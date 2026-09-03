import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://placeholder.supabase.co';
}
if (!supabaseKey) {
  supabaseKey = 'placeholder-anon-key';
}

// Initialize the Supabase client safely
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

// Default seed data for initial view / fallback state
export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's-1',
    student_custom_id: 1001,
    full_name: 'Ali Hassan Ahmed',
    department: 'Primary Education',
    time_group: 'Night',
    class_name: 'Grade 1',
    guardian_phone: '+252 61 555 1122',
    enrollment_date: '2026-01-15',
    enrolled_subject_ids: ['sub-1', 'sub-2'],
  },
  {
    id: 's-2',
    student_custom_id: 1002,
    full_name: 'Fatima Omar Abdi',
    department: 'Secondary Education',
    time_group: 'Day',
    class_name: 'English',
    guardian_phone: '+252 61 555 3344',
    enrollment_date: '2026-02-01',
    enrolled_subject_ids: ['sub-4'],
  },
  {
    id: 's-3',
    student_custom_id: 1003,
    full_name: 'Mohamed Jama Farah',
    department: 'Islamic Studies',
    time_group: 'Part-Time',
    class_name: 'تمهيد 1',
    guardian_phone: '+252 61 555 5566',
    enrollment_date: '2026-02-10',
    enrolled_subject_ids: ['sub-5'],
  },
  {
    id: 's-4',
    student_custom_id: 1004,
    full_name: 'Amina Yussuf Dahir',
    department: 'Primary Education',
    time_group: 'Night',
    class_name: 'Grade 2',
    guardian_phone: '+252 61 555 7788',
    enrollment_date: '2026-03-01',
    enrolled_subject_ids: ['sub-1', 'sub-3'],
  },
  {
    id: 's-5',
    student_custom_id: 1005,
    full_name: 'Hassan Nur Hussein',
    department: 'Secondary Education',
    time_group: 'Day',
    class_name: 'English',
    guardian_phone: '+252 61 555 9900',
    enrollment_date: '2026-03-12',
    enrolled_subject_ids: ['sub-4'],
  },
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-1', subject_name: 'Somali', department: 'Primary Education', base_fee_amount: 15.00 },
  { id: 'sub-2', subject_name: 'English', department: 'Primary Education', base_fee_amount: 20.00 },
  { id: 'sub-3', subject_name: 'Math', department: 'Primary Education', base_fee_amount: 20.00 },
  { id: 'sub-4', subject_name: 'English', department: 'Secondary Education', base_fee_amount: 30.00 },
  { id: 'sub-5', subject_name: 'Quran & Tajweed', department: 'Islamic Studies', base_fee_amount: 25.00 },
  { id: 'sub-6', subject_name: 'Hadith Studies', department: 'Islamic Studies', base_fee_amount: 25.00 },
];

export const INITIAL_FEES: FeeLedger[] = [
  { id: 'f-1', student_id: 's-1', fee_amount: 35.00, discount_amount: 5.00, final_fee_amount: 30.00, fee_status: 'Paid' },
  { id: 'f-2', student_id: 's-2', fee_amount: 30.00, discount_amount: 0.00, final_fee_amount: 30.00, fee_status: 'Paid' },
  { id: 'f-3', student_id: 's-3', fee_amount: 25.00, discount_amount: 0.00, final_fee_amount: 25.00, fee_status: 'Unpaid' },
  { id: 'f-4', student_id: 's-4', fee_amount: 35.00, discount_amount: 10.00, final_fee_amount: 25.00, fee_status: 'Paid' },
  { id: 'f-5', student_id: 's-5', fee_amount: 30.00, discount_amount: 0.00, final_fee_amount: 30.00, fee_status: 'Unpaid' },
];

export const INITIAL_EXAMS: ExamResult[] = [
  { id: 'ex-1', student_id: 's-1', subject_id: 'sub-1', exam_type: 'Midterm', score: 88.5, grade: 'A' },
  { id: 'ex-2', student_id: 's-2', subject_id: 'sub-4', exam_type: 'Final', score: 92.0, grade: 'A+' },
  { id: 'ex-3', student_id: 's-3', subject_id: 'sub-5', exam_type: 'Quiz', score: 78.0, grade: 'B' },
  { id: 'ex-4', student_id: 's-4', subject_id: 'sub-3', exam_type: 'Midterm', score: 95.0, grade: 'A+' },
  { id: 'ex-5', student_id: 's-5', subject_id: 'sub-4', exam_type: 'Quiz', score: 65.0, grade: 'C' },
];

