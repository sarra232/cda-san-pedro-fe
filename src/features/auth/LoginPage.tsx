import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import logoCDA from '../../assets/LogoCDA.PNG';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, login, isLoading, error } = useAuthStore();

  const [tipoDoc, setTipoDoc] = useState('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Si ya está autenticado, redirigir a dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!numeroDocumento.trim() || !password.trim()) {
      setLocalError('Por favor ingresa tu número de documento y contraseña');
      return;
    }

    try {
      await login({
        numeroDocumento: numeroDocumento.trim(),
        password: password.trim(),
      });
      navigate('/dashboard');
    } catch {
      // El error ya queda seteado en el store
    }
  };

  const handleQuickLogin = async (doc: string, pass: string) => {
    setNumeroDocumento(doc);
    setPassword(pass);
    try {
      await login({ numeroDocumento: doc, password: pass });
      navigate('/dashboard');
    } catch {
      // Ignorar
    }
  };

  return (
    <div className="min-h-screen bg-cda-dark-950 flex flex-col justify-center items-center p-3.5 sm:p-6 relative overflow-x-hidden font-sans selection:bg-cda-yellow-500 selection:text-black">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-cda-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-sm sm:max-w-md relative z-10 mx-auto">
        <div className="cda-glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl border border-cda-yellow-500/20 backdrop-blur-xl">
          
          {/* Brand Header */}
          <div className="text-center space-y-2 sm:space-y-3 mb-6 sm:mb-8">
            <img 
              src={logoCDA} 
              alt="CDA San Pedro" 
              className="h-12 sm:h-16 mx-auto object-contain drop-shadow-lg"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">CDA SAN PEDRO</h1>
              <p className="text-[10px] sm:text-xs text-cda-yellow-400 font-bold uppercase tracking-widest mt-0.5">
                Acceso al Sistema Central
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {(error || localError) && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error || localError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo y Documento de Identidad
              </label>
              <div className="flex gap-2 w-full">
                <select
                  value={tipoDoc}
                  onChange={(e) => setTipoDoc(e.target.value)}
                  className="w-20 sm:w-24 shrink-0 bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-xl px-2.5 py-3 focus:outline-none focus:border-cda-yellow-500 transition-colors"
                >
                  <option value="CC">CC</option>
                  <option value="CE">CE</option>
                  <option value="TI">TI</option>
                  <option value="PASAPORTE">PAS</option>
                  <option value="PPT">PPT</option>
                  <option value="PEP">PEP</option>
                </select>
                <input
                  type="text"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  placeholder="Número de documento"
                  className="flex-1 min-w-0 w-full bg-cda-dark-900 border border-cda-dark-700 text-white placeholder-slate-500 text-xs sm:text-sm rounded-xl px-3 sm:px-4 py-3 focus:outline-none focus:border-cda-yellow-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative w-full">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white placeholder-slate-500 text-xs sm:text-sm rounded-xl px-3 sm:px-4 py-3 focus:outline-none focus:border-cda-yellow-500 transition-colors pr-10"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cda-yellow-500 to-amber-500 hover:from-cda-yellow-400 hover:to-amber-400 text-black font-extrabold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-cda-yellow-500/20 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm group disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-cda-dark-800/80">
            <p className="text-[11px] text-slate-400 text-center font-medium mb-2.5">
              Acceso rápido para pruebas:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('123456789', 'Admin123*')}
                className="py-2.5 px-3 rounded-xl bg-cda-dark-900 border border-cda-dark-700 hover:border-cda-yellow-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>👑 Administrador</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('987654321', 'Recepcion123*')}
                className="py-2.5 px-3 rounded-xl bg-cda-dark-900 border border-cda-dark-700 hover:border-cda-yellow-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>🚗 Recepcionista</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-[10px] sm:text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cda-yellow-400 shrink-0" />
              <span>Sesión cifrada con algoritmo BCrypt y JWT</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
