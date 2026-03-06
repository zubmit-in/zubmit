-- Migration: Add new service types and multi-service support
-- Run this in Supabase SQL Editor

-- 1. Drop the old CHECK constraint on orders.service_type
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_service_type_check;

-- 2. Add updated CHECK constraint with all new service types
ALTER TABLE orders ADD CONSTRAINT orders_service_type_check CHECK (service_type IN (
  'CASE_STUDY', 'REPORT', 'PPT', 'LAB_RECORDS', 'HANDWRITTEN_ASSIGNMENT',
  'NOTES', 'PROTOTYPE_FULL_STACK_WEBSITE', 'INTERNSHIP_RESUME', 'SURVEY_REPORTS',
  'ARCHITECTURAL_VISUALIZATION', 'ARCHITECTURAL_DRAFTING', 'ARCHITECTURAL_DESIGN_DEVELOPMENT',
  'INTERIOR_DESIGN_PORTFOLIO', 'BUILDING_CODES_REGULATIONS',
  'INTERIOR_DESIGN_SOFTWARE_VISUALIZATION', 'INTERIOR_STYLING_DECORATION',
  'MATERIALS_FINISHES_PROJECTS', 'COLOR_THEORY_APPLICATION', 'OTHER',
  -- Keep old lowercase values for backward compatibility
  'case_study', 'report', 'ppt', 'lab_manual', 'lab_records',
  'handwritten_assignment', 'notes', 'other',
  'prototype_full_stack_website', 'internship_resume', 'survey_reports',
  'architectural_visualization', 'architectural_drafting', 'architectural_design_development',
  'interior_design_portfolio', 'building_codes_regulations',
  'interior_design_software_visualization', 'interior_styling_decoration',
  'materials_finishes_projects', 'color_theory_application'
));

-- 3. Add service_types JSONB column for multi-service orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_types JSONB DEFAULT '[]'::jsonb;

-- 4. Update existing orders: populate service_types from service_type
UPDATE orders SET service_types = jsonb_build_array(service_type) WHERE service_types = '[]'::jsonb OR service_types IS NULL;

-- 5. Also update the available_tasks CHECK constraint if it exists
ALTER TABLE available_tasks DROP CONSTRAINT IF EXISTS available_tasks_service_type_check;
