import React, { useState, useEffect } from 'react';
import { X, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { Cliente, ClienteFormData } from '../../types/cliente';
import { TipoDocumento } from '../../types/auth';
import { clienteService } from '../../services/clienteService';

import { handlePhoneInput } from '../../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cliente: Cliente) => void;
  initialData?: Partial<ClienteFormData>;
}

export function ClienteModal({ isOpen, onClose, onSuccess, initialData }: Props) {
  const [formData, setFormData] = useState<ClienteFormData>({
    tipoDocumento: (initialData?.tipoDocumento as TipoDocumento) || 'CC',
    numeroDocumento: initialData?.numeroDocumento || '',
    nombresRazonSocial: initialData?.nombresRazonSocial || '',
    direccion: initialData?.direccion || '',
    celular: initialData?.celular ? handlePhoneInput(initialData.celular) : '',
    email: initialData?.email || '',
    fechaNacimiento: initialData?.fechaNacimiento || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        tipoDocumento: (initialData?.tipoDocumento as TipoDocumento) || 'CC',
        numeroDocumento: initialData?.numeroDocumento || '',
        nombresRazonSocial: initialData?.nombresRazonSocial || '',
        direccion: initialData?.direccion || '',
        celular: initialData?.celular ? handlePhoneInput(initialData.celular) : '',
        email: initialData?.email || '',
        fechaNacimiento: initialData?.fechaNacimiento || '',
      });
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.numeroDocumento.trim() || !formData.nombresRazonSocial.trim() || !formData.celular.trim()) {
      setError('Por favor diligencie documento, nombre completo y celular del cliente.');
      return;
    }

    if (formData.email && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('El formato del correo electrónico no es válido (ejemplo: usuario@dominio.com).');
      return;
    }

    setIsLoading(true);

    try {
      const saved = await clienteService.saveCliente(formData);
      setIsLoading(false);
      onSuccess(saved);
      onClose();
    } catch (err: unknown) {
      let msg = 'Error al registrar cliente';
      if (err && typeof err === 'object' && 'response' in err) {
        const resData = (err as { response: { data?: { message?: string } } }).response?.data;
        if (resData?.message) msg = resData.message;
      }
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="cda-glass rounded-3xl p-6 md:p-8 max-w-lg w-full border border-cda-yellow-500/30 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-cda-dark-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cda-yellow-500/10 text-cda-yellow-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Registro / Actualización de Cliente</h2>
              <p className="text-xs text-slate-400">Propietario, conductor o pagador de factura</p>
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo Doc *</label>
              <select
                value={formData.tipoDocumento}
                onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value as TipoDocumento })}
                className="w-full bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
              >
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="NIT">NIT</option>
                <option value="TI">TI</option>
                <option value="PASAPORTE">PAS</option>
                <option value="PPT">PPT</option>
                <option value="PEP">PEP</option>
                <option value="RC">RC</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Número de Documento *</label>
              <input
                type="text"
                value={formData.numeroDocumento}
                onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
                placeholder="Ej. 1020304050"
                className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white text-xs rounded-xl px-3.5 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombres y Apellidos / Razón Social *</label>
            <input
              type="text"
              value={formData.nombresRazonSocial}
              onChange={(e) => setFormData({ ...formData, nombresRazonSocial: e.target.value })}
              placeholder="Ej. Carlos Arturo Ramírez"
              className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white text-xs rounded-xl px-3.5 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Celular / WhatsApp *</label>
              <input
                type="tel"
                value={formData.celular}
                onChange={(e) => setFormData({ ...formData, celular: handlePhoneInput(e.target.value) })}
                placeholder="Ej. 310 123 4567"
                maxLength={12}
                className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white text-xs rounded-xl px-3.5 py-2.5 focus:border-cda-yellow-500 focus:outline-none font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white text-xs rounded-xl px-3.5 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Dirección</label>
              <input
                type="text"
                value={formData.direccion || ''}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Calle 10 # 20-30"
                className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white text-xs rounded-xl px-3.5 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Nacimiento (Opcional)</label>
              <input
                type="date"
                value={formData.fechaNacimiento || ''}
                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white text-xs rounded-xl px-3.5 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
              />
            </div>
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
              <span>Guardar Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
