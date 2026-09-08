import React, { useState, useEffect } from 'react';
import { cuentaPagarService } from '../../services/cuentaPagarService';
import { terceroService } from '../../services/terceroService';
import { CuentaPorPagar, CuentaPorPagarFormData, PagoProveedorFormData, SemaforoVencimientos } from '../../types/cuentapagar';
import { Tercero } from '../../types/tercero';
import { NuevaObligacionModal } from './NuevaObligacionModal';
import { PagoObligacionModal } from './PagoObligacionModal';
import { 
  CreditCard, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  RefreshCw, 
  Search, 
  Calendar,
  Building2,
  Receipt
} from 'lucide-react';

export const CuentasPorPagarPage: React.FC = () => {
  const [cuentas, setCuentas] = useState<CuentaPorPagar[]>([]);
  const [semaforo, setSemaforo] = useState<SemaforoVencimientos | null>(null);
  const [proveedores, setProveedores] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalNuevaOpen, setModalNuevaOpen] = useState(false);
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaPorPagar | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [cuentasData, semaforoData, provsData] = await Promise.all([
        cuentaPagarService.listarTodas(),
        cuentaPagarService.obtenerSemaforo(),
        terceroService.listarProveedores(),
      ]);
      setCuentas(cuentasData);
      setSemaforo(semaforoData);
      setProveedores(provsData);
    } catch (error) {
      console.error('Error al cargar cuentas por pagar:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearObligacion = async (data: CuentaPorPagarFormData) => {
    await cuentaPagarService.crear(data);
    await cargarDatos();
  };

  const handleRegistrarPago = async (cuentaId: string, data: PagoProveedorFormData) => {
    await cuentaPagarService.registrarPago(cuentaId, data);
    await cargarDatos();
  };

  const cuentasFiltradas = cuentas.filter((c) => {
    const q = searchQuery.toLowerCase();
    const coincideBusqueda = 
      c.concepto.toLowerCase().includes(q) ||
      c.acreedorNombre.toLowerCase().includes(q) ||
      (c.numeroReferencia && c.numeroReferencia.toLowerCase().includes(q));

    if (!coincideBusqueda) return false;

    if (filtroEstado === 'VENCIDAS') return c.colorSemaforo === 'ROJO';
    if (filtroEstado === 'PROXIMAS') return c.colorSemaforo === 'AMARILLO';
    if (filtroEstado === 'AL_DIA') return c.colorSemaforo === 'VERDE';
    if (filtroEstado === 'PAGADAS') return c.estado === 'PAGADA';
    if (filtroEstado === 'PENDIENTES') return c.estado === 'PENDIENTE' || c.estado === 'PAGADA_PARCIAL';

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-w-0 flex-1 overflow-x-hidden">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Cuentas por Pagar & Responsabilidades
              </h1>
              <p className="text-sm text-slate-400">
                Calendario de vencimientos, facturas de proveedores, licencias y membresías
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={cargarDatos}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setModalNuevaOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Obligación</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Semáforo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Rojo: Vencidas */}
        <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Vencidas o Vencen Hoy
            </span>
            <div className="text-2xl font-black text-white">
              {semaforo?.totalVencidas || 0} <span className="text-xs font-normal text-slate-400">obligaciones</span>
            </div>
            <div className="text-xs text-red-300 font-medium">
              Saldo: ${Number(semaforo?.saldoVencido || 0).toLocaleString('es-CO')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-lg">
            🔴
          </div>
        </div>

        {/* Amarillo: Próximas */}
        <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Próximas (1 a 7 días)
            </span>
            <div className="text-2xl font-black text-white">
              {semaforo?.totalProximas || 0} <span className="text-xs font-normal text-slate-400">obligaciones</span>
            </div>
            <div className="text-xs text-amber-300 font-medium">
              Saldo: ${Number(semaforo?.saldoProximo || 0).toLocaleString('es-CO')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
            🟡
          </div>
        </div>

        {/* Verde: Al día */}
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Programadas con más de 7 días
            </span>
            <div className="text-2xl font-black text-white">
              {semaforo?.totalAlDia || 0} <span className="text-xs font-normal text-slate-400">obligaciones</span>
            </div>
            <div className="text-xs text-emerald-300 font-medium">
              Saldo: ${Number(semaforo?.saldoAlDia || 0).toLocaleString('es-CO')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
            🟢
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por concepto, proveedor o referencia..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Botones de Filtro por Semáforo / Estado */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'TODAS', label: 'Todas' },
            { id: 'PENDIENTES', label: 'Pendientes' },
            { id: 'VENCIDAS', label: '🔴 Vencidas' },
            { id: 'PROXIMAS', label: '🟡 Próximas' },
            { id: 'AL_DIA', label: '🟢 Al Día' },
            { id: 'PAGADAS', label: 'Pagadas' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltroEstado(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filtroEstado === f.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vista Móvil (Tarjetas Táctiles) */}
      <div className="grid grid-cols-1 md:hidden gap-3.5">
        {loading ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
            Cargando cuentas por pagar...
          </div>
        ) : cuentasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
            No se encontraron obligaciones para el filtro seleccionado.
          </div>
        ) : (
          cuentasFiltradas.map((c) => (
            <div
              key={c.id}
              className={`p-4 bg-slate-900 border rounded-2xl space-y-3 shadow-lg ${
                c.colorSemaforo === 'ROJO'
                  ? 'border-red-500/40 bg-red-950/10'
                  : c.colorSemaforo === 'AMARILLO'
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    c.colorSemaforo === 'ROJO'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : c.colorSemaforo === 'AMARILLO'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : c.colorSemaforo === 'VERDE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {c.colorSemaforo === 'ROJO' ? '🔴 Vencida' : c.colorSemaforo === 'AMARILLO' ? `🟡 Vence en ${c.diasRestantes}d` : '🟢 Al día'}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">{c.concepto}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    {c.acreedorNombre}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-emerald-400">
                    ${Number(c.saldoPendiente).toLocaleString('es-CO')}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Total: ${Number(c.montoTotal).toLocaleString('es-CO')}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Vence: <strong>{c.fechaVencimiento}</strong></span>
                </div>
                <span className="text-[10px] font-medium text-slate-400">
                  {c.periodicidad}
                </span>
              </div>

              {c.estado !== 'PAGADA' && (
                <button
                  onClick={() => {
                    setCuentaSeleccionada(c);
                    setModalPagoOpen(true);
                  }}
                  className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Registrar Pago</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Vista de Escritorio (Tabla) */}
      <div className="hidden md:block bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">Semáforo</th>
              <th className="py-3.5 px-4">Concepto / Obligación</th>
              <th className="py-3.5 px-4">Acreedor / Proveedor</th>
              <th className="py-3.5 px-4">Vencimiento</th>
              <th className="py-3.5 px-4">Periodicidad</th>
              <th className="py-3.5 px-4 text-right">Saldo Pendiente</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                  Cargando obligaciones...
                </td>
              </tr>
            ) : cuentasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  No hay obligaciones en este estado.
                </td>
              </tr>
            ) : (
              cuentasFiltradas.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      c.colorSemaforo === 'ROJO'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : c.colorSemaforo === 'AMARILLO'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : c.colorSemaforo === 'VERDE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {c.colorSemaforo === 'ROJO' ? '🔴 Vencida' : c.colorSemaforo === 'AMARILLO' ? `🟡 ${c.diasRestantes}d` : '🟢 Al día'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white">
                    <div>{c.concepto}</div>
                    {c.numeroReferencia && (
                      <div className="text-[11px] font-normal text-slate-400">Ref: {c.numeroReferencia}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <div className="font-medium text-slate-200">{c.acreedorNombre}</div>
                    <div className="text-[11px] text-slate-500">{c.acreedorDocumento}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{c.fechaVencimiento}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                      {c.periodicidad}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="font-bold text-emerald-400">
                      ${Number(c.saldoPendiente).toLocaleString('es-CO')}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      de ${Number(c.montoTotal).toLocaleString('es-CO')}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {c.estado !== 'PAGADA' ? (
                      <button
                        onClick={() => {
                          setCuentaSeleccionada(c);
                          setModalPagoOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs transition-colors"
                      >
                        Registrar Pago
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">Pagada</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modales */}
      <NuevaObligacionModal
        isOpen={modalNuevaOpen}
        onClose={() => setModalNuevaOpen(false)}
        onSave={handleCrearObligacion}
        proveedores={proveedores}
      />

      <PagoObligacionModal
        isOpen={modalPagoOpen}
        onClose={() => setModalPagoOpen(false)}
        onSave={handleRegistrarPago}
        cuenta={cuentaSeleccionada}
      />
    </div>
  );
};
