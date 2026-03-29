import { useState } from 'react'
import Sidebar from "../Sidebar/Sidebar"
import { Outlet } from "react-router-dom"
import { Menu, X } from 'lucide-react'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex flex-row w-full min-h-screen">

      {/* ── Mobile toggle button ── */}
      <button
        onClick={() => setMobileOpen(o => !o)}
        className="lg:hidden fixed top-1 right-1 z-50 w-7 h-7 rounded-xl bg-[#001D39] border border-white/6 flex items-center justify-center text-white shadow-lg cursor-pointer"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div className={`lg:hidden fixed top-0 right-0 z-50 h-full w-64 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:flex flex-col w-40 xl:w-[220px] flex-shrink-0 min-h-screen sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 bg-gradient-to-br from-[#0f2942] via-[#0a1e35] to-[#061526] overflow-auto min-h-screen">
        <Outlet />
      </div>

    </div>
  )
}