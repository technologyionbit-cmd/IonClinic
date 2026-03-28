import axios from 'axios'
import { useState, useEffect } from 'react'
import { Settings, Save, RefreshCw, Check, Clock, CalendarDays, Bell, Lock, Users, KeyRound, Eye, EyeOff } from 'lucide-react'
const API_BASE = import.meta.env.VITE_API_URL || ''
const API = `${API_BASE}/api/settings`

function ensureTime24h(val) {
  if (!val) return val
  const v = val.toString().trim()
  if (/AM|PM/i.test(v)) {
    const [timePart, period] = v.split(' ')
    let [h, m] = timePart.split(':').map(Number)
    if (/PM/i.test(period) && h !== 12) h += 12
    if (/AM/i.test(period) && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  return v
}

function SaveBtn({ canEdit, saving, sectionKey, onSave }) {
  if (!canEdit) return null
  const busy = saving === sectionKey
  return (
    <button onClick={() => onSave(sectionKey)} disabled={!!saving}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#000340] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#0A4174] transition-colors whitespace-nowrap ${saving ? 'opacity-60' : ''}`}>
      {busy ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
      {busy ? 'جارٍ الحفظ...' : 'حفظ'}
    </button>
  )
}

function Card({ icon: Icon, title, canEdit, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm" style={{ borderTop: '3px solid #4685AC' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#000340]/5 flex items-center justify-center">
            <Icon size={16} className="text-[#000340]" />
          </div>
          <h3 className="text-[#000340] font-bold text-sm m-0">{title}</h3>
        </div>
        {canEdit === false && (
          <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            <Lock size={10} /> قراءة فقط
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Card تغيير الباسورد ──────────────────────────────────────────
function ChangePasswordCard({ headers }) {
  const [form,    setForm]    = useState({ username: '', newPassword: '', confirm: '' })
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState(null)
  const [showPw,  setShowPw]  = useState(false)

  const users = ['admin', 'doctor', 'secretary']

  function showMsg(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 3500) }

  async function handleSubmit() {
    if (!form.username)    return showMsg('error', 'يجب اختيار المستخدم')
    if (!form.newPassword) return showMsg('error', 'يجب إدخال كلمة المرور الجديدة')
    if (form.newPassword.length < 6) return showMsg('error', 'يجب أن تكون 6 أحرف على الأقل')
    if (form.newPassword !== form.confirm) return showMsg('error', 'كلمتا المرور غير متطابقتين')

    setSaving(true)
    try {
      await axios.put(`${API_BASE}/api/auth/change-password`, {
        username:    form.username,
        newPassword: form.newPassword,
      }, { headers })
      showMsg('success', `✅ تم تغيير كلمة مرور ${form.username}`)
      setForm({ username: '', newPassword: '', confirm: '' })
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'حدث خطأ')
    } finally { setSaving(false) }
  }

  const inp = "w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[#000340] text-sm outline-none focus:border-[#4685AC] transition-colors"

  return (
    <Card icon={KeyRound} title="تغيير كلمة المرور" canEdit={true}>
      {toast && (
        <div className={`mb-3 px-3 py-2 rounded-xl text-xs font-semibold border ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {toast.msg}
        </div>
      )}
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-gray-500 text-xs block mb-1">المستخدم</label>
          <select value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            className={inp + ' appearance-none'}>
            <option value="">اختر المستخدم...</option>
            {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1">كلمة المرور الجديدة</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              placeholder="6 أحرف على الأقل"
              className={inp + ' pl-10'}
            />
            <button type="button" onClick={() => setShowPw(p => !p)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1">تأكيد كلمة المرور</label>
          <input
            type={showPw ? 'text' : 'password'}
            value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            placeholder="أعد كتابة كلمة المرور"
            className={inp}
          />
        </div>
        <button onClick={handleSubmit} disabled={saving}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#000340] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#0A4174] transition-colors mt-1 ${saving ? 'opacity-60' : ''}`}>
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
          {saving ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}
        </button>
      </div>
    </Card>
  )
}

// ════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const [form,    setForm]    = useState({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(null)
  const [toast,   setToast]   = useState(null)

  const token   = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  let role = 'Secretary'
  try {
    if (token) { const p = JSON.parse(atob(token.split('.')[1])); role = p.role || 'Secretary' }
  } catch {}
  const canEdit = role === 'Admin'

  function showToast(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 3500) }

  async function load() {
    try {
      const { data } = await axios.get(API, { headers })
      const TIME_KEYS = ['work_start_time', 'work_end_time']
      const normalized = { ...data }
      TIME_KEYS.forEach(k => { if (normalized[k]) normalized[k] = ensureTime24h(normalized[k]) })
      setForm(normalized)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function handleSave(sectionKey) {
    const sectionKeys = {
      work_hours:       ['work_start_time', 'work_end_time'],
      appointments:     ['max_daily_appointments'],
      stock_alert:      ['default_stock_alert_percent'],
      patients_percent: ['max_patients_percentage'],
    }
    saveSection(sectionKeys[sectionKey] || [], sectionKey)
  }

  async function saveSection(keys, sectionKey) {
    if (!canEdit) return
    setSaving(sectionKey)
    try {
      const TIME_KEYS = ['work_start_time', 'work_end_time']
      await Promise.all(
        keys.map(key => {
          const rawVal = form[key] ?? ''
          const value  = TIME_KEYS.includes(key) ? ensureTime24h(rawVal) : rawVal
          return axios.post(API, { key, value }, { headers })
        })
      )
      showToast('success', 'تم الحفظ بنجاح')
      await load()
    } catch (e) {
      showToast('error', e.response?.data?.message || 'حدث خطأ أثناء الحفظ')
    } finally { setSaving(null) }
  }

  async function createBackup() {
    setSaving('backup')
    try {
      const { data } = await axios.post(`${API_BASE}/api/backup`, {}, { headers })
      showToast('success', `✅ تم إنشاء النسخة: ${data.file}`)
    } catch (e) { showToast('error', 'فشل إنشاء النسخة الاحتياطية') }
    finally { setSaving(null) }
  }

  const inp = (disabled = false) =>
    `w-full px-3 py-2.5 rounded-xl bg-gray-50 border text-[#000340] text-sm outline-none transition-colors ${
      disabled ? 'border-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-200 focus:border-[#4685AC]'
    }`

  if (loading) return (
    <div className="mt-5 lg:mt-0 min-h-screen bg-white p-8 flex items-center justify-center text-gray-400 text-sm font-[Tajawal,Cairo,sans-serif]">
      جارٍ التحميل...
    </div>
  )

  return (
    <div dir="rtl" className="mt-5 lg:mt-0 min-h-screen bg-white p-4 sm:p-6 lg:p-8 font-[Tajawal,Cairo,sans-serif]">

      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border w-[90vw] sm:w-auto ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {toast.type === 'success' && <Check size={15} />} {toast.msg}
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#000340]/5 flex items-center justify-center">
          <Settings size={20} className="text-[#000340]" />
        </div>
        <div>
          <h1 className="text-[#000340] text-xl sm:text-2xl font-bold m-0">الإعدادات</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {canEdit ? 'إعدادات النظام العامة — للمدير فقط' : 'عرض الإعدادات — التعديل للمدير فقط'}
          </p>
        </div>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-700 text-sm mb-5">
          <Lock size={15} className="flex-shrink-0" />
          <span>أنت في وضع العرض فقط. تعديل الإعدادات متاح للمدير فقط.</span>
        </div>
      )}

      <div className="max-w-2xl flex flex-col gap-4">

        {/* ── ساعات العمل ── */}
        <Card icon={Clock} title="ساعات العمل" canEdit={canEdit}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-gray-500 text-xs block mb-1">وقت الفتح</label>
              <input type="time" value={form.work_start_time || '08:00'}
                onChange={e => canEdit && setForm(f => ({ ...f, work_start_time: e.target.value }))}
                disabled={!canEdit} className={inp(!canEdit)} />
            </div>
            <div>
              <label className="text-gray-500 text-xs block mb-1">وقت الإغلاق</label>
              <input type="time" value={form.work_end_time || '17:00'}
                onChange={e => canEdit && setForm(f => ({ ...f, work_end_time: e.target.value }))}
                disabled={!canEdit} className={inp(!canEdit)} />
            </div>
          </div>
          <SaveBtn canEdit={canEdit} saving={saving} sectionKey="work_hours" onSave={handleSave} />
        </Card>

        {/* ── الحد الأقصى للمواعيد ── */}
        <Card icon={CalendarDays} title="الحد الأقصى للمواعيد اليومية" canEdit={canEdit}>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-gray-500 text-xs block mb-1">عدد المواعيد في اليوم</label>
              <input type="number" value={form.max_daily_appointments || ''}
                onChange={e => canEdit && setForm(f => ({ ...f, max_daily_appointments: e.target.value }))}
                disabled={!canEdit} min="1" max="200" className={inp(!canEdit)} />
            </div>
            <SaveBtn canEdit={canEdit} saving={saving} sectionKey="appointments" onSave={handleSave} />
          </div>
        </Card>

        {/* ── نسبة تنبيه المخزون ── */}
        <Card icon={Bell} title="نسبة تنبيه المخزون الافتراضية" canEdit={canEdit}>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-gray-500 text-xs block mb-1">النسبة % — تُطبَّق على المواد الجديدة</label>
              <input type="number" value={form.default_stock_alert_percent || ''}
                onChange={e => canEdit && setForm(f => ({ ...f, default_stock_alert_percent: e.target.value }))}
                disabled={!canEdit} min="1" max="100" className={inp(!canEdit)} />
            </div>
            <SaveBtn canEdit={canEdit} saving={saving} sectionKey="stock_alert" onSave={handleSave} />
          </div>
        </Card>

        {/* ── نسبة عرض المرضى ── */}
        <Card icon={Users} title="نسبة عرض المرضى" canEdit={canEdit}>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-gray-500 text-xs block mb-1">نسبة المرضى المعروضين % — القيمة الافتراضية 20%</label>
              <input type="number" value={form.max_patients_percentage ?? ''}
                onChange={e => canEdit && setForm(f => ({ ...f, max_patients_percentage: e.target.value }))}
                disabled={!canEdit} min="1" max="100" placeholder="20" className={inp(!canEdit)} />
            </div>
            <SaveBtn canEdit={canEdit} saving={saving} sectionKey="patients_percent" onSave={handleSave} />
          </div>
        </Card>

        {/* ── تغيير كلمة المرور — Admin فقط ── */}
        {canEdit && <ChangePasswordCard headers={headers} />}

        {/* ── النسخ الاحتياطي — Admin فقط ── */}
        {canEdit && (
          <Card icon={RefreshCw} title="النسخ الاحتياطي" canEdit={canEdit}>
            <p className="text-gray-500 text-xs mb-4">إنشاء نسخة احتياطية يدوية من قاعدة البيانات وحفظها على الجهاز</p>
            <button onClick={createBackup} disabled={!!saving}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3F7E5C] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#2d5e44] transition-colors ${saving ? 'opacity-60' : ''}`}>
              <RefreshCw size={14} className={saving === 'backup' ? 'animate-spin' : ''} />
              {saving === 'backup' ? 'جارٍ النسخ...' : 'إنشاء نسخة احتياطية'}
            </button>
          </Card>
        )}

      </div>
    </div>
  )
}