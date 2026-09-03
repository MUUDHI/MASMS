'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  GraduationCap, 
  Sun, 
  Moon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Activity, 
  Award,
  ChevronRight
} from 'lucide-react';
import { 
  supabase, 
  Student, 
  FeeLedger, 
  ExamResult, 
  Subject,
  KPIMetrics,
  INITIAL_STUDENTS, 
  INITIAL_FEES, 
  INITIAL_EXAMS,
  INITIAL_SUBJECTS 
} from '@/lib/supabase';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<KPIMetrics>({
    totalStudents: 0,
    primaryStudents: 0,
    secondaryStudents: 0,
    islamicStudents: 0,
    dayStudents: 0,
    nightStudents: 0,
    partTimeStudents: 0,
    paidStudents: 0,
    unpaidStudents: 0,
    totalFeesCollected: 0,
  });

  const [recentExams, setRecentExams] = useState<ExamResult[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // 1. Fetch Students
      const { data: stData } = await supabase.from('students').select('*');
      const studentList: Student[] = (stData && stData.length > 0) ? stData : INITIAL_STUDENTS;
      setStudents(studentList);

      // 2. Fetch Fees
      const { data: feeData } = await supabase.from('fee_ledgers').select('*');
      const feeList: FeeLedger[] = (feeData && feeData.length > 0) ? feeData : INITIAL_FEES;

      // 3. Fetch Exams
      const { data: exData } = await supabase.from('exam_results').select('*').order('recorded_at', { ascending: false }).limit(5);
      const examList: ExamResult[] = (exData && exData.length > 0) ? exData : INITIAL_EXAMS;
      setRecentExams(examList);

      // 4. Fetch Subjects
      const { data: subData } = await supabase.from('subjects').select('*');
      setSubjects((subData && subData.length > 0) ? subData : INITIAL_SUBJECTS);

      // Compute exact 9 metrics
      const totalStudents = studentList.length;
      const primaryStudents = studentList.filter(s => s.department === 'Primary Education').length;
      const secondaryStudents = studentList.filter(s => s.department === 'Secondary Education').length;
      const islamicStudents = studentList.filter(s => s.department === 'Islamic Studies').length;

      const dayStudents = studentList.filter(s => s.time_group === 'Day').length;
      const nightStudents = studentList.filter(s => s.time_group === 'Night').length;
      const partTimeStudents = studentList.filter(s => s.time_group === 'Part-Time').length;

      // Calculate paid / unpaid student metrics
      const paidStudentIds = new Set(feeList.filter(f => f.fee_status === 'Paid').map(f => f.student_id));
      const unpaidStudentIds = new Set(feeList.filter(f => f.fee_status === 'Unpaid').map(f => f.student_id));

      const paidCount = paidStudentIds.size;
      // Any student with an unpaid record or not in paid set
      const unpaidCount = Math.max(unpaidStudentIds.size, totalStudents - paidCount);

      const totalFeesCollected = feeList
        .filter(f => f.fee_status === 'Paid')
        .reduce((sum, f) => sum + Number(f.final_fee_amount || 0), 0);

      setMetrics({
        totalStudents,
        primaryStudents,
        secondaryStudents,
        islamicStudents,
        dayStudents,
        nightStudents,
        partTimeStudents,
        paidStudents: paidCount,
        unpaidStudents: unpaidCount,
        totalFeesCollected,
      });

    } catch (err) {
      console.warn('Using fallback data for dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  function getStudentName(sId: string): string {
    const found = students.find(s => s.id === sId);
    return found ? found.full_name : `Student #${sId.substring(0, 5)}`;
  }

  function getSubjectName(subId: string): string {
    const found = subjects.find(s => s.id === subId);
    return found ? found.subject_name : 'Subject';
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-secondary-blue tracking-tight">System Dashboard Overview</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Real-time KPI metrics and operational summary for Murtazim Academy.</p>
        </div>
        <div className="glass-card px-4 py-2 flex items-center gap-2.5 self-start sm:self-auto shadow-sm border border-white/70">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-green animate-ping"></span>
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Live System Active</span>
        </div>
      </div>

      {/* Primary KPI Summary Cards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard 
          title="Total Students" 
          value={metrics.totalStudents.toLocaleString()} 
          subtitle="Enrolled Across All Depts"
          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-secondary-blue" />} 
          colorClass="border-l-4 border-secondary-blue" 
        />
        <MetricCard 
          title="Paid Students" 
          value={metrics.paidStudents.toLocaleString()} 
          subtitle="Fees Settled"
          icon={<CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary-green" />} 
          colorClass="border-l-4 border-primary-green" 
        />
        <MetricCard 
          title="Unpaid Students" 
          value={metrics.unpaidStudents.toLocaleString()} 
          subtitle="Pending Financial Balance"
          icon={<XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-status-warning" />} 
          colorClass="border-l-4 border-status-warning" 
        />
        <MetricCard 
          title="Total Fees Collected" 
          value={`$${metrics.totalFeesCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          subtitle="Settled Financial Ledger"
          icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-accent-orange" />} 
          colorClass="border-l-4 border-accent-orange" 
        />
      </div>

      {/* Breakdown Grids & Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Department Breakdown */}
          <div className="glass-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-secondary-blue flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary-green shrink-0" />
                <span>Department Breakdown</span>
              </h3>
              <Link href="/students" className="text-xs font-semibold text-secondary-blue hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <SmallMetricCard 
                title="Primary Education" 
                value={metrics.primaryStudents.toString()} 
                badge="Night Shift"
                accentColor="bg-blue-500"
              />
              <SmallMetricCard 
                title="Secondary Education" 
                value={metrics.secondaryStudents.toString()} 
                badge="Day Shift"
                accentColor="bg-amber-500"
              />
              <SmallMetricCard 
                title="Islamic Studies" 
                value={metrics.islamicStudents.toString()} 
                badge="Part-Time"
                accentColor="bg-emerald-500"
              />
            </div>
          </div>
          
          {/* Shift Distribution */}
          <div className="glass-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-secondary-blue flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent-orange shrink-0" />
                <span>Shift Distribution</span>
              </h3>
              <span className="text-[11px] text-gray-500 font-medium hidden sm:inline">Rigid Department Binding</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <SmallMetricCard 
                title="Day Students" 
                value={metrics.dayStudents.toString()} 
                icon={<Sun className="w-4 h-4 text-amber-500" />} 
                accentColor="bg-amber-400"
              />
              <SmallMetricCard 
                title="Night Students" 
                value={metrics.nightStudents.toString()} 
                icon={<Moon className="w-4 h-4 text-indigo-500" />} 
                accentColor="bg-indigo-400"
              />
              <SmallMetricCard 
                title="Part-Time Students" 
                value={metrics.partTimeStudents.toString()} 
                icon={<Activity className="w-4 h-4 text-emerald-500" />} 
                accentColor="bg-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Recent Results Panel */}
        <div className="glass-card p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-secondary-blue flex items-center gap-2">
                <Award className="w-5 h-5 text-accent-orange shrink-0" />
                <span>Recent Exam Results</span>
              </h3>
              <Link href="/exams" className="text-xs font-semibold text-secondary-blue hover:underline">
                Gradebook
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentExams.length > 0 ? (
                recentExams.map((ex) => (
                  <div key={ex.id} className="p-3 bg-white/50 rounded-xl border border-white/80 hover:bg-white/80 transition-all cursor-default shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-xs text-gray-900 truncate">{getStudentName(ex.student_id)}</p>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-secondary-blue/15 text-secondary-blue rounded-md border border-secondary-blue/20">
                        {ex.grade}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-2">
                      {getSubjectName(ex.subject_id)} • <span className="font-medium">{ex.exam_type}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200/80 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full" 
                          style={{ width: `${Math.min(100, Math.max(0, ex.score))}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] font-bold text-gray-800">{Number(ex.score).toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 py-6 text-center">No exam results recorded yet.</p>
              )}
            </div>
          </div>

          <Link 
            href="/exams" 
            className="mt-4 w-full py-2.5 bg-secondary-blue/10 hover:bg-secondary-blue/20 text-secondary-blue rounded-xl text-xs font-bold transition-all text-center block"
          >
            View Gradebook Matrix
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  subtitle,
  icon, 
  colorClass 
}: { 
  title: string; 
  value: string; 
  subtitle: string;
  icon: React.ReactNode; 
  colorClass: string; 
}) {
  return (
    <div className={`glass-card p-4 sm:p-6 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 ${colorClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
        </div>
        <div className="p-2.5 sm:p-3 bg-white/70 rounded-xl shadow-inner border border-white shrink-0">
          {icon}
        </div>
      </div>
      <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mt-3 sm:mt-4 border-t border-gray-100 pt-2">{subtitle}</p>
    </div>
  );
}

function SmallMetricCard({ 
  title, 
  value, 
  badge,
  icon, 
  accentColor 
}: { 
  title: string; 
  value: string; 
  badge?: string;
  icon?: React.ReactNode; 
  accentColor: string;
}) {
  return (
    <div className="bg-white/50 rounded-xl p-3.5 sm:p-4 border border-white/80 flex items-center justify-between hover:bg-white/80 transition-all shadow-sm">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`w-2 h-2 rounded-full ${accentColor}`}></span>
          <p className="text-xs font-bold text-gray-600">{title}</p>
        </div>
        <p className="text-xl sm:text-2xl font-black text-gray-900">{value}</p>
        {badge && <span className="text-[10px] font-semibold text-gray-400 block mt-0.5">{badge}</span>}
      </div>
      {icon && <div className="p-2 sm:p-2.5 bg-white/80 rounded-xl border border-gray-100 shadow-sm shrink-0">{icon}</div>}
    </div>
  );
}
