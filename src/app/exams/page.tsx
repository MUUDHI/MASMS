'use client';

import { useState, useEffect } from 'react';
import { Award, Plus, Search, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import { 
  supabase, 
  ExamResult, 
  Student, 
  Subject, 
  ExamType
} from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

export default function ExamsPage() {
  const { showError, showSuccess } = useToast();
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string>('');

  // Form State
  const [studentId, setStudentId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [examType, setExamType] = useState<ExamType>('Midterm');
  const [score, setScore] = useState<string>('85.00');
  const [grade, setGrade] = useState<string>('A');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setErrorMessage(null);
    try {
      // Fetch students
      const { data: stData, error: stErr } = await supabase.from('students').select('*').order('full_name');
      if (stErr) {
        showError('Failed to load students for gradebook dropdown', stErr);
        throw stErr;
      }
      setStudents(stData || []);

      // Fetch subjects
      const { data: subData, error: subErr } = await supabase.from('subjects').select('*').order('subject_name');
      if (subErr) {
        showError('Failed to load subjects for gradebook dropdown', subErr);
        throw subErr;
      }
      setSubjects(subData || []);

      // Fetch exams
      const { data: exData, error: exErr } = await supabase.from('exam_results').select('*').order('recorded_at', { ascending: false });
      if (exErr) {
        showError('Failed to load exam results from database', exErr);
        throw exErr;
      }
      setExams(exData || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database error';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  function getStudentName(sId: string): string {
    if (!sId) return 'Unknown Student';
    const found = students.find(s => s.id === sId);
    return found ? `${found.full_name} (#${found.student_custom_id})` : 'Unknown Student';
  }

  function getSubjectName(subId: string): string {
    if (!subId) return 'Unknown Subject';
    const found = subjects.find(s => s.id === subId);
    return found ? `${found.subject_name} (${found.department})` : 'Unknown Subject';
  }

  // Auto-calculate suggested grade based on numeric score
  const handleScoreChange = (val: string) => {
    setScore(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (num >= 90) setGrade('A');
      else if (num >= 80) setGrade('B');
      else if (num >= 70) setGrade('C');
      else if (num >= 60) setGrade('D');
      else setGrade('F');
    }
  };

  function openAddModal() {
    setIsEditing(false);
    setCurrentId('');
    setStudentId(students[0]?.id || '');
    setSubjectId(subjects[0]?.id || '');
    setExamType('Midterm');
    setScore('85.00');
    setGrade('A');
    setFormError('');
    setIsModalOpen(true);
  }

  function openEditModal(exam: ExamResult) {
    setIsEditing(true);
    setCurrentId(exam.id);
    setStudentId(exam.student_id);
    setSubjectId(exam.subject_id);
    setExamType(exam.exam_type);
    setScore(exam.score.toString());
    setGrade(exam.grade);
    setFormError('');
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this exam result?')) return;

    try {
      const { error } = await supabase.from('exam_results').delete().eq('id', id);
      if (error) {
        showError('Failed to delete exam result', error);
        return;
      }
      showSuccess('Exam result deleted successfully');
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      showError('Unexpected error deleting exam result', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const parsedScore = parseFloat(score);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      setFormError('Score must be a valid number between 0.00 and 100.00.');
      return;
    }

    if (!studentId) {
      setFormError('Please select a student.');
      return;
    }
    if (!subjectId) {
      setFormError('Please select a subject.');
      return;
    }

    const payload = {
      student_id: studentId,
      subject_id: subjectId,
      exam_type: examType,
      score: parsedScore,
      grade: grade.trim() || 'Pass',
    };

    setSubmitting(true);

    if (isEditing) {
      try {
        const { error } = await supabase
          .from('exam_results')
          .update(payload)
          .eq('id', currentId);

        if (error) {
          showError('Failed to update exam result', error);
          setFormError(error.message);
          setSubmitting(false);
          return;
        }

        showSuccess('Exam result updated');
        await fetchData();
        setIsModalOpen(false);
      } catch (err: unknown) {
        showError('Error updating exam result', err);
        setFormError(err instanceof Error ? err.message : 'Update failed');
      } finally {
        setSubmitting(false);
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('exam_results')
          .insert([payload])
          .select();

        if (error || !data || data.length === 0) {
          showError('Failed to record exam result', error);
          setFormError(error?.message || 'Insert failed');
          setSubmitting(false);
          return;
        }

        showSuccess('Exam result recorded successfully');
        await fetchData();
        setIsModalOpen(false);
      } catch (err: unknown) {
        showError('Error recording exam result', err);
        setFormError(err instanceof Error ? err.message : 'Recording failed');
      } finally {
        setSubmitting(false);
      }
    }
  }

  // Filter exams
  const filteredExams = exams.filter((ex) => {
    const studentText = getStudentName(ex.student_id).toLowerCase();
    const subjectText = getSubjectName(ex.subject_id).toLowerCase();
    const matchesSearch = studentText.includes(searchQuery.toLowerCase()) || subjectText.includes(searchQuery.toLowerCase());
    const matchesType = selectedType ? ex.exam_type === selectedType : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-secondary-blue flex items-center gap-2.5">
            <Award className="w-7 h-7 sm:w-8 sm:h-8 text-primary-green shrink-0" />
            <span>Exams & Results Matrix</span>
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Manage gradebook scores for Quizzes, Midterms, and Final academic exams.</p>
        </div>
        <button 
          onClick={openAddModal} 
          className="bg-primary-green hover:bg-primary-green/90 text-white px-5 sm:px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary-green/20 flex items-center justify-center gap-2 text-sm w-full sm:w-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Result
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1 text-xs sm:text-sm">
            <span className="font-bold block">Database Error</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow transition-all"
          >
            Retry
          </button>
        </div>
      )}

      <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student or subject..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/60 bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary-green text-xs sm:text-sm text-gray-800 backdrop-blur-md"
            />
          </div>
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-white/60 bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary-green font-medium text-xs sm:text-sm text-gray-700 backdrop-blur-md"
          >
            <option value="">All Exam Categories</option>
            <option value="Quiz">Quiz</option>
            <option value="Midterm">Midterm</option>
            <option value="Final">Final</option>
          </select>
        </div>

        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[650px] text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200/60 text-xs font-bold uppercase tracking-wider text-secondary-blue">
                <th className="pb-3 px-3 sm:px-4">Student Name</th>
                <th className="pb-3 px-3 sm:px-4">Subject</th>
                <th className="pb-3 px-3 sm:px-4">Exam Type</th>
                <th className="pb-3 px-3 sm:px-4">Score (0-100)</th>
                <th className="pb-3 px-3 sm:px-4">Grade / Status</th>
                <th className="pb-3 px-3 sm:px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-primary-green border-t-transparent rounded-full mb-2"></div>
                    <p className="text-sm">Loading gradebook matrix...</p>
                  </td>
                </tr>
              ) : filteredExams.length > 0 ? (
                filteredExams.map((ex) => (
                  <tr key={ex.id} className="hover:bg-white/60 transition-colors group">
                    <td className="py-4 px-3 sm:px-4 font-bold text-gray-900 text-xs sm:text-sm">
                      {getStudentName(ex.student_id)}
                    </td>
                    <td className="py-4 px-3 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">
                      {getSubjectName(ex.subject_id)}
                    </td>
                    <td className="py-4 px-3 sm:px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        ex.exam_type === 'Final' ? 'bg-purple-100 text-purple-800' :
                        ex.exam_type === 'Midterm' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {ex.exam_type}
                      </span>
                    </td>
                    <td className="py-4 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-accent-orange rounded-full" 
                            style={{ width: `${Math.min(100, Math.max(0, ex.score))}%` }}
                          ></div>
                        </div>
                        <span className="font-extrabold text-gray-900 text-xs">{Number(ex.score).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 sm:px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-gray-900 text-white shadow-sm">
                        {ex.grade}
                      </span>
                    </td>
                    <td className="py-4 px-3 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(ex)} 
                          title="Edit Exam Result"
                          className="p-1.5 rounded-lg bg-secondary-blue/10 text-secondary-blue hover:bg-secondary-blue hover:text-white transition-all cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(ex.id)} 
                          title="Delete Exam Result"
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
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <p className="font-semibold text-gray-700 text-base">No exam results found</p>
                    <p className="text-xs text-gray-400 mt-1">Try clearing search filters or record a new exam result.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
          <div className="glass-card w-full max-w-lg p-4 sm:p-6 relative bg-white/95 border border-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg sm:text-xl font-bold text-secondary-blue mb-1">
              {isEditing ? 'Edit Exam Result' : 'Record New Exam Result'}
            </h3>
            <p className="text-xs text-gray-500 mb-5">Record student academic scores (0.00 - 100.00) and grade assignment.</p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            {(students.length === 0 || subjects.length === 0) && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  {students.length === 0 && subjects.length === 0
                    ? 'No students or subjects found in database. Please add students and subjects first.'
                    : students.length === 0
                    ? 'No students found in database. Please add a student first.'
                    : 'No subjects found in database. Please add a subject first.'}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Student *</label>
                <select 
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm font-medium"
                >
                  <option value="">-- Select Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} (#{s.student_custom_id} • {s.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Subject *</label>
                <select 
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm font-medium"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.subject_name} ({sub.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Exam Type *</label>
                  <select 
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as ExamType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm font-medium"
                  >
                    <option value="Quiz">Quiz</option>
                    <option value="Midterm">Midterm</option>
                    <option value="Final">Final</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Score (0-100) *</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={score}
                    onChange={(e) => handleScoreChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm font-bold text-accent-orange" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Grade / Letter</label>
                  <input 
                    type="text" 
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm font-bold text-gray-900 uppercase" 
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
                <button type="button" disabled={submitting} onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-primary-green hover:bg-primary-green/90 shadow-lg shadow-primary-green/20 flex items-center gap-2">
                  {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>{isEditing ? 'Save Changes' : 'Record Result'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
