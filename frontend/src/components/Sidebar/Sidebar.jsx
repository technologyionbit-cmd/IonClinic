import { useContext } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CalendarDays, MessageSquare,
  LogOut, BadgeCent, Package, Settings,Info
} from 'lucide-react'
import { userToken } from '../../Context/UserToken'
import logo from '/Appointment Logo.webp'
import img from '/IMG_4047.JPG.jpeg'


// كل الروابط مع الصلاحيات المطلوبة من الوثيقة
const navItems = [
  { to: '/',                label: 'الصفحة الرئيسية', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'Doctor', 'Secretary'] },
  { to: '/patient',         label: 'المرضى',           icon: <Users size={20} />,           roles: ['Admin', 'Doctor', 'Secretary'] },          // الدكتور يفتح من ملف المريض مش من قائمة
  { to: '/appointment',     label: 'المواعيد',          icon: <CalendarDays size={20} />,    roles: ['Admin','Doctor', 'Secretary'] },          // الدكتور غير مسموح بتعديل المواعيد
  { to: '/whatsAppMessage', label: 'تذكيرات واتساب',   icon: <MessageSquare size={20} />,   roles: ['Admin', 'Secretary'] },
  { to: '/payment',         label: 'الدفع',             icon: <BadgeCent size={20} />,       roles: ['Admin', 'Secretary'] },          // الدكتور غير مسموح بإدخال دفعات
  { to: '/inventory',       label: 'المخزون',           icon: <Package size={20} />,         roles: ['Admin', 'Doctor'] },             // الدكتور يخصم مواد فقط
  { to: '/settings',        label: 'الإعدادات',         icon: <Settings size={20} />,        roles: ['Admin'] },   
    { to: '/About',        label: 'من نحن',         icon: <Info size={20} />,        roles:['Admin', 'Doctor', 'Secretary'] },                       // للمدير فقط
                    // للمدير فقط
]

export default function Sidebar({ onClose }) {
  const { setLogin } = useContext(userToken)
  const navigate = useNavigate()

  const token = localStorage.getItem('token')
  let role = 'Secretary'
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      role = payload.role || 'Secretary'
    }
  } catch {}

  function logout() {
    localStorage.removeItem('token')
    setLogin(null)
    navigate('/login', { replace: true })
  }

  const visibleItems = navItems.filter(item => item.roles.includes(role))

  const roleLabel = role === 'Admin' ? 'مدير' : role === 'Doctor' ? 'دكتور' : 'سكرتيرة'
  const roleColor = role === 'Admin' ? 'text-[#84C068]' : role === 'Doctor' ? 'text-[#4685AC]' : 'text-white/60'

  return (
    <div dir="rtl" className="flex flex-col h-full bg-[#000340] border-l border-white/10 font-[Tajawal,Cairo,sans-serif]">

      {/* Logo */}
      <div className="px-4 pt-8 pb-5 text-center border-b border-white/10">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden">
          <img src={logo} alt="شعار العيادة" className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none' }} />
        </div>
        <h1 className="text-white text-base font-bold m-0 leading-snug">نظام إدارة العيادات الطبية</h1>
        <p className="text-white/70 text-xs mt-1">IonClinic</p>
      </div>

      {/* Navigation */}
      <nav className="px-2 flex-1 pt-4 overflow-y-auto sidebar-scroll">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl text-sm transition-all duration-200 no-underline border-r-[3px] ${
                isActive
                  ? 'text-white bg-white/10 border-white font-semibold'
                  : 'text-white/90 bg-transparent border-transparent hover:text-white hover:bg-white/5'
              }`
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-2">
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 bg-red-500/10 text-red-400 border border-red-500/20 cursor-pointer hover:bg-red-500/20">
          <LogOut size={18} className="flex-shrink-0" />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {/* User Info */}
      <div className="px-3 py-3 border-t border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex-shrink-0 bg-gradient-to-br from-[#0A4174] to-[#001D39] flex items-center justify-center">
         <img src={img} className=' rounded-3xl' alt="img" />
        </div>
        <div className="overflow-hidden">
          <p className="text-white text-xs font-semibold m-0 truncate" style={{ direction: 'ltr', textAlign: 'left' }}>Derma Class Clinic</p>
          <p className={`text-[10px] m-0 truncate font-semibold ${roleColor}`}>{roleLabel}</p>
        </div>
      </div>
    </div>
  )
}