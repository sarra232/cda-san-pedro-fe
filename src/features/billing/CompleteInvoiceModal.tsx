import React, { useState, useEffect } from 'react';
import { OrdenIngreso } from '../../types/ingreso';
import { Factura, FacturaFormData, MetodoPago } from '../../types/factura';
import { Tarifa } from '../../types/tarifa';
import { TipoDocumento } from '../../types/auth';
import { formatPlaca, handlePhoneInput } from '../../utils/formatters';
import { siigoService } from '../../services/siigoService';
import { 
  X, 
  Receipt, 
  ShieldCheck, 
  AlertCircle, 
  Loader2,
  CheckSquare,
  Square,
  Building2,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  FileCheck,
  Tag
} from 'lucide-react';

interface CompleteInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orden: OrdenIngreso | null;
  tarifas: Tarifa[];
  onEmitir: (formData: FacturaFormData) => Promise<Factura>;
}

export const CompleteInvoiceModal: React.FC<CompleteInvoiceModalProps> = ({
  isOpen,
  onClose,
  orden,
  tarifas,
  onEmitir,
}) => {
  const [pagadorTipo, setPagadorTipo] = useState<'PROPIETARIO' | 'CONDUCTOR' | 'TERCERO'>('PROPIETARIO');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<string>('');
  const [emitirDian, setEmitirDian] = useState<boolean>(true);

  // Payer details
  const [pagadorTipoDoc, setPagadorTipoDoc] = useState<TipoDocumento>('CC');
  const [pagadorDoc, setPagadorDoc] = useState('');
  const [pagadorNombre, setPagadorNombre] = useState('');
  const [pagadorCelular, setPagadorCelular] = useState('');
  const [pagadorEmail, setPagadorEmail] = useState('');
  const [pagadorDireccion, setPagadorDireccion] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar datos del pagador cuando se selecciona la orden o cambia el tipo de pagador
  const sincronizarDatos = (targetOrden: OrdenIngreso, tipo: 'PROPIETARIO' | 'CONDUCTOR' | 'TERCERO') => {
    if (tipo === 'PROPIETARIO') {
      const prop = targetOrden.vehiculo?.propietario;
      if (prop) {
        setPagadorTipoDoc(prop.tipoDocumento);
        setPagadorDoc(prop.numeroDocumento);
        setPagadorNombre(prop.nombresRazonSocial);
        setPagadorCelular(prop.celular);
        setPagadorEmail(prop.email || '');
        setPagadorDireccion(prop.direccion || '');
      } else {
        setPagadorDoc('');
        setPagadorNombre('');
        setPagadorCelular('');
        setPagadorEmail('');
        setPagadorDireccion('');
      }
    } else if (tipo === 'CONDUCTOR') {
      const cond = targetOrden.conductor || targetOrden.vehiculo?.propietario;
      if (cond) {
        setPagadorTipoDoc(cond.tipoDocumento);
        setPagadorDoc(cond.numeroDocumento);
        setPagadorNombre(cond.nombresRazonSocial);
        setPagadorCelular(cond.celular);
        setPagadorEmail(cond.email || '');
        setPagadorDireccion(cond.direccion || '');
      } else {
        setPagadorDoc('');
        setPagadorNombre('');
        setPagadorCelular('');
        setPagadorEmail('');
        setPagadorDireccion('');
      }
    } else {
      // TERCERO
      setPagadorTipoDoc('NIT');
      setPagadorDoc('');
      setPagadorNombre('');
      setPagadorCelular('');
      setPagadorEmail('');
      setPagadorDireccion('');
    }
  };

  useEffect(() => {
    if (orden && isOpen) {
      setPagadorTipo('PROPIETARIO');
      setMetodoPago('EFECTIVO');
      setMontoRecibido('');
      setError(null);
      sincronizarDatos(orden, 'PROPIETARIO');
    }
  }, [orden, isOpen]);

  const handleTipoChange = (tipo: 'PROPIETARIO' | 'CONDUCTOR' | 'TERCERO') => {
    setPagadorTipo(tipo);
    if (orden) {
      sincronizarDatos(orden, tipo);
    }
  };

  if (!isOpen || !orden) return null;

  const esReinspeccionGratuita = Boolean(orden.esReinspeccion) || orden.tipoServicio === 'REINSPECCION_GRATUITA';

  const getTarifa = (categoria?: string) => {
    if (esReinspeccionGratuita) return 0;
    if (!categoria) return tarifas.find((t) => t.categoria === 'LIVIANO')?.precio || 320000;
    const found = tarifas.find((t) => t.categoria === categoria);
    return found ? found.precio : 320000;
  };

  const currentTotal = getTarifa(orden.vehiculo?.categoria);
  const subtotal = Math.round(currentTotal / 1.19);
  const iva = currentTotal - subtotal;

  const getSiigoServiceInfo = (categoria?: string, esReinspeccion?: boolean) => {
    if (esReinspeccion) {
      return { codigo: '014', nombre: 'REINSPECCION TECNO ($0 COP)', taxId: 'Exento' };
    }
    switch (categoria) {
      case 'MOTO':
        return { codigo: '005', nombre: 'REVISIÓN TÉCNICO MECÁNICA MOTOS (IVA 19%)', taxId: '20358' };
      case 'PESADO':
        return { codigo: '003', nombre: 'REVISION TECNOMECANICA PESADO (IVA 19%)', taxId: '18668' };
      case 'PUBLICO':
        return { codigo: '004', nombre: 'REVISION TECNO AUTO PUBLICO (IVA 19%)', taxId: '18668' };
      case 'LIVIANO':
      default:
        return { codigo: '002', nombre: 'REVISION TECNO AUTO LIVIANO (IVA 19%)', taxId: '18668' };
    }
  };

  const siigoServiceInfo = getSiigoServiceInfo(orden.vehiculo?.categoria, esReinspeccionGratuita);
  const esEmpresa = pagadorTipoDoc === 'NIT' || pagadorTipo === 'TERCERO';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagadorDoc.trim() || !pagadorNombre.trim() || !pagadorCelular.trim()) {
      setError('Debe completar el documento, nombre y celular del pagador de la factura.');
      return;
    }

    if (pagadorTipo === 'TERCERO' && !pagadorEmail.trim()) {
      setError('Para facturar a nombre de empresa o tercero, el correo electrónico es obligatorio para emisión DIAN.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: FacturaFormData = {
        ordenIngresoId: orden.id,
        metodoPago,
        pagadorTipo,
        clienteFacturaData: {
          tipoDocumento: pagadorTipoDoc,
          numeroDocumento: pagadorDoc.trim(),
          nombresRazonSocial: pagadorNombre.trim(),
          celular: pagadorCelular.trim(),
          email: pagadorEmail.trim() || undefined,
          direccion: pagadorDireccion.trim() || undefined,
        },
      };

      const nuevaFactura = await onEmitir(payload);
      
      if (emitirDian && nuevaFactura?.id) {
        try {
          await siigoService.emitirFacturaDian(nuevaFactura.id);
        } catch (dianErr) {
          console.warn('Error al transmitir automáticamente a la DIAN:', dianErr);
        }
      }

      onClose();
    } catch (err: any) {
      let msg = 'Error al emitir factura';
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Completar & Facturar SIIGO</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Turno #{orden.consecutivo || 'S/N'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Placa: <strong className="font-mono text-amber-400">{formatPlaca(orden.vehiculo?.placa)}</strong> • {orden.vehiculo?.marca} {orden.vehiculo?.linea}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Banner de Reinspección Gratuita si aplica */}
          {esReinspeccionGratuita && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-lg">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">Reinspección RTM Gratuita (15 Días)</div>
                  <div className="text-[11px] text-emerald-300">
                    Aplica exención de cobro $0 COP bajo resolución legal de 2da revisión.
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Tarifa $0 COP
              </span>
            </div>
          )}

          {/* Paso 1: Tipo de Pagador y Homologación de Persona */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                ¿A nombre de quién se emite la factura?
              </label>
              <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                {esEmpresa ? (
                  <>
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-sky-400">SIIGO: Company (O-48)</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>SIIGO: Person (R-99-PN)</span>
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTipoChange('PROPIETARIO')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  pagadorTipo === 'PROPIETARIO'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>Propietario Legal</span>
                <span className="text-[10px] font-normal opacity-80">Persona</span>
              </button>
              <button
                type="button"
                onClick={() => handleTipoChange('CONDUCTOR')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  pagadorTipo === 'CONDUCTOR'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>Conductor</span>
                <span className="text-[10px] font-normal opacity-80">Persona</span>
              </button>
              <button
                type="button"
                onClick={() => handleTipoChange('TERCERO')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  pagadorTipo === 'TERCERO'
                    ? 'bg-sky-500 text-slate-950 border-sky-500 shadow-md shadow-sky-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>Empresa / Tercero</span>
                <span className="text-[10px] font-normal opacity-80">NIT Jurídica</span>
              </button>
            </div>
          </div>

          {/* Datos del Pagador */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tipo Doc. *</label>
                <select
                  value={pagadorTipoDoc}
                  onChange={(e) => setPagadorTipoDoc(e.target.value as TipoDocumento)}
                  className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
                >
                  <option value="CC">Cédula (CC - Cód 13)</option>
                  <option value="NIT">NIT (Empresa - Cód 31)</option>
                  <option value="CE">Cédula Ext. (CE - Cód 22)</option>
                  <option value="PASAPORTE">Pasaporte (Cód 41)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Número de Documento / NIT {pagadorTipoDoc === 'NIT' ? '(con dígito de verificación, ej: 900123456-1)' : '*'}
                </label>
                <input
                  type="text"
                  value={pagadorDoc}
                  onChange={(e) => setPagadorDoc(e.target.value)}
                  placeholder={pagadorTipoDoc === 'NIT' ? "900123456-1" : "Ej: 1020304050"}
                  className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 font-mono focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                {pagadorTipoDoc === 'NIT' ? 'Razón Social Oficial *' : 'Nombres y Apellidos Completos *'}
              </label>
              <input
                type="text"
                value={pagadorNombre}
                onChange={(e) => setPagadorNombre(e.target.value)}
                placeholder={pagadorTipoDoc === 'NIT' ? "Transportes San Pedro S.A.S." : "Nombre y apellido del pagador"}
                className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Celular WhatsApp *</label>
                <input
                  type="text"
                  value={pagadorCelular}
                  onChange={(e) => setPagadorCelular(handlePhoneInput(e.target.value))}
                  placeholder="3001234567"
                  className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 font-mono focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Correo Electrónico {esEmpresa ? '(Obligatorio para DIAN *)' : '(Opcional)'}
                </label>
                <input
                  type="email"
                  value={pagadorEmail}
                  onChange={(e) => setPagadorEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
                  required={esEmpresa}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Dirección Física (Opcional)</label>
              <input
                type="text"
                value={pagadorDireccion}
                onChange={(e) => setPagadorDireccion(e.target.value)}
                placeholder="Calle 10 # 20-30"
                className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Paso 2: Forma de Pago Homologada con SIIGO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Forma de Pago (SIIGO Cloud)
              </label>
              <span className="text-[10px] text-slate-400">
                Código homologado en catálogo contable
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setMetodoPago('EFECTIVO')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                  metodoPago === 'EFECTIVO'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Efectivo</span>
                <span className="text-[10px] font-mono opacity-80">SIIGO: 5014</span>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago('TRANSFERENCIA')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                  metodoPago === 'TRANSFERENCIA'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Transferencia</span>
                <span className="text-[10px] font-mono opacity-80">SIIGO: 7767</span>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago('DATAFONO_TARJETA')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                  metodoPago === 'DATAFONO_TARJETA'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Datáfono</span>
                <span className="text-[10px] font-mono opacity-80">SIIGO: 5016</span>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago('SISTECREDITO')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                  metodoPago === 'SISTECREDITO'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>Sistecrédito</span>
                <span className="text-[10px] font-mono opacity-80">SIIGO: 5015</span>
              </button>
            </div>

            {/* Calculadora de Efectivo / Cambio */}
            {metodoPago === 'EFECTIVO' && currentTotal > 0 && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="block text-slate-400 text-[11px] font-bold mb-1">Monto Recibido en Caja:</label>
                  <input
                    type="number"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    placeholder="Ej. 350000"
                    className="w-full bg-slate-900 border border-slate-800 text-white font-mono font-bold text-xs rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Cambio / Vueltos:</span>
                  <p className={`font-mono font-black text-sm ${
                    Number(montoRecibido) >= currentTotal ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {montoRecibido ? (
                      Number(montoRecibido) >= currentTotal 
                        ? `$ ${(Number(montoRecibido) - currentTotal).toLocaleString('es-CO')} COP`
                        : `Faltan $ ${(currentTotal - Number(montoRecibido)).toLocaleString('es-CO')} COP`
                    ) : '$ 0 COP'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Resumen de Liquidación & Homologación de Servicio */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <div className="flex items-center gap-1.5 text-slate-200">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">Servicio SIIGO:</span>
                <span className="font-mono text-amber-300 font-extrabold">Cód. {siigoServiceInfo.codigo}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Impuesto ID: {siigoServiceInfo.taxId}
              </span>
            </div>

            <div className="flex justify-between text-slate-300">
              <span>Descripción SIIGO:</span>
              <span className="font-semibold text-white">{siigoServiceInfo.nombre}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Subtotal (Base Imponible):</span>
              <span className="font-mono text-slate-200">${subtotal.toLocaleString('es-CO')} COP</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>IVA (19% Incluido):</span>
              <span className="font-mono text-slate-200">${iva.toLocaleString('es-CO')} COP</span>
            </div>
            <div className="flex justify-between text-white font-bold text-base border-t border-amber-500/30 pt-2">
              <span>Total a Facturar & Recaudar:</span>
              <span className="font-mono text-amber-400 text-lg font-black">
                ${currentTotal.toLocaleString('es-CO')} COP
              </span>
            </div>
          </div>

          {/* Opción de Facturación Electrónica SIIGO */}
          <div 
            onClick={() => setEmitirDian(!emitirDian)}
            className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-cda-dark-950 border border-slate-800 hover:border-amber-500/30 cursor-pointer transition-colors"
          >
            <button
              type="button"
              className="text-amber-400 focus:outline-none"
            >
              {emitirDian ? (
                <CheckSquare className="w-5 h-5 text-amber-400" />
              ) : (
                <Square className="w-5 h-5 text-slate-500" />
              )}
            </button>
            <div className="text-xs">
              <span className="font-bold text-white block">Transmitir Factura Electrónica a la DIAN (SIIGO Cloud)</span>
              <span className="text-slate-400 text-[11px]">
                Registra la venta con el código de producto, forma de pago y genera CUFE oficial con 1 solo clic.
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Emitiendo Factura SIIGO...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Confirmar & Facturar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
