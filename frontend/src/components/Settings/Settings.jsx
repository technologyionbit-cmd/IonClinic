import axios from 'axios'
import { useState, useEffect, useRef } from 'react'
import { Settings, Save, RefreshCw, Check, Clock, CalendarDays, Bell, Lock, Users, KeyRound, Eye, EyeOff, Upload, Trash2, AlertTriangle, X, FileSpreadsheet } from 'lucide-react'
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

// ── Confirm Dialog ───────────────────────────────────────────────
function ConfirmDialog({ open, onConfirm, onCancel, title, message, confirmLabel, confirmColor = 'red' }) {
  if (!open) return null
  const colorMap = {
    red: 'bg-red-600 hover:bg-red-700',
    orange: 'bg-orange-500 hover:bg-orange-600',
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90vw] max-w-sm border border-gray-200 font-[Tajawal,Cairo,sans-serif]" dir="rtl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-[#000340] font-bold text-base m-0 mb-1">{title}</h3>
            <p className="text-gray-500 text-xs m-0 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors">
            <X size={13} /> إلغاء
          </button>
          <button onClick={onConfirm}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold border-none cursor-pointer transition-colors ${colorMap[confirmColor]}`}>
            <Check size={13} /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card تغيير الباسورد ──────────────────────────────────────────
function ChangePasswordCard({ headers }) {
  const [form, setForm] = useState({ username: '', newPassword: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [showPw, setShowPw] = useState(false)

  const users = ['admin', 'doctor', 'secretary']

  function showMsg(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 3500) }

  async function handleSubmit() {
    if (!form.username) return showMsg('error', 'يجب اختيار المستخدم')
    if (!form.newPassword) return showMsg('error', 'يجب إدخال كلمة المرور الجديدة')
    if (form.newPassword.length < 6) return showMsg('error', 'يجب أن تكون 6 أحرف على الأقل')
    if (form.newPassword !== form.confirm) return showMsg('error', 'كلمتا المرور غير متطابقتين')

    setSaving(true)
    try {
      await axios.put(`${API_BASE}/api/auth/change-password`, {
        username: form.username,
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

// ── Card استيراد Excel ───────────────────────────────────────────
function ImportDatabaseCard({ headers, showToast }) {
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const fileInputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      showToast('error', 'يجب اختيار ملف Excel بصيغة .xlsx أو .xls')
      e.target.value = ''
      return
    }
    setSelectedFile(file)
  }

  function handleImportClick() {
    if (!selectedFile) {
      showToast('error', 'يجب اختيار ملف Excel أولاً')
      return
    }
    setConfirmOpen(true)
  }

  async function doImport() {
    setConfirmOpen(false)
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      await axios.post(`${API_BASE}/api/settings/import`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      })
      showToast('success', '✅ تم استيراد قاعدة البيانات بنجاح')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (e) {
      showToast('error', e.response?.data?.message || 'فشل استيراد قاعدة البيانات')
    } finally { setSaving(false) }
  }

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={doImport}
        title="تأكيد الاستيراد"
        message={`سيتم استيراد البيانات من الملف "${selectedFile?.name}". قد يؤدي ذلك إلى استبدال بيانات موجودة. هل أنت متأكد؟`}
        confirmLabel="استيراد"
        confirmColor="orange"
      />
      <Card icon={FileSpreadsheet} title="استيراد قاعدة البيانات من Excel" canEdit={true}>
        <p className="text-gray-500 text-xs mb-4 leading-relaxed">
          رفع ملف Excel لاستيراد بيانات المرضى والمواعيد والمخزون. يجب أن يحتوي الملف على الأوراق الصحيحة بالأعمدة المطلوبة.
        </p>

        {/* File drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors mb-3
            ${selectedFile ? 'border-[#4685AC] bg-[#4685AC]/5' : 'border-gray-200 bg-gray-50 hover:border-[#4685AC] hover:bg-[#4685AC]/5'}`}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <FileSpreadsheet size={24} className={selectedFile ? 'text-[#4685AC]' : 'text-gray-300'} />
          {selectedFile ? (
            <div className="text-center">
              <p className="text-[#000340] text-xs font-bold truncate max-w-[200px]">{selectedFile.name}</p>
              <p className="text-gray-400 text-xs">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-500 text-xs font-semibold">انقر لاختيار ملف Excel</p>
              <p className="text-gray-400 text-xs">.xlsx أو .xls</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleImportClick}
            disabled={!!saving || !selectedFile}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold border-none cursor-pointer transition-colors flex-1 justify-center
              ${(!selectedFile || saving) ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#3F7E5C] hover:bg-[#2d5e44]'}`}>
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
            {saving ? 'جارٍ الاستيراد...' : 'استيراد'}
          </button>
          {selectedFile && (
            <button
              onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
      </Card>
    </>
  )
}

// ── Card حذف قاعدة البيانات ──────────────────────────────────────
function ClearDatabaseCard({ headers, showToast }) {
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const CONFIRM_WORD = 'حذف'

  async function doClear() {
    setConfirmOpen(false)
    setInputVal('')
    setSaving(true)
    try {
      await axios.post(`${API_BASE}/api/settings/clear`, {}, { headers })
      showToast('success', '✅ تم مسح قاعدة البيانات. المستخدمون والإعدادات محفوظة.')
    } catch (e) {
      showToast('error', e.response?.data?.message || 'فشل مسح قاعدة البيانات')
    } finally { setSaving(false) }
  }

  return (
    <>
      {/* Custom confirm with typed word */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90vw] max-w-sm border border-gray-200 font-[Tajawal,Cairo,sans-serif]">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-[#000340] font-bold text-base m-0 mb-1">تحذير: حذف جميع البيانات</h3>
                <p className="text-gray-500 text-xs m-0 leading-relaxed">
                  هذا الإجراء <strong className="text-red-600">لا يمكن التراجع عنه</strong>. سيتم حذف جميع بيانات المرضى والمواعيد والمدفوعات والمخزون.
                  المستخدمون والإعدادات لن تُحذف.
                </p>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-gray-500 text-xs block mb-1.5">
                اكتب <strong className="text-red-600">«{CONFIRM_WORD}»</strong> للتأكيد
              </label>
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder={CONFIRM_WORD}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[#000340] text-sm outline-none focus:border-red-400 transition-colors"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setConfirmOpen(false); setInputVal('') }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors">
                <X size={13} /> إلغاء
              </button>
              <button
                onClick={doClear}
                disabled={inputVal !== CONFIRM_WORD}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold border-none transition-colors
                  ${inputVal === CONFIRM_WORD ? 'bg-red-600 hover:bg-red-700 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'}`}>
                <Trash2 size={13} /> حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}

      <Card icon={Trash2} title="مسح قاعدة البيانات" canEdit={true}>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-xs m-0 leading-relaxed">
            <strong>تحذير:</strong> سيتم حذف جميع بيانات المرضى والمواعيد والمدفوعات والمخزون بشكل نهائي. يُنصح بإنشاء نسخة احتياطية أولاً.
          </p>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!!saving}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold border-none cursor-pointer transition-colors ${saving ? 'opacity-60' : 'bg-red-600 hover:bg-red-700'}`}>
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
          {saving ? 'جارٍ المسح...' : 'مسح جميع البيانات'}
        </button>
      </Card>
    </>
  )
}

// ════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [toast, setToast] = useState(null)

  const token = localStorage.getItem('token')
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
      work_hours: ['work_start_time', 'work_end_time'],
      appointments: ['max_daily_appointments'],
      stock_alert: ['default_stock_alert_percent'],
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
          const value = TIME_KEYS.includes(key) ? ensureTime24h(rawVal) : rawVal
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
    `w-full px-3 py-2.5 rounded-xl bg-gray-50 border text-[#000340] text-sm outline-none transition-colors ${disabled ? 'border-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-200 focus:border-[#4685AC]'
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

        {/* ── Admin only cards ── */}
        {canEdit && <ChangePasswordCard headers={headers} />}

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

        {/* ── استيراد Excel ── */}
        {canEdit && <ImportDatabaseCard headers={headers} showToast={showToast} />}

        {/* ── حذف قاعدة البيانات ── */}
        {canEdit && <ClearDatabaseCard headers={headers} showToast={showToast} />}

      </div>
    </div>
  )
}