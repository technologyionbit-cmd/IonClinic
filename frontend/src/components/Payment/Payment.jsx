import axios from 'axios'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useState, useEffect } from 'react'
import { Plus, Trash2, X, BadgeCent, ChevronDown, Search } from 'lucide-react'
import Loading from '../Loading/Loading'

const API_BASE = import.meta.env.VITE_API_URL || ''
const API_PAY = `${API_BASE}/api/payments`
const API_PAT = `${API_BASE}/api/patients`

export default function Payment() {
  const [patients,    setPatients]    = useState([])
  const [payments,    setPayments]    = useState([])
  const [selectedPat, setSelectedPat] = useState(null)
  const [showModal,   setShowModal]   = useState(false)
  const [showDel,     setShowDel]     = useState(false)
  const [delTarget,   setDelTarget]   = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [toast,       setToast]       = useState(null)
  const [search,      setSearch]      = useState('')
  const [maxPercent,  setMaxPercent]  = useState(20)

  const token   = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  // ── Roles (مطابقة للباك) ──────────────────────────────────────
  // POST   /              → Admin, Secretary
  // GET    /patient/:id   → Admin, Secretary
  // DELETE /:id           → Admin, Secretary  ✅ (مش Admin فقط)
  // Doctor لا يرى الصفحة أصلاً
  let role = 'Secretary'
  try {
    if (token) { const p = JSON.parse(atob(token.split('.')[1])); role = p.role || 'Secretary' }
  } catch {}

  const canAddPayment    = role === 'Admin' || role === 'Secretary'
  const canDeletePayment = role === 'Admin' || role === 'Secretary'

  function showToastMsg(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 3500) }

  async function loadPatients() {
    try {
      const [patRes, setRes] = await Promise.all([
        axios.get(API_PAT, { headers }),
        axios.get(`${API_BASE}/api/settings`, { headers }),
      ])
      const list = Array.isArray(patRes.data) ? patRes.data : patRes.data.patients || []
      setPatients([...list].reverse())
      const pct = setRes.data?.max_patients_percentage
      if (pct !== undefined) setMaxPercent(Number(pct))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function loadPayments(patientId) {
    if (!patientId) return
    try {
      const { data } = await axios.get(`${API_PAY}/patient/${patientId}`, { headers })
      setPayments(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => { loadPatients() }, [])

  async function selectPatient(p) {
    setSelectedPat(p)
    await loadPayments(p.id)
  }

  // تحديث بيانات المريض المختار بعد أي تغيير
  async function refreshSelectedPatient(patientId) {
    const { data } = await axios.get(API_PAT, { headers })
    const list  = Array.isArray(data) ? data : data.patients || []
    const fresh = list.find(p => p.id === patientId)
    if (fresh) setSelectedPat(fresh)
    setPatients(list)
  }

  const schema = Yup.object({
    amount: Yup.number()
      .required('يجب إدخال المبلغ')
      .min(1, 'يجب أن يكون أكبر من صفر')
      .max(selectedPat?.remaining_amount || 999999, 'لا يمكن دفع أكثر من المتبقي'),
    payment_method: Yup.string().required(),
  })

  const formik = useFormik({
    initialValues: { amount: '', payment_method: 'Cash' },
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setSaving(true)
      try {
        await axios.post(API_PAY, {
          patient_id:     selectedPat.id,
          amount:         Number(values.amount),
          payment_method: values.payment_method,
        }, { headers })
        showToastMsg('success', 'تم تسجيل الدفعة')
        await refreshSelectedPatient(selectedPat.id)
        await loadPayments(selectedPat.id)
        setShowModal(false)
        formik.resetForm()
      } catch (e) {
        showToastMsg('error', e.response?.data?.message || 'حدث خطأ أثناء تسجيل الدفعة')
      } finally { setSaving(false) }
    },
  })

  async function handleDelete() {
    setSaving(true)
    try {
      await axios.delete(`${API_PAY}/${delTarget.id}`, { headers })
      showToastMsg('success', 'تم حذف الدفعة وتعديل الرصيد')
      await refreshSelectedPatient(selectedPat.id)
      await loadPayments(selectedPat.id)
      setShowDel(false)
      setDelTarget(null)
    } catch (e) {
      showToastMsg('error', e.response?.data?.message || 'حدث خطأ أثناء الحذف')
    } finally { setSaving(false) }
  }

  const methodLabels = { Cash: 'نقدي', Transfer: 'تحويل', Card: 'بطاقة' }

  // تطبيق النسبة — لو في بحث يدور في كل المرضى، لو لا يعرض المسموح فقط
  const visibleCount = (role === 'Admin' || maxPercent >= 100)
  ? patients.length
  : (patients.length ? Math.round(patients.length * (maxPercent / 100)) : 0)
  const visiblePatients = search.trim() ? patients : patients.slice(0, visibleCount)

  const filteredPatients = visiblePatients.filter(p =>
    p.full_name?.includes(search) || p.phone_number?.includes(search)
  )

  // مجموع الأرقام المالية للمرضى المعروضين فقط
  const visibleTotals = visiblePatients.reduce((acc, p) => ({
    total:     acc.total     + (Number(p.total_amount)     || 0),
    paid:      acc.paid      + (Number(p.total_amount)     - Number(p.remaining_amount) || 0),
    remaining: acc.remaining + (Number(p.remaining_amount) || 0),
  }), { total: 0, paid: 0, remaining: 0 })

  if (loading) return <Loading />

  return (
    <div dir="rtl" className="mt-5 lg:mt-0 min-h-screen bg-white p-4 sm:p-6 lg:p-8 font-[Tajawal,Cairo,sans-serif]">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border w-[90vw] sm:w-auto ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#000340]/5 flex items-center justify-center">
          <BadgeCent size={20} className="text-[#000340]" />
        </div>
        <div>
          <h1 className="text-[#000340] text-xl sm:text-2xl font-bold m-0">إدارة الدفعات</h1>
          <p className="text-gray-500 text-xs mt-0.5">سجّل الدفعات وتتبع الذمم</p>
        </div>
      </div>

      {/* ── ملخص الأرقام للمرضى المعروضين ── */}
      {role !== 'Admin' && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'إجمالي',  value: visibleTotals.total,     color: 'text-[#000340]' },
            { label: 'مدفوع',   value: visibleTotals.paid,      color: 'text-green-600' },
            { label: 'متبقي',   value: visibleTotals.remaining, color: visibleTotals.remaining > 0 ? 'text-red-500' : 'text-green-500' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-gray-400 text-xs mb-1">{s.label}</p>
              <p className={`text-sm font-bold ${s.color}`}>{Number(s.value).toLocaleString('ar-JO')} د.أ</p>
              <p className="text-gray-300 text-xs mt-0.5">{visibleCount} مريض</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Patients List ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col"
          style={{ borderTop: '3px solid #000340' }}>

          <div className="px-4 pt-3 pb-2 border-b border-gray-100">
            <p className="text-[#000340] text-sm font-bold mb-2">المرضى</p>
            <div className="relative">
              <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث بالاسم..."
                className="w-full pr-8 pl-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#000340] text-xs placeholder:text-gray-300 outline-none focus:border-[#4685AC] transition-colors"
              />
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
            {filteredPatients.length === 0 && (
              <p className="text-gray-300 text-xs text-center py-8">لا يوجد نتائج</p>
            )}
            {filteredPatients.map(p => (
              <button key={p.id} onClick={() => selectPatient(p)}
                className={`w-full text-right px-4 py-3 cursor-pointer transition-colors flex items-center justify-between gap-2 border-none border-b border-gray-50 last:border-0 ${selectedPat?.id === p.id ? 'bg-[#000340]/5' : 'bg-transparent hover:bg-gray-50'}`}>
                <div className="min-w-0">
                  <p className="text-[#000340] text-sm font-medium truncate">{p.full_name}</p>
                  <p className={`text-xs mt-0.5 ${p.remaining_amount > 0 ? 'text-red-500' : 'text-gray-300'}`}>
                    متبقي: {Number(p.remaining_amount).toLocaleString('ar-JO')} د.أ
                  </p>
                </div>
                <ChevronDown size={14} className="text-gray-300 flex-shrink-0 -rotate-90" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Patient Details + Payments ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {selectedPat ? (
            <>
              {/* Summary Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-[#000340] font-bold text-base">{selectedPat.full_name}</h2>
                    <p className="text-gray-500 text-xs mt-0.5">{selectedPat.treatment_plan || 'لا توجد خطة علاج'}</p>
                  </div>
                  {/* إضافة دفعة — Admin + Secretary */}
                  {canAddPayment && (
                    <button onClick={() => { formik.resetForm(); setShowModal(true) }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#000340] text-white text-sm font-bold cursor-pointer border-none hover:bg-[#0A4174] transition-colors">
                      <Plus size={14} /> دفعة جديدة
                    </button>
                  )}
                </div>

                {/* الأرقام */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'الإجمالي', value: selectedPat.total_amount,                                                         color: 'text-[#000340]'  },
                    { label: 'المدفوع',  value: selectedPat.total_amount - selectedPat.remaining_amount,                          color: 'text-green-600'  },
                    { label: 'المتبقي',  value: selectedPat.remaining_amount, color: selectedPat.remaining_amount > 0 ? 'text-red-500' : 'text-green-500' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-gray-500 text-xs mb-1">{s.label}</p>
                      <p className={`text-sm font-bold ${s.color}`}>{Number(s.value).toLocaleString('ar-JO')} د.أ</p>
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#4685AC] to-[#3F7E5C] rounded-full transition-all"
                    style={{
                      width: `${selectedPat.total_amount
                        ? Math.min(100, ((selectedPat.total_amount - selectedPat.remaining_amount) / selectedPat.total_amount) * 100)
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-[#000340] text-sm font-bold">سجل الدفعات</p>
                </div>
                {payments.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm">لا توجد دفعات مسجّلة</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {['المبلغ', 'طريقة الدفع', 'التاريخ', ''].map(h => (
                            <th key={h} className="text-right px-4 py-2.5 text-gray-500 text-xs font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(p => (
                          <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 last:border-0">
                            <td className="px-4 py-3 text-green-600 font-bold text-sm">
                              {Number(p.amount).toLocaleString('ar-JO')} د.أ
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                                {methodLabels[p.payment_method] || p.payment_method}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm">{p.payment_date?.slice(0, 10)}</td>
                            <td className="px-4 py-3">
                              {/* حذف الدفعة — Admin + Secretary ✅ */}
                              {canDeletePayment ? (
                                <button onClick={() => { setDelTarget(p); setShowDel(true) }}
                                  className="w-7 h-7 rounded-lg bg-red-50 text-red-400 border-none cursor-pointer flex items-center justify-center hover:bg-red-100 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              ) : (
                                <span className="text-gray-200 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 py-20">
              <p className="text-gray-400 text-sm">اختر مريضاً لعرض الدفعات</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Payment Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#000340]/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[#000340] font-bold text-base">دفعة جديدة — {selectedPat.full_name}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-gray-600 text-xs block mb-1">
                  المبلغ * (متبقي: {Number(selectedPat.remaining_amount).toLocaleString('ar-JO')} د.أ)
                </label>
                <input type="number" name="amount" value={formik.values.amount}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  placeholder="0" min="1" max={selectedPat.remaining_amount}
                  className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 border text-[#000340] text-sm outline-none transition-colors ${formik.errors.amount && formik.touched.amount ? 'border-red-400' : 'border-gray-200 focus:border-[#4685AC]'}`} />
                {formik.errors.amount && formik.touched.amount &&
                  <p className="text-red-400 text-xs mt-1">{formik.errors.amount}</p>}
              </div>
              <div>
                <label className="text-gray-600 text-xs block mb-1">طريقة الدفع</label>
                <select name="payment_method" value={formik.values.payment_method} onChange={formik.handleChange}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[#000340] text-sm outline-none focus:border-[#4685AC] appearance-none">
                  <option value="Cash">نقدي</option>
                  <option value="Transfer">تحويل</option>
                  <option value="Card">بطاقة</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={formik.handleSubmit} disabled={saving}
                className={`flex-1 py-2.5 rounded-xl bg-[#000340] text-white font-bold text-sm border-none cursor-pointer hover:bg-[#0A4174] transition-colors ${saving ? 'opacity-50' : ''}`}>
                {saving ? 'جارٍ الحفظ...' : 'تسجيل الدفعة'}
              </button>
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-transparent text-gray-600 cursor-pointer text-sm">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {showDel && (
        <div className="fixed inset-0 z-50 bg-[#000340]/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h3 className="text-[#000340] text-base font-bold mb-2">حذف الدفعة</h3>
            <p className="text-gray-500 text-sm mb-5">
              سيتم استرداد <span className="text-[#000340] font-bold">{Number(delTarget?.amount).toLocaleString('ar-JO')} د.أ</span> لرصيد المريض
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-500 font-bold text-sm cursor-pointer hover:bg-red-100 transition-colors">
                {saving ? '...' : 'نعم، احذف'}
              </button>
              <button onClick={() => setShowDel(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-transparent text-gray-600 cursor-pointer text-sm">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}