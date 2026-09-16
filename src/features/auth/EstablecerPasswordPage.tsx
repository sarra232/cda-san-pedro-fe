import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { authService } from '../../services/authService';
import { ValidacionTokenResponse } from '../../types/auth';
import logoCDA from '../../assets/LogoCDA.PNG';

export function EstablecerPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenInfo, setTokenInfo] = useState<ValidacionTokenResponse | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validación de Token al cargar la página
  useEffect(() => {
    async function checkToken() {
      if (!token.trim()) {
        setTokenError('No se proporcionó un token de seguridad válido en el enlace.');
        setIsValidatingToken(false);
        return;
      }

      try {
        setIsValidatingToken(true);
        setTokenError(null);
        const data = await authService.validarToken(token.trim());
        setTokenInfo(data);
      } catch (err: unknown) {
        let msg = 'El usuario no existe o el enlace ha caducado';
        if (err && typeof err === 'object' && 'response' in err) {
          const resData = (err as { response: { data?: { message?: string } } }).response?.data;
          if (resData?.message) msg = resData.message;
        }
        setTokenError(msg);
      } finally {
        setIsValidatingToken(false);
      }
    }

    checkToken();
  }, [token]);

  // Reglas de Validación en Tiempo Real
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`^]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && hasUppercase && hasSpecialChar && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!isFormValid) {
      setSubmitError('Por favor cumple con todos los requisitos de seguridad de la contraseña.');
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.establecerPassword({
        token: token.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login?activacionExitosa=true');
      }, 2500);
    } catch (err: unknown) {
      let msg = 'Error al establecer la contraseña. Por favor intenta nuevamente.';
      if (err && typeof err === 'object' && 'response' in err) {
        const resData = (err as { response: { data?: { message?: string } } }).response?.data;
        if (resData?.message) msg = resData.message;
      }
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInvitacion = tokenInfo?.tipo === 'INVITACION';

  return (
    <div className="min-h-screen bg-cda-dark-950 flex flex-col justify-center items-center p-3.5 sm:p-6 relative overflow-x-hidden font-sans selection:bg-cda-yellow-500 selection:text-black">
      {/* Glow ambiental */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-cda-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-sm sm:max-w-md relative z-10 mx-auto">
        <div className="cda-glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl border border-cda-yellow-500/20 backdrop-blur-xl">
          
          {/* Logo y Encabezado */}
          <div className="text-center space-y-2 sm:space-y-3 mb-6 sm:mb-8">
            <img 
              src={logoCDA} 
              alt="CDA San Pedro" 
              className="h-12 sm:h-16 mx-auto object-contain drop-shadow-lg"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isInvitacion ? 'Bienvenido a CDA San Pedro' : 'Recuperar Contraseña'}
              </h1>
              <p className="text-[10px] sm:text-xs text-cda-yellow-400 font-bold uppercase tracking-widest mt-0.5">
                {isInvitacion ? 'Activación de Cuenta & Creación de Clave' : 'Restablecimiento Seguro de Acceso'}
              </p>
            </div>
          </div>

          {/* Estado de Carga / Validación del Token */}
          {isValidatingToken && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-cda-yellow-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-medium">
                Validando enlace de seguridad con el servidor...
              </p>
            </div>
          )}

          {/* Estado de Error del Token */}
          {!isValidatingToken && tokenError && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs sm:text-sm">
                <XCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-200">Enlace no disponible o inválido</p>
                  <p className="text-rose-300 text-xs">{tokenError}</p>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 bg-cda-dark-900 border border-cda-dark-700 hover:border-cda-yellow-500/50 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold py-3 px-4 rounded-xl transition-all"
                >
                  <span>Volver al Inicio de Sesión</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Estado de Éxito al Establecer Contraseña */}
          {!isValidatingToken && isSuccess && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  ¡Contraseña Configurada!
                </h3>
                <p className="text-xs text-slate-300">
                  Tu cuenta ha sido actualizada con éxito. Redirigiendo a la pantalla de acceso...
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-cda-yellow-400 font-medium pt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ingresando al sistema...</span>
              </div>
            </div>
          )}

          {/* Formulario Principal de Creación de Contraseña */}
          {!isValidatingToken && !tokenError && !isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tarjeta de Información del Colaborador */}
              {tokenInfo && (
                <div className="p-3.5 rounded-xl bg-cda-dark-900/90 border border-cda-dark-700 flex items-center gap-3">
                  <div className="p-2 bg-cda-yellow-500/10 rounded-lg text-cda-yellow-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {tokenInfo.nombresApellidos || 'Colaborador CDA'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Doc: {tokenInfo.numeroDocumento} {tokenInfo.emailEnmascarado && `• ${tokenInfo.emailEnmascarado}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Error de Envío */}
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Campo Nueva Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nueva Contraseña *
                </label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white placeholder-slate-500 text-xs sm:text-sm rounded-xl px-3 sm:px-4 py-3 focus:outline-none focus:border-cda-yellow-500 transition-colors pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Campo Confirmar Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative w-full">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white placeholder-slate-500 text-xs sm:text-sm rounded-xl px-3 sm:px-4 py-3 focus:outline-none focus:border-cda-yellow-500 transition-colors pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checklist Dinámico de Requisitos de Contraseña */}
              <div className="p-3.5 rounded-xl bg-cda-dark-900/60 border border-cda-dark-800 space-y-2">
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Requisitos de Seguridad:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>Mínimo 8 caracteres</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-400' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasUppercase ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>1 letra mayúscula (A-Z)</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-400' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasSpecialChar ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>1 caracter especial (!@#$...)</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-400' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>Contraseñas coinciden</span>
                  </div>
                </div>
              </div>

              {/* Botón Guardar */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full bg-gradient-to-r from-cda-yellow-500 to-amber-500 hover:from-cda-yellow-400 hover:to-amber-400 text-black font-extrabold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-cda-yellow-500/20 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm group disabled:opacity-50 mt-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Guardando contraseña segura...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{isInvitacion ? 'Activar Cuenta e Ingresar' : 'Actualizar Contraseña'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Pie de seguridad */}
          <div className="mt-5 text-center">
            <p className="text-[10px] sm:text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cda-yellow-400 shrink-0" />
              <span>Protección y cifrado criptográfico BCrypt</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
