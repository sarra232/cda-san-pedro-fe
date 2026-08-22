import React, { useState, useEffect } from 'react';
import { X, Car, Loader2, AlertCircle, Calendar, User, Plus } from 'lucide-react';
import { Vehiculo, VehiculoFormData, CategoriaVehiculo } from '../../types/vehiculo';
import { Cliente } from '../../types/cliente';
import { vehiculoService } from '../../services/vehiculoService';
import { clienteService } from '../../services/clienteService';
import { ClienteModal } from './ClienteModal';

import { handlePlacaInput, cleanPlaca, sanitizeDate } from '../../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vehiculo: Vehiculo) => void;
  initialPlaca?: string;
  initialData?: Partial<VehiculoFormData>;
}

export function VehiculoModal({ isOpen, onClose, onSuccess, initialPlaca, initialData }: Props) {
  const [formData, setFormData] = useState<VehiculoFormData>({
    placa: initialData?.placa ? handlePlacaInput(initialData.placa) : initialPlaca ? handlePlacaInput(initialPlaca) : '',
    categoria: initialData?.categoria || 'LIVIANO',
    marca: initialData?.marca || '',
    linea: initialData?.linea || '',
    modelo: initialData?.modelo || new Date().getFullYear(),
    chasisVin: initialData?.chasisVin || '',
    fechaVencimientoSoat: initialData?.fechaVencimientoSoat || '',
    fechaVencimientoRtm: initialData?.fechaVencimientoRtm || '',
    propietarioId: initialData?.propietarioId || '',
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        placa: initialData?.placa ? handlePlacaInput(initialData.placa) : initialPlaca ? handlePlacaInput(initialPlaca) : '',
        categoria: initialData?.categoria || 'LIVIANO',
        marca: initialData?.marca || '',
        linea: initialData?.linea || '',
        modelo: initialData?.modelo || new Date().getFullYear(),
        chasisVin: initialData?.chasisVin || '',
        fechaVencimientoSoat: initialData?.fechaVencimientoSoat || '',
        fechaVencimientoRtm: initialData?.fechaVencimientoRtm || '',
        propietarioId: initialData?.propietarioId || '',
      });
      setError(null);
      clienteService.getClientes().then(setClientes).catch(() => {});
    }
  }, [isOpen, initialPlaca, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload: VehiculoFormData = {
        ...formData,
        placa: cleanPlaca(formData.placa),
        fechaVencimientoSoat: sanitizeDate(formData.fechaVencimientoSoat),
        fechaVencimientoRtm: sanitizeDate(formData.fechaVencimientoRtm),
      };
      const saved = await vehiculoService.saveVehiculo(payload);
      setIsLoading(false);
      onSuccess(saved);
      onClose();
    } catch (err: unknown) {
      let msg = 'Error al registrar vehículo';
      if (err && typeof err === 'object' && 'response' in err) {
        const resData = (err as { response: { data?: { message?: string } } }).response?.data;
        if (resData?.message) msg = resData.message;
      }
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleClienteCreated = (newCliente: Cliente) => {
    setClientes((prev) => [newCliente, ...prev]);
    setFormData((prev) => ({ ...prev, propietarioId: newCliente.id }));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="cda-glass rounded-3xl p-6 md:p-8 max-w-xl w-full border border-cda-yellow-500/30 shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-cda-dark-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cda-yellow-500/10 text-cda-yellow-400">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Registro / Edición de Vehículo</h2>
                <p className="text-xs text-slate-400">Parque automotor y vigencia de certificados</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-cda-dark-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Placa & Categoría */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Placa del Vehículo *</label>
                <input
                  type="text"
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: handlePlacaInput(e.target.value) })}
                  placeholder="Ej. ABC-123 / XYZ-12A"
                  maxLength={7}
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white font-mono font-bold tracking-widest text-sm rounded-xl px-3.5 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Categoría *</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value as CategoriaVehiculo })}
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
                >
                  <option value="LIVIANO">🚗 Liviano (Automóvil / Campero)</option>
                  <option value="MOTO">🏍️ Moto (Categoría A1 / A2)</option>
                  <option value="PESADO">🚚 Pesado (Camión / Furgón)</option>
                  <option value="PUBLICO">🚕 Público (Taxi / Especial)</option>
                </select>
              </div>
            </div>

            {/* Marca, Línea y Modelo */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Marca *</label>
                <input
                  type="text"
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value.toUpperCase() })}
                  placeholder="CHEVROLET"
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white text-xs rounded-xl px-3.5 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Línea / Referencia *</label>
                <input
                  type="text"
                  value={formData.linea}
                  onChange={(e) => setFormData({ ...formData, linea: e.target.value.toUpperCase() })}
                  placeholder="SPARK GT"
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white text-xs rounded-xl px-3.5 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Año Modelo *</label>
                <input
                  type="number"
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: parseInt(e.target.value) || 2020 })}
                  min={1970}
                  max={new Date().getFullYear() + 2}
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white text-xs rounded-xl px-3.5 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Chasis / VIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Número de Chasis / VIN (Opcional)</label>
              <input
                type="text"
                value={formData.chasisVin || ''}
                onChange={(e) => setFormData({ ...formData, chasisVin: e.target.value.toUpperCase() })}
                placeholder="Ej. 9BG114455KK889900"
                className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white text-xs rounded-xl px-3.5 py-2.5 focus:border-cda-yellow-500 focus:outline-none font-mono"
              />
            </div>

            {/* Fechas de Vencimiento */}
            <div className="grid grid-cols-2 gap-3 bg-cda-dark-900/60 p-3.5 rounded-2xl border border-cda-dark-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cda-yellow-400" />
                  <span>Vencimiento SOAT</span>
                </label>
                <input
                  type="date"
                  min="1950-01-01"
                  max="2099-12-31"
                  value={formData.fechaVencimientoSoat || ''}
                  onChange={(e) => setFormData({ ...formData, fechaVencimientoSoat: e.target.value })}
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2 focus:border-cda-yellow-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Vencimiento Tecnomecánica (RTM)</span>
                </label>
                <input
                  type="date"
                  min="1950-01-01"
                  max="2099-12-31"
                  value={formData.fechaVencimientoRtm || ''}
                  onChange={(e) => setFormData({ ...formData, fechaVencimientoRtm: e.target.value })}
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2 focus:border-cda-yellow-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Propietario del Vehículo */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-cda-yellow-400" />
                  <span>Propietario Oficial Registrado</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="text-[11px] font-bold text-cda-yellow-400 hover:text-cda-yellow-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nuevo Propietario</span>
                </button>
              </div>
              <select
                value={formData.propietarioId || ''}
                onChange={(e) => setFormData({ ...formData, propietarioId: e.target.value })}
                className="w-full bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
              >
                <option value="">-- Sin propietario asignado (o asignar luego) --</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombresRazonSocial} ({c.tipoDocumento} {c.numeroDocumento}) - Tel: {c.celular}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-cda-dark-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-cda-dark-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-bold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Guardar Vehículo</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <ClienteModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={handleClienteCreated}
      />
    </>
  );
}
