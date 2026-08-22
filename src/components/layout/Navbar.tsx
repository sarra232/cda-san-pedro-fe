import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, Shield, Menu, X } from 'lucide-react';
import logoCDA from '../../assets/LogoCDA.PNG';

interface Props {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Navbar({ onToggleSidebar, isSidebarOpen }: Props) {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 border-b border-cda-dark-800 bg-cda-dark-900/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label="Abrir menú de navegación"
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-cda-dark-800 transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center space-x-2 sm:space-x-3">
          <img 
            src={logoCDA} 
            alt="CDA San Pedro" 
            className="h-8 sm:h-10 w-auto object-contain"
          />
          <div>
            <h1 className="text-xs sm:text-sm font-black text-white tracking-wide leading-none">
              CDA SAN PEDRO
            </h1>
            <p className="text-[9px] sm:text-[10px] text-cda-yellow-400 font-semibold tracking-wider uppercase mt-0.5">
              Diagnóstico Automotor
            </p>
          </div>
        </div>
      </div>

      {/* User Information & Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {user && (
          <div className="flex items-center space-x-2 sm:space-x-2.5 bg-cda-dark-800/80 px-2.5 py-1.5 rounded-xl border border-cda-dark-700">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cda-yellow-500/10 border border-cda-yellow-500/30 flex items-center justify-center text-cda-yellow-400 font-bold text-xs">
              {user.nombresApellidos.charAt(0)}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-semibold text-white leading-tight truncate max-w-[130px]">
                {user.nombresApellidos}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-cda-yellow-400" />
                <span className="text-[9px] font-bold text-cda-yellow-400 uppercase tracking-wider">
                  {user.rol.replace('_', ' ')}
                </span>
              </div>
            </div>
            <span className="lg:hidden text-[10px] font-extrabold text-cda-yellow-400 uppercase tracking-wider px-1">
              {user.rol === 'ADMINISTRADOR' ? 'ADMIN' : user.rol === 'TECNICO_PISTA' ? 'TÉCNICO' : user.rol === 'CAJERO' ? 'CAJERO' : 'RECEP'}
            </span>
          </div>
        )}

        <button
          onClick={logout}
          title="Cerrar Sesión"
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex items-center gap-1 text-xs font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
