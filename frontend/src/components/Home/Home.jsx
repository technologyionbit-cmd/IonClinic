import axios from 'axios'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, Users, DollarSign, BadgeCent,
  TrendingUp, AlertTriangle, Pill, ArrowLeft,
  Stethoscope, MessageSquare, Package
} from 'lucide-react'
const API_BASE = import.meta.env.VITE_API_URL || ''

const API = `${API_BASE}/api`

function StatCard({ label, value, icon, color, bg }) {
  return (
    <div
      className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#e5e7eb] flex items-center gap-3"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}
        style={{ color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[#000340]/50 text-xs m-0 truncate">{label}</p>
        <p className="text-[#000340] text-base sm:text-xl font-bold m-0 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

const QUICK_LINKS = {
  Admin: [
    { label: 'إدارة المرضى', sub: 'عرض وإضافة المرضى', path: '/patient', color: '#4685AC', icon: <Users size={16} /> },
    { label: 'المواعيد', sub: 'جدولة وإدارة المواعيد', path: '/appointment', color: '#0A4174', icon: <CalendarDays size={16} /> },
    { label: 'المخزون', sub: 'إدارة المواد والمستلزمات', path: '/inventory', color: '#84C068', icon: <Package size={16} /> },
    { label: 'تذكيرات واتساب', sub: 'إرسال رسائل للمرضى', path: '/whatsAppMessage', color: '#3F7E5C', icon: <MessageSquare size={16} /> },
  ],
  Secretary: [
    { label: 'إدارة المرضى', sub: 'عرض وإضافة المرضى', path: '/patient', color: '#4685AC', icon: <Users size={16} /> },
    { label: 'المواعيد', sub: 'جدولة وإدارة المواعيد', path: '/appointment', color: '#0A4174', icon: <CalendarDays size={16} /> },
    { label: 'تذكيرات واتساب', sub: 'إرسال رسائل للمرضى', path: '/whatsAppMessage', color: '#3F7E5C', icon: <MessageSquare size={16} /> },
  ],
  Doctor: [
    { label: 'إدارة المرضى', sub: 'عرض وإضافة المرضى', path: '/patient', color: '#4685AC', icon: <Users size={16} /> },
    { label: 'المواعيد', sub: 'جدولة وإدارة المواعيد', path: '/appointment', color: '#0A4174', icon: <CalendarDays size={16} /> },
  ],
}

const ROLE_LABELS = {
  Admin: 'مدير النظام',
  Secretary: 'سكرتير',
  Doctor: 'طبيب',
}

export default function Home() {
  const [stats, setStats] = useState(null)
  const [maxPercent, setMaxPercent] = useState(20)
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  let role = 'Secretary'
  let username = ''
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      role = payload.role || 'Secretary'
      username = payload.username || payload.name || ''
    }
  } catch { }

  const quickLinks = QUICK_LINKS[role] ?? QUICK_LINKS.Secretary

  useEffect(() => {
    if (!token) { navigate('/login'); return }

    Promise.all([
      axios.get(`${API}/dashboard`, { headers }),
      axios.get(`${API}/settings`, { headers }),
      axios.get(`${API}/patients`, { headers }),
    ]).then(([dashRes, settingsRes, patientsRes]) => {
      setStats(dashRes.data)
      const pct = settingsRes.data?.max_patients_percentage
      if (pct !== undefined) setMaxPercent(Number(pct))
      const list = Array.isArray(patientsRes.data)
        ? patientsRes.data
        : patientsRes.data.patients || []
      setPatients(list)
    }).catch(err => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token')
        navigate('/login')
      } else {
        setError('تعذّر تحميل البيانات، يرجى المحاولة لاحقاً')
      }
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#4685AC] border-t-transparent animate-spin" />
        <p className="text-gray-400 text-sm">جارٍ التحميل...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <AlertTriangle size={32} className="text-amber-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[#0A4174] text-white text-sm rounded-xl hover:bg-[#0A4174]/90 transition"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  )

  const hasFinance = stats?.income_today !== undefined
  const hasDebts = stats?.total_debts !== undefined
  const hasLowStock = stats?.low_stock_alerts?.length > 0 && (role === 'Admin' || role === 'Doctor')
  const hasProfit = stats?.profit_today !== undefined && stats.profit_today > 0

  // ── المرضى الظاهرون حسب الدور والنسبة ───────────────────────
  // الأدمن يشوف الكل، السكرتير والدكتور يتأثروا بالنسبة
  const visibleCount = (role === 'Admin')
    ? patients.length
    : (patients.length ? Math.round(patients.length * (maxPercent / 100)) : 0)

  const visiblePatients = (role === 'Admin') ? patients : patients.slice(0, visibleCount)

  // ── إجمالي المرضى الظاهرين ───────────────────────────────────
  const displayedPatients = (role === 'Admin')
    ? (stats?.total_patients ?? 0)
    : visibleCount

  // ── ديون المرضى الظاهرين: جمع فعلي من القائمة ───────────────
  // بدل الضرب في النسبة — هنجمع remaining_amount للمرضى اللي بيتعرضوا فعلاً
  const visibleDebts = (role === 'Admin')
    ? (stats?.total_debts ?? 0)
    : visiblePatients.reduce((sum, p) => sum + (Number(p.remaining_amount) || 0), 0)

  return (
    <div dir="rtl" className="mt-5 lg:mt-0 min-h-screen bg-white p-4 sm:p-6 lg:p-8 font-[Tajawal,Cairo,sans-serif]">

      {/* ── Hero ────────────────────────────────────────────────── */}
      <div className="relative px-1 pt-2 pb-10 overflow-hidden mb-2">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#0A4174]/10 text-[#0A4174] whitespace-nowrap mt-1">
              {ROLE_LABELS[role] ?? role}
            </span>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 m-0">Medical Clinic Management System</p>
          </div>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 ${role === "Admin" ? "lg:grid-cols-4" : "lg:grid-cols-2"
          } gap-3 sm:gap-4 -mt-4 mb-6 relative z-10`}
      >
        <StatCard
          label="مواعيد اليوم"
          value={stats?.appointments_today ?? 0}
          icon={<CalendarDays size={20} />}
          color="#0A4174"
          bg="bg-[#0A4174]/10"
        />

        <StatCard
          label="إجمالي المرضى"
          value={displayedPatients}
          icon={<Users size={20} />}
          color="#4685AC"
          bg="bg-[#4685AC]/10"
        />

        {hasFinance && role === "Admin" && (
          <StatCard
            label="دخل اليوم"
            value={`${Number(stats.income_today).toLocaleString('ar-JO')} د.أ`}
            icon={<DollarSign size={20} />}
            color="#3F7E5C"
            bg="bg-[#3F7E5C]/10"
          />
        )}

        {hasDebts && role === "Admin" && (
          <StatCard
            label="إجمالي الديون"
            value={`${Number(visibleDebts).toLocaleString('ar-JO')} د.أ`}
            icon={<BadgeCent size={20} />}
            color="#84C068"
            bg="bg-[#84C068]/10"
          />
        )}
      </div>


      {/* ── Profit — Admin only ──────────────────────────────────── */}
      {hasProfit && (
        <div
          className="mb-6 bg-white rounded-2xl p-4 sm:p-5 border border-[#e5e7eb] shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-4"
          style={{ borderTop: '3px solid #3F7E5C' }}
        >
          <div className="w-10 h-10 rounded-xl bg-[#3F7E5C]/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} className="text-[#3F7E5C]" />
          </div>
          <div>
            <p className="text-[#3F7E5C] text-xs font-semibold m-0">ربح اليوم من المواد</p>
            <p className="text-[#000340] text-lg font-bold m-0">
              {Number(stats.profit_today).toLocaleString('ar-JO')} د.أ
            </p>
          </div>
        </div>
      )}

      {/* ── Low Stock Alerts — Admin + Doctor ───────────────────── */}
      {hasLowStock && (
        <div className="mb-6">
          <h2 className="text-[#000340] text-sm sm:text-base font-bold mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-500" /> تنبيهات المخزون
          </h2>
          <div className="flex flex-col gap-2">
            {stats.low_stock_alerts.map((item, i) => {
              const critical = item.current_quantity <= 0
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${critical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                    }`}
                >
                  <Pill size={15} className={critical ? 'text-red-500' : 'text-amber-500'} />
                  <p className={`text-sm font-medium flex-1 m-0 ${critical ? 'text-red-700' : 'text-amber-700'}`}>
                    {item.name}
                  </p>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${critical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      }`}
                  >
                    متبقي: {item.current_quantity}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Quick Links ──────────────────────────────────────────── */}
      <div className="px-0 pt-2 pb-8">
        <h2 className="text-[#000340] text-sm sm:text-base font-bold mb-3 sm:mb-4">الوصول السريع</h2>
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${role === "Doctor"
            ? "lg:grid-cols-2"
            : role === "Secretary"
              ? "lg:grid-cols-3"
              : "lg:grid-cols-4"
            } gap-3 sm:gap-4`}
        >
          {quickLinks.map(link => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="text-right bg-white rounded-2xl p-4 sm:p-5 border border-[#e5e7eb] hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
              style={{ borderTop: `3px solid ${link.color}` }}
            >
              <div className="w-2.5 h-2.5 rounded-full mb-3" style={{ background: link.color }} />
              <p className="text-[#000340] text-sm font-semibold m-0">{link.label}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-gray-400 text-xs m-0">{link.sub}</p>
                <ArrowLeft size={14} className="text-gray-300" />
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}