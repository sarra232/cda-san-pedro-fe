import React, { useState, useEffect } from 'react';
import { cuentaPagarService } from '../../services/cuentaPagarService';
import { SemaforoVencimientos } from '../../types/cuentapagar';
import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard, Building2 } from 'lucide-react';

export const VencimientosWidget: React.FC = () => {
  const [semaforo, setSemaforo] = useState<SemaforoVencimientos | null>(null);

  const cargarSemaforo = async () => {
    try {
      const data = await cuentaPagarService.obtenerSemaforo();
      setSemaforo(data);
    } catch {
      // Si aún no responde
    }
  };

  useEffect(() => {
    cargarSemaforo();
  }, []);

  const totalUrgentes = (semaforo?.totalVencidas || 0) + (semaforo?.totalProximas || 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Responsabilidades & Pagos Próximos
              {totalUrgentes > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  {totalUrgentes} por atender
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Semáforo de cuentas por pagar, facturas de proveedores y membresías
            </p>
          </div>
        </div>

        <Link
          to="/cuentas-por-pagar"
          className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
        >
          <span>Ver Todas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Mini Semáforo Clicable */}
      <div className="grid grid-cols-3 gap-2.5">
        <Link
          to="/cuentas-por-pagar"
          className="p-3 bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 hover:border-red-500/60 rounded-2xl text-center transition-all cursor-pointer group shadow-sm hover:scale-[1.02]"
          title="Ver cuentas vencidas en rojo"
        >
          <div className="text-xs text-red-400 font-bold flex items-center justify-center gap-1 group-hover:text-red-300">
            <span>🔴</span> Vencidas
          </div>
          <div className="text-lg font-black text-white mt-0.5">
            {semaforo?.totalVencidas || 0}
          </div>
          <div className="text-[10px] text-red-300 font-medium truncate">
            ${Number(semaforo?.saldoVencido || 0).toLocaleString('es-CO')}
          </div>
        </Link>

        <Link
          to="/cuentas-por-pagar"
          className="p-3 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl text-center transition-all cursor-pointer group shadow-sm hover:scale-[1.02]"
          title="Ver cuentas próximas a vencer en amarillo"
        >
          <div className="text-xs text-amber-400 font-bold flex items-center justify-center gap-1 group-hover:text-amber-300">
            <span>🟡</span> Próximas
          </div>
          <div className="text-lg font-black text-white mt-0.5">
            {semaforo?.totalProximas || 0}
          </div>
          <div className="text-[10px] text-amber-300 font-medium truncate">
            ${Number(semaforo?.saldoProximo || 0).toLocaleString('es-CO')}
          </div>
        </Link>

        <Link
          to="/cuentas-por-pagar"
          className="p-3 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl text-center transition-all cursor-pointer group shadow-sm hover:scale-[1.02]"
          title="Ver cuentas al día en verde"
        >
          <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1 group-hover:text-emerald-300">
            <span>🟢</span> Al Día
          </div>
          <div className="text-lg font-black text-white mt-0.5">
            {semaforo?.totalAlDia || 0}
          </div>
          <div className="text-[10px] text-emerald-300 font-medium truncate">
            ${Number(semaforo?.saldoAlDia || 0).toLocaleString('es-CO')}
          </div>
        </Link>
      </div>

      {/* Lista de Cuentas Urgentes */}
      {semaforo?.cuentasUrgentes && semaforo.cuentasUrgentes.length > 0 ? (
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Compromisos con Vencimiento Inminente:
          </span>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {semaforo.cuentasUrgentes.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <div className="font-bold text-white truncate">{c.concepto}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    <span className="truncate">{c.acreedorNombre}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-emerald-400">
                    ${Number(c.saldoPendiente).toLocaleString('es-CO')}
                  </div>
                  <div className={`text-[10px] font-bold ${
                    c.colorSemaforo === 'ROJO' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {c.colorSemaforo === 'ROJO' ? '¡Vencida!' : `Vence en ${c.diasRestantes}d`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
