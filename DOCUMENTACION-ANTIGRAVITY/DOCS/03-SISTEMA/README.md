# 03 · SISTEMA — el diseño técnico

Cómo se construye lo que pide `01-NEGOCIO`.

| Archivo | Qué contiene |
|---|---|
| `schema.sql` | Las 22 tablas |
| `02-MODELO-DE-DATOS.md` | Qué guarda cada tabla y por qué |
| `01-PRINCIPIOS-TECNICOS.md` | Reglas que no se negocian: céntimos, libros de solo-agregar |
| `03-FLUJOS-DEL-SISTEMA.md` · `04-FLUJO-DE-ENTREGA.md` · `07-FLUJO-DEL-CLIENTE.md` | Los recorridos |
| `05-ROLES-Y-PERMISOS.md` · `06-MAPA-DE-ESTADOS.md` | Quién puede qué, y en qué estado está cada cosa |
| `08-RF-WEB-PUBLICA.md` | Requisitos de la web |
| `09-RF-BACKOFFICE-SOCIO.md` · `15-ASI-SE-VE-EL-BACKOFFICE.md` | Las 10 pantallas del socio |
| `10-RF-PANEL-ADMIN.md` | Las 10 del administrador |
| `11-RF-MOTOR-Y-SISTEMA.md` | El motor de comisiones |
| `12-CASOS-DE-USO.md` · `13-CASOS-DE-USO-CRITICOS.md` | Qué tiene que poder hacerse |
| `14-FLUJO-DE-PRECIOS-Y-DESCUENTOS.md` | Precio público, precio de socio y descuentos |

> **`schema.sql` es el diseño, no la verdad.** La verdad está en Postgres.
> Antes de dar por buena una columna, se consulta la base.
