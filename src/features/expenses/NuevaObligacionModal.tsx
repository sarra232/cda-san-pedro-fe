import React, { useState } from 'react';
import { Tercero } from '../../types/tercero';
import { CuentaPorPagarFormData, PeriodicidadPago, TipoObligacion } from '../../types/cuentapagar';
import { X, Calendar, DollarSign, Tag, Clock, FileText, PlusCircle } from 'lucide-react';

interface NuevaObligacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CuentaPorPagarFormData) => Promise<void>;
  proveedores: Tercero[];
}

export const NuevaObligacionModal: React.FC<NuevaObligacionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  proveedores,
}) => {
  const [formData, setFormData] = useState<CuentaPorPagarFormData>({
    acreedorTerceroId: '',
    numeroReferencia: '',
    concepto: '',
    montoTotal: 0,
    tipoObligacion: 'FACTURA_PROVEEDOR',
    periodicidad: 'PAGO_UNICO',
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaVencimiento: '',
    diasAvisoAnticipado: 5,
    observaciones: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acreedorTerceroId || !formData.concepto.trim() || !formData.fechaVencimiento || formData.montoTotal <= 0) {
      setError('Por favor complete todos los campos obligatorios (*) con un monto válido.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al registrar obligación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Nueva Cuenta por Pagar / Obligación
              </h3>
              <p className="text-xs text-slate-400">
                Registra facturas, membresías, licencias y servicios con fecha de vencimiento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Proveedor / Acreedor */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Proveedor / Acreedor *
            </label>
            <select
              value={formData.acreedorTerceroId}
              onChange={(e) => setFormData({ ...formData, acreedorTerceroId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              required
            >
              <option value="">-- Seleccione un proveedor --</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.razonSocialONombre} ({p.tipoDocumento}: {p.numeroDocumento})
                </option>
              ))}
            </select>
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Concepto / Descripción del Pago *
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={formData.concepto}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                placeholder="Ej: Renovación Anual Licencia ONAC / Mantenimiento Analizador"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Monto y Nro Referencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Monto Total ($ COP) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={formData.montoTotal || ''}
                  onChange={(e) => setFormData({ ...formData, montoTotal: parseFloat(e.target.value) || 0 })}
                  placeholder="Ej: 1500000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                N° Factura / Referencia
              </label>
              <input
                type="text"
                value={formData.numeroReferencia || ''}
                onChange={(e) => setFormData({ ...formData, numeroReferencia: e.target.value })}
                placeholder="FAC-9844"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Tipo Obligación y Periodicidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de Obligación
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <select
                  value={formData.tipoObligacion}
                  onChange={(e) => setFormData({ ...formData, tipoObligacion: e.target.value as TipoObligacion })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="FACTURA_PROVEEDOR">Factura Proveedor</option>
                  <option value="MEMBRESIA_LICENCIA">Membresía / Licencia</option>
                  <option value="SOFTWARE_LICENCIAS">Software / Pines / Licencias</option>
                  <option value="CALIBRACION_EQUIPOS">Calibración Equipos</option>
                  <option value="SERVICIO_PUBLICO">Servicio Público</option>
                  <option value="SEGUROS_POLIZAS">Seguros / Pólizas</option>
                  <option value="ARRIENDO">Arriendo</option>
                  <option value="IMPUESTOS_TASAS">Impuestos / Tasas</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Periodicidad / Recurrencia
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <select
                  value={formData.periodicidad}
                  onChange={(e) => setFormData({ ...formData, periodicidad: e.target.value as PeriodicidadPago })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="PAGO_UNICO">Pago Único (Sin recurrencia)</option>
                  <option value="MENSUAL">Mensual</option>
                  <option value="BIMESTRAL">Bimestral</option>
                  <option value="TRIMESTRAL">Trimestral</option>
                  <option value="SEMESTRAL">Semestral</option>
                  <option value="ANUAL">Anual</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fechas de Emisión y Vencimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Fecha Emisión
              </label>
              <input
                type="date"
                value={formData.fechaEmision || ''}
                onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Fecha Vencimiento *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="date"
                  value={formData.fechaVencimiento}
                  onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Días de Anticipación
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.diasAvisoAnticipado || 5}
                onChange={(e) => setFormData({ ...formData, diasAvisoAnticipado: parseInt(e.target.value) || 5 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              Registrar Obligación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
