import { useAuthStore } from '../../store/useAuthStore';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  Receipt, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sparkles,
  Bell, 
  Wrench, 
  Tag, 
  Building2, 
  CreditCard, 
  X, 
  Gauge, 
  Settings,
  Award 
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
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 border-r border-cda-dark-800 bg-cda-dark-900 md:bg-cda-dark-900/70 backdrop-blur-xl md:backdrop-blur-md flex flex-col justify-between p-4 shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden space-y-4">
          {/* Header on mobile with close button */}
          <div className="flex items-center justify-between md:hidden pb-3 border-b border-cda-dark-800 shrink-0">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Menú Principal</span>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-cda-dark-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Badge Indicator */}
          <div className="bg-gradient-to-r from-cda-dark-800 to-cda-dark-850 p-3 rounded-2xl border border-cda-yellow-500/20 shrink-0">
            <div className="flex items-center gap-2">
              {isTecnico ? (
                <Wrench className="w-4 h-4 text-cda-yellow-400" />
              ) : isDirector ? (
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-cda-yellow-400" />
              )}
              <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                {isAdmin 
                  ? 'Administrador' 
                  : isDirector 
                  ? 'Director Técnico' 
                  : isTecnico 
                  ? 'Técnico de Pista' 
                  : 'Recepción'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              {isAdmin 
                ? 'Acceso total gerencial, auditoría y configuración' 
                : isDirector
                ? 'Supervisión técnica y dictamen final RTM'
                : isTecnico
                ? 'Control e inspección técnica en pista'
                : 'Ventanilla de recepción y facturación'}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 py-1">
            {/* ========================================================================= */}
            {/* 1. DASHBOARD PRINCIPAL (FUERA DE GRUPOS) */}
            {/* ========================================================================= */}
            {!isTecnico && (
              <div className="space-y-1">
                <NavLink
                  to="/dashboard"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/20 font-black'
                        : 'text-slate-200 bg-cda-dark-800/60 hover:bg-cda-dark-800 hover:text-white border border-cda-dark-700/60'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0 text-cda-yellow-400" />
                  <span>{isAdmin ? 'Dashboard Ejecutivo' : 'Dashboard Operativo'}</span>
                </NavLink>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. GRUPO: CICLO DEL SERVICIO (OPERACIÓN CDA) */}
            {/* ========================================================================= */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <Gauge className="w-3.5 h-3.5 text-cda-yellow-500/70" />
                <span>Ciclo del Servicio (Operación)</span>
              </div>

              {/* 2.1 Paso 1: Recepción e Ingreso (Ventanilla) */}
              {(isAdmin || isRecep) && (
                <NavLink
                  to="/recepcion"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/20 font-bold'
                        : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Car className="w-4 h-4 shrink-0 text-cda-yellow-400" />
                    <span>1. Registro e Ingreso</span>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-cda-dark-800 text-slate-400 border border-cda-dark-700 whitespace-nowrap shrink-0">
                    Ventanilla
                  </span>
                </NavLink>
              )}

              {/* 2.2 Paso 2: Facturación y Caja (Cobro en Caja) */}
              {(isAdmin || isRecep) && (
                <NavLink
                  to="/facturacion"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/20 font-bold'
                        : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>2. Facturación y Caja</span>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 whitespace-nowrap shrink-0">
                    Recaudo
                  </span>
                </NavLink>
              )}

              {/* 2.3 Paso 3: Pista de Inspección (Pruebas Técnicas & Dictamen) */}
              <NavLink
                to="/pista?filtro=ABIERTOS"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/20 font-bold'
                      : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>3. Inspección en Pista</span>
                </div>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 whitespace-nowrap shrink-0">
                  En Pista
                </span>
              </NavLink>
            </div>

            {/* ========================================================================= */}
            {/* 3. GRUPO: DIRECTORIOS & BASE DE DATOS */}
            {/* ========================================================================= */}
            {!isTecnico && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <Users className="w-3.5 h-3.5 text-cda-yellow-500/70" />
                  <span>Directorios & Base de Datos</span>
                </div>

                {/* 3.1 Directorio de Clientes y Vehículos */}
                <NavLink
                  to="/clientes"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/20 font-bold'
                        : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                    }`
                  }
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Clientes y Vehículos</span>
                </NavLink>

                {/* 3.2 Directorio de Proveedores (Sólo Administrador) */}
                {isAdmin && (
                  <NavLink
                    to="/proveedores"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/20 font-bold'
                          : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                      }`
                    }
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>Directorio Proveedores</span>
                  </NavLink>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 4. GRUPO: ADMINISTRACIÓN & CONTROL */}
            {/* ========================================================================= */}
            {(isAdmin || isDirector) && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <Settings className="w-3.5 h-3.5 text-cda-yellow-500/70" />
                  <span>Administración & Control</span>
                </div>

                {/* 4.1 Cuentas por Pagar (Sólo Administrador) */}
                {isAdmin && (
                  <NavLink
                    to="/cuentas-por-pagar"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/20 font-bold'
                          : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                      }`
                    }
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>Cuentas por Pagar</span>
                  </NavLink>
                )}

                {/* 4.2 Catálogo de Servicios & Tarifas */}
                <NavLink
                  to="/servicios"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/20 font-bold'
                        : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                    }`
                  }
                >
                  <Tag className="w-4 h-4 shrink-0" />
                  <span>{isAdmin ? 'Catálogo & Tarifas' : 'Tarifas de Servicios'}</span>
                </NavLink>

                {/* 4.3 Reportes Analíticos y Liquidación CDA (Administrador y Director Técnico) */}
                <NavLink
                  to="/reportes"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/20 font-bold'
                        : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                    }`
                  }
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0 text-cda-yellow-400" />
                  <span>{isAdmin ? 'Reportes & Liquidación CDA' : 'Reportes por Fechas'}</span>
                </NavLink>

                {/* 4.4 Cola de Notificaciones (Sólo Administrador) */}
                {isAdmin && (
                  <NavLink
                    to="/notificaciones"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/20 font-bold'
                          : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                      }`
                    }
                  >
                    <Bell className="w-4 h-4 shrink-0" />
                    <span>Notificaciones</span>
                  </NavLink>
                )}

                {/* 4.5 Talento Humano & Personal (Administrador y Director Técnico) */}
                <NavLink
                  to="/talento-humano"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/20 font-bold'
                        : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                    }`
                  }
                >
                  <Award className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Talento Humano & Personal</span>
                </NavLink>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5. CUENTA & PREFERENCIAS (ACCESIBLE PARA TODOS LOS ROLES) */}
            {/* ========================================================================= */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <Settings className="w-3 h-3 text-slate-400" />
                <span>Mi Cuenta</span>
              </div>
              <NavLink
                to="/perfil"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cda-yellow-500 text-black shadow-md shadow-cda-yellow-500/20 font-bold'
                      : 'text-slate-300 hover:bg-cda-dark-800 hover:text-white'
                  }`
                }
              >
                <Users className="w-4 h-4 shrink-0 text-cda-yellow-400" />
                <span>Mi Perfil & Seguridad</span>
              </NavLink>
            </div>
          </nav>
        </div>


        {/* Footer info in sidebar */}
        <div className="pt-3 border-t border-cda-dark-800 shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-cda-yellow-400 shrink-0" />
            <span>CDA San Pedro • Sistema Oficial</span>
          </div>
        </div>
      </aside>
    </>
  );
}
