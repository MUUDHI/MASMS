'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import { supabase, Subject, Department, INITIAL_SUBJECTS } from '@/lib/supabase';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string>('');
  
  // Form State
  const [subjectName, setSubjectName] = useState('');
  const [department, setDepartment] = useState<Department>('Primary Education');
  const [baseFee, setBaseFee] = useState<string>('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error || !data || data.length === 0) {
        setSubjects(INITIAL_SUBJECTS);
      } else {
        setSubjects(data);
      }
    } catch {
      setSubjects(INITIAL_SUBJECTS);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setIsEditing(false);
    setCurrentId('');
    setSubjectName('');
    setDepartment('Primary Education');
    setBaseFee('');
    setFormError('');
    setIsModalOpen(true);
  }

  function openEditModal(subject: Subject) {
    setIsEditing(true);
    setCurrentId(subject.id);
    setSubjectName(subject.subject_name);
    setDepartment(subject.department);
    setBaseFee(subject.base_fee_amount.toString());
    setFormError('');
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this subject?')) {
      try {
        await supabase.from('subjects').delete().eq('id', id);
      } catch {
        // local delete fallback
      }
      setSubjects(prev => prev.filter(s => s.id !== id));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!subjectName.trim()) {
      setFormError('Subject name is required.');
      return;
    }

    const numericFee = parseFloat(baseFee) || 0;
    const payload = {
      subject_name: subjectName.trim(),
      department: department,
      base_fee_amount: numericFee
    };

    if (isEditing) {
      try {
        await supabase.from('subjects').update(payload).eq('id', currentId);
      } catch {
        // fallback
      }
      setSubjects(prev => prev.map(s => s.id === currentId ? { ...s, ...payload } : s));
    } else {
      let insertedObj: Subject | null = null;
      try {
        const { data } = await supabase.from('subjects').insert([payload]).select();
        if (data && data[0]) insertedObj = data[0];
      } catch {
        // fallback
      }

      if (!insertedObj) {
        insertedObj = {
          id: 'sub-' + Date.now(),
          ...payload
        };
      }
      setSubjects(prev => [insertedObj!, ...prev]);
    }

    setIsModalOpen(false);
  }

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch = s.subject_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept ? s.department === selectedDept : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-secondary-blue flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-primary-green shrink-0" />
            <span>Subject Management</span>
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Manage academic curriculum subjects and base tuition fees.</p>
        </div>
        <button 
          onClick={openAddModal} 
          className="bg-primary-green hover:bg-primary-green/90 text-white px-5 sm:px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary-green/20 flex items-center justify-center gap-2 text-sm w-full sm:w-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Subject
        </button>
      </div>

      <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/60 bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary-green text-xs sm:text-sm text-gray-800 backdrop-blur-md"
            />
          </div>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-white/60 bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary-green font-medium text-xs sm:text-sm text-gray-700 backdrop-blur-md"
          >
            <option value="">All Departments</option>
            <option value="Primary Education">Primary Education</option>
            <option value="Secondary Education">Secondary Education</option>
            <option value="Islamic Studies">Islamic Studies</option>
          </select>
        </div>

        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[500px] text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200/60 text-xs font-bold uppercase tracking-wider text-secondary-blue">
                <th className="pb-3 px-3 sm:px-4">Subject Name</th>
                <th className="pb-3 px-3 sm:px-4">Department</th>
                <th className="pb-3 px-3 sm:px-4">Base Fee Amount</th>
                <th className="pb-3 px-3 sm:px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-primary-green border-t-transparent rounded-full mb-2"></div>
                    <p className="text-sm">Loading subjects...</p>
                  </td>
                </tr>
              ) : filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-white/60 transition-colors group">
                    <td className="py-4 px-3 sm:px-4 font-bold text-gray-900 text-xs sm:text-sm">{subject.subject_name}</td>
                    <td className="py-4 px-3 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">{subject.department}</td>
                    <td className="py-4 px-3 sm:px-4 font-bold text-accent-orange text-xs sm:text-sm">${Number(subject.base_fee_amount).toFixed(2)}</td>
                    <td className="py-4 px-3 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(subject)} 
                          title="Edit Subject"
                          className="p-1.5 rounded-lg bg-secondary-blue/10 text-secondary-blue hover:bg-secondary-blue hover:text-white transition-all cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(subject.id)} 
                          title="Delete Subject"
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
                  <td colSpan={4} className="py-12 text-center text-gray-500 font-medium">
                    No subjects found.
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
          <div className="glass-card w-full max-w-md p-4 sm:p-6 relative bg-white/95 border border-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg sm:text-xl font-bold text-secondary-blue mb-4">{isEditing ? 'Edit Subject' : 'Add New Subject'}</h3>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Subject Name *</label>
                <input 
                  type="text" 
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Department *</label>
                <select 
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm font-medium"
                >
                  <option value="Primary Education">Primary Education</option>
                  <option value="Secondary Education">Secondary Education</option>
                  <option value="Islamic Studies">Islamic Studies</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Base Fee Amount ($) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={baseFee}
                  onChange={(e) => setBaseFee(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm" 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-primary-green hover:bg-primary-green/90 shadow-lg shadow-primary-green/20">
                  {isEditing ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
