import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://placeholder.supabase.co';
}
if (!supabaseKey) {
  supabaseKey = 'placeholder-anon-key';
}

// Helper to check if valid Supabase environment configuration is available
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http') &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')
);

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Types derived from schema
export type Department = 'Primary Education' | 'Secondary Education' | 'Islamic Studies';
export type Shift = 'Day' | 'Night' | 'Part-Time';
export type FeeStatus = 'Paid' | 'Unpaid';
export type ExamType = 'Quiz' | 'Midterm' | 'Final';

export interface Student {
  id: string;
  student_custom_id: number;
  full_name: string;
  department: Department;
  time_group: Shift;
  class_name: string;
  guardian_phone: string;
  enrollment_date: string;
  enrolled_subject_ids?: string[];
}

export interface Subject {
  id: string;
  subject_name: string;
  department: Department;
  base_fee_amount: number;
}

export interface StudentEnrollment {
  id: string;
  student_id: string;
  subject_id: string;
  enrolled_at?: string;
}

export interface FeeLedger {
  id: string;
  student_id: string;
  fee_amount: number;
  discount_amount: number;
  final_fee_amount: number;
  fee_status: FeeStatus;
  created_at?: string;
  students?: Student;
}

export interface ExamResult {
  id: string;
  student_id: string;
  subject_id: string;
  exam_type: ExamType;
  score: number;
  grade: string;
  recorded_at?: string;
  students?: Student;
  subjects?: Subject;
}

export interface KPIMetrics {
  totalStudents: number;
  primaryStudents: number;
  secondaryStudents: number;
  islamicStudents: number;
  dayStudents: number;
  nightStudents: number;
  partTimeStudents: number;
  paidStudents: number;
  unpaidStudents: number;
  totalFeesCollected: number;
}

// Enforce Rigid Structural Binding Pairs (Specification Section 3)
export const DEPARTMENT_BINDINGS: Record<Department, { time_group: Shift; classes: string[] }> = {
  'Primary Education': {
    time_group: 'Night',
    classes: ['Grade 1', 'Grade 2', 'Grade 3'],
  },
  'Secondary Education': {
    time_group: 'Day',
    classes: ['English'],
  },
  'Islamic Studies': {
    time_group: 'Part-Time',
    classes: ['تمهيد 1', 'تمهيد 2', 'تمهيد 3'],
  },
};
