-- Add Cashfree payment columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cashfree_order_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cf_payment_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_session_id TEXT;

-- Make razorpay columns nullable for new Cashfree payments
ALTER TABLE payments ALTER COLUMN razorpay_order_id DROP NOT NULL;

-- Add service_types array column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_types TEXT[] DEFAULT '{}';
