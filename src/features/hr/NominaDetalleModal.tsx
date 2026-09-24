import React, { useState } from 'react';
import { Nomina } from '../../types/hr';
import { X, CheckCircle2, FileText, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  nomina: Nomina | null;
  onAprobar: (id: string) => Promise<void>;
}

export const NominaDetalleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  nomina,
  onAprobar,
}) => {
  const [aprobando, setAprobando] = useState(false);

  if (!isOpen || !nomina) return null;

  const handleAprobar = async () => {
    try {
      setAprobando(true);
      await onAprobar(nomina.id);
      onClose();
    } catch (error) {
      console.error('Error al aprobar nómina:', error);
    } finally {
      setAprobando(false);
    }
  };

  const formatearCOP = (valor: number | undefined) => {
    return '$' + (Number(valor) || 0).toLocaleString('es-CO');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl my-8">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Desglose de Nómina Oficial: {nomina.periodoDescripcion}
                </h2>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                    nomina.estado === 'APROBADA' || nomina.estado === 'PAGADA'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {nomina.estado}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Periodo: {nomina.fechaInicio} al {nomina.fechaFin} • {nomina.detalles?.length || 0} Colaboradores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen Financiero Consolidado */}
        <div className="p-6 bg-slate-950/40 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Devengado</p>
            <p className="text-lg font-bold text-white mt-0.5">{formatearCOP(nomina.totalDevengado)}</p>
            <p className="text-[10px] text-slate-500 mt-1">Sueldos + Aux. Transp.</p>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Deducciones</p>
            <p className="text-lg font-bold text-rose-400 mt-0.5">-{formatearCOP(nomina.totalDeducciones)}</p>
            <p className="text-[10px] text-slate-500 mt-1">Salud 4% + Pensión 4%</p>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-[11px] font-semibold text-amber-300 uppercase">Neto a Dispersar</p>
            <p className="text-lg font-extrabold text-amber-400 mt-0.5">{formatearCOP(nomina.totalNeto)}</p>
            <p className="text-[10px] text-amber-300/70 mt-1">Pago real colaboradores</p>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Costos Patronales</p>
            <p className="text-lg font-bold text-slate-300 mt-0.5">
              {formatearCOP(Number(nomina.totalAportesPatronales || 0) + Number(nomina.totalProvisiones || 0))}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">ARL, Caja, Prima, Cesantías</p>
          </div>
        </div>

        {/* Tabla de Colillas por Colaborador */}
        <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
            Desglose Individual por Colaborador
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase font-semibold">
                  <th className="py-2.5 px-3">Colaborador / Cargo</th>
                  <th className="py-2.5 px-3">Días</th>
                  <th className="py-2.5 px-3">Sueldo Base</th>
                  <th className="py-2.5 px-3">Aux. Transp.</th>
                  <th className="py-2.5 px-3">Extras/Bonif.</th>
                  <th className="py-2.5 px-3 text-emerald-400">Total Devengado</th>
                  <th className="py-2.5 px-3 text-rose-400">Deduc. (Salud/Pens)</th>
                  <th className="py-2.5 px-3 text-amber-400 font-bold">Neto a Pagar</th>
                  <th className="py-2.5 px-3">Dispersión Bancaria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {nomina.detalles?.map((det) => (
                  <tr key={det.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-white uppercase">{det.empleadoNombre}</p>
                      <p className="text-[10px] text-slate-400">{det.empleadoCargo} • CC {det.empleadoDocumento}</p>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-center">{det.diasTrabajados}</td>
                    <td className="py-2.5 px-3 font-mono">{formatearCOP(det.sueldoDevengado)}</td>
                    <td className="py-2.5 px-3 font-mono">{formatearCOP(det.auxilioTransporte)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {formatearCOP(Number(det.horasExtras || 0) + Number(det.bonificaciones || 0))}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                      {formatearCOP(det.totalDevengado)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-rose-400">
                      -{formatearCOP(det.totalDeducciones)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-extrabold text-amber-400 text-sm">
                      {formatearCOP(det.netoPagar)}
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-slate-400">
                      {det.banco ? `${det.banco} (${det.numeroCuenta})` : 'Efectivo / Por definir'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie y Acciones */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              {nomina.estado === 'APROBADA'
                ? 'Nómina aprobada e integrada a Cuentas por Pagar (Tesorería)'
                : 'Al aprobar la nómina, se generará la obligación de pago en Tesorería'}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cerrar
            </button>

            {nomina.estado === 'BORRADOR' && (
              <button
                onClick={handleAprobar}
                disabled={aprobando}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {aprobando ? 'Aprobando e Integrando...' : 'Aprobar Nómina y Pasar a Tesorería'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
