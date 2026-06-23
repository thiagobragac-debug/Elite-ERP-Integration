-- Migration: Add gateway_ids to tenants for recurring subscriptions

ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS gateway_ids JSONB DEFAULT '{}'::jsonb;

-- Example of structure to be stored:
-- {
--   "stripe": { "customerId": "cus_123", "subscriptionId": "sub_123" },
--   "asaas": { "customerId": "cus_456", "subscriptionId": "sub_456" },
--   "pagarme": { "customerId": "cus_789", "subscriptionId": "sub_789" }
-- }
