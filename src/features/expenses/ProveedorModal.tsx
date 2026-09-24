import React, { useState, useEffect } from 'react';
import { Tercero, TerceroFormData } from '../../types/tercero';
import { X, Building2, Phone, Mail, MapPin, UserCheck } from 'lucide-react';

interface ProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TerceroFormData) => Promise<void>;
  proveedorAEditar?: Tercero | null;
}

export const ProveedorModal: React.FC<ProveedorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  proveedorAEditar,
}) => {
  const [formData, setFormData] = useState<TerceroFormData>({
    tipoDocumento: 'NIT',
    numeroDocumento: '',
    digitoVerificacion: '',
    tipoPersona: 'JURIDICA',
    razonSocialONombre: '',
    celularPrincipal: '',
    emailPrincipal: '',
    direccion: '',
    municipioDane: '',
    responsabilidadFiscal: 'O-23',
    roles: ['PROVEEDOR'],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wasOpenRef = React.useRef(false);
  const lastProveedorIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (!wasOpenRef.current || (proveedorAEditar?.id && lastProveedorIdRef.current !== proveedorAEditar.id)) {
        wasOpenRef.current = true;
        lastProveedorIdRef.current = proveedorAEditar?.id || null;
        if (proveedorAEditar) {
          setFormData({
            tipoDocumento: proveedorAEditar.tipoDocumento || 'NIT',
            numeroDocumento: proveedorAEditar.numeroDocumento || '',
            digitoVerificacion: proveedorAEditar.digitoVerificacion || '',
            tipoPersona: proveedorAEditar.tipoPersona || 'JURIDICA',
            razonSocialONombre: proveedorAEditar.razonSocialONombre || '',
            celularPrincipal: proveedorAEditar.celularPrincipal || '',
            emailPrincipal: proveedorAEditar.emailPrincipal || '',
            direccion: proveedorAEditar.direccion || '',
            municipioDane: proveedorAEditar.municipioDane || '',
            responsabilidadFiscal: proveedorAEditar.responsabilidadFiscal || 'O-23',
            roles: ['PROVEEDOR'],
          });
        } else {
          setFormData({
            tipoDocumento: 'NIT',
            numeroDocumento: '',
            digitoVerificacion: '',
            tipoPersona: 'JURIDICA',
            razonSocialONombre: '',
            celularPrincipal: '',
            emailPrincipal: '',
            direccion: '',
            municipioDane: '',
            responsabilidadFiscal: 'O-23',
            roles: ['PROVEEDOR'],
          });
        }
        setError(null);
      }
    } else {
      wasOpenRef.current = false;
      lastProveedorIdRef.current = null;
    }
  }, [proveedorAEditar?.id, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.numeroDocumento.trim() || !formData.razonSocialONombre.trim() || !formData.celularPrincipal.trim()) {
      setError('Por favor complete los campos obligatorios (*)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        ...formData,
        razonSocialONombre: formData.razonSocialONombre.trim().toUpperCase(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al guardar proveedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Encabezado */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {proveedorAEditar ? 'Editar Proveedor / Acreedor' : 'Registrar Nuevo Proveedor'}
              </h3>
              <p className="text-xs text-slate-400">
                Directorio maestro de acreedores, suministros y licencias
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

          {/* Tipo y Número de Documento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo Doc. *
              </label>
              <select
                value={formData.tipoDocumento}
                onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="NIT">NIT</option>
                <option value="CC">Cédula (CC)</option>
                <option value="CE">Cédula Ext. (CE)</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Número de Documento / NIT *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.numeroDocumento}
                  onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
                  placeholder="Ej: 900123456"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
                {formData.tipoDocumento === 'NIT' && (
                  <input
                    type="text"
                    value={formData.digitoVerificacion || ''}
                    onChange={(e) => setFormData({ ...formData, digitoVerificacion: e.target.value })}
                    placeholder="DV"
                    maxLength={1}
                    className="w-14 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-sm text-center text-white focus:outline-none focus:border-amber-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Razón Social / Nombre */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Razón Social / Nombre Comercial *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={formData.razonSocialONombre}
                onChange={(e) => setFormData({ ...formData, razonSocialONombre: e.target.value.toUpperCase() })}
                placeholder="Ej: METROLOGÍA Y CALIBRACIONES S.A.S."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Celular y Correo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Celular / WhatsApp *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={formData.celularPrincipal}
                  onChange={(e) => setFormData({ ...formData, celularPrincipal: e.target.value })}
                  placeholder="3001234567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={formData.emailPrincipal || ''}
                  onChange={(e) => setFormData({ ...formData, emailPrincipal: e.target.value })}
                  placeholder="contacto@empresa.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Dirección y Ciudad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Dirección Física
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={formData.direccion || ''}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Carrera 15 # 45-20"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ciudad / Municipio
              </label>
              <input
                type="text"
                value={formData.municipioDane || ''}
                onChange={(e) => setFormData({ ...formData, municipioDane: e.target.value })}
                placeholder="Montería, Córdoba"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Botones de acción */}
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
                <UserCheck className="w-4 h-4" />
              )}
              {proveedorAEditar ? 'Guardar Cambios' : 'Registrar Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
