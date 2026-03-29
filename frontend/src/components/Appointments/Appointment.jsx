import axios from 'axios'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Plus, CalendarDays, Pencil, Trash2, X,
  Filter, Search, Clock, AlertCircle, ClipboardList, Pill, Zap
} from 'lucide-react'
import Loading from '../Loading/Loading'

const STATUS = {
  Scheduled:   { label: 'مجدول',      color: 'text-[#4685AC]', bg: 'bg-[#4685AC]/10' },
  Completed:   { label: 'مكتمل',      color: 'text-green-600', bg: 'bg-green-100'    },
  Cancelled:   { label: 'ملغي',       color: 'text-red-500',   bg: 'bg-red-50'       },
  Rescheduled: { label: 'معاد جدولة', color: 'text-amber-600', bg: 'bg-amber-50'     },
}

function todayStr() { return new Date().toISOString().split('T')[0] }

function ampmTo24h(timeAmPm) {
  if (!timeAmPm) return ''
  if (!timeAmPm.includes('AM') && !timeAmPm.includes('PM')) return timeAmPm
  const [timePart, period] = timeAmPm.trim().split(' ')
  let [h, m] = timePart.split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function to12hArabic(timeStr) {
  if (!timeStr) return ''
  const t24 = timeStr.includes('AM') || timeStr.includes('PM') ? timeStr : null
  let h, m, period
  if (t24) {
    const [tp, p] = timeStr.trim().split(' ')
    ;[h, m] = tp.split(':').map(Number)
    period = /PM/i.test(p) ? 'م' : 'ص'
  } else {
    ;[h, m] = timeStr.split(':').map(Number)
    period = h >= 12 ? 'م' : 'ص'
  }
  const h12 = h % 12 || 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

function MedicalRecordModal({ appointment, onClose, headers, API_A, API_INV, onSaved }) {
  const [inventory,   setInventory]   = useState([])
  const [medications, setMedications] = useState([{ inventory_id: '', quantity: 1 }])
  const [doctorNotes, setDoctorNotes] = useState(appointment.doctor_notes || '')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    axios.get(API_INV, { headers })
      .then(r => setInventory(Array.isArray(r.data) ? r.data : r.data.data || []))
      .catch(console.error)
  }, [])

  const addMed       = ()         => setMedications(p => [...p, { inventory_id: '', quantity: 1 }])
  const removeMed    = (i)        => setMedications(p => p.filter((_, idx) => idx !== i))
  const updateMed    = (i, f, v)  => setMedications(p => p.map((m, idx) => idx === i ? { ...m, [f]: v } : m))

  async function handleSubmit() {
    setError('')
    const validMeds = medications.filter(m => m.inventory_id && Number(m.quantity) > 0)
    setSaving(true)
    try {
      await axios.put(`${API_A}/${appointment.id}/record`, {
        doctor_notes: doctorNotes || null,
        medications:  validMeds.map(m => ({
          inventory_id: Number(m.inventory_id),
          quantity:     Number(m.quantity),
        })),
      }, { headers })
      onSaved()
      onClose()
    } catch (e) {
      setError(e.response?.data?.message || 'حدث خطأ أثناء الحفظ')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#000340]/30 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div>
            <h2 className="text-[#000340] text-base font-bold m-0">تسجيل السجل الطبي</h2>
            <p className="text-gray-400 text-xs mt-0.5">{appointment.full_name}</p>
          </div>
          <button onClick={onClose} className="bg-transparent border-none text-gray-300 cursor-pointer hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl border bg-red-50 border-red-200 text-red-600 text-sm">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="text-gray-600 text-xs block mb-1.5">ملاحظات الطبيب</label>
            <textarea value={doctorNotes} onChange={e => setDoctorNotes(e.target.value)}
              placeholder="اكتب ملاحظاتك هنا..." rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 text-[#000340] text-sm placeholder:text-gray-300 outline-none border border-gray-200 focus:border-[#4685AC] transition-colors resize-y" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-600 text-xs font-semibold flex items-center gap-1">
                <Pill size={12} /> المواد المستخدمة
              </label>
              <button onClick={addMed}
                className="flex items-center gap-1 text-[#4685AC] text-xs font-semibold bg-[#4685AC]/10 px-2.5 py-1 rounded-lg border-none cursor-pointer hover:bg-[#4685AC]/20 transition-colors">
                <Plus size={11} /> إضافة مادة
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {medications.map((med, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={med.inventory_id} onChange={e => updateMed(i, 'inventory_id', e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 text-[#000340] text-sm outline-none border border-gray-200 focus:border-[#4685AC] transition-colors appearance-none">
                    <option value="">اختر المادة</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} (متبقي: {item.current_quantity})
                      </option>
                    ))}
                  </select>
                  <input type="number" min="1" value={med.quantity}
                    onChange={e => updateMed(i, 'quantity', e.target.value)}
                    className="w-20 px-3 py-2.5 rounded-xl bg-gray-50 text-[#000340] text-sm outline-none border border-gray-200 focus:border-[#4685AC] transition-colors text-center" />
                  {medications.length > 1 && (
                    <button onClick={() => removeMed(i)}
                      className="w-8 h-9 rounded-lg border-none bg-red-50 text-red-400 cursor-pointer flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0">
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={handleSubmit} disabled={saving}
            className={`flex-1 py-2.5 rounded-xl border-none font-bold text-sm cursor-pointer bg-[#000340] text-white hover:bg-[#0A4174] transition-colors ${saving ? 'opacity-50' : ''}`}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ السجل'}
          </button>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-transparent text-gray-500 cursor-pointer text-sm hover:text-gray-700 transition-colors">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
export default function Appointment() {
  const [appointments,    setAppointments]    = useState([])
  const [patients,        setPatients]        = useState([])
  const [dailyStats,      setDailyStats]      = useState(null)
  const [timeWarning,     setTimeWarning]     = useState('')
  const [backendError,    setBackendError]    = useState('')
  const [loading,         setLoading]         = useState(true)
  const [saving,          setSaving]          = useState(false)
  const [filterDate,      setFilterDate]      = useState('')
  const [search,          setSearch]          = useState('')
  const [showModal,       setShowModal]       = useState(false)
  const [showDel,         setShowDel]         = useState(false)
  const [showRecord,      setShowRecord]      = useState(false)
  const [editTarget,      setEditTarget]      = useState(null)
  const [delTarget,       setDelTarget]       = useState(null)
  const [recordTarget,    setRecordTarget]    = useState(null)
  const [patientSearch,   setPatientSearch]   = useState('')
  const [showPatientDrop, setShowPatientDrop] = useState(false)
  const [isQuickAppt,     setIsQuickAppt]     = useState(false)  // موعد سريع من الدكتور
  const [quickApptIds,    setQuickApptIds]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('quick_appts') || '[]') } catch { return [] }
  })

  const patientDropRef = useRef(null)
  const location = useLocation()

  const API_BASE = import.meta.env.VITE_API_URL || ''
  const API_A   = `${API_BASE}/api/appointments`
  const API_P   = `${API_BASE}/api/patients`
  const API_INV = `${API_BASE}/api/inventory`
  const token   = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  let role = 'Secretary'
  try {
    if (token) { const p = JSON.parse(atob(token.split('.')[1])); role = p.role || 'Secretary' }
  } catch {}

  const canManageAppt = role === 'Admin' || role === 'Secretary'
  const canAddRecord  = role === 'Admin' || role === 'Doctor'

  async function getAllPatients() {
    try {
      const { data } = await axios.get(API_P, { headers })
      setPatients(Array.isArray(data) ? data : data.patients || [])
    } catch (e) { console.error(e) }
  }

  async function getAllAppointments(date = '') {
    setLoading(true)
    try {
      const url = date ? `${API_A}?date=${date}` : API_A
      const { data } = await axios.get(url, { headers })
      setAppointments(Array.isArray(data) ? data : data.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function getDailyStats(date = todayStr()) {
    try {
      const { data } = await axios.get(`${API_A}/stats?date=${date}`, { headers })
      setDailyStats(data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    getAllPatients()
    getAllAppointments()
    getDailyStats()
  }, [])

  // استقبال المريض من صفحة السجل الطبي — إضافة موعد سريع
  useEffect(() => {
    if (location.state?.quickPatient && patients.length > 0) {
      const p = location.state.quickPatient
      setIsQuickAppt(true)
      setEditTarget(null)
      formik.resetForm()
      formik.setFieldValue('patient_id', p.id)
      setPatientSearch(p.full_name)
      setBackendError('')
      setTimeWarning('')
      setShowModal(true)
      // امسح الـ state عشان ما يتفتحش تاني لو رجع للصفحة
      window.history.replaceState({}, '')
    }
  }, [location.state, patients])

  useEffect(() => {
    function handleClick(e) {
      if (patientDropRef.current && !patientDropRef.current.contains(e.target))
        setShowPatientDrop(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function checkTimeWarning(datetime) {
    if (!dailyStats || !datetime) { setTimeWarning(''); return }
    const timePart = datetime.substring(11, 16)
    const start24  = ampmTo24h(dailyStats.working_hours?.start)
    const end24    = ampmTo24h(dailyStats.working_hours?.end)
    if (!timePart || !start24 || !end24) return
    if (timePart < start24 || timePart > end24) {
      setTimeWarning(`⚠️ خارج ساعات العمل (${dailyStats.working_hours.start} - ${dailyStats.working_hours.end})`)
    } else {
      setTimeWarning('')
    }
  }

  const filteredPatientsSearch = patients.filter(p =>
    p.full_name?.includes(patientSearch) || p.phone_number?.includes(patientSearch)
  )

  function selectPatientForAppt(p) {
    formik.setFieldValue('patient_id', p.id)
    setPatientSearch(p.full_name)
    setShowPatientDrop(false)
  }

  const ValidationSchema = Yup.object().shape({
    patient_id:           Yup.string().required('يجب اختيار المريض'),
    appointment_datetime: Yup.string().required('يجب ادخال التاريخ والوقت'),
    session_number:       Yup.number().required('يجب ادخال رقم الجلسة').min(1, 'يجب أن يكون أكبر من 0'),
    price:                Yup.number().min(0).optional(),
    status:               Yup.string().optional(),
  })

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      patient_id:           editTarget?.patient_id || '',
      appointment_datetime: editTarget?.appointment_datetime?.slice(0, 16) || '',
      session_number:       editTarget?.session_number || '',
      price:                editTarget?.price || 0,
      status:               editTarget?.status || 'Scheduled',
    },
    validationSchema: ValidationSchema,
    onSubmit: async (values) => {
      setSaving(true)
      setBackendError('')
      try {
        let warning = null
        if (editTarget) {
          await axios.put(`${API_A}/${editTarget.id}`, {
            appointment_datetime: values.appointment_datetime,
            session_number:       Number(values.session_number),
            price:                Number(values.price) || 0,
            status:               values.status,
          }, { headers })
        } else {
          const res = await axios.post(API_A, {
            patient_id:           Number(values.patient_id),
            appointment_datetime: values.appointment_datetime,
            session_number:       Number(values.session_number),
            price:                Number(values.price) || 0,
          }, { headers })
          warning = res.data?.warning
          // لو موعد سريع — احفظ الـ ID في localStorage
          if (isQuickAppt && res.data?.id) {
            const stored = JSON.parse(localStorage.getItem('quick_appts') || '[]')
            stored.push(res.data.id)
            localStorage.setItem('quick_appts', JSON.stringify(stored))
            setQuickApptIds([...stored])
          }
        }
        await getAllAppointments(filterDate)
        await getDailyStats(filterDate || todayStr())
        setShowModal(false); setEditTarget(null); formik.resetForm(); setPatientSearch(''); setIsQuickAppt(false)
        if (warning) setBackendError(warning)
      } catch (e) {
        setBackendError(e.response?.data?.message || 'حدث خطأ')
      } finally { setSaving(false) }
    },
  })

  async function handleDelete() {
    setSaving(true)
    try {
      await axios.delete(`${API_A}/${delTarget.id}`, { headers })
      await getAllAppointments(filterDate)
      await getDailyStats(filterDate || todayStr())
      setShowDel(false); setDelTarget(null)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  function openAdd()    { setEditTarget(null); formik.resetForm(); setPatientSearch(''); setBackendError(''); setTimeWarning(''); setIsQuickAppt(false); setShowModal(true) }
  function openEdit(a)  { setEditTarget(a); setBackendError(''); setTimeWarning(''); setIsQuickAppt(false); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditTarget(null); formik.resetForm(); setPatientSearch(''); setBackendError(''); setTimeWarning(''); setIsQuickAppt(false) }



  function handleDateFilter(e) {
    const d = e.target.value
    setFilterDate(d)
    getAllAppointments(d)
    getDailyStats(d || todayStr())
  }


  function formatDate(dt) {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('ar-EG-u-ca-gregory', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const inp = (err) =>
    `w-full px-4 py-3 rounded-xl bg-gray-50 text-[#000340] text-sm placeholder:text-gray-400 outline-none border transition-colors ${err ? 'border-red-400' : 'border-gray-300 focus:border-[#4685AC]'}`

  const filtered = appointments.filter(a =>
    a.full_name?.includes(search) ||
    a.phone_number?.includes(search) ||
    formatDate(a.appointment_datetime)?.includes(search)
  )

  const stats    = dailyStats?.appointments
  const isFull   = stats?.is_full
  const nearFull = stats && !isFull && (stats.max_allowed - stats.current_booked) <= 3
  const counterCls = isFull   ? 'bg-red-50 border-red-200 text-red-600'
                   : nearFull ? 'bg-amber-50 border-amber-200 text-amber-600'
                   :            'bg-[#4685AC]/10 border-[#4685AC]/40 text-[#0A4174]'

  // ✅ Loading screen — بتغطي الصفحة كلها لحد ما تجي البيانات
  if (loading) return <Loading />

  return (
    <div dir="rtl" className="mt-5 lg:mt-0 min-h-screen bg-white p-4 sm:p-6 lg:p-8 font-[Tajawal,Cairo,sans-serif]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[#000340] text-xl sm:text-2xl font-bold m-0">المواعيد</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">{appointments.length} موعد</p>
        </div>
        {canManageAppt && (
          <button onClick={openAdd}
            className="flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl border-none bg-[#000340] text-white font-bold text-xs sm:text-sm cursor-pointer shadow-lg shadow-[#000340]/20 hover:bg-[#0A4174] transition-colors">
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">إضافة موعد</span>
            <span className="sm:hidden">إضافة</span>
          </button>
        )}
      </div>

      {/* ── عداد المواعيد + ساعات العمل ── */}
      {dailyStats && stats && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold mb-5 flex-wrap ${counterCls}`}>
          <CalendarDays size={16} className="flex-shrink-0" />
          <span>
            مواعيد {filterDate || 'اليوم'}: <strong>{stats.current_booked}</strong> من <strong>{stats.max_allowed}</strong>
            {isFull
              ? ' — اكتملت المواعيد'
              : ` — متبقي ${stats.max_allowed - stats.current_booked}`}
          </span>
          <span className="mr-auto flex items-center gap-1 text-xs font-normal opacity-70 flex-shrink-0">
            <Clock size={13} />
            ساعات العمل: {to12hArabic(dailyStats.working_hours?.start)} – {to12hArabic(dailyStats.working_hours?.end)}
          </span>
        </div>
      )}

      {/* تحذير double booking */}
      {backendError && !showModal && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-700 text-sm font-semibold mb-4">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{backendError}</span>
          <button onClick={() => setBackendError('')} className="mr-auto bg-transparent border-none cursor-pointer text-amber-400 hover:text-amber-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Filter + Search ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="date" value={filterDate} onChange={handleDateFilter}
            className="pr-9 pl-4 py-2.5 rounded-xl bg-white border border-gray-300 text-[#000340] text-sm outline-none focus:border-[#4685AC] transition-colors w-52" />
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو الهاتف..."
          className="px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-[#000340] text-sm outline-none focus:border-[#4685AC] transition-colors w-60 placeholder:text-gray-400" />
        {(filterDate || search) && (
          <button onClick={() => { setFilterDate(''); setSearch(''); getAllAppointments(''); getDailyStats(todayStr()) }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-xs cursor-pointer hover:text-gray-700 transition-colors">
            <X size={12} /> إلغاء البحث
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-gray-200 rounded-2xl h-[400px] 2xl:h-[500px] overflow-y-scroll overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
        style={{ borderTop: '3px solid #4685AC' }}>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold"
              style={{ gridTemplateColumns: '2fr 1.8fr 0.7fr 1fr 0.8fr 1fr 96px' }}>
              <span>المريض</span><span>التاريخ والوقت</span><span>الجلسة</span>
              <span>الهاتف</span><span>السعر</span><span>الحالة</span><span>إجراءات</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
                لا توجد مواعيد{filterDate ? ' في هذا اليوم' : ''}
              </div>
            ) : filtered.map((a, i) => {
              const st      = STATUS[a.status] || STATUS.Scheduled
              const isQuick = quickApptIds.includes(a.id)
              return (
                <div key={a.id}
                  className={`grid gap-2 px-5 py-[14px] items-center transition-colors ${isQuick ? 'bg-purple-50 hover:bg-purple-100' : 'hover:bg-gray-50'}`}
                  style={{
                    gridTemplateColumns: '2fr 1.8fr 0.7fr 1fr 0.8fr 1fr 96px',
                    borderBottom: i < filtered.length - 1 ? `1px solid ${isQuick ? '#e9d5ff' : '#f3f4f6'}` : 'none'
                  }}>
                  <span className="text-[#000340] text-sm font-medium truncate flex items-center gap-1.5">
                    {/* {quickApptIds.includes(a.id) && (
                      <span title="موعد سريع من الدكتور" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-600 text-[10px] font-bold flex-shrink-0">
                        <Zap size={9} /> الطبيب
                      </span>
                    )} */}
                    {a.full_name}
                  </span>
                  <span className="text-gray-500 text-sm">{formatDate(a.appointment_datetime)}</span>
                  <span className="text-gray-500 text-sm">#{a.session_number}</span>
                  <span dir="ltr" className="text-gray-500 text-sm">{a.phone_number}</span>
                  <span className="text-[#3F7E5C] text-sm font-semibold">
                    {Number(a.price || 0).toLocaleString('ar-JO')} د.أ
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${st.color} ${st.bg}`}>
                    {st.label}
                  </span>
                  <div className="flex gap-1.5">
                    {canAddRecord && (
                      <button onClick={() => { setRecordTarget(a); setShowRecord(true) }}
                        title="تسجيل السجل الطبي"
                        className="w-8 h-8 rounded-lg border-none bg-[#0A4174]/10 text-[#0A4174] cursor-pointer flex items-center justify-center hover:bg-[#0A4174]/20 transition-colors">
                        <ClipboardList size={13} />
                      </button>
                    )}
                    {canManageAppt && (
                      <>
                        <button onClick={() => openEdit(a)} title="تعديل"
                          className="w-8 h-8 rounded-lg border-none bg-[#4685AC]/10 text-[#4685AC] cursor-pointer flex items-center justify-center hover:bg-[#4685AC]/20 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => { setDelTarget(a); setShowDel(true) }} title="حذف"
                          className="w-8 h-8 rounded-lg border-none bg-red-50 text-red-400 cursor-pointer flex items-center justify-center hover:bg-red-100 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                    {!canManageAppt && !canAddRecord && (
                      <span className="text-gray-300 text-xs px-2">عرض فقط</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Modal إضافة/تعديل ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#000340]/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-7 w-full max-w-md shadow-[0_24px_60px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#000340] text-base sm:text-lg font-bold m-0 flex items-center gap-2">
                {editTarget ? `تعديل موعد: ${editTarget.full_name}` : 'إضافة موعد جديد'}
                {isQuickAppt && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-100 text-purple-600 text-xs font-bold">
                    <Zap size={11} /> موعد سريع
                  </span>
                )}
              </h2>
              <button onClick={closeModal} className="bg-transparent border-none text-gray-400 cursor-pointer hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {backendError && showModal && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl border bg-red-50 border-red-200 text-red-600 text-sm font-semibold mb-4">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{backendError}</span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {!editTarget && (
                <div>
                  <label className="text-gray-600 text-xs block mb-1.5">المريض *</label>
                  <div className="relative" ref={patientDropRef}>
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input value={patientSearch}
                      onChange={e => { setPatientSearch(e.target.value); setShowPatientDrop(true); if (!e.target.value) formik.setFieldValue('patient_id', '') }}
                      onFocus={() => setShowPatientDrop(true)}
                      placeholder="ابحث بالاسم أو الهاتف..."
                      className={`w-full pr-9 pl-4 py-3 rounded-xl bg-gray-50 text-sm outline-none border transition-colors ${formik.errors.patient_id && formik.touched.patient_id ? 'border-red-400' : 'border-gray-300 focus:border-[#4685AC]'} text-[#000340] placeholder:text-gray-400`} />
                    {showPatientDrop && patientSearch && (
                      <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-44 overflow-y-auto">
                        {filteredPatientsSearch.length === 0
                          ? <div className="px-4 py-3 text-gray-400 text-sm text-center">لا يوجد نتائج</div>
                          : filteredPatientsSearch.map(p => (
                            <button key={p.id} type="button" onClick={() => selectPatientForAppt(p)}
                              className="w-full text-right px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between gap-3 border-none bg-transparent cursor-pointer">
                              <span className="text-[#000340] text-sm font-medium">{p.full_name}</span>
                              <span className="text-gray-400 text-xs" dir="ltr">{p.phone_number}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  {formik.errors.patient_id && formik.touched.patient_id &&
                    <p className="text-red-400 text-xs mt-1">{formik.errors.patient_id}</p>}
                </div>
              )}

              <div>
                <label className="text-gray-600 text-xs block mb-1.5">التاريخ والوقت *</label>
                <input type="datetime-local" name="appointment_datetime"
                  value={formik.values.appointment_datetime}
                  onChange={e => { formik.handleChange(e); checkTimeWarning(e.target.value); setBackendError('') }}
                  onBlur={formik.handleBlur}
                  className={inp(formik.errors.appointment_datetime && formik.touched.appointment_datetime)} />
                {formik.errors.appointment_datetime && formik.touched.appointment_datetime &&
                  <p className="text-red-400 text-xs mt-1">{formik.errors.appointment_datetime}</p>}
                {timeWarning && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-amber-600 text-xs font-semibold">
                    <Clock size={12} /> {timeWarning}
                  </div>
                )}
              </div>

              <div>
                <label className="text-gray-600 text-xs block mb-1.5">رقم الجلسة *</label>
                <input type="number" name="session_number" value={formik.values.session_number}
                  onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="1" min="1"
                  className={inp(formik.errors.session_number && formik.touched.session_number)} />
                {formik.errors.session_number && formik.touched.session_number &&
                  <p className="text-red-400 text-xs mt-1">{formik.errors.session_number}</p>}
              </div>

              <div>
                <label className="text-gray-600 text-xs block mb-1.5">سعر الجلسة</label>
                <input type="number" name="price" value={formik.values.price}
                  onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="0" min="0"
                  className={inp(false)} />
              </div>

              {editTarget && (
                <div>
                  <label className="text-gray-600 text-xs block mb-1.5">الحالة</label>
                  <select name="status" value={formik.values.status} onChange={formik.handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 text-[#000340] text-sm outline-none border border-gray-300 focus:border-[#4685AC] transition-colors appearance-none">
                    {Object.entries(STATUS).map(([val, { label }]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={formik.handleSubmit} disabled={saving}
                className={`flex-1 py-2.5 rounded-xl border-none font-bold text-sm cursor-pointer bg-[#000340] text-white hover:bg-[#0A4174] transition-colors ${saving ? 'opacity-50' : ''}`}>
                {saving ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
              <button onClick={closeModal}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-transparent text-gray-500 cursor-pointer text-sm hover:text-gray-700">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal حذف ── */}
      {showDel && (
        <div className="fixed inset-0 z-50 bg-[#000340]/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-7 w-full max-w-sm text-center shadow-[0_24px_60px_rgba(0,0,0,0.1)]">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h3 className="text-[#000340] text-base font-bold mb-2">تأكيد الحذف</h3>
            <p className="text-gray-500 text-sm mb-6">
              هل تريد حذف موعد <span className="text-[#000340] font-semibold">{delTarget?.full_name}</span>؟
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-400 font-bold cursor-pointer text-sm hover:bg-red-100 transition-colors">
                {saving ? '...' : 'نعم، احذف'}
              </button>
              <button onClick={() => setShowDel(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-transparent text-gray-500 cursor-pointer text-sm hover:text-gray-700">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal السجل الطبي ── */}
      {showRecord && recordTarget && (
        <MedicalRecordModal
          appointment={recordTarget}
          onClose={() => { setShowRecord(false); setRecordTarget(null) }}
          headers={headers}
          API_A={API_A}
          API_INV={API_INV}
          onSaved={() => getAllAppointments(filterDate)}
        />
      )}
    </div>
  )
}