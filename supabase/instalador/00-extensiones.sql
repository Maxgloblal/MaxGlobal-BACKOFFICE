-- =====================================================================
-- MAX GLOBAL CORPORATION · INSTALADOR DE PRODUCCIÓN
-- 00-EXTENSIONES.SQL
-- Habilita extensiones para criptografía y UUIDs
-- Idempotente: CREATE EXTENSION IF NOT EXISTS
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
