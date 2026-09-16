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
  KeyRound,
} from 'lucide-react';

export const HRPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EMPLEADOS' | 'CERTIFICACIONES' | 'NOMINA'>('EMPLEADOS');
  
  // Estados de datos
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [certificaciones, setCertificaciones] = useState<EmpleadoCertificacion[]>([]);
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEstadoEmp, setFiltroEstadoEmp] = useState<string>('TODOS');
  
  // Modales
  const [modalEmpleadoOpen, setModalEmpleadoOpen] = useState(false);
  const [empleadoAEditar, setEmpleadoAEditar] = useState<Empleado | null>(null);
  
  const [modalCertOpen, setModalCertOpen] = useState(false);
  const [modalLiquidarOpen, setModalLiquidarOpen] = useState(false);
  
  const [modalDetalleNominaOpen, setModalDetalleNominaOpen] = useState(false);
  const [nominaSeleccionada, setNominaSeleccionada] = useState<Nomina | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
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
    if (window.confirm(`¿Desea enviar una invitación con enlace seguro para crear contraseña a ${emp.nombresApellidos}${estadoTexto}?`)) {
      try {
        const msg = await hrService.reenviarInvitacion(emp.id);
        alert(msg);
        await cargarDatos();
      } catch (err: unknown) {
        let msg = 'Error al enviar invitación';
        if (err && typeof err === 'object' && 'response' in err) {
          const resData = (err as { response: { data?: { message?: string } } }).response?.data;
          if (resData?.message) msg = resData.message;
        }
        alert(msg);
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

  // Filtros de Empleados
  const empleadosFiltrados = empleados.filter((e) => {
    const matchEstado = filtroEstadoEmp === 'TODOS' || e.estado === filtroEstadoEmp;
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return matchEstado;
    const matchSearch =
      (e.nombresApellidos || '').toLowerCase().includes(q) ||
      (e.numeroDocumento || '').toLowerCase().includes(q) ||
      (e.cargo || '').toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q);
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
            onClick={cargarDatos}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all"
            title="Refrescar Datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {activeTab === 'EMPLEADOS' && (
            <button
              onClick={() => {
                setEmpleadoAEditar(null);
                setModalEmpleadoOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Colaborador</span>
            </button>
          )}

          {activeTab === 'CERTIFICACIONES' && (
            <button
              onClick={() => setModalCertOpen(true)}
              disabled={empleados.length === 0}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center gap-2 text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              <Award className="w-4 h-4" />
              <span>Registrar Certificación</span>
            </button>
          )}

          {activeTab === 'NOMINA' && (
            <button
              onClick={() => setModalLiquidarOpen(true)}
              disabled={empleadosActivos.length === 0}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center gap-2 text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              <DollarSign className="w-4 h-4" />
              <span>Liquidar Quincena</span>
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas Resumen KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Plantilla Activa</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{empleadosActivos.length}</p>
          <p className="text-[10px] text-slate-500 mt-1">Inspectores, técnicos y admin</p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Acreditaciones Vigentes</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            {certificaciones.filter((c) => c.colorSemaforo === 'VERDE').length}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Cumplimiento ISO 17020</p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Alertas Certificados</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400">{certsPorVencer}</span>
            <span className="text-xs text-slate-400">por vencer</span>
            {certsVencidas > 0 && (
              <span className="text-xs font-bold text-rose-400">({certsVencidas} vencidas)</span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Renovación ante evaluadores</p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Última Nómina</span>
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg font-bold text-white mt-1">
            {nominas[0]?.periodoDescripcion || 'Sin liquidar'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {nominas[0] ? `Neto: ${formatearCOP(nominas[0].totalNeto)}` : 'Periodo actual'}
          </p>
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
                <option value="TODOS">Todos los Estados</option>
                <option value="ACTIVO">Activos</option>
                <option value="EN_VACACIONES">En Vacaciones</option>
                <option value="INCAPACITADO">Incapacitados</option>
                <option value="RETIRADO">Retirados</option>
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
              empleadosFiltrados.map((emp) => (
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
                      <h3 className="text-base font-bold text-white mt-1">{emp.nombresApellidos}</h3>
                      <p className="text-xs text-amber-400 font-medium">{emp.cargo}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleReenviarInvitacion(emp)}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Enviar invitación para crear contraseña"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEmpleadoAEditar(emp);
                          setModalEmpleadoOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg"
                        title="Editar Colaborador y Rol"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {emp.estado === 'ACTIVO' && (
                        <button
                          onClick={() => handleRetirarEmpleado(emp.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                          title="Retirar colaborador y dar de baja en la app"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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

          {/* Vista Escritorio: Tabla Estilizada */}
          <div className="hidden md:block bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Documento</th>
                  <th className="py-3.5 px-4">Colaborador / Nombres</th>
                  <th className="py-3.5 px-4">Cargo & Departamento</th>
                  <th className="py-3.5 px-4">Rol en App</th>
                  <th className="py-3.5 px-4">Contrato</th>
                  <th className="py-3.5 px-4">Salario Base</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
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
                  empleadosFiltrados.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-amber-400 text-xs">
                        {emp.tipoDocumento} {emp.numeroDocumento}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{emp.nombresApellidos}</p>
                        <p className="text-xs text-slate-400">{emp.celular} • {emp.email || 'Sin correo'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-white font-medium text-xs">{emp.cargo}</p>
                        <p className="text-[11px] text-slate-500">{emp.departamento}</p>
                      </td>
                      <td className="py-3 px-4">
                        {getRolBadge(emp.rolApp)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300">
                        {emp.tipoContrato}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {formatearCOP(emp.salarioBase)}
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleReenviarInvitacion(emp)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Enviar invitación para crear contraseña"
                          >
                            <KeyRound className="w-4 h-4" />
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
              certsFiltradas.map((c) => {
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
                        <strong className="text-white">{c.empleadoNombre}</strong>
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
              nominas.map((nom) => (
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

          <div className="hidden md:block bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Periodo Nómina</th>
                  <th className="py-3.5 px-4">Rango Fechas</th>
                  <th className="py-3.5 px-4">Total Devengado</th>
                  <th className="py-3.5 px-4">Total Deducciones</th>
                  <th className="py-3.5 px-4">Neto a Pagar</th>
                  <th className="py-3.5 px-4">Costos Patronales</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
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
                  nominas.map((nom) => (
                    <tr key={nom.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        {nom.periodoDescripcion}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                        {nom.fechaInicio} al {nom.fechaFin}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {formatearCOP(nom.totalDevengado)}
                      </td>
                      <td className="py-3 px-4 font-mono text-rose-400">
                        -{formatearCOP(nom.totalDeducciones)}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-amber-400">
                        {formatearCOP(nom.totalNeto)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-xs">
                        {formatearCOP(Number(nom.totalAportesPatronales || 0) + Number(nom.totalProvisiones || 0))}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            nom.estado === 'APROBADA' || nom.estado === 'PAGADA'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {nom.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
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
