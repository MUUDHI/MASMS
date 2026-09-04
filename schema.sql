-- ====================================================================
-- MURTAZIM ACADEMY SCHOOL MANAGEMENT SYSTEM (MASMS) V1 SCHEMA (UPDATED)
-- ====================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS & CUSTOM TYPES
CREATE TYPE department_enum AS ENUM ('Primary Education', 'Secondary Education', 'Islamic Studies');
CREATE TYPE shift_enum AS ENUM ('Day', 'Night', 'Part-Time');
CREATE TYPE fee_status_enum AS ENUM ('Paid', 'Unpaid');
CREATE TYPE exam_type_enum AS ENUM ('Quiz', 'Midterm', 'Final');

-- 2. STUDENTS TABLE
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_custom_id SERIAL UNIQUE, 
    full_name VARCHAR(255) NOT NULL,
    department department_enum NOT NULL,
    time_group shift_enum NOT NULL,
    class_name VARCHAR(100) NOT NULL, 
    guardian_phone VARCHAR(50) NOT NULL,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SUBJECTS TABLE
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_name VARCHAR(255) NOT NULL,
    department department_enum NOT NULL,
    base_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject_name, department)
);

-- 4. STUDENT ENROLLMENTS
CREATE TABLE public.student_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_id)
);

-- 5. FEE MANAGEMENT TABLE (Multi-record, Manually Editable Ledgers)
CREATE TABLE public.fee_ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE, -- Removed UNIQUE to allow multiple fee entries per student
    fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,                         
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,                   
    final_fee_amount NUMERIC(10, 2) GENERATED ALWAYS AS (fee_amount - discount_amount) STORED, 
    fee_status fee_status_enum NOT NULL DEFAULT 'Unpaid',                    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. EXAMS & RESULTS TABLE
CREATE TABLE public.exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    exam_type exam_type_enum NOT NULL,
    score NUMERIC(5, 2) NOT NULL CHECK (score >= 0.00 AND score <= 100.00),
    grade VARCHAR(5) NOT NULL, 
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- AUTOMATIC TIMESTAMP UPDATERS
-- ====================================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_modtime BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_fee_modtime BEFORE UPDATE ON public.fee_ledgers FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_exam_modtime BEFORE UPDATE ON public.exam_results FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) & ADMINISTRATOR POLICIES
-- ====================================================================

-- Enable RLS on all 5 main tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Drop legacy / conflicting policies if present
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

-- Create Policies to grant full management access (SELECT, INSERT, UPDATE, DELETE) exclusively to authenticated users
CREATE POLICY authenticated_manage_students ON public.students 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_manage_subjects ON public.subjects 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_manage_enrollments ON public.student_enrollments 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_manage_fees ON public.fee_ledgers 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_manage_exams ON public.exam_results 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ====================================================================
-- INITIAL DATABASE SEEDING
-- ====================================================================
INSERT INTO public.subjects (subject_name, department, base_fee_amount) VALUES 
('Somali', 'Primary Education', 15.00),
('English', 'Primary Education', 20.00),
('Math', 'Primary Education', 20.00),
('English', 'Secondary Education', 30.00);