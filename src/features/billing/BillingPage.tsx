import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Car, 
  Bike, 
  Truck, 
  Bus, 
  Printer, 
  Search, 
  X, 
  AlertCircle, 
  Send,
  Loader2,
  FileText,
  History,
  Tag,
  Save,
  Lock,
  Edit3
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ingresoService } from '../../services/ingresoService';
import { facturaService } from '../../services/facturaService';
import { tarifaService } from '../../services/tarifaService';
import { useAuthStore } from '../../store/useAuthStore';
import { OrdenIngreso } from '../../types/ingreso';
import { Factura, MetodoPago, FacturaFormData } from '../../types/factura';
import { Tarifa } from '../../types/tarifa';
import { TipoDocumento } from '../../types/auth';
import { formatPlaca, handlePhoneInput, formatDocumento } from '../../utils/formatters';
import { Pagination } from '../../components/common/Pagination';

export function BillingPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'ADMINISTRADOR';

  const [searchParams] = useSearchParams();
  const initialIngresoId = searchParams.get('ingresoId') || '';

  // Tab State: 'LIQUIDAR' | 'HISTORIAL' | 'TARIFAS'
  const [activeTab, setActiveTab] = useState<'LIQUIDAR' | 'HISTORIAL' | 'TARIFAS'>('LIQUIDAR');

  // State
  const [ingresosHoy, setIngresosHoy] = useState<OrdenIngreso[]>([]);
  const [selectedIngreso, setSelectedIngreso] = useState<OrdenIngreso | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [isEmitting, setIsEmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Historial Filters & Pagination State
  const [searchFilter, setSearchFilter] = useState('');
  const [filterMetodoPago, setFilterMetodoPago] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form State
  const [pagadorTipo, setPagadorTipo] = useState<'PROPIETARIO' | 'CONDUCTOR' | 'TERCERO'>('PROPIETARIO');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<string>('');

  // Editable Payer Data (if not previously recorded)
  const [pagadorTipoDoc, setPagadorTipoDoc] = useState<TipoDocumento>('CC');
  const [pagadorDoc, setPagadorDoc] = useState('');
  const [pagadorNombre, setPagadorNombre] = useState('');
  const [pagadorCelular, setPagadorCelular] = useState('');
  const [pagadorEmail, setPagadorEmail] = useState('');
  const [pagadorDireccion, setPagadorDireccion] = useState('');

  // Success Modal
  const [facturaEmitida, setFacturaEmitida] = useState<Factura | null>(null);

  // Modal de Edición de Tarifa
  const [editingTarifa, setEditingTarifa] = useState<Tarifa | null>(null);
  const [tarifaNombre, setTarifaNombre] = useState('');
  const [tarifaDesc, setTarifaDesc] = useState('');
  const [tarifaPrecio, setTarifaPrecio] = useState<number | ''>('');
  const [tarifaActivo, setTarifaActivo] = useState(true);
  const [isSavingTarifa, setIsSavingTarifa] = useState(false);
  const [tarifaModalOpen, setTarifaModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [listos, facts, tList] = await Promise.all([
        ingresoService.getListosParaFacturar(),
        facturaService.getFacturas(),
        tarifaService.getTarifas(),
      ]);

      setIngresosHoy(listos);
      setFacturas(facts);
      setTarifas(tList);

      if (initialIngresoId) {
        let target: OrdenIngreso | null | undefined = listos.find((i) => i.id === initialIngresoId);
        if (!target) {
          try {
            target = await ingresoService.getIngresoById(initialIngresoId);
          } catch {
            target = null;
          }
        }
        if (target) {
          setSelectedIngreso(target);
          sincronizarDatosPagador(target, 'PROPIETARIO');
        }
      } else if (listos.length > 0 && !selectedIngreso) {
        setSelectedIngreso(listos[0]);
        sincronizarDatosPagador(listos[0], 'PROPIETARIO');
      }
    } catch {
      // Ignorar
    }
  };

  useEffect(() => {
    loadData();
  }, [initialIngresoId]);

  const sincronizarDatosPagador = (orden: OrdenIngreso, tipo: 'PROPIETARIO' | 'CONDUCTOR' | 'TERCERO') => {
    if (tipo === 'PROPIETARIO') {
      const prop = orden.vehiculo?.propietario;
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
      const cond = orden.conductor || orden.vehiculo?.propietario;
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

  const handleSelectOrden = (orden: OrdenIngreso) => {
    setSelectedIngreso(orden);
    sincronizarDatosPagador(orden, pagadorTipo);
    setError(null);
  };

  const handlePagadorTipoChange = (tipo: 'PROPIETARIO' | 'CONDUCTOR' | 'TERCERO') => {
    setPagadorTipo(tipo);
    if (selectedIngreso) {
      sincronizarDatosPagador(selectedIngreso, tipo);
    }
  };

  const isSelectedFacturado = selectedIngreso?.estado === 'FACTURADO';

  const getTarifa = (categoria?: string) => {
    if (!categoria) return tarifas.find((t) => t.categoria === 'LIVIANO')?.precio || 320000;
    const found = tarifas.find((t) => t.categoria === categoria);
    return found ? found.precio : 320000;
  };

  const currentTotal = selectedIngreso ? getTarifa(selectedIngreso.vehiculo?.categoria) : 0;
  const subtotal = Math.round(currentTotal / 1.19);
  const iva = currentTotal - subtotal;

  const handleEmitirFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngreso) return;

    if (isSelectedFacturado) {
      setError('Esta orden de ingreso ya tiene una factura emitida.');
      return;
    }

    if (!pagadorDoc.trim() || !pagadorNombre.trim() || !pagadorCelular.trim()) {
      setError('Debe completar el documento, nombre y celular del pagador de la factura.');
      return;
    }

    if (pagadorTipo === 'TERCERO' && !pagadorEmail.trim()) {
      setError('Para facturar a nombre de una empresa o tercero, el correo electrónico es obligatorio.');
      return;
    }

    setIsEmitting(true);
    setError(null);

    try {
      const payload: FacturaFormData = {
        ordenIngresoId: selectedIngreso.id,
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

      const res = await facturaService.emitirFactura(payload);
      setFacturaEmitida(res);
      setIsEmitting(false);
      loadData();
    } catch (err: unknown) {
      let msg = 'Error al emitir factura';
      if (err && typeof err === 'object' && 'response' in err) {
        const resData = (err as { response: { data?: { message?: string } } }).response?.data;
        if (resData?.message) msg = resData.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      setIsEmitting(false);
    }
  };

  const handleOpenEditTarifa = (t: Tarifa) => {
    setEditingTarifa(t);
    setTarifaNombre(t.nombreServicio);
    setTarifaDesc(t.descripcion || '');
    setTarifaPrecio(t.precio);
    setTarifaActivo(t.activo);
    setTarifaModalOpen(true);
  };

  const handleSaveTarifa = async () => {
    if (!editingTarifa || tarifaPrecio === '' || Number(tarifaPrecio) < 0) return;
    setIsSavingTarifa(true);

    try {
      await tarifaService.updateTarifa(editingTarifa.id, {
        nombreServicio: tarifaNombre.trim(),
        descripcion: tarifaDesc.trim() || undefined,
        precio: Number(tarifaPrecio),
        activo: tarifaActivo,
      });

      setTarifaModalOpen(false);
      const updatedList = await tarifaService.getTarifas();
      setTarifas(updatedList);
    } catch (err: unknown) {
      let msg = 'Error al actualizar tarifa';
      if (err && typeof err === 'object' && 'response' in err) {
        const resData = (err as { response: { data?: { message?: string } } }).response?.data;
        if (resData?.message) msg = resData.message;
      }
      alert(msg);
    } finally {
      setIsSavingTarifa(false);
    }
  };

  const handleDownloadPdf = async (facturaId: string, numeroFactura: string) => {
    try {
      await facturaService.downloadPdf(facturaId, numeroFactura);
    } catch {
      alert('Error al descargar el PDF de la factura.');
    }
  };

  const handleSendWhatsApp = async (facturaId: string) => {
    try {
      await facturaService.enviarFactura(facturaId);
      alert('¡Comprobante de factura enviado exitosamente por WhatsApp!');
    } catch {
      alert('Error al enviar la notificación por WhatsApp.');
    }
  };

  // Historial filtering
  const filteredFacturas = facturas.filter((f) => {
    const matchesSearch = 
      (f.numeroFactura && f.numeroFactura.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (f.clienteFactura?.nombresRazonSocial && f.clienteFactura.nombresRazonSocial.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (f.ordenIngreso?.vehiculo?.placa && f.ordenIngreso.vehiculo.placa.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (f.clienteFactura?.numeroDocumento && f.clienteFactura.numeroDocumento.includes(searchFilter));

    const matchesMetodo = filterMetodoPago === 'TODOS' || f.metodoPago === filterMetodoPago;
    return matchesSearch && matchesMetodo;
  });

  const getCategoryIcon = (categoria?: string) => {
    switch (categoria) {
      case 'MOTO': return <Bike className="w-5 h-5 text-amber-400" />;
      case 'PESADO': return <Truck className="w-5 h-5 text-rose-400" />;
      case 'PUBLICO': return <Bus className="w-5 h-5 text-purple-400" />;
      default: return <Car className="w-5 h-5 text-cda-yellow-400" />;
    }
  };

  const ordenesPendientesCobro = ingresosHoy.filter((i) => i.estado !== 'FACTURADO');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Facturación & Caja</span>
            <span className="text-xs font-extrabold text-cda-yellow-400 bg-cda-yellow-400/10 px-2.5 py-0.5 rounded-full border border-cda-yellow-400/20">
              Recaudo Oficial
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Liquidación oficial de servicios RTM, gestión de tarifas y emisión de comprobantes
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-cda-dark-900 p-1 rounded-2xl border border-cda-dark-700/80">
          <button
            onClick={() => setActiveTab('LIQUIDAR')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'LIQUIDAR'
                ? 'bg-cda-yellow-500 text-black shadow-lg shadow-cda-yellow-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Emitir Factura</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORIAL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'HISTORIAL'
                ? 'bg-cda-yellow-500 text-black shadow-lg shadow-cda-yellow-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial ({facturas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('TARIFAS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'TARIFAS'
                ? 'bg-cda-yellow-500 text-black shadow-lg shadow-cda-yellow-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Tarifas Oficiales</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: LIQUIDAR & COBRAR */}
      {activeTab === 'LIQUIDAR' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 & 2: Formulario de Liquidación */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Selector de Orden en Turno */}
            <div className="cda-glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-cda-dark-700/80 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-cda-dark-800">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-cda-yellow-500/20 text-cda-yellow-400 flex items-center justify-center text-[11px]">
                    1
                  </span>
                  <span>Vehículo a Liquidar</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {ordenesPendientesCobro.length} órdenes listas para cobro
                </span>
              </div>

              {ordenesPendientesCobro.length === 0 ? (
                <div className="p-4 rounded-2xl bg-cda-dark-900/60 border border-cda-dark-800 text-center text-xs text-slate-400">
                  No hay órdenes pendientes de cobro en este momento. Registra un vehículo desde Recepción.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {ordenesPendientesCobro.map((orden) => (
                    <button
                      key={orden.id}
                      type="button"
                      onClick={() => handleSelectOrden(orden)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedIngreso?.id === orden.id
                          ? 'bg-cda-yellow-500/15 border-cda-yellow-500 text-white shadow-md shadow-cda-yellow-500/10'
                          : 'bg-cda-dark-900/60 border-cda-dark-800 text-slate-400 hover:border-cda-dark-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-cda-yellow-400 text-sm">
                          {formatPlaca(orden.vehiculo?.placa)}
                        </span>
                        <span className="text-[10px] font-mono bg-cda-dark-950 px-2 py-0.5 rounded border border-cda-dark-800 text-slate-300">
                          Turno #{orden.consecutivo || 'S/N'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 font-medium truncate">
                        {orden.vehiculo?.marca} {orden.vehiculo?.linea}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        Prop: {orden.vehiculo?.propietario?.nombresRazonSocial || 'No asignado'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: ¿A Nombre de Quién se Emite la Factura? */}
            <div className="cda-glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-cda-dark-700/80 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-cda-dark-800">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-cda-yellow-500/20 text-cda-yellow-400 flex items-center justify-center text-[11px]">
                    2
                  </span>
                  <span>Datos del Pagador & Emisión de Factura</span>
                </div>
              </div>

              {/* Selector de Tipo de Pagador */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePagadorTipoChange('PROPIETARIO')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    pagadorTipo === 'PROPIETARIO'
                      ? 'bg-cda-yellow-500 text-black border-cda-yellow-500 shadow'
                      : 'bg-cda-dark-900 border-cda-dark-800 text-slate-300 hover:text-white'
                  }`}
                >
                  Propietario Legal
                </button>
                <button
                  type="button"
                  onClick={() => handlePagadorTipoChange('CONDUCTOR')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    pagadorTipo === 'CONDUCTOR'
                      ? 'bg-cda-yellow-500 text-black border-cda-yellow-500 shadow'
                      : 'bg-cda-dark-900 border-cda-dark-800 text-slate-300 hover:text-white'
                  }`}
                >
                  Conductor / Chofer
                </button>
                <button
                  type="button"
                  onClick={() => handlePagadorTipoChange('TERCERO')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    pagadorTipo === 'TERCERO'
                      ? 'bg-cda-yellow-500 text-black border-cda-yellow-500 shadow'
                      : 'bg-cda-dark-900 border-cda-dark-800 text-slate-300 hover:text-white'
                  }`}
                >
                  Empresa / Tercero
                </button>
              </div>

              {/* Formulario Editable del Pagador */}
              <div className="p-4 rounded-2xl bg-cda-dark-900/60 border border-cda-dark-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex gap-2">
                    <select
                      value={pagadorTipoDoc}
                      onChange={(e) => setPagadorTipoDoc(e.target.value as TipoDocumento)}
                      className="w-20 bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-2 py-2"
                    >
                      <option value="CC">CC</option>
                      <option value="NIT">NIT</option>
                      <option value="CE">CE</option>
                      <option value="PASAPORTE">PAS</option>
                    </select>
                    <input
                      type="text"
                      value={pagadorDoc}
                      onChange={(e) => setPagadorDoc(e.target.value)}
                      placeholder="Documento / NIT *"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2 font-mono"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={pagadorNombre}
                      onChange={(e) => setPagadorNombre(e.target.value)}
                      placeholder="Nombres o Razón Social *"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={pagadorCelular}
                      onChange={(e) => setPagadorCelular(handlePhoneInput(e.target.value))}
                      placeholder="Celular WhatsApp *"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2 font-mono"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="email"
                      value={pagadorEmail}
                      onChange={(e) => setPagadorEmail(e.target.value)}
                      placeholder={pagadorTipo === 'TERCERO' ? 'Correo Electrónico (Obligatorio para Factura) *' : 'Correo Electrónico (Opcional)'}
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2"
                      required={pagadorTipo === 'TERCERO'}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={pagadorDireccion}
                      onChange={(e) => setPagadorDireccion(e.target.value)}
                      placeholder="Dirección (Opcional)"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Método de Pago & Calculadora de Cambio */}
            <div className="cda-glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-cda-dark-700/80 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-cda-dark-800">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-cda-yellow-500/20 text-cda-yellow-400 flex items-center justify-center text-[11px]">
                    3
                  </span>
                  <span>Método de Pago</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMetodoPago('EFECTIVO')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    metodoPago === 'EFECTIVO'
                      ? 'bg-cda-yellow-500 text-black border-cda-yellow-500 shadow'
                      : 'bg-cda-dark-900 border-cda-dark-800 text-slate-300 hover:text-white'
                  }`}
                >
                  💵 Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('TRANSFERENCIA')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    metodoPago === 'TRANSFERENCIA'
                      ? 'bg-cda-yellow-500 text-black border-cda-yellow-500 shadow'
                      : 'bg-cda-dark-900 border-cda-dark-800 text-slate-300 hover:text-white'
                  }`}
                >
                  📱 Transferencia
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('DATAFONO_TARJETA')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    metodoPago === 'DATAFONO_TARJETA'
                      ? 'bg-cda-yellow-500 text-black border-cda-yellow-500 shadow'
                      : 'bg-cda-dark-900 border-cda-dark-800 text-slate-300 hover:text-white'
                  }`}
                >
                  💳 Datáfono
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('SISTECREDITO')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    metodoPago === 'SISTECREDITO'
                      ? 'bg-cda-yellow-500 text-black border-cda-yellow-500 shadow'
                      : 'bg-cda-dark-900 border-cda-dark-800 text-slate-300 hover:text-white'
                  }`}
                >
                  📑 Sistecrédito
                </button>
              </div>

              {/* Calculadora de Efectivo / Cambio */}
              {metodoPago === 'EFECTIVO' && selectedIngreso && (
                <div className="p-4 rounded-2xl bg-cda-dark-950 border border-cda-dark-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">Monto Recibido del Cliente:</label>
                    <input
                      type="number"
                      value={montoRecibido}
                      onChange={(e) => setMontoRecibido(e.target.value)}
                      placeholder="Ej. 350000"
                      className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white font-mono font-bold text-sm rounded-xl px-3 py-2"
                    />
                  </div>

                  <div className="flex flex-col justify-center">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">Cambio / Vueltas a Entregar:</span>
                    <p className={`font-mono font-black text-lg ${
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
          </div>

          {/* Col 3: Resumen Financiero & Botón de Cobro */}
          <div className="space-y-6">
            <div className="cda-glass rounded-2xl sm:rounded-3xl p-6 border border-cda-yellow-500/40 space-y-6 shadow-2xl">
              <h3 className="font-black text-white text-base border-b border-cda-dark-800 pb-3 flex items-center justify-between">
                <span>Resumen de Liquidación</span>
                <span className="text-xs bg-cda-yellow-400 text-black px-2 py-0.5 rounded font-mono font-bold">
                  {selectedIngreso?.vehiculo?.categoria || 'RTM'}
                </span>
              </h3>

              {selectedIngreso ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Placa del Vehículo:</span>
                    <span className="whitespace-nowrap font-mono font-black text-cda-yellow-400 text-base">
                      {formatPlaca(selectedIngreso.vehiculo?.placa)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Servicio Oficial:</span>
                    <span className="text-white font-bold text-right">
                      {tarifas.find((t) => t.categoria === selectedIngreso.vehiculo?.categoria)?.nombreServicio || 'RTM & Emisiones'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Método de Cobro:</span>
                    <span className="text-slate-200 font-mono uppercase font-bold">{metodoPago}</span>
                  </div>

                  <div className="pt-3 border-t border-cda-dark-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Subtotal (Base Gravable):</span>
                      <span className="font-mono">$ {subtotal.toLocaleString('es-CO')} COP</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>IVA (19% Incluido):</span>
                      <span className="font-mono">$ {iva.toLocaleString('es-CO')} COP</span>
                    </div>

                    <div className="flex items-center justify-between text-white font-bold text-base pt-2 border-t border-cda-dark-800">
                      <span>Total a Recaudar:</span>
                      <span className="font-mono text-cda-yellow-400 text-xl font-black">
                        $ {currentTotal.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleEmitirFactura}
                    disabled={isEmitting || isSelectedFacturado}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-cda-yellow-500 to-amber-500 hover:from-cda-yellow-400 hover:to-amber-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cda-yellow-500/20 transition-all disabled:opacity-50 mt-4"
                  >
                    {isEmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                        <span>Generando Factura & PDF...</span>
                      </>
                    ) : isSelectedFacturado ? (
                      <span>✓ Factura Ya Emitida</span>
                    ) : (
                      <>
                        <Receipt className="w-5 h-5" />
                        <span>Confirmar & Emitir Factura</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Selecciona una orden de ingreso para ver su liquidación.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIAL DE FACTURAS EMITIDAS */}
      {activeTab === 'HISTORIAL' && (
        <div className="space-y-4">
          {/* Toolbar & Filters */}
          <div className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => {
                    setSearchFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Buscar por # factura, placa o pagador..."
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cda-yellow-500 focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={filterMetodoPago}
                  onChange={(e) => {
                    setFilterMetodoPago(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-cda-yellow-500 focus:outline-none"
                >
                  <option value="TODOS">Todos los Métodos de Pago</option>
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TRANSFERENCIA">📱 Transferencia</option>
                  <option value="DATAFONO_TARJETA">💳 Datáfono / Tarjeta</option>
                  <option value="SISTECREDITO">📑 Sistecrédito</option>
                </select>
              </div>
            </div>
          </div>

          {/* Facturas Table */}
          <div className="cda-glass rounded-2xl border border-cda-dark-700/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 bg-cda-dark-900/80 border-b border-cda-dark-800">
                  <tr>
                    <th className="p-3.5 font-semibold">Factura / Fecha</th>
                    <th className="p-3.5 font-semibold">Placa / Vehículo</th>
                    <th className="p-3.5 font-semibold">Cliente Pagador</th>
                    <th className="p-3.5 font-semibold">Método & Total</th>
                    <th className="p-3.5 font-semibold text-right">Comprobantes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cda-dark-800 text-slate-200">
                  {filteredFacturas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No se encontraron facturas con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredFacturas
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((f) => (
                        <tr key={f.id} className="hover:bg-cda-dark-800/40 transition-colors">
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-white block">{f.numeroFactura}</span>
                            <span className="text-[10px] text-slate-400">
                              {f.fechaEmision ? new Date(f.fechaEmision).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="whitespace-nowrap font-mono font-black text-cda-yellow-400 text-xs">
                              {formatPlaca(f.ordenIngreso?.vehiculo?.placa)}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-bold text-white block">{f.clienteFactura?.nombresRazonSocial || 'Cliente'}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {f.clienteFactura?.tipoDocumento} {formatDocumento(f.clienteFactura?.numeroDocumento)}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-mono font-black text-emerald-400 block text-xs">
                              $ {f.total?.toLocaleString('es-CO')} COP
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-mono">{f.metodoPago}</span>
                          </td>

                          <td className="p-3.5 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(f.id, f.numeroFactura)}
                              className="inline-flex items-center gap-1 bg-cda-dark-800 hover:bg-cda-dark-700 text-cda-yellow-400 px-2.5 py-1.5 rounded-lg border border-cda-dark-700 text-xs font-bold"
                              title="Descargar Comprobante PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(f.id)}
                              className="inline-flex items-center gap-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                              title="Enviar por WhatsApp"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredFacturas.length / itemsPerPage) || 1}
            totalItems={filteredFacturas.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}

      {/* TAB 3: TARIFAS & PRECIOS OFICIALES DINÁMICOS */}
      {activeTab === 'TARIFAS' && (
        <div className="space-y-6">
          <div className="cda-glass rounded-2xl p-5 border border-cda-dark-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-cda-yellow-400" />
                <span>Lista Oficial de Tarifas Reguladas CDA San Pedro</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Precios base oficiales aplicados a las liquidaciones según la categoría vehicular (NTC 5375).
              </p>
            </div>

            {isAdmin ? (
              <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5">
                <span>✓ Edición Habilitada (Administrador)</span>
              </span>
            ) : (
              <span className="text-xs bg-cda-dark-800 text-slate-400 border border-cda-dark-700 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Modo Consulta</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tarifas.map((t) => {
              const sub = Math.round(t.precio / 1.19);
              const iv = t.precio - sub;

              return (
                <div
                  key={t.id}
                  className="cda-glass rounded-2xl sm:rounded-3xl p-5 border border-cda-dark-700/80 hover:border-cda-yellow-500/40 transition-all space-y-4 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-cda-dark-800">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-cda-yellow-500/10">
                        {getCategoryIcon(t.categoria)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{t.nombreServicio}</span>
                          <span className="text-[10px] bg-cda-dark-900 text-cda-yellow-400 font-mono px-2 py-0.5 rounded border border-cda-dark-700 font-bold">
                            {t.categoria}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{t.descripcion}</p>
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditTarifa(t)}
                        className="bg-cda-dark-800 hover:bg-cda-yellow-500 hover:text-black text-slate-300 font-bold px-3 py-1.5 rounded-xl text-xs border border-cda-dark-700 flex items-center gap-1.5 transition-all shrink-0"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>

                  {/* Precios y Desglose */}
                  <div className="grid grid-cols-3 gap-2 bg-cda-dark-900/80 p-3.5 rounded-2xl border border-cda-dark-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Base (sin IVA):</span>
                      <p className="font-mono font-bold text-slate-300 mt-0.5">$ {sub.toLocaleString('es-CO')}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">IVA (19%):</span>
                      <p className="font-mono font-bold text-slate-300 mt-0.5">$ {iv.toLocaleString('es-CO')}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-cda-yellow-400 block uppercase font-bold">Precio Oficial:</span>
                      <p className="font-mono font-black text-cda-yellow-400 text-sm mt-0.5">
                        $ {t.precio?.toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Edición de Tarifa */}
      {tarifaModalOpen && editingTarifa && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cda-glass rounded-3xl p-6 max-w-md w-full border border-cda-yellow-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cda-dark-800">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-cda-yellow-400" />
                <h3 className="font-black text-white text-base">
                  Modificar Tarifa Oficial
                </h3>
              </div>
              <button
                onClick={() => setTarifaModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-cda-dark-900 border border-cda-dark-800 flex items-center justify-between">
              <span className="font-bold text-white text-sm">{editingTarifa.nombreServicio}</span>
              <span className="text-xs bg-cda-yellow-400 text-black font-mono font-black px-2 py-0.5 rounded">
                {editingTarifa.categoria}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre del Servicio:</label>
                <input
                  type="text"
                  value={tarifaNombre}
                  onChange={(e) => setTarifaNombre(e.target.value)}
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white rounded-xl px-3 py-2 focus:border-cda-yellow-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Precio Total al Usuario ($ COP):</label>
                <input
                  type="number"
                  value={tarifaPrecio}
                  onChange={(e) => setTarifaPrecio(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0}
                  step={1000}
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-cda-yellow-400 font-mono font-black text-base rounded-xl px-3 py-2 focus:border-cda-yellow-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Descripción / Alcance:</label>
                <textarea
                  value={tarifaDesc}
                  onChange={(e) => setTarifaDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-slate-300 rounded-xl px-3 py-2 resize-none focus:border-cda-yellow-500 focus:outline-none"
                />
              </div>

              {/* Vista previa en vivo */}
              {tarifaPrecio !== '' && Number(tarifaPrecio) > 0 && (
                <div className="p-3 rounded-xl bg-cda-dark-950 border border-cda-dark-800 space-y-1 text-[11px]">
                  <span className="text-slate-400 font-bold block uppercase">Desglose Fiscal Calculado:</span>
                  <div className="flex justify-between text-slate-300">
                    <span>Base sin IVA:</span>
                    <span className="font-mono">$ {Math.round(Number(tarifaPrecio) / 1.19).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>IVA 19%:</span>
                    <span className="font-mono">$ {(Number(tarifaPrecio) - Math.round(Number(tarifaPrecio) / 1.19)).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-cda-yellow-400 font-bold border-t border-cda-dark-800 pt-1">
                    <span>Total a Facturar:</span>
                    <span className="font-mono font-black">$ {Number(tarifaPrecio).toLocaleString('es-CO')} COP</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTarifaModalOpen(false)}
                className="w-1/3 py-2.5 rounded-xl bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTarifa}
                disabled={isSavingTarifa}
                className="w-2/3 py-2.5 rounded-xl bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cda-yellow-500/20"
              >
                {isSavingTarifa ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4" />}
                <span>Guardar Tarifa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito al Emitir Factura */}
      {facturaEmitida && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cda-glass rounded-3xl p-6 sm:p-7 max-w-md w-full border border-emerald-500/40 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 mx-auto shadow-lg shadow-emerald-500/20">
              <Receipt className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">¡Factura Emitida con Éxito!</h3>
              <p className="font-mono font-black text-cda-yellow-400 text-lg mt-1">
                {facturaEmitida.numeroFactura}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Cliente: <strong className="text-white">{facturaEmitida.clienteFactura?.nombresRazonSocial}</strong>
              </p>
              <p className="text-xs font-mono text-emerald-400 font-bold mt-0.5">
                Total Cobrado: $ {facturaEmitida.total?.toLocaleString('es-CO')} COP ({facturaEmitida.metodoPago})
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleDownloadPdf(facturaEmitida.id, facturaEmitida.numeroFactura)}
                className="w-full py-3 rounded-xl bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cda-yellow-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>Descargar Comprobante PDF Oficial</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendWhatsApp(facturaEmitida.id)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Factura a WhatsApp del Cliente</span>
              </button>

              <button
                type="button"
                onClick={() => setFacturaEmitida(null)}
                className="w-full py-2.5 rounded-xl bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-400 hover:text-white font-semibold text-xs transition-colors"
              >
                Cerrar y Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
