-- =============================================
-- ZUBMIT WORKER EARNINGS SYSTEM — FULL MIGRATION
-- Run this in Supabase SQL Editor in order
-- =============================================

--- 2A: REMOVE OLD BROADCAST SYSTEM ---
DROP TABLE IF EXISTS broadcast_tasks CASCADE;

--- 2B: ADD WORKER PROFILE FIELDS TO profiles TABLE ---
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worker_full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worker_contact TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worker_university TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worker_roll_no TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worker_degree TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worker_specialization TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accommodation_type TEXT
  CHECK (accommodation_type IN ('tower', 'block'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tower_no INTEGER
  CHECK (tower_no BETWEEN 1 AND 5);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tower_room_no TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS block_no TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS block_room_no TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS upi_qr_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worker_profile_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worker_agreed BOOLEAN DEFAULT FALSE;

--- 2C: CREATE available_tasks TABLE ---
CREATE TABLE IF NOT EXISTS available_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Assignment info shown to workers
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  degree TEXT NOT NULL,
  specialization TEXT NOT NULL,
  semester TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN (
    'case_study','report','ppt','lab_manual',
    'handwritten_assignment','notes','other'
  )),
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('digital','physical')),
  description TEXT,
  page_count INTEGER,

  -- REAL deadline stored here (never exposed to workers)
  real_deadline TIMESTAMPTZ NOT NULL,

  -- How much worker earns for this task
  worker_pay INTEGER NOT NULL DEFAULT 100,

  -- Task status
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN (
    'available',
    'assigned',
    'submitted',
    'under_review',
    'revision_required',
    'approved',
    'payment_processing',
    'paid',
    'cancelled'
  )),

  -- Assigned worker
  assigned_worker_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,

  -- Links to original order (NEVER exposed to workers)
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- Admin-only notes
  admin_notes TEXT,

  -- Revision tracking
  revision_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

--- 2D: CREATE task_submissions TABLE ---
CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES available_tasks(id) ON DELETE CASCADE,
  worker_id TEXT NOT NULL REFERENCES profiles(id),

  -- Uploaded assignment file
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,

  -- For physical: just mark complete flag
  is_physical_complete BOOLEAN DEFAULT FALSE,
  physical_completed_at TIMESTAMPTZ,

  -- Review
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN (
    'pending', 'approved', 'revision_required'
  )),
  revision_count INTEGER DEFAULT 0,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,

  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

--- 2E: CREATE task_review_stages TABLE ---
CREATE TABLE IF NOT EXISTS task_review_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES available_tasks(id) ON DELETE CASCADE,
  worker_id TEXT NOT NULL REFERENCES profiles(id),

  stage TEXT NOT NULL CHECK (stage IN (
    'task_accepted',
    'digital_submitted',
    'physical_completed',
    'under_review',
    'revision_required',
    'revision_submitted',
    'approved',
    'payment_processing',
    'paid'
  )),

  -- Human-readable message shown to student
  message TEXT NOT NULL,

  -- Admin notes for revision stage
  admin_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- 2F: RECREATE worker_earnings TABLE ---
DROP TABLE IF EXISTS worker_earnings CASCADE;

CREATE TABLE worker_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id TEXT NOT NULL REFERENCES profiles(id),
  task_id UUID NOT NULL REFERENCES available_tasks(id),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'paid', 'withheld'
  )),
  upi_transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- 2G: WORKER TASKS VIEW (hides real deadline, hides client data) ---
CREATE OR REPLACE VIEW worker_tasks_view AS
SELECT
  id,
  title,
  subject,
  degree,
  specialization,
  semester,
  service_type,
  delivery_type,
  description,
  page_count,
  worker_pay,
  status,
  assigned_worker_id,
  assigned_at,
  revision_count,
  created_at,
  updated_at,
  -- KEY: subtract 8 hours from real deadline
  -- Workers NEVER see real_deadline
  (real_deadline - INTERVAL '8 hours') AS deadline
  -- order_id NOT included
  -- admin_notes NOT included
  -- real_deadline NOT included
FROM available_tasks;

--- 2H: AUTO UPDATE TRIGGER ---
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS available_tasks_updated_at ON available_tasks;
CREATE TRIGGER available_tasks_updated_at
  BEFORE UPDATE ON available_tasks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

--- 2I: ROW LEVEL SECURITY ---
ALTER TABLE available_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_review_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_earnings ENABLE ROW LEVEL SECURITY;

-- Workers read available tasks via view only
CREATE POLICY "workers_read_tasks" ON available_tasks
  FOR SELECT USING (true);

-- Workers manage their own submissions
CREATE POLICY "workers_own_submissions" ON task_submissions
  FOR ALL USING (worker_id = auth.uid()::text);

-- Workers read their own stages
CREATE POLICY "workers_own_stages" ON task_review_stages
  FOR SELECT USING (worker_id = auth.uid()::text);

-- Workers read their own earnings
CREATE POLICY "workers_own_earnings" ON worker_earnings
  FOR SELECT USING (worker_id = auth.uid()::text);

--- 2J: REALTIME ---
ALTER PUBLICATION supabase_realtime
  ADD TABLE available_tasks;
ALTER PUBLICATION supabase_realtime
  ADD TABLE task_review_stages;
ALTER PUBLICATION supabase_realtime
  ADD TABLE worker_earnings;

-- NOTE: Storage buckets must be created via Supabase Dashboard:
-- 1. Bucket: "worker-upi-qr" (Private)
-- 2. Bucket: "task-submissions" (Private)
