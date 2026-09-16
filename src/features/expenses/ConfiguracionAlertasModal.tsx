import React, { useState, useEffect } from 'react';
import { cuentaPagarService } from '../../services/cuentaPagarService';
import { X, Bell, Mail, Phone, Clock, CheckCircle2, AlertCircle, Save, Send, Plus, Trash2, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: () => void;
}

export const ConfiguracionAlertasModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'err'; mensaje: string } | null>(null);

  const [emails, setEmails] = useState<string[]>([]);
  const [nuevoEmail, setNuevoEmail] = useState('');

  const [telefonos, setTelefonos] = useState<string[]>([]);
  const [nuevoTelefono, setNuevoTelefono] = useState('');

  const [activo, setActivo] = useState(true);
  const [horaEnvio, setHoraEnvio] = useState('08:00');

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const conf = await cuentaPagarService.obtenerConfiguracionAlertas();
      if (conf) {
        setEmails(conf.emails || ['administracion@cdasanpedro.com', 'gerencia@cdasanpedro.com']);
        setTelefonos(conf.telefonos || ['3000000000']);
        setActivo(conf.activo ?? true);
        setHoraEnvio(conf.horaEnvio || '08:00');
      }
    } catch (error) {
      console.error('Error al cargar configuración de alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      cargarConfiguracion();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrim = nuevoEmail.trim();
    if (emailTrim && !emails.includes(emailTrim)) {
      setEmails([...emails, emailTrim]);
      setNuevoEmail('');
    }
  };

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleAddTelefono = (e: React.FormEvent) => {
    e.preventDefault();
    const telTrim = nuevoTelefono.trim();
    if (telTrim && !telefonos.includes(telTrim)) {
      setTelefonos([...telefonos, telTrim]);
      setNuevoTelefono('');
    }
  };

  const handleRemoveTelefono = (index: number) => {
    setTelefonos(telefonos.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      setFeedback(null);
      await cuentaPagarService.guardarConfiguracionAlertas({
        emails,
        telefonos,
        activo,
        horaEnvio,
      });
      setFeedback({ tipo: 'ok', mensaje: 'Configuración de alertas guardada exitosamente en el sistema.' });
      if (onConfigUpdated) onConfigUpdated();
      setTimeout(() => {
        setFeedback(null);
      }, 3000);
    } catch (error: any) {
      setFeedback({ tipo: 'err', mensaje: error?.response?.data?.message || 'Error al guardar la configuración.' });
    } finally {
      setGuardando(false);
    }
  };

  const handleDispararPrueba = async () => {
    try {
      setEnviandoPrueba(true);
      setFeedback(null);
      await cuentaPagarService.notificarPendientes({
        emails,
        telefonos,
      });
      setFeedback({ tipo: 'ok', mensaje: 'Alerta de prueba enviada exitosamente a los destinatarios configurados.' });
      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    } catch (error: any) {
      setFeedback({ tipo: 'err', mensaje: error?.response?.data?.message || 'Error al disparar la alerta.' });
    } finally {
      setEnviandoPrueba(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Configuración de Recordatorios & Alertas Automáticas
              </h2>
              <p className="text-xs text-slate-400">
                Administra los correos y teléfonos que recibirán el reporte diario de cuentas por pagar
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

        {/* Contenido */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-3" />
              <p className="text-sm">Cargando configuración de alertas y destinatarios...</p>
            </div>
          ) : (
            <>
              {feedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    feedback.tipo === 'ok'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {feedback.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{feedback.mensaje}</span>
                </div>
              )}

          {/* Sección Estado del Barrido Automático */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Barrido Automático Programado</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Se ejecuta todos los días a las <strong className="text-amber-400">{horaEnvio} AM</strong> evaluando vencimientos
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-xs font-semibold text-slate-300">
                {activo ? '🟢 Activado' : '🔴 Desactivado'}
              </span>
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 cursor-pointer"
              />
            </label>
          </div>

          {/* Sección 1: Correos Electrónicos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> 1. Correos Electrónicos para Notificaciones ({emails.length})
              </label>
            </div>

            <form onSubmit={handleAddEmail} className="flex gap-2">
              <input
                type="email"
                value={nuevoEmail}
                onChange={(e) => setNuevoEmail(e.target.value)}
                placeholder="Ingresa un correo (ej: tesoreria@cdasanpedro.com)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </form>

            <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
              {emails.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No hay correos configurados.</p>
              ) : (
                emails.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs"
                  >
                    <span className="font-mono text-slate-200">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(index)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Eliminar correo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sección 2: Números Telefónicos (SMS / WhatsApp) */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> 2. Celulares para SMS / WhatsApp ({telefonos.length})
              </label>
            </div>

            <form onSubmit={handleAddTelefono} className="flex gap-2">
              <input
                type="tel"
                value={nuevoTelefono}
                onChange={(e) => setNuevoTelefono(e.target.value)}
                placeholder="Ingresa número celular (ej: 3113456789)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </form>

            <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
              {telefonos.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No hay teléfonos configurados.</p>
              ) : (
                telefonos.map((tel, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs"
                  >
                    <span className="font-mono text-slate-200">{tel}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTelefono(index)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Eliminar teléfono"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>

        {/* Pie con Acciones */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDispararPrueba}
            disabled={enviandoPrueba || (emails.length === 0 && telefonos.length === 0)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-amber-500/20 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{enviandoPrueba ? 'Enviando Prueba...' : 'Enviar Alerta de Prueba Ahora'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{guardando ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
