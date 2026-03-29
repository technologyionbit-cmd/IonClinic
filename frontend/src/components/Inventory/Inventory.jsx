import axios from 'axios'
import { useState, useEffect } from 'react'
import { Plus, Package, Pill, X, Pencil, Trash2, Info } from 'lucide-react'
import Loading from '../Loading/Loading'

const API_BASE = import.meta.env.VITE_API_URL || ''
const API = `${API_BASE}/api/inventory`

export default function Inventory() {
  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [toast,      setToast]      = useState(null)
  const [showAdd,    setShowAdd]    = useState(false)
  const [showEdit,   setShowEdit]   = useState(false)
  const [showDel,    setShowDel]    = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)
  const [saving,     setSaving]     = useState(false)

  const [addForm,  setAddForm]  = useState({ name: '', initial_quantity: '', price: '', alert_threshold_percent: 20 })
  const [editForm, setEditForm] = useState({ name: '', price: '', alert_threshold_percent: 20, added_quantity: '' })

  const token   = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  let role = 'Secretary'
  try {
    if (token) { const p = JSON.parse(atob(token.split('.')[1])); role = p.role || 'Secretary' }
  } catch {}

  const canManage = role === 'Admin'

  function showToastMsg(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 3500) }

  async function load() {
    try {
      const { data } = await axios.get(API, { headers })
      setItems(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!addForm.name || !addForm.initial_quantity || !addForm.price) {
      showToastMsg('error', 'يجب ملء جميع الحقول'); return
    }
    setSaving(true)
    try {
      await axios.post(API, {
        name:                    addForm.name,
        initial_quantity:        Number(addForm.initial_quantity),
        cost_price:              Number(addForm.price),
        usage_price:             Number(addForm.price),
        alert_threshold_percent: Number(addForm.alert_threshold_percent) || 20,
      }, { headers })
      showToastMsg('success', 'تم إضافة المادة')
      await load()
      setShowAdd(false)
      setAddForm({ name: '', initial_quantity: '', price: '', alert_threshold_percent: 20 })
    } catch (e) { showToastMsg('error', e.response?.data?.message || 'حدث خطأ') }
    finally { setSaving(false) }
  }

  async function handleEdit() {
    if (!editForm.name || !editForm.price) {
      showToastMsg('error', 'يجب ملء جميع الحقول'); return
    }
    setSaving(true)
    try {
      await axios.put(`${API}/${editTarget.id}`, {
        name:                    editForm.name,
        cost_price:              Number(editForm.price),
        usage_price:             Number(editForm.price),
        alert_threshold_percent: Number(editForm.alert_threshold_percent) || 20,
        added_quantity:          editForm.added_quantity ? Number(editForm.added_quantity) : 0,
      }, { headers })
      showToastMsg('success', 'تم تعديل المادة')
      await load()
      setShowEdit(false)
    } catch (e) { showToastMsg('error', e.response?.data?.message || 'حدث خطأ') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      await axios.delete(`${API}/${delTarget.id}`, { headers })
      showToastMsg('success', 'تم حذف المادة')
      await load()
      setShowDel(false)
    } catch (e) { showToastMsg('error', e.response?.data?.message || 'حدث خطأ') }
    finally { setSaving(false) }
  }

  const inp = "w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[#000340] text-sm outline-none focus:border-[#4685AC] transition-colors"

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#000340]/5 flex items-center justify-center">
            <Package size={20} className="text-[#000340]" />
          </div>
          <div>
            <h1 className="text-[#000340] text-xl sm:text-2xl font-bold m-0">المخزون</h1>
            <p className="text-gray-500 text-xs mt-0.5">{items.length} مادة مسجّلة</p>
          </div>
        </div>
        {canManage && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#000340] text-white text-sm font-bold cursor-pointer border-none shadow-lg shadow-[#000340]/20 hover:bg-[#0A4174] transition-colors">
            <Plus size={15} /> إضافة مادة
          </button>
        )}
      </div>

      <div className="flex items-start gap-2 px-4 py-3 rounded-xl border bg-[#4685AC]/5 border-[#4685AC]/20 text-[#0A4174] text-xs mb-5">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        <span>خصم المواد يتم تلقائياً عند تسجيل السجل الطبي في صفحة <strong>المواعيد</strong></span>
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          <Package size={36} className="mx-auto mb-3 opacity-20" />
          لا توجد مواد في المخزون
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => {
            const pct      = item.initial_quantity > 0 ? Math.round((item.current_quantity / item.initial_quantity) * 100) : 0
            const critical = item.current_quantity <= 0
            const warning  = item.is_low_stock === 1 && !critical

            return (
              <div key={item.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm ${critical ? 'border-red-200' : warning ? 'border-amber-200' : 'border-gray-100'}`}
                style={{ borderTop: `3px solid ${critical ? '#ef4444' : warning ? '#f59e0b' : '#4685AC'}` }}>
                <div className="flex items-center gap-4">

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${critical ? 'bg-red-50' : warning ? 'bg-amber-50' : 'bg-[#4685AC]/10'}`}>
                    <Pill size={18} className={critical ? 'text-red-500' : warning ? 'text-amber-500' : 'text-[#4685AC]'} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <p className="text-[#000340] font-semibold text-sm">{item.name}</p>
                      {critical && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold border border-red-200">نفد ⚠️</span>}
                      {warning  && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-semibold border border-amber-200">تنبيه ({item.alert_threshold_percent}%)</span>}
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                      <div className={`h-full rounded-full transition-all ${critical ? 'bg-red-500' : warning ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      متبقي: <span className={`font-semibold ${critical ? 'text-red-500' : warning ? 'text-amber-500' : 'text-[#000340]'}`}>{item.current_quantity}</span> من {item.initial_quantity} — {pct}%
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0 space-y-1.5">
                    <p className="text-gray-400 text-xs">السعر: {item.cost_price} د.أ</p>
                    {canManage && (
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => { setEditTarget(item); setEditForm({ name: item.name, price: item.cost_price, alert_threshold_percent: item.alert_threshold_percent, added_quantity: '' }); setShowEdit(true) }}
                          className="w-8 h-8 rounded-lg bg-[#4685AC]/10 text-[#4685AC] border-none cursor-pointer flex items-center justify-center hover:bg-[#4685AC]/20 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => { setDelTarget(item); setShowDel(true) }}
                          className="w-8 h-8 rounded-lg bg-red-50 text-red-400 border-none cursor-pointer flex items-center justify-center hover:bg-red-100 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-[#000340]/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[#000340] font-bold text-base">إضافة مادة جديدة</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-gray-600 text-xs block mb-1">اسم المادة *</label>
                <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} className={inp} placeholder="مثال: إبر التخدير" />
              </div>
              {[
                ['initial_quantity',        'الكمية الافتتاحية *'],
                ['price',                   'السعر (د.أ) *'],
                ['alert_threshold_percent', 'نسبة التنبيه %'],
              ].map(([k, l]) => (
                <div key={k}>
                  <label className="text-gray-600 text-xs block mb-1">{l}</label>
                  <input type="number" value={addForm[k]} onChange={e => setAddForm(f => ({ ...f, [k]: e.target.value }))} className={inp} min="0" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleAdd} disabled={saving}
                className={`flex-1 py-2.5 rounded-xl bg-[#000340] text-white font-bold text-sm border-none cursor-pointer hover:bg-[#0A4174] transition-colors ${saving ? 'opacity-50' : ''}`}>
                {saving ? 'جارٍ الحفظ...' : 'إضافة'}
              </button>
              <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 bg-transparent text-gray-600 cursor-pointer text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 bg-[#000340]/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[#000340] font-bold text-base">تعديل: {editTarget?.name}</h3>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-gray-600 text-xs block mb-1">اسم المادة *</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inp} />
              </div>
              {[
                ['price',                   'السعر (د.أ) *'],
                ['alert_threshold_percent', 'نسبة التنبيه %'],
              ].map(([k, l]) => (
                <div key={k}>
                  <label className="text-gray-600 text-xs block mb-1">{l}</label>
                  <input type="number" value={editForm[k]} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} className={inp} min="0" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-gray-600 text-xs block mb-1">
                  إضافة كمية للمخزون
                  <span className="text-gray-400 mr-1">(المتاح حالياً: {editTarget?.current_quantity})</span>
                </label>
                <input type="number" value={editForm.added_quantity}
                  onChange={e => setEditForm(f => ({ ...f, added_quantity: e.target.value }))}
                  placeholder="0 — اتركه فارغاً إن لم تريد إضافة كمية"
                  className={inp} min="0" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleEdit} disabled={saving}
                className={`flex-1 py-2.5 rounded-xl bg-[#4685AC] text-white font-bold text-sm border-none cursor-pointer hover:bg-[#3a6f94] transition-colors ${saving ? 'opacity-50' : ''}`}>
                {saving ? 'جارٍ الحفظ...' : 'حفظ التعديل'}
              </button>
              <button onClick={() => setShowEdit(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 bg-transparent text-gray-600 cursor-pointer text-sm">إلغاء</button>
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
            <h3 className="text-[#000340] text-base font-bold mb-2">حذف المادة</h3>
            <p className="text-gray-500 text-sm mb-5">هل تريد حذف <span className="text-[#000340] font-semibold">{delTarget?.name}</span>؟</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-500 font-bold text-sm cursor-pointer hover:bg-red-100 transition-colors">
                {saving ? '...' : 'نعم، احذف'}
              </button>
              <button onClick={() => setShowDel(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-transparent text-gray-600 cursor-pointer text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}