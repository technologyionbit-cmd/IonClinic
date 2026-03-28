import axios from 'axios'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, X, Users, ClipboardList, ChevronDown, ChevronUp, Pill, Calendar } from 'lucide-react'
import Loading from '../Loading/Loading'

const COUNTRY_CODES = [
  { code: '+962', flag: '🇯🇴', name: 'الأردن' },
  { code: '+966', flag: '🇸🇦', name: 'السعودية' },
  { code: '+971', flag: '🇦🇪', name: 'الإمارات' },
  { code: '+965', flag: '🇰🇼', name: 'الكويت' },
  { code: '+974', flag: '🇶🇦', name: 'قطر' },
  { code: '+973', flag: '🇧🇭', name: 'البحرين' },
  { code: '+968', flag: '🇴🇲', name: 'عُمان' },
  { code: '+20',  flag: '🇪🇬', name: 'مصر' },
  { code: '+963', flag: '🇸🇾', name: 'سوريا' },
  { code: '+961', flag: '🇱🇧', name: 'لبنان' },
  { code: '+964', flag: '🇮🇶', name: 'العراق' },
  { code: '+970', flag: '🇵🇸', name: 'فلسطين' },
  { code: '+1',   flag: '🇺🇸', name: 'أمريكا' },
  { code: '+44',  flag: '🇬🇧', name: 'بريطانيا' },
  { code: '+49',  flag: '🇩🇪', name: 'ألمانيا' },
  { code: '+33',  flag: '🇫🇷', name: 'فرنسا' },
  { code: '+90',  flag: '🇹🇷', name: 'تركيا' },
  { code: '+92',  flag: '🇵🇰', name: 'باكستان' },
  { code: '+91',  flag: '🇮🇳', name: 'الهند' },
  { code: '+86',  flag: '🇨🇳', name: 'الصين' },
]

