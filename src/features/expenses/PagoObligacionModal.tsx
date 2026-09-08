import React, { useState } from 'react';
import { CuentaPorPagar, PagoProveedorFormData } from '../../types/cuentapagar';
import { X, DollarSign, CreditCard, Receipt, CheckCircle2 } from 'lucide-react';

interface PagoObligacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cuentaId: string, data: PagoProveedorFormData) => Promise<void>;
  cuenta: CuentaPorPagar | null;
}

export const PagoObligacionModal: React.FC<PagoObligacionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cuenta,
}) => {
  const [formData, setFormData] = useState<PagoProveedorFormData>({
    montoPagado: cuenta?.saldoPendiente || 0,
    metodoPago: 'TRANSFERENCIA',
    numeroComprobante: '',
    observaciones: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (cuenta) {
      setFormData({
        montoPagado: cuenta.saldoPendiente,
        metodoPago: 'TRANSFERENCIA',
        numeroComprobante: '',
        observaciones: '',
      });
    }
  }, [cuenta]);

  if (!isOpen || !cuenta) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.montoPagado <= 0 || formData.montoPagado > cuenta.saldoPendiente) {
      setError(`El monto a pagar debe ser mayor a 0 y menor o igual al saldo pendiente ($${cuenta.saldoPendiente.toLocaleString('es-CO')})`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(cuenta.id, formData);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Registrar Pago a Proveedor</h3>
              <p className="text-xs text-slate-400">{cuenta.acreedorNombre}</p>
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

          {/* Resumen de la obligación */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Concepto:</span>
              <span className="text-slate-200 font-medium text-right">{cuenta.concepto}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Vencimiento:</span>
              <span className="text-amber-400 font-semibold">{cuenta.fechaVencimiento}</span>
            </div>
            <div className="flex justify-between text-xs border-t border-slate-800/80 pt-2">
              <span className="text-slate-400">Saldo Pendiente:</span>
              <span className="text-emerald-400 font-bold text-sm">
                ${cuenta.saldoPendiente.toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          {/* Monto a pagar */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Monto a Pagar ($ COP) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="number"
                min="1"
                max={cuenta.saldoPendiente}
                step="100"
                value={formData.montoPagado || ''}
                onChange={(e) => setFormData({ ...formData, montoPagado: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div className="mt-1 flex justify-between">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, montoPagado: cuenta.saldoPendiente })}
                className="text-[11px] text-amber-400 hover:underline"
              >
                Pagar Totalidad (${cuenta.saldoPendiente.toLocaleString('es-CO')})
              </button>
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Método de Desembolso
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <select
                value={formData.metodoPago}
                onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="EFECTIVO">Efectivo de Caja</option>
                <option value="CHEQUE">Cheque</option>
                <option value="DEBITO_AUTOMATICO">Débito Automático</option>
              </select>
            </div>
          </div>

          {/* Número de comprobante */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              N° Comprobante / Aprobación Bancaria
            </label>
            <input
              type="text"
              value={formData.numeroComprobante || ''}
              onChange={(e) => setFormData({ ...formData, numeroComprobante: e.target.value })}
              placeholder="Ej: APROB-883492"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Notas / Observaciones
            </label>
            <textarea
              rows={2}
              value={formData.observaciones || ''}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Detalles del desembolso..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
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
              className="px-5 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Confirmar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
