import React, { useState } from 'react';
import { Empleado, CertificacionFormData, TipoCertificacion } from '../../types/hr';
import { X, Award, Calendar, ShieldCheck, User } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CertificacionFormData) => Promise<void>;
  empleados: Empleado[];
  empleadoPreseleccionadoId?: string;
}

export const CertificacionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  empleados,
  empleadoPreseleccionadoId,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CertificacionFormData>({
    empleadoId: empleadoPreseleccionadoId || (empleados[0]?.id || ''),
    tipoCertificacion: 'INSPECTOR_LINEA_LIVIANOS',
    codigoCertificado: '',
    entidadEmisora: 'SENA / Organismo Evaluador de la Conformidad',
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaVencimiento: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
    soporteUrl: '',
    observaciones: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error al registrar certificación:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Acreditar Certificación ONAC / ISO 17020
              </h2>
              <p className="text-xs text-slate-400">
                Registro de competencias técnicas, calibración o dirección técnica
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" /> Colaborador a Acreditar *
            </label>
            <select
              required
              value={formData.empleadoId}
              onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="" disabled>Seleccione un colaborador...</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombresApellidos} ({emp.cargo} - {emp.numeroDocumento})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Tipo de Certificación / Competencia *
            </label>
            <select
              required
              value={formData.tipoCertificacion}
              onChange={(e) => setFormData({ ...formData, tipoCertificacion: e.target.value as TipoCertificacion })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="INSPECTOR_LINEA_LIVIANOS">Inspector de Línea Livianos (ISO/IEC 17020)</option>
              <option value="INSPECTOR_LINEA_PESADOS">Inspector de Línea Pesados (ISO/IEC 17020)</option>
              <option value="INSPECTOR_LINEA_MOTOS">Inspector de Línea Motos (ISO/IEC 17020)</option>
              <option value="DIRECTOR_TECNICO">Director Técnico Acreditado ONAC</option>
              <option value="DIRECTOR_TECNICO_SUPLENTE">Director Técnico Suplente</option>
              <option value="CALIBRACION_EQUIPOS">Calibración y Metrología de Equipos</option>
              <option value="SEGURIDAD_SALUD_TRABAJO">Seguridad y Salud en el Trabajo (SST)</option>
              <option value="PRIMEROS_AUXILIOS">Primeros Auxilios y Brigadista</option>
              <option value="OTRO">Otra Certificación Oficial</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Código / Folio de Certificado *</label>
              <input
                type="text"
                required
                value={formData.codigoCertificado}
                onChange={(e) => setFormData({ ...formData, codigoCertificado: e.target.value })}
                placeholder="Ej: ONAC-INSP-2026-981"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Entidad Emisora</label>
              <input
                type="text"
                value={formData.entidadEmisora}
                onChange={(e) => setFormData({ ...formData, entidadEmisora: e.target.value })}
                placeholder="Ej: SENA, SGS, Bureau Veritas"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Fecha de Emisión *
              </label>
              <input
                type="date"
                required
                value={formData.fechaEmision}
                onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Fecha de Vencimiento *
              </label>
              <input
                type="date"
                required
                value={formData.fechaVencimiento}
                onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Observaciones / Alcance Técnico</label>
            <textarea
              rows={2}
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Detalles sobre resolución, vigencia o línea autorizada..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

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
              disabled={loading}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              {loading ? 'Guardando...' : 'Registrar Acreditación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
