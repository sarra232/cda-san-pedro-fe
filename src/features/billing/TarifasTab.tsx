import React, { useState } from 'react';
import { Tarifa } from '../../types/tarifa';
import { tarifaService } from '../../services/tarifaService';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Tag, 
  Car, 
  Bike, 
  Truck, 
  Bus, 
  Edit3, 
  Lock, 
  CheckCircle2, 
  X, 
  Loader2
} from 'lucide-react';

interface TarifasTabProps {
  tarifas: Tarifa[];
  onTarifasUpdated: () => Promise<void>;
}

export const TarifasTab: React.FC<TarifasTabProps> = ({ tarifas, onTarifasUpdated }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'ADMINISTRADOR';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTarifa, setEditingTarifa] = useState<Tarifa | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [valorServicio, setValorServicio] = useState<number | ''>('');
  const [iva, setIva] = useState<number | ''>('');
  const [runt, setRunt] = useState<number | ''>('');
  const [sicov, setSicov] = useState<number | ''>('');
  const [operador, setOperador] = useState<number | ''>('');
  const [seguridadVial, setSeguridadVial] = useState<number | ''>('');
  const [fupa, setFupa] = useState<number | ''>('');
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  const totalCalculado = 
    (Number(valorServicio) || 0) +
    (Number(iva) || 0) +
    (Number(runt) || 0) +
    (Number(sicov) || 0) +
    (Number(operador) || 0) +
    (Number(seguridadVial) || 0) +
    (Number(fupa) || 0);

  const handleOpenEdit = (t: Tarifa) => {
    setEditingTarifa(t);
    setNombre(t.nombreServicio);
    setDescripcion(t.descripcion || '');
    setValorServicio(t.valorServicio || Math.round(t.precio / 1.19));
    setIva(t.iva || (t.precio - Math.round(t.precio / 1.19)));
    setRunt(t.runt || 0);
    setSicov(t.sicov || 0);
    setOperador(t.operador || 0);
    setSeguridadVial(t.seguridadVial || 0);
    setFupa(t.fupa || 0);
    setActivo(t.activo);
    setModalOpen(true);
  };

  const handleAutoCalcIva = (valServ: number) => {
    setValorServicio(valServ);
    const ivaCalc = Math.round(valServ * 0.19);
    setIva(ivaCalc);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarifa || totalCalculado < 0) return;

    try {
      setSaving(true);
      await tarifaService.updateTarifa(editingTarifa.id, {
        nombreServicio: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        valorServicio: Number(valorServicio) || 0,
        iva: Number(iva) || 0,
        runt: Number(runt) || 0,
        sicov: Number(sicov) || 0,
        operador: Number(operador) || 0,
        seguridadVial: Number(seguridadVial) || 0,
        fupa: Number(fupa) || 0,
        precio: totalCalculado,
        activo,
      });
      setModalOpen(false);
      await onTarifasUpdated();
    } catch {
      alert('Error al guardar tarifa');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'MOTO': return <Bike className="w-6 h-6 text-amber-400" />;
      case 'PESADO': return <Truck className="w-6 h-6 text-rose-400" />;
      case 'PUBLICO': return <Bus className="w-6 h-6 text-purple-400" />;
      default: return <Car className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Informativo */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            <span>Lista Oficial de Tarifas Reguladas CDA San Pedro</span>
          </h3>
          <p className="text-xs text-slate-400">
            Desglose reglamentario de 7 rubros: Servicio Base, IVA, RUNT, SICOV, Operador, Seguridad Vial y FUPA.
          </p>
        </div>

        {isAdmin ? (
          <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <span>✓ Edición Habilitada (Administrador)</span>
          </span>
        ) : (
          <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5" />
            <span>Modo Consulta</span>
          </span>
        )}
      </div>

      {/* Grid de Tarifas Desglosadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tarifas.map((t) => {
          const valServ = t.valorServicio || Math.round(t.precio / 1.19);
          const valIva = t.iva || (t.precio - valServ);
          const valRunt = t.runt || 0;
          const valSicov = t.sicov || 0;
          const valOp = t.operador || 0;
          const valSegVial = t.seguridadVial || 0;
          const valFupa = t.fupa || 0;

          return (
            <div
              key={t.id}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    {getCategoryIcon(t.categoria)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                      {t.categoria} • {t.codigo || 'RTM'}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">{t.nombreServicio}</h4>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors"
                    title="Editar Tarifa Desglosada"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Desglose Ticket RTM */}
              <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800/80 space-y-2 text-xs font-mono">
                <div className="text-[10px] uppercase font-bold text-amber-400/90 pb-1 border-b border-slate-800/80 tracking-wider">
                  Desglose Oficial Tarifa:
                </div>

                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Servicio CDA:</span>
                    <span>${valServ.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">IVA (19%):</span>
                    <span>${valIva.toLocaleString('es-CO')}</span>
                  </div>
                  {valRunt > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">RUNT:</span>
                      <span>${valRunt.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {valSicov > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">SICOV:</span>
                      <span>${valSicov.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {valOp > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Operador:</span>
                      <span>${valOp.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {valSegVial > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Seguridad Vial:</span>
                      <span>${valSegVial.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {valFupa > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">FUPA / Certificado:</span>
                      <span>${valFupa.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                  <span>Total Tarifa:</span>
                  <span className="text-amber-400 font-black">${t.precio.toLocaleString('es-CO')} COP</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Edición de Tarifa Desglosada */}
      {modalOpen && editingTarifa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Editar Desglose de Tarifa Oficial</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nombre del Servicio</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">1. Servicio CDA (Base $)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={valorServicio}
                    onChange={(e) => handleAutoCalcIva(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="281508"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">2. IVA (19% s/Servicio $)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={iva}
                    onChange={(e) => setIva(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="53487"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">3. RUNT ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={runt}
                    onChange={(e) => setRunt(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="5500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">4. SICOV ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={sicov}
                    onChange={(e) => setSicov(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="35492"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">5. Operador / Recaudo ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={operador}
                    onChange={(e) => setOperador(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="10329"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">6. Seguridad Vial (ANSV $)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={seguridadVial}
                    onChange={(e) => setSeguridadVial(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">7. FUPA / Certificado ($)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={fupa}
                  onChange={(e) => setFupa(e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                  placeholder="0"
                />
              </div>

              {/* Total Calculado en Vivo */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">Total Tarifa Regulada (Suma):</span>
                  <span className="text-xs text-slate-400">Servicio + IVA + RUNT + SICOV + Operador + ANSV + FUPA</span>
                </div>
                <span className="text-lg font-black font-mono text-amber-400">
                  ${totalCalculado.toLocaleString('es-CO')} COP
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tarifaActivo"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                />
                <label htmlFor="tarifaActivo" className="text-slate-300 font-medium">Tarifa Activa para Liquidación en Caja</label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Guardar Tarifa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
