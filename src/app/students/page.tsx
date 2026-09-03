'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, Plus, Search, Edit, Trash2, X, Check, BookOpen, AlertCircle } from 'lucide-react';
import { 
  supabase, 
  safeSupabaseQuery,
  Student, 
  Subject, 
  Department, 
  Shift, 
  DEPARTMENT_BINDINGS, 
  INITIAL_STUDENTS, 
  INITIAL_SUBJECTS 
} from '@/lib/supabase';

function StudentsContent() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedDept, setSelectedDept] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string>('');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState<Department>('Primary Education');
  const [className, setClassName] = useState('Grade 1');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  
  // Form error notice
  const [formError, setFormError] = useState('');

  // Shift is strictly derived from Department binding
  const currentBinding = DEPARTMENT_BINDINGS[department];
  const timeGroup: Shift = currentBinding.time_group;
  const availableClasses = currentBinding.classes;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch subjects
      const loadedSubjects = await safeSupabaseQuery<Subject[]>(async () => {
        const { data } = await supabase.from('subjects').select('*').order('subject_name');
        return (data && data.length > 0) ? data : INITIAL_SUBJECTS;
      }, INITIAL_SUBJECTS);
      setSubjects(loadedSubjects);

      // Fetch students
      const loadedStudents = await safeSupabaseQuery<Student[]>(async () => {
        const { data: stData } = await supabase.from('students').select('*').order('student_custom_id', { ascending: true });
        if (stData && stData.length > 0) {
          const { data: enrollData } = await supabase.from('student_enrollments').select('*');
          return stData.map((s) => {
            const sEnrolls = enrollData?.filter(e => e.student_id === s.id).map(e => e.subject_id) || [];
            return { ...s, enrolled_subject_ids: sEnrolls };
          });
        }
        return INITIAL_STUDENTS;
      }, INITIAL_STUDENTS);
      setStudents(loadedStudents);
    } catch (err) {
      console.warn('Using local initial students data:', err);
      setStudents(INITIAL_STUDENTS);
      setSubjects(INITIAL_SUBJECTS);
    } finally {
      setLoading(false);
    }
  }

  // Handle department change -> reset valid default class
  const handleDepartmentChange = (newDept: Department) => {
    setDepartment(newDept);
    const newClasses = DEPARTMENT_BINDINGS[newDept].classes;
    setClassName(newClasses[0]);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId('');
    setFullName('');
    setDepartment('Primary Education');
    setClassName(DEPARTMENT_BINDINGS['Primary Education'].classes[0]);
    setGuardianPhone('');
    setEnrollmentDate(new Date().toISOString().split('T')[0]);
    setSelectedSubjectIds([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setIsEditing(true);
    setCurrentId(student.id);
    setFullName(student.full_name);
    setDepartment(student.department);
    setClassName(student.class_name);
    setGuardianPhone(student.guardian_phone);
    setEnrollmentDate(student.enrollment_date || new Date().toISOString().split('T')[0]);
    setSelectedSubjectIds(student.enrolled_subject_ids || []);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this student record?')) {
      try {
        await supabase.from('students').delete().eq('id', id);
      } catch {
        // ignore fallback
      }
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const toggleSubjectSelect = (subId: string) => {
    setSelectedSubjectIds(prev => 
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('Student full name is required.');
      return;
    }
    if (!guardianPhone.trim()) {
      setFormError('Guardian phone number is required.');
      return;
    }

    const payload = {
      full_name: fullName.trim(),
      department: department,
      time_group: timeGroup,
      class_name: className,
      guardian_phone: guardianPhone.trim(),
      enrollment_date: enrollmentDate,
    };

    if (isEditing) {
      try {
        await supabase.from('students').update(payload).eq('id', currentId);
        // update enrollments
        await supabase.from('student_enrollments').delete().eq('student_id', currentId);
        if (selectedSubjectIds.length > 0) {
          const enrollInserts = selectedSubjectIds.map(subId => ({ student_id: currentId, subject_id: subId }));
          await supabase.from('student_enrollments').insert(enrollInserts);
        }
      } catch {
        // local update
      }
      setStudents(prev => prev.map(s => s.id === currentId ? { ...s, ...payload, enrolled_subject_ids: selectedSubjectIds } : s));
    } else {
      let createdStudent: Student | null = null;
      try {
        const { data } = await supabase.from('students').insert([payload]).select();
        if (data && data[0]) {
          createdStudent = data[0];
          if (selectedSubjectIds.length > 0) {
            const enrollInserts = selectedSubjectIds.map(subId => ({ student_id: createdStudent!.id, subject_id: subId }));
            await supabase.from('student_enrollments').insert(enrollInserts);
          }
        }
      } catch {
        // fallback local ID generator
      }

      if (!createdStudent) {
        const nextCustomId = Math.max(1000, ...students.map(s => s.student_custom_id || 0)) + 1;
        createdStudent = {
          id: 'st-' + Date.now(),
          student_custom_id: nextCustomId,
          ...payload,
          enrolled_subject_ids: selectedSubjectIds
        };
      }
      setStudents(prev => [...prev, createdStudent!]);
    }

    setIsModalOpen(false);
  };

  // Filter students based on search query and department filter
  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_custom_id.toString().includes(searchQuery) ||
      student.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.guardian_phone.includes(searchQuery);

    const matchesDept = selectedDept ? student.department === selectedDept : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-secondary-blue flex items-center gap-2.5">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-primary-green shrink-0" />
            <span>Student Management</span>
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Manage enrollments, strict department-shift bindings, and course records.</p>
        </div>
        <button 
          onClick={openAddModal} 
          className="bg-primary-green hover:bg-primary-green/90 text-white px-5 sm:px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary-green/20 flex items-center justify-center gap-2 text-sm w-full sm:w-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Student
        </button>
      </div>

      {/* Main Glass Panel */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-6">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, custom ID, phone, or class..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/60 bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary-green text-xs sm:text-sm text-gray-800 backdrop-blur-md"
            />
          </div>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-white/60 bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary-green font-medium text-xs sm:text-sm text-gray-700 backdrop-blur-md"
          >
            <option value="">All Departments</option>
            <option value="Primary Education">Primary Education (Night)</option>
            <option value="Secondary Education">Secondary Education (Day)</option>
            <option value="Islamic Studies">Islamic Studies (Part-Time)</option>
          </select>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200/60 text-xs font-bold uppercase tracking-wider text-secondary-blue">
                <th className="pb-3 px-3 sm:px-4">Custom ID</th>
                <th className="pb-3 px-3 sm:px-4">Full Name</th>
                <th className="pb-3 px-3 sm:px-4">Department & Shift</th>
                <th className="pb-3 px-3 sm:px-4">Class</th>
                <th className="pb-3 px-3 sm:px-4">Guardian Phone</th>
                <th className="pb-3 px-3 sm:px-4">Enrolled Date</th>
                <th className="pb-3 px-3 sm:px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-primary-green border-t-transparent rounded-full mb-2"></div>
                    <p className="text-sm">Loading student records...</p>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-white/60 transition-colors group">
                    <td className="py-4 px-3 sm:px-4 font-mono font-bold text-xs text-secondary-blue">
                      #{student.student_custom_id}
                    </td>
                    <td className="py-4 px-3 sm:px-4 font-bold text-gray-900 text-xs sm:text-sm">
                      {student.full_name}
                    </td>
                    <td className="py-4 px-3 sm:px-4">
                      <span className="font-semibold text-xs text-gray-800 block">{student.department}</span>
                      <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-bold ${
                        student.time_group === 'Day' ? 'bg-amber-100 text-amber-800' :
                        student.time_group === 'Night' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Shift: {student.time_group}
                      </span>
                    </td>
                    <td className="py-4 px-3 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">
                      {student.class_name}
                    </td>
                    <td className="py-4 px-3 sm:px-4 text-xs font-mono text-gray-600">
                      {student.guardian_phone}
                    </td>
                    <td className="py-4 px-3 sm:px-4 text-xs text-gray-500">
                      {student.enrollment_date || 'N/A'}
                    </td>
                    <td className="py-4 px-3 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(student)} 
                          title="Edit Student"
                          className="p-1.5 rounded-lg bg-secondary-blue/10 text-secondary-blue hover:bg-secondary-blue hover:text-white transition-all cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id)} 
                          title="Delete Student"
                          className="p-1.5 rounded-lg bg-status-warning/10 text-status-warning hover:bg-status-warning hover:text-white transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <p className="font-semibold text-gray-700">No students match your query.</p>
                    <p className="text-xs text-gray-400 mt-1">Try clearing filters or add a new student profile.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="glass-card w-full max-w-xl p-4 sm:p-6 relative bg-white/95 border border-white my-6 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-secondary-blue mb-1">
              {isEditing ? 'Edit Student Profile' : 'Register New Student'}
            </h3>
            <p className="text-xs text-gray-500 mb-5">Enforces rigid department-shift bindings and multi-subject selection.</p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Student Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Ali Hassan Ahmed"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Department *</label>
                  <select 
                    value={department}
                    onChange={(e) => handleDepartmentChange(e.target.value as Department)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm font-medium"
                  >
                    <option value="Primary Education">Primary Education</option>
                    <option value="Secondary Education">Secondary Education</option>
                    <option value="Islamic Studies">Islamic Studies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Shift (Bound) <span className="text-[10px] text-primary-green font-normal">(Auto-Locked)</span>
                  </label>
                  <input 
                    type="text" 
                    disabled 
                    value={timeGroup}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-600 font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Class *</label>
                  <select 
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm font-medium"
                  >
                    {availableClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Guardian Phone *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+252 61 000 0000"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Enrollment Date</label>
                <input 
                  type="date" 
                  value={enrollmentDate}
                  onChange={(e) => setEnrollmentDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm" 
                />
              </div>

              {/* Multi-Subject Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-secondary-blue" />
                  Subject Enrollments (Many-to-Many Decoupled)
                </label>
                <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 max-h-36 overflow-y-auto space-y-2">
                  {subjects.length > 0 ? (
                    subjects.map((sub) => {
                      const isSelected = selectedSubjectIds.includes(sub.id);
                      return (
                        <div 
                          key={sub.id}
                          onClick={() => toggleSubjectSelect(sub.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors border ${
                            isSelected 
                              ? 'bg-primary-green/10 border-primary-green/40 text-primary-green font-semibold' 
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div>
                            <span>{sub.subject_name}</span>
                            <span className="text-[10px] text-gray-400 block">{sub.department} (${Number(sub.base_fee_amount).toFixed(2)})</span>
                          </div>
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected ? 'bg-primary-green border-primary-green text-white' : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400">No subjects available.</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-primary-green hover:bg-primary-green/90 shadow-lg shadow-primary-green/20 transition-all"
                >
                  {isEditing ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={
      <div className="py-12 text-center text-gray-500">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-primary-green border-t-transparent rounded-full mb-2"></div>
        <p className="text-sm">Loading page...</p>
      </div>
    }>
      <StudentsContent />
    </Suspense>
  );
}
