-- ============================================================
-- ZUBMIT — Supabase Database Migration
-- Auth: Clerk (user IDs are TEXT strings like "user_2abc123...")
-- Database: Supabase (PostgreSQL)
-- ============================================================
-- Run this entire file in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ============================================================
-- TABLE 1: profiles
-- ============================================================
CREATE TABLE profiles (
  id                TEXT PRIMARY KEY, -- Clerk userId
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  phone             TEXT,
  college_name      TEXT NOT NULL,
  degree            TEXT NOT NULL,
  specialization    TEXT,
  semester          INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 10),
  roll_no           TEXT,
  role              TEXT NOT NULL DEFAULT 'student'
                    CHECK (role IN ('student', 'worker', 'admin')),
  worker_agreed     BOOLEAN DEFAULT FALSE,
  worker_agreed_at  TIMESTAMPTZ,
  worker_banned     BOOLEAN DEFAULT FALSE,
  worker_ban_reason TEXT,
  total_orders      INTEGER DEFAULT 0,
  total_spent       NUMERIC(10,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: orders
-- ============================================================
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Academic info
  degree            TEXT NOT NULL,
  specialization    TEXT,
  semester          INTEGER NOT NULL,
  subject           TEXT NOT NULL,

  -- Service info
  service_type      TEXT NOT NULL CHECK (service_type IN (
                      'case_study', 'report', 'ppt',
                      'lab_manual', 'handwritten_assignment',
                      'notes', 'other'
                    )),
  delivery_type     TEXT NOT NULL DEFAULT 'digital'
                    CHECK (delivery_type IN ('digital', 'physical')),

  -- Order details
  title             TEXT NOT NULL,
  roll_no           TEXT NOT NULL,
  description       TEXT NOT NULL,
  front_page_info   TEXT,
  material_note     TEXT,
  pickup_address    TEXT,
  reference_file_url TEXT,

  -- Deadline & pricing
  deadline          TIMESTAMPTZ NOT NULL,
  hours_until_deadline NUMERIC GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (deadline - created_at)) / 3600
  ) STORED,
  base_price        NUMERIC(10,2) NOT NULL,
  urgency_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  total_price       NUMERIC(10,2) NOT NULL,
  advance_amount    NUMERIC(10,2) NOT NULL,
  final_amount      NUMERIC(10,2) NOT NULL,

  -- Payment status
  advance_paid      BOOLEAN DEFAULT FALSE,
  advance_paid_at   TIMESTAMPTZ,
  final_paid        BOOLEAN DEFAULT FALSE,
  final_paid_at     TIMESTAMPTZ,

  -- Delivery files
  watermark_file_url TEXT,
  watermark_uploaded_at TIMESTAMPTZ,
  final_file_url    TEXT,
  final_uploaded_at TIMESTAMPTZ,

  -- Order status
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                      'pending',
                      'confirmed',
                      'assigned',
                      'in_progress',
                      'delivered',
                      'completed',
                      'revision_requested',
                      'cancelled'
                    )),

  -- Revision tracking
  revision_count    INTEGER DEFAULT 0,
  revision_note     TEXT,

  -- Worker assigned
  worker_id         TEXT REFERENCES profiles(id),
  assigned_at       TIMESTAMPTZ,

  -- Timestamps
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: order_status_history
-- ============================================================
CREATE TABLE order_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status  TEXT,
  new_status  TEXT NOT NULL,
  changed_by  TEXT REFERENCES profiles(id),
  changed_by_role TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: payments
-- ============================================================
CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id               TEXT NOT NULL REFERENCES profiles(id),

  -- Razorpay data
  razorpay_order_id     TEXT UNIQUE NOT NULL,
  razorpay_payment_id   TEXT UNIQUE,
  razorpay_signature    TEXT,

  -- Payment details
  amount                NUMERIC(10,2) NOT NULL,
  amount_paise          INTEGER NOT NULL,
  currency              TEXT DEFAULT 'INR',
  payment_type          TEXT NOT NULL CHECK (payment_type IN ('advance', 'final')),
  payment_method        TEXT,

  -- Status
  status                TEXT NOT NULL DEFAULT 'created'
                        CHECK (status IN ('created', 'captured', 'failed', 'refunded')),
  failure_reason        TEXT,

  -- Timestamps
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  captured_at           TIMESTAMPTZ
);

