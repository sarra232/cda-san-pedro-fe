import React, { useState } from 'react';
import { X, KeyRound, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RecuperarPasswordModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [identificador, setIdentificador] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setIdentificador('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!identificador.trim()) {
      setErrorMessage('Por favor ingresa tu número de documento o correo electrónico registrado.');
      return;
    }

    try {
      setIsLoading(true);
      const msg = await authService.solicitarRecuperacion(identificador.trim());
      setSuccessMessage(msg);
    } catch (err: unknown) {
      let msg = 'El correo o usuario no existe';
      if (err && typeof err === 'object' && 'response' in err) {
        const resData = (err as { response: { data?: { message?: string } } }).response?.data;
        if (resData?.message) msg = resData.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-cda-dark-950 border border-cda-yellow-500/20 rounded-2xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        
        {/* Cabecera */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-cda-dark-800 flex items-center justify-between bg-cda-dark-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cda-yellow-500/10 border border-cda-yellow-500/20 rounded-xl text-cda-yellow-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Recuperar Contraseña
              </h2>
              <p className="text-[11px] text-slate-400">
                Enlace de restablecimiento por correo institucional
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-cda-dark-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Mensaje de Error */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mensaje de Éxito */}
          {successMessage ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">¡Solicitud Procesada!</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {successMessage}
                </p>
                <p className="text-[11px] text-cda-yellow-400 font-medium">
                  El enlace enviado tiene una validez de 24 horas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full bg-cda-dark-900 border border-cda-dark-700 hover:border-cda-yellow-500/50 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold py-3 px-4 rounded-xl transition-all"
              >
                Cerrar y Volver al Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Ingresa tu <strong>Número de Documento</strong> o <strong>Correo Electrónico</strong> registrado en CDA San Pedro. Si tu cuenta se encuentra habilitada y activa, te enviaremos un enlace seguro para crear tu nueva contraseña.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Documento o Correo Registrado *
                </label>
                <div className="relative w-full">
                  <input
                    type="text"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    placeholder="Ej: 1020304050 o usuario@cdasanpedro.com"
                    className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white placeholder-slate-500 text-xs sm:text-sm rounded-xl px-3 sm:px-4 py-3 focus:outline-none focus:border-cda-yellow-500 transition-colors pr-10 font-medium"
                    required
                    autoFocus
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 bg-cda-dark-900 hover:bg-cda-dark-800 text-slate-300 text-xs font-semibold rounded-xl transition-colors border border-cda-dark-700"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isLoading || !identificador.trim()}
                  className="bg-gradient-to-r from-cda-yellow-500 to-amber-500 hover:from-cda-yellow-400 hover:to-amber-400 text-black font-extrabold py-2.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 text-xs group disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Enlace</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
