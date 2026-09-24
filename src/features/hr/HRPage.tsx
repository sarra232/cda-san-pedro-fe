import React, { useState, useEffect } from 'react';
import { hrService } from '../../services/hrService';
import {
  Empleado,
  EmpleadoFormData,
  EmpleadoCertificacion,
  CertificacionFormData,
  Nomina,
  LiquidacionNominaFormData,
} from '../../types/hr';
import { EmpleadoModal } from './EmpleadoModal';
import { CertificacionModal } from './CertificacionModal';
import { LiquidacionNominaModal } from './LiquidacionNominaModal';
import { NominaDetalleModal } from './NominaDetalleModal';
import {
  Users,
  Award,
  DollarSign,
  Plus,
  Search,
  RefreshCw,
  Phone,
  Edit3,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Wrench,
  UserCheck,
  CreditCard,
  Eye,
  Mail,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const HRPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EMPLEADOS' | 'CERTIFICACIONES' | 'NOMINA'>('EMPLEADOS');
  
  // Estados de datos
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [certificaciones, setCertificaciones] = useState<EmpleadoCertificacion[]>([]);
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [enviandoInvitacionId, setEnviandoInvitacionId] = useState<string | null>(null);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEstadoEmp, setFiltroEstadoEmp] = useState<string>('ACTIVOS');
  
  // Paginación
  const [paginaEmp, setPaginaEmp] = useState(1);
  const [itemsPorPaginaEmp, setItemsPorPaginaEmp] = useState(10);
  
  const [paginaCert, setPaginaCert] = useState(1);
  const [itemsPorPaginaCert, setItemsPorPaginaCert] = useState(9);
  
  const [paginaNom, setPaginaNom] = useState(1);
  const [itemsPorPaginaNom, setItemsPorPaginaNom] = useState(10);

  useEffect(() => {
    setPaginaEmp(1);
  }, [searchQuery, filtroEstadoEmp]);

  useEffect(() => {
    setPaginaCert(1);
  }, [searchQuery]);

  // Modales
  const [modalEmpleadoOpen, setModalEmpleadoOpen] = useState(false);
  const [empleadoAEditar, setEmpleadoAEditar] = useState<Empleado | null>(null);
  
  const [modalCertOpen, setModalCertOpen] = useState(false);
  const [modalLiquidarOpen, setModalLiquidarOpen] = useState(false);
  
  const [modalDetalleNominaOpen, setModalDetalleNominaOpen] = useState(false);
  const [nominaSeleccionada, setNominaSeleccionada] = useState<Nomina | null>(null);

  const cargarDatos = async (silent = false) => {
    try {
      if (!silent) {
        if (empleados.length === 0) setLoading(true);
        setIsRefreshing(true);
      }
      const [dataEmp, dataCert, dataNom] = await Promise.all([
        hrService.listarEmpleados().catch((err) => {
          console.error('Error al listar empleados:', err);
          return [];
        }),
        hrService.listarCertificaciones().catch((err) => {
          console.error('Error al listar certificaciones:', err);
          return [];
        }),
        hrService.listarNominas().catch((err) => {
          console.error('Error al listar nóminas:', err);
          return [];
        }),
      ]);
      setEmpleados(Array.isArray(dataEmp) ? dataEmp : []);
      setCertificaciones(Array.isArray(dataCert) ? dataCert : []);
      setNominas(Array.isArray(dataNom) ? dataNom : []);
    } catch (error) {
      console.error('Error al cargar datos de Talento Humano:', error);
    } finally {
      if (!silent) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    cargarDatos(false);

    // Polling periódico cada 10 segundos
    const interval = setInterval(() => {
      cargarDatos(true);
    }, 10000);

    // Revalidación inmediata al enfocar pestaña
    const handleRevalidate = () => {
      cargarDatos(true);
    };

    window.addEventListener('focus', handleRevalidate);
    document.addEventListener('visibilitychange', handleRevalidate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleRevalidate);
      document.removeEventListener('visibilitychange', handleRevalidate);
    };
  }, []);

  // Handlers para Empleados
  const handleSaveEmpleado = async (data: EmpleadoFormData) => {
    if (empleadoAEditar) {
      await hrService.actualizarEmpleado(empleadoAEditar.id, data);
    } else {
      await hrService.crearEmpleado(data);
    }
    await cargarDatos();
  };

  const handleRetirarEmpleado = async (id: string) => {
    if (window.confirm('¿Está seguro de pasar a estado RETIRADO este colaborador?')) {
      await hrService.retirarEmpleado(id);
      await cargarDatos();
    }
  };

  const handleReenviarInvitacion = async (emp: Empleado) => {
    const estadoTexto = emp.estado !== 'ACTIVO' ? ' (se reactivará su acceso en el sistema)' : '';
    if (window.confirm(`¿Desea enviar un correo para resetear o crear la contraseña a ${emp.nombresApellidos}${estadoTexto}?`)) {
      try {
        setEnviandoInvitacionId(emp.id);
        const msg = await hrService.reenviarInvitacion(emp.id);
        alert(msg);
        await cargarDatos();
      } catch (err: unknown) {
        let msg = 'Error al enviar correo de restablecimiento';
        if (err && typeof err === 'object' && 'response' in err) {
          const resData = (err as { response: { data?: { message?: string } } }).response?.data;
          if (resData?.message) msg = resData.message;
        }
        alert(msg);
      } finally {
        setEnviandoInvitacionId(null);
      }
    }
  };

  // Handlers para Certificaciones
  const handleSaveCertificacion = async (data: CertificacionFormData) => {
    await hrService.registrarCertificacion(data);
    await cargarDatos();
  };

  const handleEliminarCertificacion = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta certificación técnica?')) {
      await hrService.eliminarCertificacion(id);
      await cargarDatos();
    }
  };

  // Handlers para Nómina
  const handleLiquidarNomina = async (data: LiquidacionNominaFormData) => {
    const liquidada = await hrService.liquidarNomina(data);
    await cargarDatos();
    setNominaSeleccionada(liquidada);
    setModalDetalleNominaOpen(true);
  };

  const handleAprobarNomina = async (id: string) => {
    await hrService.aprobarNomina(id);
    await cargarDatos();
  };

  // Contadores de estado de colaboradores
  const countActivos = empleados.filter((e) => e.estado === 'ACTIVO' && e.usuarioActivo !== false).length;
  const countRetirados = empleados.filter((e) => e.estado === 'RETIRADO' || e.usuarioActivo === false).length;
  const countNovedades = empleados.filter((e) => ['VACACIONES', 'INCAPACITADO', 'LICENCIA'].includes(e.estado)).length;

  // Filtros de Empleados
  const empleadosFiltrados = empleados.filter((e) => {
    let matchEstado = true;
    if (filtroEstadoEmp === 'ACTIVOS' || filtroEstadoEmp === 'ACTIVO') {
      matchEstado = e.estado === 'ACTIVO' && e.usuarioActivo !== false;
    } else if (filtroEstadoEmp === 'RETIRADOS' || filtroEstadoEmp === 'RETIRADO' || filtroEstadoEmp === 'INACTIVO') {
      matchEstado = e.estado === 'RETIRADO' || e.usuarioActivo === false;
    } else if (filtroEstadoEmp === 'NOVEDADES') {
      matchEstado = ['VACACIONES', 'INCAPACITADO', 'LICENCIA'].includes(e.estado);
    } else if (filtroEstadoEmp === 'TODOS') {
      matchEstado = true;
    } else {
      matchEstado = e.estado === filtroEstadoEmp;
    }

    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return matchEstado;
    const matchSearch =
      (e.nombresApellidos || '').toLowerCase().includes(q) ||
      (e.numeroDocumento || '').toLowerCase().includes(q) ||
      (e.cargo || '').toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.departamento || '').toLowerCase().includes(q);
    return matchEstado && matchSearch;
  });

  // Filtros de Certificaciones
  const certsFiltradas = certificaciones.filter((c) => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (c.empleadoNombre || '').toLowerCase().includes(q) ||
      (c.tipoCertificacion || '').toLowerCase().includes(q) ||
      (c.codigoCertificado || '').toLowerCase().includes(q)
    );
  });

  // Paginación calculada
  const totalPaginasEmp = Math.max(1, Math.ceil(empleadosFiltrados.length / itemsPorPaginaEmp));
  const empleadosPaginados = empleadosFiltrados.slice(
    (paginaEmp - 1) * itemsPorPaginaEmp,
    paginaEmp * itemsPorPaginaEmp
  );

  const totalPaginasCert = Math.max(1, Math.ceil(certsFiltradas.length / itemsPorPaginaCert));
  const certsPaginadas = certsFiltradas.slice(
    (paginaCert - 1) * itemsPorPaginaCert,
    paginaCert * itemsPorPaginaCert
  );

  const totalPaginasNom = Math.max(1, Math.ceil(nominas.length / itemsPorPaginaNom));
  const nominasPaginadas = nominas.slice(
    (paginaNom - 1) * itemsPorPaginaNom,
    paginaNom * itemsPorPaginaNom
  );

  // KPIs Resumen
  const empleadosActivos = empleados.filter((e) => e.estado === 'ACTIVO');
  const certsVencidas = certificaciones.filter((c) => c.colorSemaforo === 'ROJO').length;
  const certsPorVencer = certificaciones.filter((c) => c.colorSemaforo === 'AMARILLO').length;

  const formatearCOP = (valor: number | undefined) => {
    return '$' + (Number(valor) || 0).toLocaleString('es-CO');
  };

  const getRolBadge = (rol?: string) => {
    switch (rol) {
      case 'ADMINISTRADOR':
        return (
          <span className="bg-cda-yellow-500/15 text-cda-yellow-400 border border-cda-yellow-500/30 px-2 py-0.5 rounded-md text-[9px] font-bold inline-flex items-center gap-1">
            <Shield className="w-2.5 h-2.5" />
            <span>ADMINISTRADOR</span>
          </span>
        );
      case 'DIRECTOR_TECNICO':
        return (
          <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md text-[9px] font-bold inline-flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
            <span>DIRECTOR TÉCNICO</span>
          </span>
        );
      case 'TECNICO_PISTA':
        return (
          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[9px] font-bold inline-flex items-center gap-1">
            <Wrench className="w-2.5 h-2.5" />
            <span>TÉCNICO DE PISTA</span>
          </span>
        );
      case 'RECEPCIONISTA':
        return (
          <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md text-[9px] font-bold inline-flex items-center gap-1">
            <UserCheck className="w-2.5 h-2.5" />
            <span>RECEPCIONISTA</span>
          </span>
        );
      case 'CAJERO':
        return (
          <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-md text-[9px] font-bold inline-flex items-center gap-1">
            <CreditCard className="w-2.5 h-2.5" />
            <span>CAJERO</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-md text-[9px] font-bold">
            {rol || 'OPERATIVO'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-w-0 flex-1 overflow-x-hidden">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Talento Humano & Gestión de Personal
              </h1>
              <p className="text-sm text-slate-400">
                Gestión unificada de colaboradores, roles en la app, acreditaciones ONAC / ISO 17020 y nómina oficial
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => cargarDatos(false)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            title="Recargar datos en tiempo real"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
          </button>

          {activeTab === 'EMPLEADOS' && (
            <button
              onClick={() => {
                setEmpleadoAEditar(null);
                setModalEmpleadoOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Colaborador</span>
            </button>
          )}

          {activeTab === 'CERTIFICACIONES' && (
            <button
              onClick={() => setModalCertOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Acreditar Certificación</span>
            </button>
          )}

          {activeTab === 'NOMINA' && (
            <button
              onClick={() => setModalLiquidarOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Liquidar Quincena</span>
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas KPIs Superiores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Colaboradores</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{empleados.length}</p>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 inline-block">
            ● {empleadosActivos.length} activos en servicio
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Acreditaciones ONAC</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{certificaciones.length}</p>
          <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">
            Vigentes en pista
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Certificaciones en Riesgo</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">{certsPorVencer + certsVencidas}</p>
          <span className="text-[10px] text-rose-400 font-medium mt-1 inline-block">
            {certsVencidas} vencidas • {certsPorVencer} por vencer
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Nóminas Procesadas</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{nominas.length}</p>
          <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">
            Periodos liquidados
          </span>
        </div>
      </div>

      {/* Selector de Pestañas (Tabs) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('EMPLEADOS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'EMPLEADOS'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Colaboradores & Contratos ({empleados.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CERTIFICACIONES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'CERTIFICACIONES'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Certificaciones ONAC / ISO 17020 ({certificaciones.length})</span>
          {certsPorVencer + certsVencidas > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('NOMINA')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'NOMINA'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Liquidación de Nómina ({nominas.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: COLABORADORES & CONTRATOS */}
      {/* ========================================================================= */}
      {activeTab === 'EMPLEADOS' && (
        <div className="space-y-4">
          {/* Selector de Segmentos de Estado (Pestañas rápidas) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFiltroEstadoEmp('ACTIVOS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                filtroEstadoEmp === 'ACTIVOS' || filtroEstadoEmp === 'ACTIVO'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Activos en Servicio</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-mono font-bold text-emerald-300">
                {countActivos}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstadoEmp('NOVEDADES')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                filtroEstadoEmp === 'NOVEDADES' || ['VACACIONES', 'INCAPACITADO', 'LICENCIA'].includes(filtroEstadoEmp)
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>En Novedad / Licencia</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-mono font-bold text-amber-300">
                {countNovedades}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstadoEmp('RETIRADOS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                filtroEstadoEmp === 'RETIRADOS' || filtroEstadoEmp === 'RETIRADO' || filtroEstadoEmp === 'INACTIVO'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/10'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>Inactivos / Retirados</span>
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-[10px] font-mono font-bold text-rose-300">
                {countRetirados}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstadoEmp('TODOS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                filtroEstadoEmp === 'TODOS'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Todos</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono font-bold text-slate-300">
                {empleados.length}
              </span>
            </button>
          </div>

          {/* Banner informativo cuando se visualizan inactivos/retirados */}
          {(filtroEstadoEmp === 'RETIRADOS' || filtroEstadoEmp === 'RETIRADO' || filtroEstadoEmp === 'INACTIVO') && (
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                Mostrando colaboradores inactivos o retirados. Puede reactivar su acceso en cualquier momento editando su estado a ACTIVO o restableciendo su clave.
              </span>
            </div>
          )}

          {/* Barra de Búsqueda y Filtros */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, documento o cargo..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filtroEstadoEmp}
                onChange={(e) => setFiltroEstadoEmp(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ACTIVOS">✓ Activos en Servicio</option>
                <option value="NOVEDADES">⏸️ En Novedad (Vacaciones / Licencias)</option>
                <option value="RETIRADOS">✕ Inactivos y Retirados</option>
                <option value="VACACIONES">Específico: En Vacaciones</option>
                <option value="INCAPACITADO">Específico: Incapacitados</option>
                <option value="LICENCIA">Específico: En Licencia</option>
                <option value="TODOS">Todos los Estados</option>
              </select>
            </div>
          </div>

          {/* Vista Móvil: Tarjetas Táctiles */}
          <div className="grid grid-cols-1 md:hidden gap-3.5">
            {loading ? (
              <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                Cargando colaboradores...
              </div>
            ) : empleadosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                No se encontraron colaboradores con los criterios seleccionados.
              </div>
            ) : (
              empleadosPaginados.map((emp) => (
                <div
                  key={emp.id}
                  className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-3 shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            emp.estado === 'ACTIVO'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {emp.estado}
                        </span>
                        {getRolBadge(emp.rolApp)}
                        <span className="text-[10px] text-amber-400 font-mono font-bold">
                          {emp.tipoDocumento} {emp.numeroDocumento}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1 uppercase">{emp.nombresApellidos}</h3>
                      <p className="text-xs text-amber-400 font-medium">{emp.cargo}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEmpleadoAEditar(emp);
                          setModalEmpleadoOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar Colaborador y Rol"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {emp.estado === 'ACTIVO' && (
                        <button
                          onClick={() => handleRetirarEmpleado(emp.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Retirar colaborador y dar de baja en la app"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Botón de reseteo de clave */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleReenviarInvitacion(emp)}
                      disabled={enviandoInvitacionId === emp.id}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
                      title="Enviar enlace por correo para resetear contraseña"
                    >
                      {enviandoInvitacionId === emp.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : (
                        <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span>Reset Clave</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Salario Base</span>
                      <strong className="text-emerald-400">{formatearCOP(emp.salarioBase)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Contrato</span>
                      <span className="text-slate-300">{emp.tipoContrato}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    {emp.celular ? (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{emp.celular}</span>
                      </div>
                    ) : <span />}
                    <div className="flex items-center gap-1 text-[10px]">
                      {emp.usuarioActivo !== false ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Acceso Habilitado
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Acceso Bloqueado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Vista Escritorio: Tabla Estilizada con soporte horizontal y sticky actions */}
          <div className="hidden md:block bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[1000px] text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 whitespace-nowrap">Documento</th>
                    <th className="py-3.5 px-4 whitespace-nowrap min-w-[200px]">Colaborador / Nombres</th>
                    <th className="py-3.5 px-4 whitespace-nowrap min-w-[160px]">Cargo & Departamento</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Rol en App</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Contrato</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Salario Base</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Estado</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap sticky right-0 bg-slate-950/95 backdrop-blur-sm z-10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.5)] border-l border-slate-800/80">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                        Cargando colaboradores...
                      </td>
                    </tr>
                  ) : empleadosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No hay colaboradores registrados con esos filtros.
                      </td>
                    </tr>
                  ) : (
                    empleadosPaginados.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="py-3 px-4 font-mono font-medium text-amber-400 text-xs whitespace-nowrap">
                          {emp.tipoDocumento} {emp.numeroDocumento}
                        </td>
                        <td className="py-3 px-4 min-w-[200px]">
                          <p className="font-bold text-white whitespace-nowrap uppercase">{emp.nombresApellidos}</p>
                          <p className="text-xs text-slate-400 whitespace-nowrap">{emp.celular} • {emp.email || 'Sin correo'}</p>
                        </td>
                        <td className="py-3 px-4 min-w-[160px]">
                          <p className="text-white font-medium text-xs whitespace-nowrap">{emp.cargo}</p>
                          <p className="text-[11px] text-slate-500 whitespace-nowrap">{emp.departamento}</p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getRolBadge(emp.rolApp)}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-300 whitespace-nowrap">
                          {emp.tipoContrato}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {formatearCOP(emp.salarioBase)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border inline-block text-center ${
                                emp.estado === 'ACTIVO'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {emp.estado}
                            </span>
                            <span className={`text-[9px] font-medium ${emp.usuarioActivo !== false ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                              {emp.usuarioActivo !== false ? '● Acceso App OK' : '✕ Acceso Bloqueado'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap sticky right-0 bg-slate-900/95 group-hover:bg-slate-900 backdrop-blur-sm z-10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.5)] border-l border-slate-800/80">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleReenviarInvitacion(emp)}
                              disabled={enviandoInvitacionId === emp.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold transition-all disabled:opacity-50 shadow-sm whitespace-nowrap"
                              title="Enviar enlace por correo para resetear contraseña"
                            >
                              {enviandoInvitacionId === emp.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                              ) : (
                                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              )}
                              <span>Reset Clave</span>
                            </button>
                            <button
                              onClick={() => {
                                setEmpleadoAEditar(emp);
                                setModalEmpleadoOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Editar Colaborador y Rol"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {emp.estado === 'ACTIVO' && (
                              <button
                                onClick={() => handleRetirarEmpleado(emp.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Retirar colaborador y dar de baja en la app"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Barra de Paginación de Colaboradores */}
          {empleadosFiltrados.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Mostrar</span>
                <select
                  value={itemsPorPaginaEmp}
                  onChange={(e) => {
                    setItemsPorPaginaEmp(Number(e.target.value));
                    setPaginaEmp(1);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>por página • Mostrando {Math.min((paginaEmp - 1) * itemsPorPaginaEmp + 1, empleadosFiltrados.length)} a {Math.min(paginaEmp * itemsPorPaginaEmp, empleadosFiltrados.length)} de {empleadosFiltrados.length} colaboradores</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPaginaEmp((p) => Math.max(1, p - 1))}
                  disabled={paginaEmp === 1}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg font-bold">
                  Página {paginaEmp} de {totalPaginasEmp}
                </span>
                <button
                  onClick={() => setPaginaEmp((p) => Math.min(totalPaginasEmp, p + 1))}
                  disabled={paginaEmp === totalPaginasEmp}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: CERTIFICACIONES TÉCNICAS ONAC / ISO 17020 */}
      {/* ========================================================================= */}
      {activeTab === 'CERTIFICACIONES' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por colaborador, tipo de certificación o código..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Matriz de Certificaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                Cargando matriz de acreditaciones...
              </div>
            ) : certsFiltradas.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                No hay certificaciones técnicas registradas.
              </div>
            ) : (
              certsPaginadas.map((c) => {
                const isRojo = c.colorSemaforo === 'ROJO';
                const isAmarillo = c.colorSemaforo === 'AMARILLO';

                return (
                  <div
                    key={c.id}
                    className={`p-4 bg-slate-900 border rounded-2xl space-y-3 shadow-lg relative overflow-hidden ${
                      isRojo
                        ? 'border-rose-500/40 bg-rose-950/10'
                        : isAmarillo
                        ? 'border-amber-500/40 bg-amber-950/10'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            isRojo
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : isAmarillo
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {c.estado} • {c.diasRestantes} días
                        </span>
                        <h3 className="text-sm font-bold text-white mt-1.5">{c.tipoCertificacion}</h3>
                        <p className="text-xs text-amber-400 font-mono">{c.codigoCertificado}</p>
                      </div>

                      <button
                        onClick={() => handleEliminarCertificacion(c.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                        title="Eliminar certificación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Colaborador:</span>
                        <strong className="text-white uppercase">{c.empleadoNombre}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Entidad:</span>
                        <span className="text-slate-400">{c.entidadEmisora}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-500">Vencimiento:</span>
                        <strong className={isRojo ? 'text-rose-400' : isAmarillo ? 'text-amber-400' : 'text-slate-300'}>
                          {c.fechaVencimiento}
                        </strong>
                      </div>
                    </div>

                    {c.observaciones && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                        {c.observaciones}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Barra de Paginación de Certificaciones */}
          {certsFiltradas.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Mostrar</span>
                <select
                  value={itemsPorPaginaCert}
                  onChange={(e) => {
                    setItemsPorPaginaCert(Number(e.target.value));
                    setPaginaCert(1);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={18}>18</option>
                  <option value={36}>36</option>
                </select>
                <span>por página • Mostrando {Math.min((paginaCert - 1) * itemsPorPaginaCert + 1, certsFiltradas.length)} a {Math.min(paginaCert * itemsPorPaginaCert, certsFiltradas.length)} de {certsFiltradas.length} certificaciones</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPaginaCert((p) => Math.max(1, p - 1))}
                  disabled={paginaCert === 1}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg font-bold">
                  Página {paginaCert} de {totalPaginasCert}
                </span>
                <button
                  onClick={() => setPaginaCert((p) => Math.min(totalPaginasCert, p + 1))}
                  disabled={paginaCert === totalPaginasCert}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: LIQUIDACIÓN DE NÓMINA & PRESTACIONES */}
      {/* ========================================================================= */}
      {activeTab === 'NOMINA' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:hidden gap-3.5">
            {loading ? (
              <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                Cargando historial de nómina...
              </div>
            ) : nominas.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                No hay nóminas liquidadas en el historial. Utilice el botón "Liquidar Quincena".
              </div>
            ) : (
              nominasPaginadas.map((nom) => (
                <div
                  key={nom.id}
                  className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-3 shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          nom.estado === 'APROBADA' || nom.estado === 'PAGADA'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {nom.estado}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">{nom.periodoDescripcion}</h3>
                      <p className="text-xs text-slate-400">
                        {nom.fechaInicio} al {nom.fechaFin} • {nom.detalles?.length || 0} personas
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setNominaSeleccionada(nom);
                        setModalDetalleNominaOpen(true);
                      }}
                      className="p-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-xl"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Devengado</span>
                      <strong className="text-white">{formatearCOP(nom.totalDevengado)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Deducciones</span>
                      <strong className="text-rose-400">-{formatearCOP(nom.totalDeducciones)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Neto Pagar</span>
                      <strong className="text-amber-400">{formatearCOP(nom.totalNeto)}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Vista Escritorio: Tabla de Nóminas con soporte horizontal y sticky actions */}
          <div className="hidden md:block bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[950px] text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 whitespace-nowrap">Periodo Nómina</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Rango Fechas</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Total Devengado</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Total Deducciones</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Neto a Pagar</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Costos Patronales</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Estado</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap sticky right-0 bg-slate-950/95 backdrop-blur-sm z-10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.5)] border-l border-slate-800/80">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                        Cargando historial de nómina...
                      </td>
                    </tr>
                  ) : nominas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No hay nóminas registradas. Utilice el botón "Liquidar Quincena".
                      </td>
                    </tr>
                  ) : (
                    nominasPaginadas.map((nom) => (
                      <tr key={nom.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                          {nom.periodoDescripcion}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                          {nom.fechaInicio} al {nom.fechaFin}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400 whitespace-nowrap">
                          {formatearCOP(nom.totalDevengado)}
                        </td>
                        <td className="py-3 px-4 font-mono text-rose-400 whitespace-nowrap">
                          -{formatearCOP(nom.totalDeducciones)}
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold text-amber-400 whitespace-nowrap">
                          {formatearCOP(nom.totalNeto)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-xs whitespace-nowrap">
                          {formatearCOP(Number(nom.totalAportesPatronales || 0) + Number(nom.totalProvisiones || 0))}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border inline-block ${
                              nom.estado === 'APROBADA' || nom.estado === 'PAGADA'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {nom.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap sticky right-0 bg-slate-900/95 group-hover:bg-slate-900 backdrop-blur-sm z-10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.5)] border-l border-slate-800/80">
                          <button
                            onClick={() => {
                              setNominaSeleccionada(nom);
                              setModalDetalleNominaOpen(true);
                            }}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 mx-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Desglose</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Barra de Paginación de Nóminas */}
          {nominas.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Mostrar</span>
                <select
                  value={itemsPorPaginaNom}
                  onChange={(e) => {
                    setItemsPorPaginaNom(Number(e.target.value));
                    setPaginaNom(1);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <span>por página • Mostrando {Math.min((paginaNom - 1) * itemsPorPaginaNom + 1, nominas.length)} a {Math.min(paginaNom * itemsPorPaginaNom, nominas.length)} de {nominas.length} periodos</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPaginaNom((p) => Math.max(1, p - 1))}
                  disabled={paginaNom === 1}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg font-bold">
                  Página {paginaNom} de {totalPaginasNom}
                </span>
                <button
                  onClick={() => setPaginaNom((p) => Math.min(totalPaginasNom, p + 1))}
                  disabled={paginaNom === totalPaginasNom}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modales de Gestión */}
      <EmpleadoModal
        isOpen={modalEmpleadoOpen}
        onClose={() => setModalEmpleadoOpen(false)}
        onSave={handleSaveEmpleado}
        empleadoAEditar={empleadoAEditar}
      />

      <CertificacionModal
        isOpen={modalCertOpen}
        onClose={() => setModalCertOpen(false)}
        onSave={handleSaveCertificacion}
        empleados={empleadosActivos}
      />

      <LiquidacionNominaModal
        isOpen={modalLiquidarOpen}
        onClose={() => setModalLiquidarOpen(false)}
        onLiquidar={handleLiquidarNomina}
        empleadosActivos={empleadosActivos}
      />

      <NominaDetalleModal
        isOpen={modalDetalleNominaOpen}
        onClose={() => setModalDetalleNominaOpen(false)}
        nomina={nominaSeleccionada}
        onAprobar={handleAprobarNomina}
      />
    </div>
  );
};
