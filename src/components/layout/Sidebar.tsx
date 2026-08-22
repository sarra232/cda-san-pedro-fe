import { useAuthStore } from '../../store/useAuthStore';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  Receipt, 
  FileSpreadsheet, 
  UserCog, 
  ShieldCheck, 
  Sparkles,
  Bell,
  Wrench,
  Tag,
  X
} from 'lucide-react';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: Props) {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'ADMINISTRADOR';
  const isDirector = user?.rol === 'DIRECTOR_TECNICO';
  const isTecnico = user?.rol === 'TECNICO_PISTA';
  const isRecep = user?.rol === 'RECEPCIONISTA';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 border-r border-cda-dark-800 bg-cda-dark-900 md:bg-cda-dark-900/60 backdrop-blur-xl md:backdrop-blur-md flex flex-col justify-between p-4 shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-5">
          {/* Header on mobile with close button */}
          <div className="flex items-center justify-between md:hidden pb-3 border-b border-cda-dark-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Menú Principal</span>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-cda-dark-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Badge Indicator */}
          <div className="bg-gradient-to-r from-cda-dark-800 to-cda-dark-850 p-3.5 rounded-2xl border border-cda-yellow-500/20">
            <div className="flex items-center gap-2">
              {isTecnico ? (
                <Wrench className="w-4 h-4 text-cda-yellow-400" />
              ) : isDirector ? (
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-cda-yellow-400" />
              )}
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {isAdmin 
                  ? 'Administrador' 
                  : isDirector 
                  ? 'Director Técnico' 
                  : isTecnico 
                  ? 'Técnico de Pista' 
                  : 'Recepción'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isAdmin 
                ? 'Acceso total gerencial, auditoría y reportes' 
                : isDirector
                ? 'Supervisión técnica, pistas y dictamen final RTM'
                : isTecnico
                ? 'Control de pruebas e inspección técnica en pista'
                : 'Gestión ágil de ventanilla, clientes y facturación'}
            </p>
          </div>

          {/* Navigation Links by Role */}
          <nav className="space-y-1.5">
            {/* 1. Dashboard (Admin, Director y Recepción) */}
            {!isTecnico && (
              <NavLink
                to="/dashboard"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/10 font-bold'
                      : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{isAdmin ? 'Dashboard Ejecutivo' : 'Dashboard Operativo'}</span>
              </NavLink>
            )}

            {/* 2. Recepción e Ingreso (Admin y Recepcionista) */}
            {(isAdmin || isRecep) && (
              <NavLink
                to="/recepcion"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/10 font-bold'
                      : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                  }`
                }
              >
                <Car className="w-4 h-4" />
                <span>Recepción de Vehículos</span>
              </NavLink>
            )}

            {/* 3. Pista de Inspección (Para todos los roles) */}
            <NavLink
              to="/pista"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/10 font-bold'
                    : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                }`
              }
            >
              <Wrench className="w-4 h-4" />
              <span>Pista de Inspección</span>
            </NavLink>

            {/* 4. Clientes y Vehículos (Admin, Director y Recepción) */}
            {!isTecnico && (
              <NavLink
                to="/clientes"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/10 font-bold'
                      : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                  }`
                }
              >
                <Users className="w-4 h-4" />
                <span>Clientes y Vehículos</span>
              </NavLink>
            )}

            {/* 5. Facturación (Admin y Recepción) */}
            {(isAdmin || isRecep) && (
              <NavLink
                to="/facturacion"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/10 font-bold'
                      : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                  }`
                }
              >
                <Receipt className="w-4 h-4" />
                <span>Facturación</span>
              </NavLink>
            )}

            {/* 6. Reportes Analíticos (Administrador y Director Técnico) */}
            {(isAdmin || isDirector) && (
              <NavLink
                to="/reportes"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/10 font-bold'
                      : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                  }`
                }
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Reportes por Fechas</span>
              </NavLink>
            )}

            {/* 6. Cola de Notificaciones (Sólo Administrador) */}
            {isAdmin && (
              <NavLink
                to="/notificaciones"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/10 font-bold'
                      : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                  }`
                }
              >
                <Bell className="w-4 h-4" />
                <span>Notificaciones</span>
              </NavLink>
            )}

            {/* 7. Catálogo de Servicios & Tarifas (Para todos, editable para Admin) */}
            <NavLink
              to="/servicios"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/10 font-bold'
                    : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                }`
              }
            >
              <Tag className="w-4 h-4" />
              <span>{isAdmin ? 'Catálogo de Servicios' : 'Tarifas de Servicios'}</span>
            </NavLink>

            {/* 8. Gestión de Personal (Administrador y Consulta para Recepción) */}
            {!isTecnico && (
              <NavLink
                to="/usuarios"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/10 font-bold'
                      : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                  }`
                }
              >
                <UserCog className="w-4 h-4" />
                <span>{isAdmin ? 'Personal & Roles' : 'Directorio de Personal'}</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="pt-4 border-t border-cda-dark-800">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-cda-yellow-400" />
            <span>CDA San Pedro • 2026</span>
          </div>
        </div>
      </aside>
    </>
  );
}
