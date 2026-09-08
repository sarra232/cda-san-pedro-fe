import { useState, useEffect } from 'react';
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
  FileSpreadsheet
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
      { name: '10:00', vehiculos: 0, ingresos: 0 },
      { name: '12:00', vehiculos: 0, ingresos: 0 },
      { name: '14:00', vehiculos: 0, ingresos: 0 },
      { name: '16:00', vehiculos: 0, ingresos: 0 },
      { name: '18:00', vehiculos: 0, ingresos: 0 },
    ],
  });

  const [semaforo, setSemaforo] = useState<SemaforoVencimientos | null>(null);

  const loadStats = async () => {
    try {
      const data = await reporteService.getDashboardStats();
      if (data) setStats(data);
    } catch {
      // Usar estado por defecto si aún no hay conexión
    }

    if (isAdmin) {
      try {
        const sem = await cuentaPagarService.obtenerSemaforo();
        if (sem) setSemaforo(sem);
      } catch {
        // Ignorar si no carga semáforo
      }
    }
  };

  useEffect(() => {
    loadStats();
  }, [isAdmin]);

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
        <div className="flex items-center gap-2 sm:gap-3">
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Recaudo Hoy */}
        <div className="cda-glass rounded-2xl p-4 sm:p-5 border border-cda-dark-700/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Recaudo del Día</span>
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
        <div className="cda-glass rounded-2xl p-4 sm:p-5 border border-cda-dark-700/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Vehículos Atendidos Hoy</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{stats.vehiculosAtendidosHoy}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Vehículos en pista hoy
            </p>
          </div>
        </div>

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">Actividad de Atención por Horas</h2>
            <p className="text-[11px] sm:text-xs text-slate-400">Registro de vehículos inspeccionados hoy</p>
          </div>
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

        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.actividadPorHoras}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#111827', 
                  borderColor: '#374151',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#fff'
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
