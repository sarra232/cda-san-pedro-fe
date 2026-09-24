import React, { useState, useEffect } from 'react';
import { Empleado, EmpleadoFormData, TipoContrato, EstadoEmpleado } from '../../types/hr';
import { RolUsuario } from '../../types/auth';
import { X, User, DollarSign, Briefcase, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmpleadoFormData) => Promise<void>;
  empleadoAEditar?: Empleado | null;
}

const mapearCargoARol = (c: string): RolUsuario => {
  switch (c) {
    case 'ADMINISTRADOR': return 'ADMINISTRADOR';
    case 'DIRECTOR_TECNICO':
    case 'DIRECTOR_TECNICO_SUPLENTE': return 'DIRECTOR_TECNICO';
    case 'RECEPCIONISTA': return 'RECEPCIONISTA';
    case 'INSPECTOR_LINEA_LIVIANOS':
    case 'INSPECTOR_LINEA_PESADOS':
    case 'INSPECTOR_LINEA_MOTOS': return 'TECNICO_PISTA';
    default: return 'TECNICO_PISTA';
  }
};

export const EmpleadoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  empleadoAEditar,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmpleadoFormData>({
    tipoDocumento: 'CC',
    numeroDocumento: '',
    nombresApellidos: '',
    celular: '',
    email: '',
    direccion: '',
    cargo: 'INSPECTOR_LINEA_LIVIANOS',
    departamento: 'OPERACIONES_PISTA',
    tipoContrato: 'TERMINO_INDEFINIDO',
    salarioBase: 1600000,
    auxilioTransporteAplica: true,
    banco: 'BANCOLOMBIA',
    tipoCuenta: 'AHORROS',
    numeroCuenta: '',
    fechaIngreso: new Date().toISOString().split('T')[0],
    estado: 'ACTIVO',
    rolApp: 'TECNICO_PISTA',
  });

  const wasOpenRef = React.useRef(false);
  const lastEmpleadoIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (!wasOpenRef.current || (empleadoAEditar?.id && lastEmpleadoIdRef.current !== empleadoAEditar.id)) {
        wasOpenRef.current = true;
        lastEmpleadoIdRef.current = empleadoAEditar?.id || null;
        setErrorMessage(null);
        if (empleadoAEditar) {
          setFormData({
            terceroId: empleadoAEditar.terceroId,
            tipoDocumento: empleadoAEditar.tipoDocumento || 'CC',
            numeroDocumento: empleadoAEditar.numeroDocumento || '',
            nombresApellidos: empleadoAEditar.nombresApellidos || '',
            celular: empleadoAEditar.celular || '',
            email: empleadoAEditar.email || '',
            direccion: empleadoAEditar.direccion || '',
            cargo: empleadoAEditar.cargo || 'INSPECTOR_LINEA_LIVIANOS',
            departamento: empleadoAEditar.departamento || 'OPERACIONES_PISTA',
            tipoContrato: empleadoAEditar.tipoContrato || 'TERMINO_INDEFINIDO',
            salarioBase: Number(empleadoAEditar.salarioBase) || 1600000,
            auxilioTransporteAplica: Boolean(empleadoAEditar.auxilioTransporteAplica),
            banco: empleadoAEditar.banco || '',
            tipoCuenta: empleadoAEditar.tipoCuenta || 'AHORROS',
            numeroCuenta: empleadoAEditar.numeroCuenta || '',
            fechaIngreso: empleadoAEditar.fechaIngreso || new Date().toISOString().split('T')[0],
            estado: empleadoAEditar.estado || 'ACTIVO',
            rolApp: empleadoAEditar.rolApp || mapearCargoARol(empleadoAEditar.cargo || 'INSPECTOR_LINEA_LIVIANOS'),
          });
        } else {
          setFormData({
            tipoDocumento: 'CC',
            numeroDocumento: '',
            nombresApellidos: '',
            celular: '',
            email: '',
            direccion: '',
            cargo: 'INSPECTOR_LINEA_LIVIANOS',
            departamento: 'OPERACIONES_PISTA',
            tipoContrato: 'TERMINO_INDEFINIDO',
            salarioBase: 1600000,
            auxilioTransporteAplica: true,
            banco: 'BANCOLOMBIA',
            tipoCuenta: 'AHORROS',
            numeroCuenta: '',
            fechaIngreso: new Date().toISOString().split('T')[0],
            estado: 'ACTIVO',
            rolApp: 'TECNICO_PISTA',
          });
        }
      }
    } else {
      wasOpenRef.current = false;
      lastEmpleadoIdRef.current = null;
    }
  }, [empleadoAEditar?.id, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      setLoading(true);
      await onSave({
        ...formData,
        nombresApellidos: formData.nombresApellidos.trim().toUpperCase(),
      });
      onClose();
    } catch (error: any) {
      console.error('Error al guardar empleado:', error);
      const msg = error?.response?.data?.message || error?.message || 'Error al guardar colaborador. Verifique los datos e intente nuevamente.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {empleadoAEditar ? 'Editar Colaborador' : 'Registrar Nuevo Colaborador'}
              </h2>
              <p className="text-xs text-slate-400">
                Información personal, contrato, salario y acreditación técnica
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Sección 1: Datos Personales */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4" /> 1. Datos Personales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tipo Doc.</label>
                <select
                  value={formData.tipoDocumento}
                  onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="CC">Cédula de Ciudadanía (CC)</option>
                  <option value="CE">Cédula de Extranjería (CE)</option>
                  <option value="PEP">PEP</option>
                  <option value="PPT">PPT</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Número de Documento *</label>
                <input
                  type="text"
                  required
                  value={formData.numeroDocumento}
                  onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
                  placeholder="Ej: 1065890123"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombres y Apellidos Completos *</label>
                <input
                  type="text"
                  required
                  value={formData.nombresApellidos}
                  onChange={(e) => setFormData({ ...formData, nombresApellidos: e.target.value.toUpperCase() })}
                  placeholder="Ej: JUAN CARLOS PÉREZ GÓMEZ"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Celular Principal *</label>
                <input
                  type="text"
                  required
                  value={formData.celular}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  placeholder="Ej: 3101234567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico (Para Invitación & Acceso)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ejemplo@cdasanpedro.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                {!empleadoAEditar && (
                  <p className="text-[10px] text-amber-400/90 mt-1">
                    ℹ️ Se enviará un correo de bienvenida con un enlace seguro (48h) para que el colaborador cree su contraseña.
                  </p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-1">Dirección de Residencia</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Ej: Cra 15 # 22-40, San Pedro"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Cargo y Contratación */}
          <div className="pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" /> 2. Cargo & Contrato
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Cargo Técnico / Administrativo *</label>
                <select
                  value={formData.cargo}
                  onChange={(e) => {
                    const newCargo = e.target.value;
                    setFormData({ 
                      ...formData, 
                      cargo: newCargo,
                      rolApp: mapearCargoARol(newCargo)
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="DIRECTOR_TECNICO">DIRECTOR TÉCNICO</option>
                  <option value="DIRECTOR_TECNICO_SUPLENTE">DIRECTOR TÉCNICO SUPLENTE</option>
                  <option value="INSPECTOR_LINEA_LIVIANOS">INSPECTOR LÍNEA LIVIANOS</option>
                  <option value="INSPECTOR_LINEA_PESADOS">INSPECTOR LÍNEA PESADOS</option>
                  <option value="INSPECTOR_LINEA_MOTOS">INSPECTOR LÍNEA MOTOS</option>
                  <option value="RECEPCIONISTA">RECEPCIONISTA / CAJERO</option>
                  <option value="SERVICIOS_GENERALES">SERVICIOS GENERALES</option>
                  <option value="ADMINISTRADOR">ADMINISTRADOR GENERAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rol de Acceso en la App *</span>
                </label>
                <select
                  value={formData.rolApp || 'TECNICO_PISTA'}
                  onChange={(e) => setFormData({ ...formData, rolApp: e.target.value as RolUsuario })}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-sm text-amber-300 focus:outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="TECNICO_PISTA">🔧 TÉCNICO DE PISTA (Inspección)</option>
                  <option value="DIRECTOR_TECNICO">🎓 DIRECTOR TÉCNICO (Dictamen & Calidad)</option>
                  <option value="RECEPCIONISTA">📋 RECEPCIONISTA (Ingreso & Clientes)</option>
                  <option value="CAJERO">💳 CAJERO (Facturación & Cobro)</option>
                  <option value="ADMINISTRADOR">👑 ADMINISTRADOR (Acceso Total)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Departamento</label>
                <select
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="OPERACIONES_PISTA">Operaciones y Pista RTM</option>
                  <option value="ADMINISTRACION">Administración y Gerencia</option>
                  <option value="RECEPCION_CAJA">Recepción y Caja</option>
                  <option value="MANTENIMIENTO">Calidad y Mantenimiento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Contrato</label>
                <select
                  value={formData.tipoContrato}
                  onChange={(e) => setFormData({ ...formData, tipoContrato: e.target.value as TipoContrato })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="TERMINO_INDEFINIDO">Término Indefinido</option>
                  <option value="TERMINO_FIJO">Término Fijo</option>
                  <option value="OBRA_LABOR">Por Obra o Labor</option>
                  <option value="PRESTACION_SERVICIOS">Prestación de Servicios</option>
                  <option value="APRENDIZAJE_SENA">Contrato de Aprendizaje SENA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Fecha de Ingreso *</label>
                <input
                  type="date"
                  required
                  value={formData.fechaIngreso}
                  onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {empleadoAEditar && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estado del Colaborador</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoEmpleado })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="VACACIONES">EN VACACIONES</option>
                    <option value="INCAPACITADO">INCAPACITADO</option>
                    <option value="LICENCIA">LICENCIA</option>
                    <option value="RETIRADO">RETIRADO</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Sección 3: Salario y Dispersión Bancaria */}
          <div className="pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> 3. Remuneración & Dispersión Bancaria
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Salario Base Mensual (COP) *</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={formData.salarioBase}
                    onChange={(e) => setFormData({ ...formData, salarioBase: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auxilioTransporteAplica}
                    onChange={(e) => setFormData({ ...formData, auxilioTransporteAplica: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                  />
                  <span className="text-xs text-slate-300 font-medium">Auxilio de Transporte</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Banco</label>
                <input
                  type="text"
                  value={formData.banco}
                  onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                  placeholder="Ej: Bancolombia, Davivienda, Nequi"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Cuenta</label>
                <select
                  value={formData.tipoCuenta}
                  onChange={(e) => setFormData({ ...formData, tipoCuenta: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="AHORROS">Ahorros</option>
                  <option value="CORRIENTE">Corriente</option>
                  <option value="BILLETERA_DIGITAL">Billetera Digital</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Número de Cuenta</label>
                <input
                  type="text"
                  value={formData.numeroCuenta}
                  onChange={(e) => setFormData({ ...formData, numeroCuenta: e.target.value })}
                  placeholder="Ej: 031-456789-01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
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
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              {loading ? 'Guardando...' : empleadoAEditar ? 'Actualizar Colaborador' : 'Guardar Colaborador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
