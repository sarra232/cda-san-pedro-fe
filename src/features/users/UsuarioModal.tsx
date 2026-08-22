import React, { useState, useEffect } from 'react';
import { X, Shield, Lock, User as UserIcon, FileText, Loader2, Save } from 'lucide-react';
import { User, RolUsuario, TipoDocumento } from '../../types/auth';
import { userService, CreateUserData, UpdateUserData } from '../../services/userService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: User | null;
}

export function UsuarioModal({ isOpen, onClose, onSuccess, userToEdit }: Props) {
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [nombresApellidos, setNombresApellidos] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<RolUsuario>('TECNICO_PISTA');
  const [activo, setActivo] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (userToEdit) {
        setTipoDocumento(userToEdit.tipoDocumento || 'CC');
        setNumeroDocumento(userToEdit.numeroDocumento || '');
        setNombresApellidos(userToEdit.nombresApellidos || '');
        setPassword('');
        setRol(userToEdit.rol || 'TECNICO_PISTA');
        setActivo(userToEdit.activo ?? true);
      } else {
        setTipoDocumento('CC');
        setNumeroDocumento('');
        setNombresApellidos('');
        setPassword('');
        setRol('TECNICO_PISTA');
        setActivo(true);
      }
    }
  }, [isOpen, userToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!numeroDocumento.trim()) {
      setError('El número de documento es obligatorio');
      return;
    }
    if (!nombresApellidos.trim()) {
      setError('El nombre completo es obligatorio');
      return;
    }

    if (!userToEdit && !password.trim()) {
      setError('La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    setIsLoading(true);
    try {
      if (userToEdit) {
        const updateData: UpdateUserData = {
          tipoDocumento,
          numeroDocumento: numeroDocumento.trim(),
          nombresApellidos: nombresApellidos.trim(),
          rol,
          activo,
        };
        if (password.trim()) {
          updateData.password = password.trim();
        }
        await userService.updateUsuario(userToEdit.id, updateData);
      } else {
        const createData: CreateUserData = {
          tipoDocumento,
          numeroDocumento: numeroDocumento.trim(),
          nombresApellidos: nombresApellidos.trim(),
          password: password.trim(),
          rol,
        };
        await userService.createUsuario(createData);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      let msg = 'Error al procesar el usuario';
      if (err && typeof err === 'object' && 'response' in err) {
        const resData = (err as { response: { data?: { message?: string } } }).response?.data;
        if (resData?.message) msg = resData.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="cda-glass rounded-3xl p-5 sm:p-7 max-w-lg w-full border border-cda-yellow-500/30 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-cda-dark-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-cda-dark-800 mb-5">
          <div className="p-2.5 rounded-xl bg-cda-yellow-500/10 text-cda-yellow-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {userToEdit ? 'Editar Usuario / Personal' : 'Nuevo Empleado o Técnico'}
            </h3>
            <p className="text-xs text-slate-400">
              {userToEdit 
                ? `Modificando credenciales de ${userToEdit.nombresApellidos}`
                : 'Crea una nueva cuenta de acceso al sistema del CDA'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Document Type and Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tipo Doc.</label>
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
                className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl px-3 py-2.5 text-white focus:border-cda-yellow-500 focus:outline-none"
              >
                <option value="CC">Cédula (CC)</option>
                <option value="CE">Cédula Extranjería (CE)</option>
                <option value="NIT">NIT</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="PEP">PEP / PPT</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Número de Documento</label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  placeholder="Ej: 1020304050"
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl pl-9 pr-3 py-2.5 text-white font-mono placeholder:text-slate-500 focus:border-cda-yellow-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nombres y Apellidos</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={nombresApellidos}
                onChange={(e) => setNombresApellidos(e.target.value)}
                placeholder="Ej: Juan David Pérez"
                className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-slate-500 focus:border-cda-yellow-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Rol / Permisos del Sistema</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as RolUsuario)}
              className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl px-3 py-2.5 text-white font-bold focus:border-cda-yellow-500 focus:outline-none"
            >
              <option value="TECNICO_PISTA">🔧 TÉCNICO DE PISTA (Inspección vehicular y pruebas en pista)</option>
              <option value="DIRECTOR_TECNICO">🎓 DIRECTOR TÉCNICO (Supervisión técnica, dictamen y certificación RTM)</option>
              <option value="RECEPCIONISTA">📋 RECEPCIONISTA (Ingreso de vehículos, clientes y cobros)</option>
              <option value="CAJERO">💳 CAJERO (Facturación, métodos de pago y caja)</option>
              <option value="ADMINISTRADOR">👑 ADMINISTRADOR (Acceso total gerencial, auditoría y reportes)</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {userToEdit ? 'Nueva Contraseña (dejar en blanco para mantener actual)' : 'Contraseña de Acceso'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={userToEdit ? '•••••••• (sin cambios)' : 'Mínimo 6 caracteres'}
                className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl pl-9 pr-3 py-2.5 text-white font-mono placeholder:text-slate-500 focus:border-cda-yellow-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Estado Activo toggle (if editing) */}
          {userToEdit && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-cda-dark-900 border border-cda-dark-700">
              <span className="text-slate-300 font-semibold">Estado de la cuenta</span>
              <button
                type="button"
                onClick={() => setActivo(!activo)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activo 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}
              >
                {activo ? '✓ Activo' : '✕ Inactivo'}
              </button>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex gap-3 pt-3 border-t border-cda-dark-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 font-semibold py-2.5 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold py-2.5 rounded-xl transition-all shadow-lg shadow-cda-yellow-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{userToEdit ? 'Guardar Cambios' : 'Crear Usuario'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
