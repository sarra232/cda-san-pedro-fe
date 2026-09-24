import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Bike, 
  Car, 
  Truck, 
  Bus, 
  DollarSign, 
  Calendar, 
  PlusCircle, 
  Receipt, 
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  RefreshCw,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { reporteService, DashboardStats } from '../../services/reporteService';
import { cuentaPagarService } from '../../services/cuentaPagarService';
import { SemaforoVencimientos } from '../../types/cuentapagar';
import { formatCOP } from '../../utils/formatters';
import { VencimientosWidget } from './VencimientosWidget';

export function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'ADMINISTRADOR';
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    recaudoHoy: 0,
    vehiculosAtendidosHoy: 0,
    facturasEmitidasHoy: 0,
    alertasVencimiento: 0,
    totalMotos: 0,
    totalLivianos: 0,
    totalPesados: 0,
    totalPublicos: 0,
    actividadPorHoras: [
      { name: '08:00', vehiculos: 0, ingresos: 0 },
      { name: '09:00', vehiculos: 0, ingresos: 0 },
      { name: '10:00', vehiculos: 0, ingresos: 0 },
      { name: '11:00', vehiculos: 0, ingresos: 0 },
      { name: '12:00', vehiculos: 0, ingresos: 0 },
      { name: '13:00', vehiculos: 0, ingresos: 0 },
      { name: '14:00', vehiculos: 0, ingresos: 0 },
      { name: '15:00', vehiculos: 0, ingresos: 0 },
      { name: '16:00', vehiculos: 0, ingresos: 0 },
      { name: '17:00', vehiculos: 0, ingresos: 0 },
    ],
  });

  const [semaforo, setSemaforo] = useState<SemaforoVencimientos | null>(null);

  const loadStats = useCallback(async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const data = await reporteService.getDashboardStats();
      if (data) setStats(data);
    } catch {
      // Usar estado previo si falla la conexión
    }

    if (isAdmin) {
      try {
        const sem = await cuentaPagarService.obtenerSemaforo();
        if (sem) setSemaforo(sem);
      } catch {
        // Ignorar si no carga semáforo
      }
    }
    if (showLoading) {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadStats();

    // Actualización periódica en vivo cada 15 segundos
    const interval = setInterval(() => {
      loadStats(false);
    }, 15000);

    // Actualización inmediata cuando el usuario vuelve a enfocar la pestaña
    const onFocus = () => loadStats(false);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadStats]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-cda-dark-900 via-cda-dark-850 to-cda-dark-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-cda-yellow-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] sm:text-xs font-bold text-cda-yellow-400 uppercase tracking-wider bg-cda-yellow-400/10 px-2.5 py-0.5 rounded-full border border-cda-yellow-400/20">
              {isAdmin ? 'Panel Gerencial' : 'Ventanilla de Recepción'}
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">|</span>
            <span className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cda-yellow-400" />
              {new Date().toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            ¡Hola, {user?.nombresApellidos}!
          </h1>
          <p className="text-xs text-slate-400">
            {isAdmin 
              ? 'Supervisión en tiempo real de operaciones, ingresos y vehículos atendidos.' 
              : 'Bienvenido al sistema de recepción y facturación del CDA San Pedro.'}
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => loadStats(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 hover:text-white border border-cda-dark-700 hover:border-cda-yellow-500/30 transition-all flex items-center justify-center gap-1.5 text-xs"
            title="Actualizar datos en vivo"
          >
            <RefreshCw className={`w-4 h-4 text-cda-yellow-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <Link
            to="/recepcion"
            className="flex-1 sm:flex-none bg-gradient-to-r from-cda-yellow-500 to-amber-500 hover:from-cda-yellow-400 hover:to-amber-400 text-black font-extrabold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-cda-yellow-500/20 transition-all flex items-center justify-center gap-2 text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo Ingreso</span>
          </Link>
          {isAdmin && (
            <Link
              to="/reportes"
              className="bg-cda-dark-800 hover:bg-cda-dark-700 text-white font-semibold px-3.5 py-2.5 rounded-xl border border-cda-dark-700 hover:border-cda-yellow-500/30 transition-all flex items-center justify-center gap-1.5 text-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-cda-yellow-400" />
              <span className="hidden sm:inline">Reportes</span>
            </Link>
          )}
        </div>
      </div>

      {/* Alerta de Cuentas por Pagar en Rojo (Solo Administradores) */}
      {isAdmin && semaforo && semaforo.totalVencidas > 0 && (
        <Link
          to="/cuentas-por-pagar"
          className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-rose-950/60 via-red-900/40 to-rose-950/60 border border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rose-400 hover:shadow-xl hover:shadow-rose-950/50 transition-all cursor-pointer group animate-fade-in"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center font-bold text-xl shrink-0 animate-pulse">
              🔴
            </div>
            <div>
              <div className="text-sm font-black text-white group-hover:text-rose-300 transition-colors flex items-center gap-2 flex-wrap">
                <span>¡Atención! {semaforo.totalVencidas} Cuenta{semaforo.totalVencidas > 1 ? 's' : ''} por Pagar en Rojo</span>
                <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Vencida{semaforo.totalVencidas > 1 ? 's' : ''} / Hoy
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Saldo total vencido: <strong className="font-mono text-white">${Number(semaforo.saldoVencido).toLocaleString('es-CO')} COP</strong>. Haz clic para revisar compromisos y registrar desembolsos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 group-hover:text-rose-300 self-end sm:self-auto shrink-0 group-hover:translate-x-1 transition-transform">
            <span>Gestionar Cuentas por Pagar</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      )}

      {/* Panel Ejecutivo de Ganancia Real CDA (Exclusivo Administradores) */}
      {isAdmin && (
        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-950/40 via-cda-dark-850 to-amber-950/30 border border-cda-yellow-500/40 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-cda-yellow-400 text-slate-950 px-3.5 py-1.5 rounded-xl shadow-md whitespace-nowrap shrink-0">
                  <Briefcase className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>Métrica Financiera Real</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-cda-yellow-400 font-bold bg-cda-yellow-400/10 px-3 py-1.5 rounded-xl border border-cda-yellow-400/20 whitespace-nowrap shrink-0">
                  <span className="w-2 h-2 rounded-full bg-cda-yellow-400"></span>
                  <span>Liquidación Neta del Día</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-300 font-medium block">¿Cuánto ganó en sí el CDA hoy?</span>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cda-yellow-400 via-amber-300 to-yellow-200">
                    {formatCOP(stats.gananciaNetaCdaHoy || 0)}
                  </h2>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    {stats.margenCdaPorcentajeHoy || 0}% de Margen Neto
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                Ingreso neto propio generado tras descontar automáticamente tasas de terceros (RUNT, SICOV, ANSV, Operador) e IVA 19%.
              </p>
            </div>

            {/* Micro desglose financiero */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-cda-dark-900/80 p-3 sm:p-4 rounded-2xl border border-cda-dark-700/80 shrink-0">
              <div className="text-center px-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Recaudo Bruto</span>
                <span className="text-xs sm:text-sm font-extrabold text-white">{formatCOP(stats.recaudoHoy)}</span>
              </div>
              <div className="text-center px-2 border-x border-cda-dark-700">
                <span className="text-[10px] text-rose-400 uppercase font-bold block">Terceros (RUNT/SICOV)</span>
                <span className="text-xs sm:text-sm font-extrabold text-rose-300">{formatCOP(stats.totalTercerosHoy || 0)}</span>
              </div>
              <div className="text-center px-2">
                <span className="text-[10px] text-blue-400 uppercase font-bold block">IVA Fiscal</span>
                <span className="text-xs sm:text-sm font-extrabold text-blue-300">{formatCOP(stats.totalIvaHoy || 0)}</span>
              </div>
            </div>

            <Link
              to="/reportes"
              className="self-start lg:self-center bg-gradient-to-r from-cda-yellow-500 to-amber-500 hover:from-cda-yellow-400 hover:to-amber-400 text-black font-black px-4 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cda-yellow-500/20 transition-all shrink-0"
            >
              <span>Ver Liquidación Detallada</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Recaudo Hoy */}
        <div className="cda-glass rounded-2xl p-4 sm:p-5 border border-cda-dark-700/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Recaudo del Día (Total Caja)</span>
            <div className="p-2 rounded-xl bg-cda-yellow-500/10 text-cda-yellow-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{formatCOP(stats.recaudoHoy)}</h3>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Flujo activo de facturación</span>
            </p>
          </div>
        </div>

        {/* Vehículos Recibidos Hoy */}
        <Link 
          to="/pista?filtro=ABIERTOS" 
          className="cda-glass rounded-2xl p-4 sm:p-5 border border-cda-dark-700/80 hover:border-cda-yellow-500/50 hover:shadow-lg hover:shadow-cda-yellow-500/10 transition-all relative overflow-hidden group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">Vehículos Atendidos Hoy</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-cda-yellow-500/20 group-hover:text-cda-yellow-400 transition-colors">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-black text-white">{stats.vehiculosAtendidosHoy}</h3>
              <span className="text-[10px] font-bold text-cda-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                <span>Ver en pista</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Haz clic para ver vehículos con proceso abierto
            </p>
          </div>
        </Link>

        {/* Facturas Emitidas */}
        <div className="cda-glass rounded-2xl p-4 sm:p-5 border border-cda-dark-700/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Facturas Emitidas</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{stats.facturasEmitidasHoy}</h3>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <span>100% con comprobante PDF</span>
            </p>
          </div>
        </div>

        {/* Alertas SOAT / RTM */}
        <div className="cda-glass rounded-2xl p-4 sm:p-5 border border-cda-dark-700/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Alertas SOAT / RTM</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{stats.alertasVencimiento}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Vencidos o próximos a vencer
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Category Breakdown Cards with Icons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span>Afluencia por Categoría Vehicular</span>
            <span className="text-[10px] font-semibold text-cda-yellow-400 bg-cda-yellow-400/10 px-2 py-0.5 rounded-full border border-cda-yellow-400/20">
              Hoy
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Motos */}
          <div className="cda-glass rounded-2xl p-4 sm:p-5 border border-cda-dark-700/80 hover:border-cda-yellow-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Motos</span>
              <div className="p-2 rounded-xl bg-cda-yellow-500/10 text-cda-yellow-400">
                <Bike className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalMotos}</span>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Categoría A1 / A2</p>
            </div>
          </div>

          {/* Livianos */}
          <div className="cda-glass rounded-2xl p-4 sm:p-5 border border-cda-dark-700/80 hover:border-blue-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Livianos</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Car className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalLivianos}</span>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Automóvil / Campero</p>
            </div>
          </div>

          {/* Pesados */}
          <div className="cda-glass rounded-2xl p-4 sm:p-5 border border-cda-dark-700/80 hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pesados</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalPesados}</span>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Carga / Camiones</p>
            </div>
          </div>

          {/* Públicos */}
          <div className="cda-glass rounded-2xl p-4 sm:p-5 border border-cda-dark-700/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Público</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Bus className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalPublicos}</span>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Taxi / Esp.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section (Visual Dashboard) */}
      <div className="cda-glass rounded-2xl p-4 sm:p-6 border border-cda-dark-700/80">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white">Actividad de Atención por Horas (8:00 AM - 5:00 PM)</h2>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                En vivo
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Registro horario de vehículos inspeccionados hoy ({stats.vehiculosAtendidosHoy} en total)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadStats(true)}
              className="text-[11px] text-slate-400 hover:text-cda-yellow-400 flex items-center gap-1 transition-colors"
              title="Refrescar gráfico"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cda-yellow-400' : ''}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>
            {isAdmin && (
              <Link
                to="/reportes"
                className="text-[11px] sm:text-xs font-semibold text-cda-yellow-400 hover:text-cda-yellow-300 flex items-center gap-1"
              >
                <span>Ver reporte completo</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        <div className="h-60 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.actividadPorHoras} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as { name: string; vehiculos: number; ingresos: number };
                    return (
                      <div className="bg-cda-dark-900/95 border border-cda-dark-700 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1 min-w-[150px]">
                        <p className="font-black text-white text-sm border-b border-cda-dark-800 pb-1 flex items-center justify-between">
                          <span>Hora {label}</span>
                          <span className="text-[10px] text-slate-400 font-normal">Hoy</span>
                        </p>
                        <div className="flex items-center justify-between gap-3 text-slate-200 pt-1">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Car className="w-3 h-3 text-cda-yellow-400" />
                            <span>Vehículos:</span>
                          </span>
                          <span className="font-mono font-bold text-white">{d.vehiculos}</span>
                        </div>
                        {d.ingresos > 0 && (
                          <div className="flex items-center justify-between gap-3 text-slate-200">
                            <span className="flex items-center gap-1 text-emerald-400">
                              <DollarSign className="w-3 h-3" />
                              <span>Recaudo:</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-400">{formatCOP(d.ingresos)}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="vehiculos" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Vehículos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Widget de Responsabilidades & Cuentas por Pagar para Administradores */}
      {isAdmin && <VencimientosWidget />}
    </div>
  );
}
