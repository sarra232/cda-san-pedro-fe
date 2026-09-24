import React, { useState } from 'react';
import { Empleado, LiquidacionNominaFormData, NovedadEmpleado } from '../../types/hr';
import { X, Calculator, Calendar, DollarSign, Users, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLiquidar: (data: LiquidacionNominaFormData) => Promise<void>;
  empleadosActivos: Empleado[];
}

export const LiquidacionNominaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onLiquidar,
  empleadosActivos,
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentDay = currentDate.getDate();
  const defaultQuincena = currentDay <= 15 ? 1 : 2;

  const [loading, setLoading] = useState(false);
  const [periodoAnio, setPeriodoAnio] = useState(currentYear);
  const [periodoMes, setPeriodoMes] = useState(currentMonth);
  const [periodoQuincena, setPeriodoQuincena] = useState(defaultQuincena);
  const [observaciones, setObservaciones] = useState('');
  const [novedades, setNovedades] = useState<Record<string, NovedadEmpleado>>({});

  if (!isOpen) return null;

  const handleNovedadChange = (empleadoId: string, field: keyof NovedadEmpleado, value: any) => {
    setNovedades((prev) => ({
      ...prev,
      [empleadoId]: {
        ...(prev[empleadoId] || { empleadoId, diasTrabajados: 15, horasExtras: 0, bonificaciones: 0, otrasDeducciones: 0 }),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const novedadesList: NovedadEmpleado[] = Object.values(novedades);
      await onLiquidar({
        periodoAnio,
        periodoMes,
        periodoQuincena,
        observaciones,
        novedades: novedadesList,
      });
      onClose();
    } catch (error) {
      console.error('Error al liquidar nómina:', error);
    } finally {
      setLoading(false);
    }
  };

  const meses = [
    { num: 1, nombre: 'Enero' },
    { num: 2, nombre: 'Febrero' },
    { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' },
    { num: 5, nombre: 'Mayo' },
    { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' },
    { num: 8, nombre: 'Agosto' },
    { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' },
    { num: 11, nombre: 'Noviembre' },
    { num: 12, nombre: 'Diciembre' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Liquidar Periodo de Nómina Oficial
              </h2>
              <p className="text-xs text-slate-400">
                Cálculo automático de devengados, auxilio transporte, salud 4%, pensión 4%, ARL y provisiones de ley
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Parámetros del Periodo */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Periodo a Liquidar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Año</label>
                <input
                  type="number"
                  required
                  value={periodoAnio}
                  onChange={(e) => setPeriodoAnio(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mes</label>
                <select
                  value={periodoMes}
                  onChange={(e) => setPeriodoMes(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-bold"
                >
                  {meses.map((m) => (
                    <option key={m.num} value={m.num}>
                      {m.nombre} (Mes {m.num})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Quincena / Periodo</label>
                <select
                  value={periodoQuincena}
                  onChange={(e) => setPeriodoQuincena(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-bold text-amber-400"
                >
                  <option value={1}>1ra Quincena (Días 1 al 15)</option>
                  <option value={2}>2da Quincena (Días 16 al fin de mes)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Plantilla y Novedades por Empleado */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Novedades por Colaborador ({empleadosActivos.length} activos)
              </h3>
              <span className="text-[11px] text-slate-400">
                (Por defecto se toman 15 días base de la quincena)
              </span>
            </div>

            {empleadosActivos.length === 0 ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                No hay empleados activos en el sistema. Registre al menos un colaborador antes de liquidar.
              </div>
            ) : (
              <div className="space-y-3">
                {empleadosActivos.map((emp) => {
                  const nov = novedades[emp.id] || {
                    diasTrabajados: 15,
                    horasExtras: 0,
                    bonificaciones: 0,
                    otrasDeducciones: 0,
                  };

                  return (
                    <div
                      key={emp.id}
                      className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="min-w-[200px]">
                        <p className="text-sm font-bold text-white uppercase">{emp.nombresApellidos}</p>
                        <p className="text-xs text-slate-400">
                          {emp.cargo} • Base: ${Number(emp.salarioBase).toLocaleString('es-CO')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Días Trab.</label>
                          <input
                            type="number"
                            min="0"
                            max="15"
                            value={nov.diasTrabajados ?? 15}
                            onChange={(e) =>
                              handleNovedadChange(emp.id, 'diasTrabajados', Number(e.target.value))
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-center"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">H. Extras ($)</label>
                          <input
                            type="number"
                            min="0"
                            step="5000"
                            value={nov.horasExtras ?? 0}
                            onChange={(e) =>
                              handleNovedadChange(emp.id, 'horasExtras', Number(e.target.value))
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-right"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Bonificación ($)</label>
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            value={nov.bonificaciones ?? 0}
                            onChange={(e) =>
                              handleNovedadChange(emp.id, 'bonificaciones', Number(e.target.value))
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-right text-emerald-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Otras Deduc. ($)</label>
                          <input
                            type="number"
                            min="0"
                            step="5000"
                            value={nov.otrasDeducciones ?? 0}
                            onChange={(e) =>
                              handleNovedadChange(emp.id, 'otrasDeducciones', Number(e.target.value))
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-right text-rose-400"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Observaciones generales */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observaciones de la Liquidación
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Liquidación ordinaria quincenal CDA San Pedro con recargos dominicales"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || empleadosActivos.length === 0}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              {loading ? 'Calculando Nómina...' : 'Ejecutar Liquidación Automática'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
