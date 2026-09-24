import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  KeyRound, 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Loader2, 
  Save, 
  Clock, 
  Building2,
  FileText
} from 'lucide-react';
import { profileService } from '../../services/profileService';
import { useAuthStore } from '../../store/useAuthStore';
import { UsuarioPerfil } from '../../types/auth';

export function ProfilePage() {
  const { user: authUser, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<UsuarioPerfil | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'DATOS' | 'SEGURIDAD' | 'LABORAL'>('DATOS');

  // Formulario de datos personales
  const [nombresApellidos, setNombresApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [direccion, setDireccion] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Formulario de cambio de contraseña
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [confirmarNuevoPassword, setConfirmarNuevoPassword] = useState('');
  const [showPasswordActual, setShowPasswordActual] = useState(false);
  const [showNuevoPassword, setShowNuevoPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await profileService.getMiPerfil();
      setProfile(data);
      setNombresApellidos(data.nombresApellidos || '');
      setEmail(data.email || '');
      setCelular(data.celular || '');
      setDireccion(data.direccion || '');
    } catch {
      // Si falla la carga del perfil extendido, usar datos del store de sesión
      if (authUser) {
        setNombresApellidos(authUser.nombresApellidos);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Validación de requisitos de contraseña en tiempo real
  const hasMinLength = nuevoPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(nuevoPassword);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`^]/.test(nuevoPassword);
  const passwordsMatch = nuevoPassword.length > 0 && nuevoPassword === confirmarNuevoPassword;
  const isPasswordFormValid = hasMinLength && hasUppercase && hasSpecialChar && passwordsMatch && passwordActual.length > 0;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombresApellidos.trim()) return;

    setIsSavingProfile(true);
    setProfileFeedback(null);
    try {
      const updated = await profileService.actualizarPerfil({
        nombresApellidos: nombresApellidos.trim().toUpperCase(),
        email: email.trim() || undefined,
        celular: celular.trim() || undefined,
        direccion: direccion.trim() || undefined,
      });

      setProfile(updated);
      updateUser({ nombresApellidos: updated.nombresApellidos });
      setProfileFeedback({ success: true, msg: '¡Tus datos personales han sido actualizados exitosamente!' });
    } catch (err: any) {
      setProfileFeedback({
        success: false,
        msg: err.response?.data?.message || err.message || 'Error al actualizar el perfil. Intenta nuevamente.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordFormValid) return;

    setIsSavingPassword(true);
    setPasswordFeedback(null);
    try {
      const msg = await profileService.cambiarPassword({
        passwordActual,
        nuevoPassword,
        confirmarNuevoPassword,
      });

      setPasswordFeedback({ success: true, msg: msg || '¡Tu contraseña ha sido cambiada exitosamente!' });
      setPasswordActual('');
      setNuevoPassword('');
      setConfirmarNuevoPassword('');
    } catch (err: any) {
      setPasswordFeedback({
        success: false,
        msg: err.response?.data?.message || err.message || 'Error al cambiar la contraseña. Verifica tu contraseña actual.',
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const getRolLabel = (rol?: string) => {
    switch (rol) {
      case 'ADMINISTRADOR': return 'Administrador General';
      case 'DIRECTOR_TECNICO': return 'Director Técnico (ONAC)';
      case 'TECNICO_PISTA': return 'Inspector Técnico de Pista';
      case 'RECEPCIONISTA': return 'Cajero / Recepcionista';
      case 'CAJERO': return 'Cajero Oficial';
      default: return rol?.replace('_', ' ') || 'Usuario del Sistema';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-cda-yellow-500" />
        <span className="text-sm font-semibold">Cargando perfil de usuario...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Encabezado / Banner de Perfil */}
      <div className="cda-glass rounded-3xl p-6 sm:p-8 border border-cda-dark-700/80 relative overflow-hidden bg-gradient-to-br from-cda-dark-900 via-cda-dark-900/90 to-cda-dark-950 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cda-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative z-10">
          {/* Avatar con iniciales */}
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-cda-yellow-400 to-cda-yellow-600 p-0.5 shadow-xl shadow-cda-yellow-500/20">
              <div className="w-full h-full bg-cda-dark-950 rounded-2xl flex items-center justify-center text-cda-yellow-400 text-2xl sm:text-3xl font-black">
                {profile?.nombresApellidos ? profile.nombresApellidos.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 rounded-lg border-2 border-cda-dark-900 shadow-md" title="Usuario Activo">
              <CheckCircle2 className="w-3.5 h-3.5 text-black" />
            </div>
          </div>

          {/* Información Principal */}
          <div className="text-center sm:text-left flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase">
                {profile?.nombresApellidos || authUser?.nombresApellidos}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-cda-yellow-400 bg-cda-yellow-500/10 border border-cda-yellow-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <Shield className="w-3 h-3" />
                {profile?.rol || authUser?.rol}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              {getRolLabel(profile?.rol || authUser?.rol)} • {profile?.cargo || 'Colaborador CDA San Pedro'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cda-yellow-500" />
                <span>{profile?.tipoDocumento || authUser?.tipoDocumento}: {profile?.numeroDocumento || authUser?.numeroDocumento}</span>
              </span>
              {profile?.email && (
                <span className="flex items-center gap-1.5 font-sans">
                  <Mail className="w-3.5 h-3.5 text-cda-yellow-500" />
                  <span>{profile.email}</span>
                </span>
              )}
              {profile?.ultimoLogin && (
                <span className="flex items-center gap-1.5 font-sans">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Último acceso: {new Date(profile.ultimoLogin).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-cda-dark-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('DATOS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'DATOS'
                ? 'bg-cda-yellow-500 text-black shadow-lg shadow-cda-yellow-500/20'
                : 'bg-cda-dark-800/80 text-slate-400 hover:text-white hover:bg-cda-dark-800'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Datos Personales & Contacto</span>
          </button>

          <button
            onClick={() => setActiveTab('SEGURIDAD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'SEGURIDAD'
                ? 'bg-cda-yellow-500 text-black shadow-lg shadow-cda-yellow-500/20'
                : 'bg-cda-dark-800/80 text-slate-400 hover:text-white hover:bg-cda-dark-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Seguridad & Contraseña</span>
          </button>

          <button
            onClick={() => setActiveTab('LABORAL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'LABORAL'
                ? 'bg-cda-yellow-500 text-black shadow-lg shadow-cda-yellow-500/20'
                : 'bg-cda-dark-800/80 text-slate-400 hover:text-white hover:bg-cda-dark-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Información Laboral</span>
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: DATOS PERSONALES & CONTACTO */}
      {activeTab === 'DATOS' && (
        <div className="cda-glass rounded-3xl p-6 sm:p-8 border border-cda-dark-700/80 space-y-6">
          <div className="border-b border-cda-dark-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-cda-yellow-500" />
              <span>Información Personal y Canales de Contacto</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Actualiza tus datos de contacto registrados en la base de datos de CDA San Pedro.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Documento (Solo Lectura por seguridad) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Documento de Identidad (Inmutable)
                </label>
                <div className="w-full bg-cda-dark-950/80 border border-cda-dark-800 rounded-xl px-3 py-2.5 text-xs text-slate-400 font-mono flex items-center justify-between cursor-not-allowed">
                  <span>{profile?.tipoDocumento} - {profile?.numeroDocumento}</span>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>

              {/* Rol del Sistema (Solo Lectura) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Rol Asignado en el Sistema
                </label>
                <div className="w-full bg-cda-dark-950/80 border border-cda-dark-800 rounded-xl px-3 py-2.5 text-xs text-slate-400 font-semibold flex items-center justify-between cursor-not-allowed">
                  <span>{getRolLabel(profile?.rol)}</span>
                  <Shield className="w-3.5 h-3.5 text-cda-yellow-500" />
                </div>
              </div>

              {/* Nombres y Apellidos */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombres y Apellidos Completos *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={nombresApellidos}
                    onChange={(e) => setNombresApellidos(e.target.value.toUpperCase())}
                    placeholder="Ej. CARLOS ALBERTO GÓMEZ"
                    className="w-full bg-cda-dark-950 border border-cda-dark-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-cda-yellow-500"
                  />
                </div>
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Correo Electrónico (Notificaciones)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-cda-dark-950 border border-cda-dark-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cda-yellow-500"
                  />
                </div>
              </div>

              {/* Número Celular */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Número Celular (SMS / WhatsApp)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    placeholder="300 123 4567"
                    className="w-full bg-cda-dark-950 border border-cda-dark-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cda-yellow-500"
                  />
                </div>
              </div>

              {/* Dirección de Residencia */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dirección de Residencia
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Calle 10 # 20-30, San Pedro de los Milagros"
                    className="w-full bg-cda-dark-950 border border-cda-dark-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cda-yellow-500"
                  />
                </div>
              </div>
            </div>

            {profileFeedback && (
              <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                profileFeedback.success 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}>
                {profileFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <p className="font-semibold">{profileFeedback.msg}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-cda-yellow-500/10 disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando Cambios...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Datos Personales</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PESTAÑA 2: SEGURIDAD & CONTRASEÑA */}
      {activeTab === 'SEGURIDAD' && (
        <div className="cda-glass rounded-3xl p-6 sm:p-8 border border-cda-dark-700/80 space-y-6">
          <div className="border-b border-cda-dark-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cda-yellow-500" />
              <span>Cambiar Contraseña de Acceso</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Por tu seguridad y cumplimiento normativo ISO 17020 / ONAC, utiliza una contraseña robusta.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
            {/* Contraseña Actual */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contraseña Actual *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPasswordActual ? 'text' : 'password'}
                  required
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                  className="w-full bg-cda-dark-950 border border-cda-dark-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cda-yellow-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordActual(!showPasswordActual)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPasswordActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nueva Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nueva Contraseña *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showNuevoPassword ? 'text' : 'password'}
                  required
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres con mayúscula y símbolo"
                  className="w-full bg-cda-dark-950 border border-cda-dark-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cda-yellow-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNuevoPassword(!showNuevoPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showNuevoPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Nueva Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirmar Nueva Contraseña *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmarNuevoPassword}
                  onChange={(e) => setConfirmarNuevoPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full bg-cda-dark-950 border border-cda-dark-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cda-yellow-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Indicadores de Requisitos de Seguridad */}
            <div className="bg-cda-dark-950/80 p-4 rounded-2xl border border-cda-dark-800 space-y-2">
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Requisitos de Seguridad (OWASP Standard):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>Mínimo 8 caracteres</span>
                </div>
                <div className={`flex items-center gap-2 ${hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${hasUppercase ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>Al menos 1 mayúscula (A-Z)</span>
                </div>
                <div className={`flex items-center gap-2 ${hasSpecialChar ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${hasSpecialChar ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>Al menos 1 símbolo (!@#$%...)</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>Las contraseñas coinciden</span>
                </div>
              </div>
            </div>

            {passwordFeedback && (
              <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                passwordFeedback.success 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}>
                {passwordFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <p className="font-semibold">{passwordFeedback.msg}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingPassword || !isPasswordFormValid}
                className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-cda-yellow-500/10 disabled:opacity-50"
              >
                {isSavingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Actualizando Contraseña...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Modificar Contraseña</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PESTAÑA 3: INFORMACIÓN LABORAL */}
      {activeTab === 'LABORAL' && (
        <div className="cda-glass rounded-3xl p-6 sm:p-8 border border-cda-dark-700/80 space-y-6">
          <div className="border-b border-cda-dark-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cda-yellow-500" />
              <span>Información Laboral & Acreditación Técnica</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Detalles del contrato, departamento y vinculación laboral en CDA San Pedro.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-cda-dark-950 border border-cda-dark-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <Briefcase className="w-4 h-4 text-cda-yellow-500" />
                <span>Cargo Registrado</span>
              </div>
              <p className="text-sm font-bold text-white">{profile?.cargo || 'OPERACIONES_CDA'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-cda-dark-950 border border-cda-dark-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <Building2 className="w-4 h-4 text-cda-yellow-500" />
                <span>Departamento / Área</span>
              </div>
              <p className="text-sm font-bold text-white">{profile?.departamento || 'OPERACIONES Y PISTA'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-cda-dark-950 border border-cda-dark-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <Calendar className="w-4 h-4 text-cda-yellow-500" />
                <span>Fecha de Ingreso</span>
              </div>
              <p className="text-sm font-bold text-white font-mono">
                {profile?.fechaIngreso ? new Date(profile.fechaIngreso).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Servicio Activo'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cda-dark-950 border border-cda-dark-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Estado en el CDA</span>
              </div>
              <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>COLABORADOR ACTIVO</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cda-dark-950 border border-cda-dark-800 space-y-1 sm:col-span-2">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <FileText className="w-4 h-4 text-cda-yellow-500" />
                <span>Identificador Único de Sistema (UUID)</span>
              </div>
              <p className="text-xs font-mono text-slate-300 break-all">{profile?.id}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
