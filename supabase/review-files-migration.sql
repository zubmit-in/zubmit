-- Add review_files column to task_review_stages for file attachments on revision requests
ALTER TABLE task_review_stages ADD COLUMN IF NOT EXISTS review_files jsonb DEFAULT NULL;
