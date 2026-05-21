import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { IS_MOCK } from '@/lib/supabase'
import { Home, Users, Menu, X, LogOut, Sparkles, FlaskConical } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Centros', icon: Home, end: true },
  { to: '/clients', label: 'Todas las clientas', icon: Users, end: false },
]

function SidebarContent({ onNav, user, onSignOut }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-rose-100">
        <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">DermaFlow</p>
          <p className="text-[10px] text-rose-400 leading-tight">Micropigmentación CRM</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNav}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-rose-50 text-rose-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-rose-500">
              {user?.email?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#f9f5f5]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-56 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-40">
        <SidebarContent user={user} onNav={() => {}} onSignOut={handleSignOut} />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white z-50 lg:hidden flex flex-col shadow-xl transition-transform duration-200 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-900">DermaFlow</span>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <SidebarContent user={user} onNav={() => setOpen(false)} onSignOut={handleSignOut} />
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Mobile top header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setOpen(true)}
            className="p-2 -ml-1 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-rose-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-900">DermaFlow</span>
          </div>
        </header>

        {/* Demo mode banner */}
        {IS_MOCK && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2">
            <FlaskConical className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="text-xs text-amber-700 font-medium">
              Modo demo · datos guardados localmente · para producción conecta Supabase
            </span>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
