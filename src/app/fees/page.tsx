'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Plus, Search, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import { 
  supabase, 
  safeSupabaseQuery,
  FeeLedger, 
  Student, 
  FeeStatus, 
  INITIAL_FEES, 
  INITIAL_STUDENTS 
} from '@/lib/supabase';

export default function FeesPage() {
  const [fees, setFees] = useState<FeeLedger[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string>('');

  // Form State
  const [studentId, setStudentId] = useState<string>('');
  const [feeAmount, setFeeAmount] = useState<string>('30.00');
  const [discountAmount, setDiscountAmount] = useState<string>('0.00');
  const [feeStatus, setFeeStatus] = useState<FeeStatus>('Paid');
  const [formError, setFormError] = useState('');

  // Calculated final fee preview
  const parsedFee = parseFloat(feeAmount) || 0;
  const parsedDiscount = parseFloat(discountAmount) || 0;
  const calculatedFinal = Math.max(0, parsedFee - parsedDiscount);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch students list for dropdown
      const loadedStudents = await safeSupabaseQuery<Student[]>(async () => {
        const { data: stData } = await supabase.from('students').select('*').order('full_name');
        return (stData && stData.length > 0) ? stData : INITIAL_STUDENTS;
      }, INITIAL_STUDENTS);
      setStudents(loadedStudents);

      // Fetch fee ledgers
      const loadedFees = await safeSupabaseQuery<FeeLedger[]>(async () => {
        const { data: feeData } = await supabase.from('fee_ledgers').select('*').order('created_at', { ascending: false });
        return (feeData && feeData.length > 0) ? feeData : INITIAL_FEES;
      }, INITIAL_FEES);
      setFees(loadedFees);
    } catch {
      setStudents(INITIAL_STUDENTS);
      setFees(INITIAL_FEES);
    } finally {
      setLoading(false);
    }
  }

  function getStudentName(sId: string): string {
    const found = students.find(s => s.id === sId);
    return found ? `${found.full_name} (#${found.student_custom_id})` : 'Unknown Student';
  }

  function openAddModal() {
    setIsEditing(false);
    setCurrentId('');
    setStudentId(students[0]?.id || '');
    setFeeAmount('30.00');
    setDiscountAmount('0.00');
    setFeeStatus('Unpaid');
    setFormError('');
    setIsModalOpen(true);
  }

  function openEditModal(fee: FeeLedger) {
    setIsEditing(true);
    setCurrentId(fee.id);
    setStudentId(fee.student_id);
    setFeeAmount(fee.fee_amount.toString());
    setDiscountAmount(fee.discount_amount.toString());
    setFeeStatus(fee.fee_status);
    setFormError('');
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this fee ledger record?')) {
      try {
        await supabase.from('fee_ledgers').delete().eq('id', id);
      } catch {
        // fallback
      }
      setFees(prev => prev.filter(f => f.id !== id));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!studentId) {
      setFormError('Please select a student.');
      return;
    }

    const payload = {
      student_id: studentId,
      fee_amount: parsedFee,
      discount_amount: parsedDiscount,
      final_fee_amount: calculatedFinal,
      fee_status: feeStatus,
    };

    if (isEditing) {
      try {
        await supabase.from('fee_ledgers').update(payload).eq('id', currentId);
      } catch {
        // fallback
      }
      setFees(prev => prev.map(f => f.id === currentId ? { ...f, ...payload } : f));
    } else {
      let insertedFee: FeeLedger | null = null;
      try {
        const { data } = await supabase.from('fee_ledgers').insert([payload]).select();
        if (data && data[0]) insertedFee = data[0];
      } catch {
        // fallback
      }

      if (!insertedFee) {
        insertedFee = {
          id: 'f-' + Date.now(),
          ...payload
        };
      }
      setFees(prev => [insertedFee!, ...prev]);
    }

    setIsModalOpen(false);
  }

  // Filter fees
  const filteredFees = fees.filter((fee) => {
    const studentName = getStudentName(fee.student_id).toLowerCase();
    const matchesSearch = studentName.includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus ? fee.fee_status === selectedStatus : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-secondary-blue flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-primary-green shrink-0" />
            <span>Fee Management</span>
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Multi-record financial ledgers, discount overrides, and binary payment status tracking.</p>
        </div>
        <button 
          onClick={openAddModal} 
          className="bg-primary-green hover:bg-primary-green/90 text-white px-5 sm:px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary-green/20 flex items-center justify-center gap-2 text-sm w-full sm:w-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Fee Record
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
              placeholder="Search by student name or custom ID..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/60 bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary-green text-xs sm:text-sm text-gray-800 backdrop-blur-md"
            />
          </div>
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-white/60 bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary-green font-medium text-xs sm:text-sm text-gray-700 backdrop-blur-md"
          >
            <option value="">All Fee Statuses</option>
            <option value="Paid">Paid (Green)</option>
            <option value="Unpaid">Unpaid (Red/Warning)</option>
          </select>
        </div>

        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[650px] text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200/60 text-xs font-bold uppercase tracking-wider text-secondary-blue">
                <th className="pb-3 px-3 sm:px-4">Student Profile</th>
                <th className="pb-3 px-3 sm:px-4">Base Fee</th>
                <th className="pb-3 px-3 sm:px-4">Discount</th>
                <th className="pb-3 px-3 sm:px-4">Final Amount</th>
                <th className="pb-3 px-3 sm:px-4">Binary Status</th>
                <th className="pb-3 px-3 sm:px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-primary-green border-t-transparent rounded-full mb-2"></div>
                    <p className="text-sm">Loading fee ledgers...</p>
                  </td>
                </tr>
              ) : filteredFees.length > 0 ? (
                filteredFees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-white/60 transition-colors group">
                    <td className="py-4 px-3 sm:px-4 font-bold text-gray-900 text-xs sm:text-sm">
                      {getStudentName(fee.student_id)}
                    </td>
                    <td className="py-4 px-3 sm:px-4 text-xs sm:text-sm text-gray-600 font-medium">
                      ${Number(fee.fee_amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-3 sm:px-4 text-xs sm:text-sm text-emerald-600 font-medium">
                      -${Number(fee.discount_amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-3 sm:px-4 font-extrabold text-secondary-blue text-xs sm:text-sm">
                      ${Number(fee.final_fee_amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-3 sm:px-4">
                      {fee.fee_status === 'Paid' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-green/15 text-primary-green border border-primary-green/30">
                          <span className="w-2 h-2 rounded-full bg-primary-green"></span>
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-status-warning/15 text-status-warning border border-status-warning/30">
                          <span className="w-2 h-2 rounded-full bg-status-warning"></span>
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(fee)} 
                          title="Edit Fee Record"
                          className="p-1.5 rounded-lg bg-secondary-blue/10 text-secondary-blue hover:bg-secondary-blue hover:text-white transition-all cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(fee.id)} 
                          title="Delete Fee Record"
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
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-medium">
                    No fee records found matching your filters.
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
              {isEditing ? 'Edit Fee Ledger Record' : 'Record New Fee Ledger'}
            </h3>
            <p className="text-xs text-gray-500 mb-5">Manually editable financial figures with strict binary status mapping.</p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Select Student *</label>
                <select 
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm font-medium"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} (#{s.student_custom_id} • {s.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Base Fee ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm font-semibold text-gray-800" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Discount Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm font-semibold text-emerald-600" 
                  />
                </div>
              </div>

              {/* Calculated Final Fee Preview Box */}
              <div className="p-3.5 bg-secondary-blue/5 rounded-xl border border-secondary-blue/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-600 block">Calculated Final Amount</span>
                  <span className="text-[10px] text-gray-400">Formula: Base Fee - Discount</span>
                </div>
                <span className="text-xl font-extrabold text-secondary-blue">${calculatedFinal.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Binary Fee Status *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFeeStatus('Paid')}
                    className={`py-2.5 px-4 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      feeStatus === 'Paid'
                        ? 'bg-primary-green text-white border-primary-green shadow-md shadow-primary-green/20'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${feeStatus === 'Paid' ? 'bg-white' : 'bg-primary-green'}`}></span>
                    Paid
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeeStatus('Unpaid')}
                    className={`py-2.5 px-4 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      feeStatus === 'Unpaid'
                        ? 'bg-status-warning text-white border-status-warning shadow-md shadow-status-warning/20'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${feeStatus === 'Unpaid' ? 'bg-white' : 'bg-status-warning'}`}></span>
                    Unpaid
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-primary-green hover:bg-primary-green/90 shadow-lg shadow-primary-green/20">
                  {isEditing ? 'Save Changes' : 'Record Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
