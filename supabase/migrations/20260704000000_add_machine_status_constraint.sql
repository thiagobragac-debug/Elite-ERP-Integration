-- Migration to enforce valid statuses on the maquinas table

-- 1. Update legacy records from 'stopped' to 'broken'
UPDATE maquinas 
SET status = 'broken' 
WHERE status = 'stopped';

-- 2. Sanitize any unknown or invalid statuses (like empty strings or old data) to 'active'
UPDATE maquinas 
SET status = 'active'
WHERE status NOT IN ('active', 'maintenance', 'broken', 'inactive', 'reforming')
  AND status IS NOT NULL;

-- 2. Drop existing constraint if it exists (for idempotency)
ALTER TABLE maquinas DROP CONSTRAINT IF EXISTS maquinas_status_check;

-- 3. Add CHECK constraint to restrict values
ALTER TABLE maquinas 
ADD CONSTRAINT maquinas_status_check 
CHECK (status IN ('active', 'maintenance', 'broken', 'inactive', 'reforming'));