-- ============================================================
-- TABLE 5: worker_tasks
-- ============================================================
CREATE TABLE worker_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  worker_id       TEXT NOT NULL REFERENCES profiles(id),
  assigned_by     TEXT REFERENCES profiles(id),

  -- Task details
  worker_pay      NUMERIC(10,2) NOT NULL,
  instructions    TEXT,

  -- Status
  status          TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN (
                    'assigned', 'accepted', 'in_progress',
                    'submitted', 'approved', 'rejected'
                  )),
  rejection_note  TEXT,

  -- Submission
  submitted_file_url TEXT,
  submitted_at    TIMESTAMPTZ,
  approved_at     TIMESTAMPTZ,

  -- Payment to worker
  worker_paid     BOOLEAN DEFAULT FALSE,
  worker_paid_at  TIMESTAMPTZ,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 6: worker_earnings
-- ============================================================
CREATE TABLE worker_earnings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id     TEXT NOT NULL REFERENCES profiles(id),
  task_id       UUID NOT NULL REFERENCES worker_tasks(id),
  order_id      UUID NOT NULL REFERENCES orders(id),

  amount        NUMERIC(10,2) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'paid', 'withheld')),
  withheld_reason TEXT,

  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 7: notifications
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN (
                'order_confirmed', 'order_assigned', 'order_delivered',
                'payment_received', 'revision_requested', 'worker_task',
                'general'
              )),
  order_id    UUID REFERENCES orders(id),
  read        BOOLEAN DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 8: revision_requests
-- ============================================================
CREATE TABLE revision_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES profiles(id),
  description TEXT NOT NULL,
  status      TEXT DEFAULT 'open'
              CHECK (status IN ('open', 'in_progress', 'resolved')),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 9: broadcast_tasks
-- ============================================================
CREATE TABLE broadcast_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id),

  subject       TEXT NOT NULL,
  degree        TEXT NOT NULL,
  semester      INTEGER NOT NULL,
  service_type  TEXT NOT NULL,
  deadline      TIMESTAMPTZ NOT NULL,
  worker_pay    NUMERIC(10,2) NOT NULL,

  status        TEXT DEFAULT 'open'
                CHECK (status IN ('open', 'assigned', 'expired')),
  first_response_worker TEXT REFERENCES profiles(id),
  responded_at  TIMESTAMPTZ,

  broadcast_sent_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_worker_id ON orders(worker_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_deadline ON orders(deadline);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX idx_worker_tasks_worker_id ON worker_tasks(worker_id);
CREATE INDEX idx_worker_earnings_worker_id ON worker_earnings(worker_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id, read);
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_worker_tasks_updated_at
  BEFORE UPDATE ON worker_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Log every order status change
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- Update profile stats on order completion
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE profiles
    SET
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total_price
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_completed
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_profile_stats();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get full order details with user info (for admin)
CREATE OR REPLACE FUNCTION get_order_with_details(order_uuid UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'order', row_to_json(o.*),
    'user', row_to_json(p.*),
    'payments', (SELECT json_agg(py.*) FROM payments py WHERE py.order_id = o.id),
    'status_history', (SELECT json_agg(sh.* ORDER BY sh.created_at) FROM order_status_history sh WHERE sh.order_id = o.id),
    'worker_task', (SELECT row_to_json(wt.*) FROM worker_tasks wt WHERE wt.order_id = o.id),
    'revisions', (SELECT json_agg(rr.*) FROM revision_requests rr WHERE rr.order_id = o.id)
  )
  FROM orders o
  JOIN profiles p ON p.id = o.user_id
  WHERE o.id = order_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get worker earnings summary
CREATE OR REPLACE FUNCTION get_worker_earnings_summary(worker_user_id TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_earned', COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0),
    'pending_payout', COALESCE(SUM(CASE WHEN status IN ('pending','approved') THEN amount ELSE 0 END), 0),
    'total_tasks', COUNT(*),
    'completed_tasks', COUNT(CASE WHEN status = 'paid' THEN 1 END)
  )
  FROM worker_earnings
  WHERE worker_id = worker_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- NOTE: Since we use supabaseAdmin (service role) from API routes,
-- RLS is bypassed. These policies document intended access patterns
-- and provide defense-in-depth if anon key is ever used.
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_tasks ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (these are auto-granted but explicit for clarity)
-- All actual access control is handled in Next.js API routes via Clerk auth

-- ============================================================
-- STORAGE BUCKETS
-- Run these in Supabase Dashboard → Storage → Create Bucket
-- Or use the SQL below:
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('reference-files', 'reference-files', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('assignments', 'assignments', false, 26214400, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE worker_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE broadcast_tasks;
