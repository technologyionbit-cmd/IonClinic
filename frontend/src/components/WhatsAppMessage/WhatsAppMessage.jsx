import axios from 'axios'
import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Send, MessageCircle, Phone, User, CheckCircle, XCircle, Wifi, WifiOff, Loader2, Search, X } from 'lucide-react'

export default function WhatsAppMessage() {
  const [patients,       setPatients]       = useState([])
  const [sending,        setSending]        = useState(false)
  const [toast,          setToast]          = useState(null)
  const [form,           setForm]           = useState({ patient_id: '', message: '' })
  const [errors,         setErrors]         = useState({})
  const [status,         setStatus]         = useState(null)
  const [qrImg,          setQrImg]          = useState('')
  const [patientSearch,  setPatientSearch]  = useState('')
  const [showDrop,       setShowDrop]       = useState(false)
  const [selectedPat,    setSelectedPat]    = useState(null)
  const pollRef   = useRef(null)
  const dropRef   = useRef(null)
  const token     = localStorage.getItem('token')
  const API_BASE  = import.meta.env.VITE_API_URL || ''

  // إغلاق الـ dropdown لما تضغط بره
  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setShowDrop(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchStatus() {
    try {
      const { data } = await axios.get(`${API_BASE}/api/whatsapp/status`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStatus(data.status)
      if (data.qr) {
        QRCode.toDataURL(data.qr, { width: 220, margin: 2, color: { dark: '#001D39', light: '#ffffff' } })
          .then(url => setQrImg(url)).catch(console.error)
      } else {
        setQrImg('')
      }
    } catch (e) { console.log(e) }
  }

  useEffect(() => {
    fetchStatus()
    pollRef.current = setInterval(() => fetchStatus(), 30000)
    return () => clearInterval(pollRef.current)
  }, [])

  useEffect(() => {
    if (status === 'CONNECTED') clearInterval(pollRef.current)
  }, [status])

  async function getAllPatients() {
    try {
      const { data } = await axios.get(`${API_BASE}/api/patients`, { headers: { Authorization: `Bearer ${token}` } })
      const list = Array.isArray(data) ? data : data.patients || []
      setPatients(list)
    } catch (e) { console.log(e) }
  }

  useEffect(() => { getAllPatients() }, [])

  function selectPatient(p) {
    setSelectedPat(p)
    setForm(f => ({ ...f, patient_id: p.id }))
    setPatientSearch(p.full_name)
    setShowDrop(false)
    setErrors(e => ({ ...e, patient_id: '' }))
  }

  function clearPatient() {
    setSelectedPat(null)
    setForm(f => ({ ...f, patient_id: '' }))
    setPatientSearch('')
  }

  const filteredPatients = patientSearch.trim()
    ? patients.filter(p =>
        p.full_name?.includes(patientSearch) ||
        p.phone_number?.includes(patientSearch)
      )
    : patients

  function validate() {
    const errs = {}
    if (!form.patient_id)     errs.patient_id = 'يجب اختيار المريض'
    if (!form.message.trim()) errs.message    = 'يجب كتابة الرسالة'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSend() {
    if (!validate()) return
    setSending(true)
    try {
      const phone = selectedPat.phone_number.replace(/\D/g, '')
      await axios.post(`${API_BASE}/api/whatsapp/send`,
        { phone, message: form.message },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      )
      showToast('success', `تم إرسال الرسالة إلى ${selectedPat.full_name}`)
      setForm({ patient_id: '', message: '' })
      setErrors({})
      clearPatient()
    } catch (e) {
      console.log(e)
      showToast('error', 'فشل إرسال الرسالة، تأكد من اتصال WhatsApp')
    } finally { setSending(false) }
  }

  function showToast(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 4000) }

  const quickMessages = [
    'السلام عليكم، نذكركم بموعدكم غداً في العيادة.',
    'نرجو تأكيد حضوركم للموعد المحدد.',
    'تم تأجيل موعدكم، يرجى التواصل لتحديد موعد جديد.',
    'شكراً لزيارتكم، نتمنى لكم الشفاء العاجل.',
  ]

  const statusConfig = {
    CONNECTED:      { label: 'متصل',           icon: <Wifi size={14} />,                              dot: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    QR_READY:       { label: 'في انتظار المسح', icon: <Loader2 size={14} className="animate-spin" />, dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    AUTHENTICATING: { label: 'جارٍ التحقق',     icon: <Loader2 size={14} className="animate-spin" />, dot: 'bg-blue-500',  text: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200'  },
    DISCONNECTED:   { label: 'غير متصل',        icon: <WifiOff size={14} />,                           dot: 'bg-red-500',   text: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200'   },
  }

  const isLoading   = status === null
  const sc          = statusConfig[status] || statusConfig.DISCONNECTED
  const isConnected = status === 'CONNECTED'

  return (
    <div dir="rtl" className="mt-5 lg:mt-0 min-h-screen bg-white p-4 sm:p-6 lg:p-8 font-[Tajawal,Cairo,sans-serif]">

      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 sm:px-5 py-3 rounded-xl shadow-lg text-sm font-semibold w-[90vw] sm:w-auto ${toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            <MessageCircle size={18} />
          </div>
          <div>
            <h1 className="text-[#001D39] text-xl sm:text-2xl font-bold m-0">رسائل WhatsApp</h1>
            <p className="text-[#0A4174] text-xs mt-0.5">إرسال رسائل مباشرة للمرضى</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#0A4174]/25 bg-white/40 text-xs text-[#0A4174]/70">
            <Loader2 size={12} className="animate-spin" />
            <span>جارٍ التحقق...</span>
          </div>
        ) : (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${sc.text} ${sc.bg} ${sc.border}`}>
            {isConnected ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            ) : (
              <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
            )}
            {sc.icon}
            <span>{sc.label}</span>
          </div>
        )}
      </div>

      {!isConnected && !isLoading && (
        <div className={`mb-5 px-4 py-3 rounded-xl border flex items-center gap-3 text-sm ${sc.bg} ${sc.border}`}>
          <span className={sc.text}>{sc.icon}</span>
          <span className={`${sc.text} font-medium`}>
            {status === 'QR_READY'       && 'يرجى مسح QR Code من تطبيق WhatsApp لإتمام الاتصال'}
            {status === 'AUTHENTICATING' && 'جارٍ التحقق من الحساب، يرجى الانتظار...'}
            {status === 'DISCONNECTED'   && 'WhatsApp غير متصل — لن تتمكن من إرسال الرسائل'}
          </span>
        </div>
      )}

      {status === 'QR_READY' && (
        <div className="mb-5 bg-white border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5 shadow-[0_2px_12px_rgba(10,65,116,0.06)]">
          <div className="flex-shrink-0">
            {qrImg ? (
              <div className="w-[180px] h-[180px] rounded-xl overflow-hidden border-4 border-[#0A4174]/20 shadow-[0_0_20px_rgba(10,65,116,0.1)]">
                <img src={qrImg} alt="QR Code" className="w-full h-full" />
              </div>
            ) : (
              <div className="w-[180px] h-[180px] rounded-xl bg-white/40 flex items-center justify-center">
                <Loader2 size={32} className="text-[#0A4174]/80 animate-spin" />
              </div>
            )}
          </div>
          <div className="text-center sm:text-right">
            <h3 className="text-amber-600 font-bold text-sm mb-2">امسح الكود لتسجيل الدخول</h3>
            <ul className="text-[#0A4174] text-sm flex flex-col gap-1.5 list-none m-0 p-0">
              <li className="flex items-center gap-2"><span className="text-amber-500">١.</span> افتح WhatsApp على هاتفك</li>
              <li className="flex items-center gap-2"><span className="text-amber-500">٢.</span> الإعدادات ← الأجهزة المرتبطة</li>
              <li className="flex items-center gap-2"><span className="text-amber-500">٣.</span> اضغط "ربط جهاز" وامسح الكود</li>
            </ul>
            <p className="text-[#0A4174]/80 text-xs mt-2">الكود بيتحدث تلقائياً كل 30 ثانية</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* فورم الإرسال */}
        <div className="bg-white border border-[#0A4174]/20 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-[0_2px_12px_rgba(10,65,116,0.06)]">
          <h2 className="text-[#001D39] text-sm sm:text-base font-bold m-0">رسالة جديدة</h2>

          {/* ── بحث المريض ── */}
          <div>
            <label className="text-[#001D39]/90 text-xs block mb-1.5">المريض *</label>
            <div className="relative" ref={dropRef}>
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={patientSearch}
                onChange={e => {
                  setPatientSearch(e.target.value)
                  setShowDrop(true)
                  if (!e.target.value) clearPatient()
                }}
                onFocus={() => setShowDrop(true)}
                placeholder="ابحث بالاسم أو الهاتف..."
                className={`w-full pr-9 pl-8 py-2.5 rounded-xl bg-white/30 text-[#001D39] text-sm placeholder:text-[#0A4174]/60 outline-none border transition-colors ${errors.patient_id ? 'border-red-400' : 'border-[#0A4174]/25 focus:border-[#0A4174]/50'}`}
              />
              {patientSearch && (
                <button onClick={clearPatient} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600">
                  <X size={13} />
                </button>
              )}

              {/* Dropdown */}
              {showDrop && (
                <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                  {filteredPatients.length === 0 ? (
                    <div className="px-4 py-3 text-gray-400 text-sm text-center">لا يوجد نتائج</div>
                  ) : filteredPatients.map(p => (
                    <button key={p.id} type="button" onClick={() => selectPatient(p)}
                      className="w-full text-right px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between gap-3 border-none bg-transparent cursor-pointer border-b border-gray-50 last:border-0">
                      <span className="text-[#001D39] text-sm font-medium">{p.full_name}</span>
                      <span className="text-gray-400 text-xs" dir="ltr">{p.phone_number}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.patient_id && <p className="text-red-500 text-xs mt-1">{errors.patient_id}</p>}
          </div>

          {/* معلومات المريض المختار */}
          {selectedPat && (
            <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                <User size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#001D39] text-sm font-semibold m-0">{selectedPat.full_name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone size={10} className="text-[#0A4174]/80" />
                  <p className="text-[#0A4174]/80 text-xs m-0" dir="ltr">{selectedPat.phone_number}</p>
                </div>
              </div>
              <button onClick={clearPatient} className="text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600 flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          )}

          {/* الرسالة */}
          <div>
            <label className="text-[#001D39]/90 text-xs block mb-1.5">الرسالة *</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="اكتب رسالتك هنا..." rows={5}
              className={`w-full px-3 py-2.5 rounded-xl bg-white/30 text-[#001D39] text-sm placeholder:text-[#0A4174]/80 outline-none border transition-colors resize-none ${errors.message ? 'border-red-400' : 'border-[#0A4174]/25 focus:border-[#0A4174]/50'}`} />
            {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
            <p className="text-[#0A4174]/80 text-xs mt-1">{form.message.length} حرف</p>
          </div>

          <button onClick={handleSend} disabled={sending || !isConnected}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-none font-bold text-sm cursor-pointer bg-[#0A4174] text-white shadow-lg shadow-[#0A4174]/20 transition-all ${(sending || !isConnected) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#001D39]'}`}>
            <Send size={15} />
            {sending ? 'جارٍ الإرسال...' : !isConnected ? 'يجب الاتصال أولاً' : 'إرسال الرسالة'}
          </button>
        </div>

        {/* رسائل جاهزة + تعليمات */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[#0A4174]/20 rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(10,65,116,0.06)]">
            <h2 className="text-[#001D39] text-sm sm:text-base font-bold m-0 mb-3">رسائل جاهزة</h2>
            <div className="flex flex-col gap-2.5">
              {quickMessages.map((msg, i) => (
                <button key={i} onClick={() => setForm(f => ({ ...f, message: msg }))}
                  className="text-right px-4 py-3 rounded-xl bg-white/30 border border-[#0A4174]/20 text-[#0A4174]/80 text-sm cursor-pointer hover:bg-white/60 hover:border-[#0A4174]/25 hover:text-[#001D39] transition-all">
                  {msg}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#0A4174]/20 rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(10,65,116,0.06)]">
            <h2 className="text-[#001D39] text-sm sm:text-base font-bold m-0 mb-3">تعليمات</h2>
            <ul className="text-[#0A4174] text-sm flex flex-col gap-2 list-none m-0 p-0">
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span> تأكد من اتصال WhatsApp بالسيرفر</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span> رقم المريض لازم يبدأ بـ 07 (أردني)</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span> يمكنك استخدام الرسائل الجاهزة أو كتابة رسالة مخصصة</li>
              <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span> لا يمكن إرسال رسالة لمريض بدون رقم هاتف</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}