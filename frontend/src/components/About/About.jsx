import ImgDoctor from '/Appointment Logo.webp'
import { Globe, Phone, Info } from 'lucide-react'

export default function About() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-[Tajawal,Cairo,sans-serif]">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-[#0A4174] text-2xl font-bold m-0">عن النظام</h1>
        <p className="text-gray-500 text-sm mt-1">معلومات النظام والشركة</p>
      </div>

      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* ── System Card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          <div className="px-6 py-4 bg-[#0A4174]/5 border-b border-gray-100 flex items-center gap-2">
            <Info size={16} className="text-[#0A4174]" />
            <h2 className="text-[#0A4174] text-sm font-bold m-0">معلومات النظام</h2>
          </div>

          <div className="p-6 flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
              <img
                src={ImgDoctor}
                alt="IonClinic"
                className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }}
              />
            </div>

            <div>
              <p className="text-[#000340] text-xl font-bold m-0">IonClinic</p>
              <p className="text-gray-500 text-sm mt-1 m-0">
                نظام إدارة العيادات الطبية
              </p>
            </div>
          </div>

        </div>

        {/* ── Company Card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          <div className="px-6 py-4 bg-[#16a34a]/5 border-b border-gray-100 flex items-center gap-2">
            <Globe size={16} className="text-[#16a34a]" />
            <h2 className="text-[#16a34a] text-sm font-bold m-0">معلومات الشركة</h2>
          </div>

          <div className="p-6 flex flex-col gap-6">

            {/* Website */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#0A4174]/10 flex items-center justify-center">
                <Globe size={18} className="text-[#0A4174]" />
              </div>
              <div>
                <p className="text-gray-500 text-xs m-0">الموقع الإلكتروني</p>
                <a
                  href="https://ionbittechnology.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0A4174] text-sm font-semibold hover:underline"
                  dir="ltr"
                >
                  ionbittechnology.com
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#16a34a]/10 flex items-center justify-center">
                <Phone size={18} className="text-[#16a34a]" />
              </div>
              <div>
                <p className="text-gray-500 text-xs m-0">رقم الهاتف</p>
                <p className="text-[#000340] text-sm font-semibold m-0" dir="ltr">
                  02 741 9398
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
