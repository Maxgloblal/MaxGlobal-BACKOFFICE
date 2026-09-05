import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));

    // Extraer campos (admitir nombres en singular o según formulario de landing)
    const rawNombres = (body.nombres || body.nombre || "").trim();
    const rawApellidos = (body.apellidos || "").trim();

    let finalNombres = rawNombres;
    let finalApellidos = rawApellidos;

    // Si viene solo un campo combinado de nombre y apellidos
    if (rawNombres && !rawApellidos) {
      const partes = rawNombres.split(/\s+/);
      if (partes.length > 1) {
        finalNombres = partes.slice(0, partes.length - 1).join(" ");
        finalApellidos = partes[partes.length - 1];
      } else {
        finalApellidos = "-";
      }
    }

    const telefonoRaw = (body.telefono || "").toString().trim();
    const emailRaw = (body.email || "").toString().trim().toLowerCase();
    const packCodigo = (body.pack_codigo || body.pack || "").toString().trim();
    const documentoRaw = (body.documento || body.dni || "").toString().trim();
    const refCodigoRaw = (body.ref_codigo || body.ref || body.patrocinador || "").toString().trim();

    // 1. Validar obligatorios: nombres, apellidos, telefono, email, pack_codigo
    if (!finalNombres || !finalApellidos || !telefonoRaw || !emailRaw || !packCodigo) {
      return new Response(JSON.stringify({ error: "Faltan campos obligatorios (nombres, apellidos, teléfono, correo y pack)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Validar formato email
    if (!emailRaw.includes("@") || emailRaw.length < 5) {
      return new Response(JSON.stringify({ error: "El correo electrónico debe contener un formato válido con @" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validar teléfono: 9 dígitos numéricos
    const telefonoDigitos = telefonoRaw.replace(/\D/g, "");
    if (telefonoDigitos.length !== 9) {
      return new Response(JSON.stringify({ error: "El teléfono debe contener exactamente 9 dígitos numéricos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validar documento si viene: solo dígitos
    let documento = null;
    if (documentoRaw) {
      const docDigitos = documentoRaw.replace(/\D/g, "");
      if (docDigitos !== documentoRaw) {
        return new Response(JSON.stringify({ error: "El documento debe contener únicamente números" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      documento = docDigitos;
    }

    // Obtener IP del cliente (permitir override en body para pruebas automatizadas)
    const clientIp = body.ip ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "127.0.0.1";

    // 4. Rate limit: máximo 3 solicitudes por IP por hora
    const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: conteoIp } = await supabase
      .from("solicitud_afiliacion")
      .select("*", { count: "exact", head: true })
      .eq("ip", clientIp)
      .gte("creado_en", haceUnaHora);

    if (conteoIp !== null && conteoIp >= 3) {
      return new Response(
        JSON.stringify({ error: "Demasiadas solicitudes desde esta IP. Inténtalo más tarde." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Anti-duplicado: si ya hay solicitud 'nueva' con el mismo email en las últimas 24 horas
    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: duplicado } = await supabase
      .from("solicitud_afiliacion")
      .select("id")
      .eq("email", emailRaw)
      .eq("estado", "nueva")
      .gte("creado_en", hace24Horas)
      .limit(1)
      .maybeSingle();

    if (duplicado) {
      // Devuelve éxito sin crear otra fila para evitar pistas
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Resolver referido
    let patrocinadorId: number | null = null;
    const refCodigoGuardado: string | null = refCodigoRaw || null;

    if (refCodigoRaw) {
      const { data: socioSponsor } = await supabase
        .from("socio")
        .select("id, estado")
        .ilike("codigo", refCodigoRaw)
        .limit(1)
        .maybeSingle();

      if (socioSponsor && socioSponsor.estado === "activo") {
        patrocinadorId = socioSponsor.id;
      } else {
        patrocinadorId = null;
      }
    }

    // 6. Insertar solicitud
    const { error: errInsert } = await supabase
      .from("solicitud_afiliacion")
      .insert({
        nombres: finalNombres,
        apellidos: finalApellidos,
        documento,
        telefono: telefonoDigitos,
        email: emailRaw,
        departamento: body.departamento || null,
        provincia: body.provincia || null,
        distrito: body.distrito || null,
        direccion: body.direccion || null,
        pack_codigo: packCodigo,
        ref_codigo: refCodigoGuardado,
        patrocinador_id: patrocinadorId,
        estado: "nueva",
        origen: body.origen || "landing",
        ip: clientIp,
        creado_en: new Date().toISOString(),
      });

    if (errInsert) {
      console.error("Error al insertar solicitud de afiliación:", errInsert);
      return new Response(JSON.stringify({ error: "No se pudo registrar la solicitud" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 🔴 Devolver ÚNICAMENTE { ok: true } (sin ID, sin resolver referido ni datos de socio)
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error inesperado en registro-afiliacion:", err);
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