// ── Modal: السجل الطبي ────────────────────────────────────────────
function HistoryModal({ patient, onClose, headers, API }) {
  const [history,  setHistory]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    axios.get(`${API}/${patient.id}/history`, { headers })
      .then(r => setHistory(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [patient.id])

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const statusColor = (s) => ({
    completed:   'bg-green-100 text-green-700',
    Completed:   'bg-green-100 text-green-700',
    scheduled:   'bg-blue-100 text-blue-700',
    Scheduled:   'bg-blue-100 text-blue-700',
    cancelled:   'bg-red-100 text-red-600',
    Cancelled:   'bg-red-100 text-red-600',
    Rescheduled: 'bg-amber-100 text-amber-600',
    'no-show':   'bg-gray-100 text-gray-500',
  }[s] || 'bg-gray-100 text-gray-500')

  const statusLabel = (s) => ({
    completed:   'مكتمل',
    Completed:   'مكتمل',
    scheduled:   'مجدول',
    Scheduled:   'مجدول',
    cancelled:   'ملغي',
    Cancelled:   'ملغي',
    Rescheduled: 'معاد جدولة',
    'no-show':   'لم يحضر',
  }[s] || s)

  return (
    <div className="fixed inset-0 z-50 bg-[#000340]/30 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_24px_60px_rgba(0,0,0,0.12)]">

        {/* Header */}
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100">
          <div>
            <h2 className="text-[#000340] text-base sm:text-lg font-bold m-0">السجل الطبي</h2>
            <p className="text-gray-400 text-xs mt-0.5">{history?.patient?.full_name || patient.full_name}</p>
          </div>
          <button onClick={onClose} className="bg-transparent border-none text-gray-300 cursor-pointer hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="py-12 text-center text-gray-300 text-sm">جارٍ التحميل...</div>
          ) : !history?.timeline?.length ? (
            <div className="py-12 text-center text-gray-300 text-sm">
              <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
              لا يوجد سجل طبي لهذا المريض
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* خطة العلاج */}
              {history.patient?.treatment_plan && (
                <div className="bg-[#0A4174]/5 border border-[#0A4174]/15 rounded-xl px-4 py-3 mb-2">
                  <p className="text-[#0A4174] text-xs font-semibold m-0 mb-1">خطة العلاج</p>
                  <p className="text-[#000340] text-sm m-0">{history.patient.treatment_plan}</p>
                </div>
              )}

              {/* Timeline */}
              {history.timeline.map((apt, i) => (
                <div key={apt.appointment_id}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">

                  {/* Row header */}
                  <button
                    onClick={() => toggle(apt.appointment_id)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors border-none cursor-pointer text-right"
                  >
                    {/* Number bubble */}
                    <span className="w-6 h-6 rounded-full bg-[#4685AC]/10 text-[#4685AC] text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {apt.session_number ?? (history.timeline.length - i)}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[#000340] text-sm font-semibold m-0">
                          {new Date(apt.appointment_datetime).toLocaleDateString('ar-EG-u-ca-gregory', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                        <span className="text-gray-300 text-xs">
                          {new Date(apt.appointment_datetime).toLocaleTimeString('ar-EG-u-ca-gregory', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${statusColor(apt.status)}`}>
                      {statusLabel(apt.status)}
                    </span>

                    {expanded[apt.appointment_id]
                      ? <ChevronUp size={14} className="text-gray-300 flex-shrink-0" />
                      : <ChevronDown size={14} className="text-gray-300 flex-shrink-0" />
                    }
                  </button>

                  {/* Expanded details */}
                  {expanded[apt.appointment_id] && (
                    <div className="px-4 pb-4 pt-1 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">

                      {/* ملاحظات الدكتور */}
                      {apt.doctor_notes ? (
                        <div>
                          <p className="text-gray-400 text-xs font-semibold mb-1">ملاحظات الطبيب</p>
                          <p className="text-[#000340] text-sm m-0 leading-relaxed">{apt.doctor_notes}</p>
                        </div>
                      ) : (
                        <p className="text-gray-300 text-xs italic m-0">لا توجد ملاحظات للطبيب</p>
                      )}

                      {/* المواد المستخدمة */}
                      {apt.medications?.length > 0 && (
                        <div>
                          <p className="text-gray-400 text-xs font-semibold mb-2 flex items-center gap-1">
                            <Pill size={12} /> المواد المستخدمة
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {apt.medications.map((med, j) => (
                              <span key={j}
                                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[#000340]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#4685AC] flex-shrink-0" />
                                {med.material_name}
                                <span className="text-gray-400">×{med.quantity_used}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
export default function Patient() {
  const [patients,     setPatients]     = useState([])
  const [maxPercent,   setMaxPercent]   = useState(20)   // default 20%
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [search,       setSearch]       = useState('')
  const [showModal,    setShowModal]    = useState(false)
  const [showDel,      setShowDel]      = useState(false)
  const [showHistory,  setShowHistory]  = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [delTarget,    setDelTarget]    = useState(null)
  const [histTarget,   setHistTarget]   = useState(null)
  const [countryCode,  setCountryCode]  = useState('+962')
const API_BASE = import.meta.env.VITE_API_URL || ''

  const API     = `${API_BASE}/api/patients`
  const token   = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  // ── Roles (مطابقة للباك) ──────────────────────────────────────
  // POST   → Admin, Secretary
  // GET    → Admin, Secretary, Doctor
  // PUT    → Admin, Secretary
  // DELETE → Admin, Secretary
  // GET /:id/history → Admin, Doctor
  let role = 'Secretary'
  try {
    if (token) {
      const p = JSON.parse(atob(token.split('.')[1]))
      role = p.role || 'Secretary'
    }
  } catch {}

  const canCreate  = role === 'Admin' || role === 'Secretary'
  const canEdit    = role === 'Admin' || role === 'Secretary'
  const canDelete  = role === 'Admin' || role === 'Secretary'   // ✅ تصحيح: Secretary يحذف أيضاً
  const canHistory = role === 'Admin' || role === 'Doctor'      // ✅ جديد: السجل الطبي

  // ─────────────────────────────────────────────────────────────
  async function getAllPatients() {
    setLoading(true)
    try {
      const { data } = await axios.get(API, { headers })
      // الباك يرجع { max_patients_percentage, patients } أو مصفوفة مباشرة
      if (Array.isArray(data)) {
        setPatients(data)
      } else {
        setPatients(data.patients || [])
        if (data.max_patients_percentage !== undefined) {
          setMaxPercent(Number(data.max_patients_percentage))
        }
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { getAllPatients() }, [])

  // ── Formik ───────────────────────────────────────────────────
  const ValidationSchema = Yup.object().shape({
    full_name:      Yup.string().required('يجب ادخال الاسم'),
    phone_number:   Yup.string().required('يجب ادخال رقم الهاتف'),
    birth_date:     Yup.string().optional(),
    treatment_plan: Yup.string().optional(),
    notes:          Yup.string().optional(),
  })

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      full_name:      editTarget?.full_name      || '',
      phone_number:   editTarget?.phone_number   || '',
      birth_date:     editTarget?.birth_date     || '',
      treatment_plan: editTarget?.treatment_plan || '',
      notes:          editTarget?.notes          || '',
    },
    validationSchema: ValidationSchema,
    onSubmit: async (values) => {
      setSaving(true)
      try {
        const rawPhone  = values.phone_number.replace(/\s/g, '')
        const fullPhone = rawPhone.startsWith('+') ? rawPhone : `${countryCode}${rawPhone}`
        const payload   = {
          full_name:      values.full_name,
          phone_number:   fullPhone,
          birth_date:     values.birth_date,
          notes:          values.notes,
          treatment_plan: values.treatment_plan,
        }
        if (editTarget) await axios.put(`${API}/${editTarget.id}`, payload, { headers })
        else            await axios.post(API, payload, { headers })
        await getAllPatients()
        setShowModal(false); setEditTarget(null); formik.resetForm()
      } catch (e) { console.error(e) }
      finally { setSaving(false) }
    },
  })

  async function handleDelete() {
    setSaving(true)
    try {
      await axios.delete(`${API}/${delTarget.id}`, { headers })
      await getAllPatients()
      setShowDel(false); setDelTarget(null)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  function openAdd() {
    setEditTarget(null); formik.resetForm(); setCountryCode('+962'); setShowModal(true)
  }
  function openEdit(p) {
    setEditTarget(p)
    const match = COUNTRY_CODES.find(c => p.phone_number?.startsWith(c.code))
    if (match) {
      setCountryCode(match.code)
      formik.setFieldValue('phone_number', p.phone_number.replace(match.code, ''))
    } else {
      setCountryCode('+962')
    }
    setShowModal(true)
  }
  function closeModal() { setShowModal(false); setEditTarget(null); formik.resetForm() }

  // حساب عدد المرضى المسموح بعرضهم حسب النسبة
  // لو النسبة 100 أو مش محددة → عرض الكل
  const visibleCount = (role === 'Admin' || maxPercent >= 100)
  ? patients.length
  : (patients.length ? Math.round(patients.length * (maxPercent / 100)) : 0)
  const visiblePatients = patients.slice(0, visibleCount)

  const filtered = search.trim()
    ? patients.filter(p => p.full_name?.includes(search) || p.phone_number?.includes(search))
    : visiblePatients

  const inp = (err) =>
    `w-full px-3 py-2.5 rounded-xl bg-gray-50 text-[#000340] text-sm placeholder:text-gray-400 outline-none border transition-colors ${err ? 'border-red-400' : 'border-gray-300 focus:border-[#4685AC]'}`

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode)

  // حساب عدد الأعمدة في الجدول حسب الأدوار
  const colTemplate = canEdit || canDelete || canHistory
    ? '2fr 1.5fr 1.5fr auto'
    : '2fr 1.5fr 1.5fr'

  if (loading) return <Loading />

  return (
    <div dir="rtl" className="mt-5 lg:mt-0 min-h-screen bg-white p-4 sm:p-6 lg:p-8 font-[Tajawal,Cairo,sans-serif]">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[#000340] text-xl sm:text-2xl font-bold m-0">المرضى</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1">
            {visibleCount}   مريض مسجّل

          </p>
        </div>
        {canCreate && (
          <button onClick={openAdd}
            className="flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl border-none bg-[#000340] text-white font-bold text-xs sm:text-sm cursor-pointer shadow-lg shadow-[#000340]/20 hover:bg-[#0A4174] transition-colors">
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">إضافة مريض</span>
            <span className="sm:hidden">إضافة</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-xs mb-4">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف..."
          className="w-full pr-9 pl-4 py-2.5 rounded-xl bg-white border border-gray-200 text-[#000340] text-sm placeholder:text-gray-300 outline-none focus:border-[#4685AC] transition-colors" />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl h-[450px] 2xl:h-[550px] overflow-y-scroll overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
        style={{ borderTop: '3px solid #4685AC' }}>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Head */}
            <div className="grid gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-gray-600 text-xs font-semibold"
              style={{ gridTemplateColumns: colTemplate }}>
              <span>الاسم</span>
              <span>الهاتف</span>
              <span>خطة العلاج</span>
              <span>إجراءات</span>
            </div>

            {/* Rows */}
            {loading ? (
              <div className="py-12 text-center text-gray-300 text-sm">جارٍ التحميل...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-300 text-sm">
                <Users size={32} className="mx-auto mb-3 opacity-30" />لا يوجد مرضى
              </div>
            ) : filtered.map((p, i) => (
              <div key={p.id}
                className="grid gap-2 px-4 py-3 items-center hover:bg-gray-50 transition-colors"
                style={{
                  gridTemplateColumns: colTemplate,
                  borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>

                <span className="text-[#000340] text-sm font-medium truncate">{p.full_name}</span>
                <span className="text-gray-600 text-sm">{p.phone_number}</span>
                <span className="text-gray-600 text-sm truncate">{p.treatment_plan || '—'}</span>

                {/* Buttons */}
                <div className="flex gap-1.5 items-center">

                  {/* السجل الطبي — Admin + Doctor */}
                  {canHistory && (
                    <button
                      onClick={() => { setHistTarget(p); setShowHistory(true) }}
                      title="السجل الطبي"
                      className="w-8 h-8 rounded-lg border-none bg-[#0A4174]/10 text-[#0A4174] cursor-pointer flex items-center justify-center hover:bg-[#0A4174]/20 transition-colors">
                      <ClipboardList size={13} />
                    </button>
                  )}

                  {/* تعديل — Admin + Secretary */}
                  {canEdit && (
                    <button onClick={() => openEdit(p)}
                      title="تعديل"
                      className="w-8 h-8 rounded-lg border-none bg-[#4685AC]/10 text-[#4685AC] cursor-pointer flex items-center justify-center hover:bg-[#4685AC]/20 transition-colors">
                      <Pencil size={13} />
                    </button>
                  )}

                  {/* حذف — Admin + Secretary */}
                  {canDelete && (
                    <button onClick={() => { setDelTarget(p); setShowDel(true) }}
                      title="حذف"
                      className="w-8 h-8 rounded-lg border-none bg-red-50 text-red-400 cursor-pointer flex items-center justify-center hover:bg-red-100 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal إضافة/تعديل */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#000340]/30 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_24px_60px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[#000340] text-base sm:text-lg font-bold m-0">
                {editTarget ? `تعديل: ${editTarget.full_name}` : 'إضافة مريض جديد'}
              </h2>
              <button onClick={closeModal} className="bg-transparent border-none text-gray-300 cursor-pointer hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="text-gray-600 text-xs block mb-1.5">الاسم الكامل *</label>
                <input name="full_name" value={formik.values.full_name}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  className={inp(formik.errors.full_name && formik.touched.full_name)} />
                {formik.errors.full_name && formik.touched.full_name &&
                  <p className="text-red-400 text-xs mt-1">{formik.errors.full_name}</p>}
              </div>

              {/* Phone + Country */}
              <div className="sm:col-span-2">
                <label className="text-gray-600 text-xs block mb-1.5">رقم الهاتف *</label>
                <div dir="ltr" className="flex gap-2">
                  <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                    className="px-2 py-2.5 rounded-xl bg-gray-100 border border-gray-300 text-[#000340] text-sm outline-none cursor-pointer focus:border-[#4685AC] transition-colors"
                    style={{ minWidth: '95px' }}>
                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                  </select>
                  <input dir="ltr" name="phone_number" value={formik.values.phone_number}
                    onChange={e => formik.setFieldValue('phone_number', e.target.value.replace(/\D/g, ''))}
                    onBlur={formik.handleBlur} placeholder="7xxxxxxxx"
                    className={`flex-1 px-3 py-2.5 rounded-xl bg-gray-50 text-[#000340] text-sm placeholder:text-gray-400 outline-none border transition-colors ${formik.errors.phone_number && formik.touched.phone_number ? 'border-red-400' : 'border-gray-300 focus:border-[#4685AC]'}`} />
                </div>
                {formik.values.phone_number && (
                  <p className="text-[#4685AC] text-xs mt-1 font-medium" dir="ltr">
                    {selectedCountry?.flag} {countryCode}{formik.values.phone_number}
                  </p>
                )}
                {formik.errors.phone_number && formik.touched.phone_number &&
                  <p className="text-red-400 text-xs mt-1">{formik.errors.phone_number}</p>}
              </div>

              {/* Birth Date */}
              <div>
                <label className="text-gray-600 text-xs block mb-1.5">تاريخ الميلاد</label>
                <input type="date" name="birth_date" value={formik.values.birth_date}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  className={inp(formik.errors.birth_date && formik.touched.birth_date)} />
              </div>

              {/* Treatment Plan */}
              <div>
                <label className="text-gray-600 text-xs block mb-1.5">خطة العلاج</label>
                <input name="treatment_plan" value={formik.values.treatment_plan}
                  onChange={formik.handleChange}
                  className={inp(false)} />
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="text-gray-600 text-xs block mb-1.5">ملاحظات</label>
                <textarea name="notes" value={formik.values.notes} onChange={formik.handleChange}
                  placeholder="أي ملاحظات إضافية..." rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 text-[#000340] text-sm placeholder:text-gray-300 outline-none border border-gray-200 focus:border-[#4685AC] transition-colors resize-y" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={formik.handleSubmit} disabled={saving}
                className={`flex-1 py-2.5 rounded-xl border-none font-bold text-sm cursor-pointer bg-[#000340] text-white hover:bg-[#0A4174] transition-colors ${saving ? 'opacity-50' : ''}`}>
                {saving ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
              <button onClick={closeModal}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-transparent text-gray-600 cursor-pointer text-sm hover:text-gray-700 transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal حذف */}
      {showDel && (
        <div className="fixed inset-0 z-50 bg-[#000340]/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-7 w-full max-w-sm text-center shadow-[0_24px_60px_rgba(0,0,0,0.1)]">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h3 className="text-[#000340] text-base font-bold mb-2">تأكيد الحذف</h3>
            <p className="text-gray-600 text-sm mb-6">
              هل تريد حذف <span className="text-[#000340] font-semibold">{delTarget?.full_name}</span>؟ لا يمكن التراجع.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-400 font-bold cursor-pointer text-sm hover:bg-red-100 transition-colors">
                {saving ? '...' : 'نعم، احذف'}
              </button>
              <button onClick={() => setShowDel(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-transparent text-gray-600 cursor-pointer text-sm hover:text-gray-700">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal السجل الطبي */}
      {showHistory && histTarget && (
        <HistoryModal
          patient={histTarget}
          onClose={() => { setShowHistory(false); setHistTarget(null) }}
          headers={headers}
          API={API}
        />
      )}

    </div>
  )
}