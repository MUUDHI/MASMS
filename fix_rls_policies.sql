-- ====================================================================
-- MURTAZIM ACADEMY SMS - RLS PERMISSION FIX FOR AUTHENTICATED USERS
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ====================================================================

-- 1. Ensure RLS is enabled on all 5 application tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS admin_manage_students ON public.students;
DROP POLICY IF EXISTS admin_manage_subjects ON public.subjects;
DROP POLICY IF EXISTS admin_manage_enrollments ON public.student_enrollments;
DROP POLICY IF EXISTS admin_manage_fees ON public.fee_ledgers;
DROP POLICY IF EXISTS admin_manage_exams ON public.exam_results;

DROP POLICY IF EXISTS authenticated_manage_students ON public.students;
DROP POLICY IF EXISTS authenticated_manage_subjects ON public.subjects;
DROP POLICY IF EXISTS authenticated_manage_enrollments ON public.student_enrollments;
DROP POLICY IF EXISTS authenticated_manage_fees ON public.fee_ledgers;
DROP POLICY IF EXISTS authenticated_manage_exams ON public.exam_results;

-- 3. Create policies granting full SELECT, INSERT, UPDATE, DELETE access exclusively to authenticated users
CREATE POLICY authenticated_manage_students ON public.students 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY authenticated_manage_subjects ON public.subjects 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY authenticated_manage_enrollments ON public.student_enrollments 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY authenticated_manage_fees ON public.fee_ledgers 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY authenticated_manage_exams ON public.exam_results 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);
