-- Migration: Add Telemetry Fields to Maquinas
-- Description: Adds IoT integration capability for real-time tracking

ALTER TABLE public.maquinas 
  ADD COLUMN IF NOT EXISTS telemetry_id text,
  ADD COLUMN IF NOT EXISTS telemetry_provider text DEFAULT 'Nenhum';

-- Add an index on the telemetry_id for faster lookups when the IoT payload arrives
CREATE INDEX IF NOT EXISTS idx_maquinas_telemetry_id ON public.maquinas(telemetry_id);

-- Optional: Since RLS is already active and tied to tenant_id, this index helps isolating lookups
CREATE INDEX IF NOT EXISTS idx_maquinas_telemetry_tenant ON public.maquinas(telemetry_id, tenant_id);
