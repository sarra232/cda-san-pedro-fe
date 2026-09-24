import { useState, useEffect } from 'react';
import { 
  Plus, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Edit3, 
  UserCheck, 
  UserX, 
  Loader2, 
  Wrench, 
  Shield, 
  CreditCard,
  Trash2,
  Lock,
  Mail,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { User, RolUsuario } from '../../types/auth';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { formatDocumento } from '../../utils/formatters';
import { Pagination } from '../../components/common/Pagination';
import { UsuarioModal } from './UsuarioModal';

export function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.rol === 'ADMINISTRADOR';

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reseteandoId, setReseteandoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRol, setFilterRol] = useState<string>('TODOS');
  const [filterEstado, setFilterEstado] = useState<string>('ACTIVO');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadUsuarios = async (silent = false) => {
    if (!silent) {
      if (usuarios.length === 0) setIsLoading(true);
      setIsRefreshing(true);
    }
    try {
      const list = await userService.getUsuarios();
      setUsuarios(list);
    } catch {
      // Manejo silencioso
    } finally {
      if (!silent) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadUsuarios(false);

    // Polling reactivo cada 10 segundos
    const interval = setInterval(() => {
      loadUsuarios(true);
    }, 10000);

    // Revalidación inmediata al volver a la pestaña
    const handleRevalidate = () => {
      loadUsuarios(true);
    };

    window.addEventListener('focus', handleRevalidate);
    document.addEventListener('visibilitychange', handleRevalidate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleRevalidate);
      document.removeEventListener('visibilitychange', handleRevalidate);
    };
  }, []);

  const handleToggleEstado = async (u: User) => {
    if (!isAdmin) return;
    try {
      await userService.cambiarEstado(u.id, !u.activo);
      loadUsuarios();
    } catch {
      // Manejo silencioso
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (!isAdmin) return;
    if (u.id === currentUser?.id) {
      alert('No puedes eliminar tu propia cuenta de Administrador.');
      return;
    }

    const confirmDelete = window.confirm(`¿Estás seguro de eliminar permanentemente al usuario ${u.nombresApellidos}?`);
    if (!confirmDelete) return;

    try {
      await userService.eliminarUsuario(u.id);
      loadUsuarios();
    } catch {
      alert('Error al eliminar usuario. Puede tener registros históricos asociados en pista o facturación.');
    }
  };

  const handleResetPassword = async (u: User) => {
    if (!isAdmin) return;
    const confirm = window.confirm(`¿Desea enviar un correo para resetear la contraseña del usuario ${u.nombresApellidos} (Documento: ${u.numeroDocumento})?`);
    if (!confirm) return;

    try {
      setReseteandoId(u.id);
      const msg = await authService.solicitarRecuperacion(u.numeroDocumento);
      alert(msg || `Se ha enviado el correo para resetear la contraseña a ${u.nombresApellidos}`);
    } catch (err: unknown) {
      let msg = 'Error al enviar correo de restablecimiento';
      if (err && typeof err === 'object' && 'response' in err) {
        const resData = (err as { response: { data?: { message?: string } } }).response?.data;
        if (resData?.message) msg = resData.message;
      }
      alert(msg);
    } finally {
      setReseteandoId(null);
    }
  };

  const handleEdit = (u: User) => {
    if (!isAdmin) return;
    setSelectedUser(u);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    if (!isAdmin) return;
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  // Filtering
  const filteredUsuarios = usuarios.filter((u) => {
    const matchesSearch = 
      u.nombresApellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.numeroDocumento.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRol = filterRol === 'TODOS' || u.rol === filterRol;
    const matchesEstado = 
      filterEstado === 'TODOS' ||
      (filterEstado === 'ACTIVO' && u.activo !== false) ||
      (filterEstado === 'INACTIVO' && u.activo === false);

    return matchesSearch && matchesRol && matchesEstado;
  });

  const getRolBadge = (rol: RolUsuario) => {
    switch (rol) {
      case 'ADMINISTRADOR':
        return (
          <span className="bg-cda-yellow-500/15 text-cda-yellow-400 border border-cda-yellow-500/30 px-2.5 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>ADMINISTRADOR</span>
          </span>
        );
      case 'DIRECTOR_TECNICO':
        return (
          <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>DIRECTOR TÉCNICO</span>
          </span>
        );
      case 'TECNICO_PISTA':
        return (
          <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1">
            <Wrench className="w-3 h-3" />
            <span>TÉCNICO DE PISTA</span>
          </span>
        );
      case 'RECEPCIONISTA':
        return (
          <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            <span>RECEPCIONISTA</span>
          </span>
        );
      case 'CAJERO':
        return (
          <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            <span>CAJERO</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold">
            {rol}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>{isAdmin ? 'Gestión de Personal y Roles' : 'Directorio de Personal del CDA'}</span>
            <span className="text-xs font-extrabold text-cda-yellow-400 bg-cda-yellow-400/10 px-2.5 py-0.5 rounded-full border border-cda-yellow-400/20">
              {isAdmin ? 'Administración' : 'Modo Consulta'}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAdmin 
              ? 'Administra técnicos de pista, recepcionistas, cajeros y credenciales de acceso'
              : 'Directorio de técnicos, recepcionistas y personal operativo activo del CDA'}
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={handleCreate}
            className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cda-yellow-500/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario / Técnico</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-cda-dark-800 px-3 py-1.5 rounded-xl border border-cda-dark-700">
            <Lock className="w-3.5 h-3.5 text-cda-yellow-400" />
            <span>Modificaciones restringidas a Administrador</span>
          </div>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-3">
        {/* Selector de Segmentos de Estado */}
        <div className="flex items-center gap-2 flex-wrap pb-1">
          <button
            type="button"
            onClick={() => {
              setFilterEstado('ACTIVO');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterEstado === 'ACTIVO'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-cda-dark-900 text-slate-400 border border-cda-dark-700 hover:text-white hover:bg-cda-dark-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Activos en el Sistema</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-[10px] font-mono font-bold text-emerald-300">
              {usuarios.filter((u) => u.activo !== false).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterEstado('INACTIVO');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterEstado === 'INACTIVO'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'bg-cda-dark-900 text-slate-400 border border-cda-dark-700 hover:text-white hover:bg-cda-dark-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>Inactivos / Bloqueados</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-[10px] font-mono font-bold text-rose-300">
              {usuarios.filter((u) => u.activo === false).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterEstado('TODOS');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterEstado === 'TODOS'
                ? 'bg-cda-dark-800 text-white border border-cda-dark-600 shadow-sm'
                : 'bg-cda-dark-900 text-slate-400 border border-cda-dark-700 hover:text-white hover:bg-cda-dark-800'
            }`}
          >
            <span>Todos los Usuarios</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cda-dark-800 text-[10px] font-mono font-bold text-slate-300">
              {usuarios.length}
            </span>
          </button>
        </div>

        {filterEstado === 'INACTIVO' && (
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-rose-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Mostrando únicamente usuarios inactivos o bloqueados en el sistema. Puede activarlos nuevamente haciendo clic en el icono de reactivación.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search Bar */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre o documento..."
              className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cda-yellow-500 focus:outline-none"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filterRol}
              onChange={(e) => {
                setFilterRol(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-cda-yellow-500 focus:outline-none"
            >
              <option value="TODOS">Todos los Roles</option>
              <option value="TECNICO_PISTA">🔧 Técnicos de Pista</option>
              <option value="DIRECTOR_TECNICO">🎓 Directores Técnicos</option>
              <option value="RECEPCIONISTA">📋 Recepcionistas</option>
              <option value="CAJERO">💳 Cajeros</option>
              <option value="ADMINISTRADOR">👑 Administradores</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <select
              value={filterEstado}
              onChange={(e) => {
                setFilterEstado(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 bg-cda-dark-900 border border-cda-dark-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-cda-yellow-500 focus:outline-none"
            >
              <option value="ACTIVO">✓ Solo Activos</option>
              <option value="INACTIVO">✕ Solo Inactivos</option>
              <option value="TODOS">Todos los Estados</option>
            </select>
            <button
              type="button"
              onClick={() => loadUsuarios(false)}
              disabled={isRefreshing}
              title="Actualizar datos en tiempo real"
              className="p-2.5 bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 hover:text-white border border-cda-dark-700 rounded-xl transition-colors shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-cda-yellow-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="cda-glass rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-cda-yellow-400" />
            <p className="text-xs">Cargando catálogo de personal...</p>
          </div>
        ) : (
          <>
            {/* MOBILE CARDS VIEW (< md) */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredUsuarios.length === 0 ? (
                <div className="cda-glass rounded-2xl p-6 text-center text-slate-500 text-xs">
                  No se encontraron usuarios con los filtros aplicados.
                </div>
              ) : (
                filteredUsuarios
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((u) => (
                    <div key={u.id} className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-cda-yellow-500/10 border border-cda-yellow-500/30 flex items-center justify-center text-cda-yellow-400 font-bold text-xs">
                            {u.nombresApellidos.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs uppercase">{u.nombresApellidos}</p>
                            <p className="text-[11px] font-mono text-slate-400">
                              {u.tipoDocumento} {formatDocumento(u.numeroDocumento)}
                            </p>
                          </div>
                        </div>
                        <div>{getRolBadge(u.rol)}</div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-cda-dark-800 text-xs">
                        <span className={`inline-flex items-center gap-1 font-semibold ${u.activo !== false ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {u.activo !== false ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                          <span>{u.activo !== false ? 'Activo' : 'Inactivo'}</span>
                        </span>

                        {isAdmin && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleToggleEstado(u)}
                              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                u.activo !== false
                                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              }`}
                              title={u.activo !== false ? 'Desactivar usuario' : 'Activar usuario'}
                            >
                              {u.activo !== false ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleEdit(u)}
                              className="bg-cda-dark-800 hover:bg-cda-dark-700 text-cda-yellow-400 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 border border-cda-dark-700"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Botón explícito para Enviar Correo de Reset en móvil */}
                      {isAdmin && (
                        <div className="pt-2 border-t border-cda-dark-800">
                          <button
                            onClick={() => handleResetPassword(u)}
                            disabled={reseteandoId === u.id}
                            className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
                            title="Enviar enlace por correo para resetear contraseña"
                          >
                            {reseteandoId === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            ) : (
                              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                            <span>Reset Clave</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>

            {/* DESKTOP TABLE VIEW (>= md) */}
            <div className="hidden md:block cda-glass rounded-2xl border border-cda-dark-700/80 overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[850px] text-left text-xs">
                  <thead className="text-slate-400 bg-cda-dark-900/80 border-b border-cda-dark-800">
                    <tr>
                      <th className="p-4 font-semibold whitespace-nowrap min-w-[180px]">Empleado</th>
                      <th className="p-4 font-semibold whitespace-nowrap">Documento</th>
                      <th className="p-4 font-semibold whitespace-nowrap">Rol Asignado</th>
                      <th className="p-4 font-semibold whitespace-nowrap">Estado Cuenta</th>
                      {isAdmin && (
                        <th className="p-4 font-semibold text-right whitespace-nowrap sticky right-0 bg-cda-dark-900/95 backdrop-blur-sm z-10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.5)] border-l border-cda-dark-800">
                          Acciones de Administrador
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cda-dark-800 text-slate-200">
                    {filteredUsuarios.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 5 : 4} className="p-8 text-center text-slate-500">
                          No se encontraron usuarios con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredUsuarios
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((u) => (
                          <tr key={u.id} className="hover:bg-cda-dark-800/40 transition-colors group">
                            <td className="p-4 min-w-[180px]">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-cda-yellow-500/10 border border-cda-yellow-500/30 flex items-center justify-center text-cda-yellow-400 font-bold text-xs shrink-0">
                                  {u.nombresApellidos.charAt(0)}
                                </div>
                                <span className="font-bold text-white whitespace-nowrap uppercase">{u.nombresApellidos}</span>
                              </div>
                            </td>

                            <td className="p-4 font-mono text-slate-300 whitespace-nowrap">
                              {u.tipoDocumento} {formatDocumento(u.numeroDocumento)}
                            </td>

                            <td className="p-4 whitespace-nowrap">
                              {getRolBadge(u.rol)}
                            </td>

                            <td className="p-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 font-semibold ${u.activo !== false ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {u.activo !== false ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                <span>{u.activo !== false ? 'Activo' : 'Inactivo'}</span>
                              </span>
                            </td>

                            {isAdmin && (
                              <td className="p-4 text-right space-x-1.5 whitespace-nowrap sticky right-0 bg-cda-dark-900/90 group-hover:bg-cda-dark-900 backdrop-blur-sm z-10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.5)] border-l border-cda-dark-800">
                                <button
                                  onClick={() => handleResetPassword(u)}
                                  disabled={reseteandoId === u.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold transition-all disabled:opacity-50 shadow-sm whitespace-nowrap"
                                  title="Enviar enlace por correo para resetear contraseña"
                                >
                                  {reseteandoId === u.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                  ) : (
                                    <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  )}
                                  <span>Reset Clave</span>
                                </button>
                                <button
                                  onClick={() => handleToggleEstado(u)}
                                  className={`p-1.5 rounded-lg border text-xs transition-colors inline-flex ${
                                    u.activo !== false
                                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  }`}
                                  title={u.activo !== false ? 'Desactivar usuario' : 'Activar usuario'}
                                >
                                  {u.activo !== false ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => handleEdit(u)}
                                  className="inline-flex items-center gap-1 bg-cda-dark-800 hover:bg-cda-dark-700 text-cda-yellow-400 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-cda-dark-700 transition-all"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors inline-flex"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredUsuarios.length / itemsPerPage) || 1}
              totalItems={filteredUsuarios.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}
      </div>

      {/* Create / Edit Modal (Only rendered/accessible if Admin) */}
      {isAdmin && (
        <UsuarioModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadUsuarios}
          userToEdit={selectedUser}
        />
      )}
    </div>
  );
}
