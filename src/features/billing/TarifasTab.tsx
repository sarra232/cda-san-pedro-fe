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
  const [precio, setPrecio] = useState<number | ''>('');
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleOpenEdit = (t: Tarifa) => {
    setEditingTarifa(t);
    setNombre(t.nombreServicio);
    setDescripcion(t.descripcion || '');
    setPrecio(t.precio);
    setActivo(t.activo);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarifa || precio === '' || Number(precio) < 0) return;

    try {
      setSaving(true);
      await tarifaService.updateTarifa(editingTarifa.id, {
        nombreServicio: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        precio: Number(precio),
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
            Precios base aplicados a las liquidaciones según la categoría vehicular (NTC 5375).
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

      {/* Grid de Tarifas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tarifas.map((t) => {
          const sub = Math.round(t.precio / 1.19);
          const iv = t.precio - sub;

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
                      {t.categoria}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">{t.nombreServicio}</h4>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors"
                    title="Editar Tarifa"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Base Gravable (Subtotal):</span>
                  <span className="font-mono text-slate-300">${sub.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>IVA (19%):</span>
                  <span className="font-mono text-slate-300">${iv.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm pt-1.5 border-t border-slate-800">
                  <span>Total Regulado:</span>
                  <span className="font-mono text-amber-400 font-black">${t.precio.toLocaleString('es-CO')} COP</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Edición de Tarifa */}
      {modalOpen && editingTarifa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Editar Tarifa Oficial</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
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

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Precio Total ($ COP con IVA)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm text-amber-400 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="tarifaActivo"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                />
                <label htmlFor="tarifaActivo" className="text-slate-300 font-medium">Tarifa Activa para Liquidación</label>
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
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
