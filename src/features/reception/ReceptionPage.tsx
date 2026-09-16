import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Plus, 
  Loader2, 
  Receipt, 
  Bike, 
  Truck, 
  Bus, 
  Printer, 
  Wrench, 
  Search, 
  X, 
  ShieldCheck, 
  ShieldAlert,
  ListOrdered
} from 'lucide-react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { vehiculoService } from '../../services/vehiculoService';
import { clienteService } from '../../services/clienteService';
import { ingresoService } from '../../services/ingresoService';
import { reinspeccionService } from '../../services/reinspeccionService';
import { Vehiculo, CategoriaVehiculo } from '../../types/vehiculo';
import { Cliente } from '../../types/cliente';
import { OrdenIngreso, EstadoOrden, OrdenIngresoFormData } from '../../types/ingreso';
import { ReinspeccionVerificacion } from '../../types/reinspeccion';
import { TipoDocumento } from '../../types/auth';
import { formatPlaca, handlePlacaInput, cleanPlaca, handlePhoneInput, formatPhone, formatDocumento, sanitizeDate } from '../../utils/formatters';
import { Pagination } from '../../components/common/Pagination';
import { TicketTermicoModal } from './TicketTermicoModal';

export function ReceptionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlacaParam = searchParams.get('placa') || '';
  const initialOrdenPadreId = searchParams.get('ordenPadreId') || '';
  const initialEsReinspeccion = searchParams.get('esReinspeccion') === 'true';

  // Tab State: 'FORMULARIO' (Nuevo Turno) | 'HISTORIAL' (Turnos de Hoy)
  const [activeTab, setActiveTab] = useState<'FORMULARIO' | 'HISTORIAL'>('FORMULARIO');

  // Form State
  const [placaInput, setPlacaInput] = useState(initialPlacaParam.toUpperCase());
  const [vehiculoEncontrado, setVehiculoEncontrado] = useState<Vehiculo | null>(null);
  const [isSearchingPlaca, setIsSearchingPlaca] = useState(false);
  const [isVehiculoNuevo, setIsVehiculoNuevo] = useState(false);
  const [reinspeccionVerif, setReinspeccionVerif] = useState<ReinspeccionVerificacion | null>(null);

  // Placa autocomplete suggestions
  const [placaSugerencias, setPlacaSugerencias] = useState<Vehiculo[]>([]);
  const [showPlacaDropdown, setShowPlacaDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New Vehicle form fields if not found
  const [nuevoVehCategoria, setNuevoVehCategoria] = useState<CategoriaVehiculo>('LIVIANO');
  const [nuevoVehMarca, setNuevoVehMarca] = useState('');
  const [nuevoVehLinea, setNuevoVehLinea] = useState('');
  const [nuevoVehModelo, setNuevoVehModelo] = useState(new Date().getFullYear());
  const [nuevoVehSoat, setNuevoVehSoat] = useState('');
  const [nuevoVehRtm, setNuevoVehRtm] = useState('');

  // Propietario State (Owner)
  const [propietarioDoc, setPropietarioDoc] = useState('');
  const [propietarioTipoDoc, setPropietarioTipoDoc] = useState<TipoDocumento>('CC');
  const [propietarioNombre, setPropietarioNombre] = useState('');
  const [propietarioCelular, setPropietarioCelular] = useState('');
  const [propietarioEmail, setPropietarioEmail] = useState('');
  const [propietarioEncontrado, setPropietarioEncontrado] = useState<Cliente | null>(null);
  const [isEditingPropietario, setIsEditingPropietario] = useState(false);

  // Ingreso Fields
  const [kilometraje, setKilometraje] = useState<number | ''>('');
  const [tipoServicio, setTipoServicio] = useState('RTM_LEGAL');
  const [conductorEsPropietario, setConductorEsPropietario] = useState(true);
  const [observaciones, setObservaciones] = useState('');

  // Driver Third-Party Fields (if conductorEsPropietario === false)
  const [conductorDoc, setConductorDoc] = useState('');
  const [conductorTipoDoc, setConductorTipoDoc] = useState<TipoDocumento>('CC');
  const [conductorNombre, setConductorNombre] = useState('');
  const [conductorCelular, setConductorCelular] = useState('');
  const [conductorEncontrado, setConductorEncontrado] = useState<Cliente | null>(null);

  // Status & List State
  const [ingresosHoy, setIngresosHoy] = useState<OrdenIngreso[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Banner de éxito no invasivo tras crear orden
  const [ordenCreadaBanner, setOrdenCreadaBanner] = useState<OrdenIngreso | null>(null);
  const [selectedTicketOrden, setSelectedTicketOrden] = useState<OrdenIngreso | null>(null);

  const loadIngresosHoy = async () => {
    try {
      const list = await ingresoService.getIngresosHoy();
      setIngresosHoy(list);
    } catch {
      // Ignorar
    }
  };

  useEffect(() => {
    loadIngresosHoy();
    if (initialPlacaParam) {
      handleBuscarPlaca(initialPlacaParam);
    }
  }, [initialPlacaParam]);

  // Click outside to close plate suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPlacaDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePlacaChange = async (val: string) => {
    const formatted = handlePlacaInput(val);
    setPlacaInput(formatted);
    const clean = cleanPlaca(formatted);

    if (clean.length >= 3) {
      try {
        const matches = await vehiculoService.getVehiculos(clean);
        setPlacaSugerencias(matches);
        setShowPlacaDropdown(matches.length > 0);
      } catch {
        setPlacaSugerencias([]);
        setShowPlacaDropdown(false);
      }
    } else {
      setPlacaSugerencias([]);
      setShowPlacaDropdown(false);
    }

    if (clean.length >= 5) {
      handleBuscarPlaca(clean);
    } else {
      setVehiculoEncontrado(null);
      setIsVehiculoNuevo(false);
    }
  };

  const handleSelectPlacaSugerencia = (veh: Vehiculo) => {
    setPlacaInput(formatPlaca(veh.placa));
    setVehiculoEncontrado(veh);
    setIsVehiculoNuevo(false);
    setShowPlacaDropdown(false);
    
    if (veh.propietario) {
      setPropietarioEncontrado(veh.propietario);
      setPropietarioDoc(veh.propietario.numeroDocumento);
      setPropietarioTipoDoc(veh.propietario.tipoDocumento);
      setPropietarioNombre(veh.propietario.nombresRazonSocial);
      setPropietarioCelular(veh.propietario.celular);
      setPropietarioEmail(veh.propietario.email || '');
      setIsEditingPropietario(false);
    } else {
      setPropietarioEncontrado(null);
      setPropietarioDoc('');
      setPropietarioNombre('');
      setPropietarioCelular('');
      setPropietarioEmail('');
      setIsEditingPropietario(true);
    }
  };

  const handleBuscarPlaca = async (placaBuscada: string) => {
    const limpia = cleanPlaca(placaBuscada);
    if (limpia.length < 5) return;

    setIsSearchingPlaca(true);
    setFormError(null);

    try {
      const [veh, verif] = await Promise.all([
        vehiculoService.getVehiculoByPlaca(limpia).catch(() => null),
        reinspeccionService.verificarPlaca(limpia).catch(() => null),
      ]);

      if (verif) {
        setReinspeccionVerif(verif);
        if (verif.tieneReinspeccionGratuita) {
          setTipoServicio('REINSPECCION_GRATUITA');
        }
      } else {
        setReinspeccionVerif(null);
      }

      if (veh) {
        setVehiculoEncontrado(veh);
        setIsVehiculoNuevo(false);
        if (veh.propietario) {
          setPropietarioEncontrado(veh.propietario);
          setPropietarioDoc(veh.propietario.numeroDocumento);
          setPropietarioTipoDoc(veh.propietario.tipoDocumento);
          setPropietarioNombre(veh.propietario.nombresRazonSocial);
          setPropietarioCelular(veh.propietario.celular);
          setPropietarioEmail(veh.propietario.email || '');
          setIsEditingPropietario(false);
        } else {
          setPropietarioEncontrado(null);
          setIsEditingPropietario(true);
        }
      } else {
        setVehiculoEncontrado(null);
        setIsVehiculoNuevo(true);
        setIsEditingPropietario(true);
      }
    } catch {
      setVehiculoEncontrado(null);
      setIsVehiculoNuevo(true);
      setIsEditingPropietario(true);
      setReinspeccionVerif(null);
    } finally {
      setIsSearchingPlaca(false);
    }
  };

  const handleBuscarPropietarioDoc = async (doc: string) => {
    const cleanDoc = doc.trim();
    if (cleanDoc.length < 5) return;
    try {
      const cli = await clienteService.getClienteByDocumento(cleanDoc);
      if (cli) {
        setPropietarioEncontrado(cli);
        setPropietarioNombre(cli.nombresRazonSocial);
        setPropietarioCelular(cli.celular);
        setPropietarioEmail(cli.email || '');
        setPropietarioTipoDoc(cli.tipoDocumento);
      }
    } catch {
      // Ignorar
    }
  };

  const handleBuscarConductorDoc = async (doc: string) => {
    const cleanDoc = doc.trim();
    if (cleanDoc.length < 5) return;
    try {
      const cli = await clienteService.getClienteByDocumento(cleanDoc);
      if (cli) {
        setConductorEncontrado(cli);
        setConductorNombre(cli.nombresRazonSocial);
        setConductorCelular(cli.celular);
        setConductorTipoDoc(cli.tipoDocumento);
      } else {
        setConductorEncontrado(null);
      }
    } catch {
      setConductorEncontrado(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent, directToFactura: boolean = false) => {
    e.preventDefault();
    setFormError(null);

    const placaLimpia = cleanPlaca(placaInput);
    if (!placaLimpia) {
      setFormError('La placa del vehículo es obligatoria');
      return;
    }

    if (kilometraje === '' || kilometraje < 0) {
      setFormError('Debe ingresar un kilometraje válido');
      return;
    }

    // Validar datos de propietario si es nuevo o no tiene asignado
    if ((isVehiculoNuevo || !vehiculoEncontrado?.propietario) && (!propietarioDoc.trim() || !propietarioNombre.trim() || !propietarioCelular.trim())) {
      setFormError('Debe ingresar el documento, nombre y celular del propietario del vehículo');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: OrdenIngresoFormData = {
        placa: placaLimpia,
        kilometraje: Number(kilometraje),
        tipoServicio,
        conductorEsPropietario,
        ordenPadreId: reinspeccionVerif?.tieneReinspeccionGratuita ? reinspeccionVerif.ordenRechazadaId : (initialOrdenPadreId || undefined),
        esReinspeccion: reinspeccionVerif?.tieneReinspeccionGratuita || tipoServicio === 'REINSPECCION_GRATUITA' || initialEsReinspeccion,
        observaciones: observaciones.trim() || undefined,
      };

      // Si el vehículo es nuevo, anexar datos del vehículo
      if (isVehiculoNuevo || !vehiculoEncontrado) {
        payload.vehiculoData = {
          placa: placaLimpia,
          categoria: nuevoVehCategoria,
          marca: nuevoVehMarca.toUpperCase() || 'GENÉRICO',
          linea: nuevoVehLinea.toUpperCase() || 'ESTÁNDAR',
          modelo: nuevoVehModelo,
          fechaVencimientoSoat: sanitizeDate(nuevoVehSoat),
          fechaVencimientoRtm: sanitizeDate(nuevoVehRtm),
        };
      }

      // Propietario del vehículo
      if (propietarioEncontrado && !isEditingPropietario) {
        payload.propietarioId = propietarioEncontrado.id;
      } else if (propietarioDoc.trim()) {
        payload.propietarioData = {
          tipoDocumento: propietarioTipoDoc,
          numeroDocumento: propietarioDoc.trim(),
          nombresRazonSocial: propietarioNombre.trim(),
          celular: propietarioCelular.trim(),
          email: propietarioEmail.trim() || undefined,
        };
      }

      // Conductor que ingresa el vehículo
      if (conductorEsPropietario) {
        // El conductor es el mismo propietario
        if (propietarioEncontrado && !isEditingPropietario) {
          payload.conductorId = propietarioEncontrado.id;
        } else if (propietarioDoc.trim()) {
          payload.conductorData = {
            tipoDocumento: propietarioTipoDoc,
            numeroDocumento: propietarioDoc.trim(),
            nombresRazonSocial: propietarioNombre.trim(),
            celular: propietarioCelular.trim(),
            email: propietarioEmail.trim() || undefined,
          };
        }
      } else {
        // Conductor tercero
        if (conductorEncontrado) {
          payload.conductorId = conductorEncontrado.id;
        } else {
          if (!conductorDoc || !conductorNombre || !conductorCelular) {
            throw new Error('Debe completar el documento, nombre y celular del conductor');
          }
          payload.conductorData = {
            tipoDocumento: conductorTipoDoc,
            numeroDocumento: conductorDoc.trim(),
            nombresRazonSocial: conductorNombre.trim(),
            celular: conductorCelular.trim(),
          };
        }
      }

      const res = await ingresoService.createIngreso(payload);
      setIsSubmitting(false);

      if (directToFactura) {
        navigate(`/facturacion?ingresoId=${res.id}`);
        return;
      }

      setOrdenCreadaBanner(res);
      loadIngresosHoy();

      // Reset Form
      setPlacaInput('');
      setVehiculoEncontrado(null);
      setIsVehiculoNuevo(false);
      setKilometraje('');
      setObservaciones('');
      setPropietarioDoc('');
      setPropietarioNombre('');
      setPropietarioCelular('');
      setPropietarioEmail('');
      setPropietarioEncontrado(null);
      setConductorDoc('');
      setConductorNombre('');
      setConductorCelular('');
      setConductorEncontrado(null);
      setConductorEsPropietario(true);
    } catch (err: unknown) {
      let msg = 'Error al registrar orden de ingreso';
      if (err && typeof err === 'object' && 'response' in err) {
        const resData = (err as { response: { data?: { message?: string } } }).response?.data;
        if (resData?.message) msg = resData.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setFormError(msg);
      setIsSubmitting(false);
    }
  };

  const filteredIngresos = ingresosHoy.filter((i) => {
    const matchesSearch = 
      (i.vehiculo?.placa && i.vehiculo.placa.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (i.vehiculo?.propietario?.nombresRazonSocial && i.vehiculo.propietario.nombresRazonSocial.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (i.consecutivo && i.consecutivo.toString().includes(searchFilter));

    const matchesEstado = filterEstado === 'TODOS' || i.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const getCategoryIcon = (categoria?: string) => {
    switch (categoria) {
      case 'MOTO': return <Bike className="w-5 h-5 text-amber-400" />;
      case 'PESADO': return <Truck className="w-5 h-5 text-rose-400" />;
      case 'PUBLICO': return <Bus className="w-5 h-5 text-purple-400" />;
      default: return <Car className="w-5 h-5 text-cda-yellow-400" />;
    }
  };

  const getEstadoBadge = (estado: EstadoOrden) => {
    switch (estado) {
      case 'INGRESADO':
        return (
          <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>EN ESPERA DE PISTA</span>
          </span>
        );
      case 'EN_INSPECCION':
        return (
          <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
            <Wrench className="w-3 h-3 text-blue-400 animate-spin" />
            <span>EN PISTA DE PRUEBAS</span>
          </span>
        );
      case 'APROBADO':
        return (
          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>RTM APROBADA</span>
          </span>
        );
      case 'RECHAZADO':
        return (
          <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            <span>RTM RECHAZADA</span>
          </span>
        );
      case 'FACTURADO':
        return (
          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
            <Receipt className="w-3 h-3" />
            <span>FACTURADO</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full text-[10px]">
            {estado}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Clean Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Recepción de Vehículos</span>
            <span className="text-xs font-extrabold text-cda-yellow-400 bg-cda-yellow-400/10 px-2.5 py-0.5 rounded-full border border-cda-yellow-400/20">
              Ventanilla
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro ágil de turno de ventanilla, verificación de propietario y pase a pista de inspección
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-cda-dark-900 p-1 rounded-2xl border border-cda-dark-700/80">
          <button
            onClick={() => setActiveTab('FORMULARIO')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'FORMULARIO'
                ? 'bg-cda-yellow-500 text-black shadow-lg shadow-cda-yellow-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Ingreso</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORIAL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'HISTORIAL'
                ? 'bg-cda-yellow-500 text-black shadow-lg shadow-cda-yellow-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Turnos de Hoy ({ingresosHoy.length})</span>
          </button>
        </div>
      </div>

      {/* Banner de Éxito No Invasivo al Crear Turno */}
      {ordenCreadaBanner && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-cda-dark-900 to-cda-dark-900 border border-emerald-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-white">¡Turno de Inspección Registrado con Éxito!</span>
                <span className="whitespace-nowrap inline-flex items-center px-2.5 py-0.5 rounded-lg bg-cda-yellow-400 text-black font-mono font-black text-xs tracking-wider shadow-sm">
                  {formatPlaca(ordenCreadaBanner.vehiculo?.placa)}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Consecutivo: <strong className="font-mono text-cda-yellow-400">#{ordenCreadaBanner.consecutivo || 'S/N'}</strong> • Propietario: {ordenCreadaBanner.vehiculo?.propietario?.nombresRazonSocial || 'No asignado'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!ordenCreadaBanner.facturado && ordenCreadaBanner.estado !== 'FACTURADO' ? (
              <Link
                to={`/facturacion?ingresoId=${ordenCreadaBanner.id}`}
                className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cda-yellow-500/20 transition-all"
              >
                <Receipt className="w-4 h-4" />
                <span>Facturar Ahora</span>
              </Link>
            ) : (
              <Link
                to={`/facturacion?ingresoId=${ordenCreadaBanner.id}`}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ver Factura</span>
              </Link>
            )}

            <button
              onClick={() => setSelectedTicketOrden(ordenCreadaBanner)}
              className="bg-cda-dark-800 hover:bg-cda-dark-700 text-cda-yellow-400 border border-cda-dark-700 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Ticket</span>
            </button>

            <Link
              to={`/pista?ordenId=${ordenCreadaBanner.id}`}
              className="bg-cda-dark-800 hover:bg-cda-dark-700 text-blue-400 border border-cda-dark-700 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <Wrench className="w-4 h-4" />
              <span>Ver en Pista</span>
            </Link>

            <button
              onClick={() => {
                setOrdenCreadaBanner(null);
                setActiveTab('HISTORIAL');
              }}
              className="bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 border border-cda-dark-700 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <ListOrdered className="w-4 h-4" />
              <span>Ver Turnos</span>
            </button>

            <button
              onClick={() => setOrdenCreadaBanner(null)}
              className="p-2 text-slate-400 hover:text-white rounded-lg"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: FORMULARIO DE NUEVO INGRESO (100% Enfocado sin scroll) */}
      {activeTab === 'FORMULARIO' && (
        <div className="cda-glass rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-cda-dark-700/80 shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Step 1: Vehicle Plate Search with Autocomplete */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Input Placa with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Placa del Vehículo *</span>
                  <span className="text-[10px] text-slate-500 font-normal">Autocompletado desde 3 letras</span>
                </label>
                
                <div className="relative">
                  <input
                    type="text"
                    value={placaInput}
                    onChange={(e) => handlePlacaChange(e.target.value)}
                    placeholder="Ej. ABC-123 o XYZ-12A"
                    maxLength={7}
                    className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white font-mono font-black text-base tracking-wider rounded-xl pl-3 pr-10 py-2.5 focus:border-cda-yellow-500 focus:outline-none uppercase"
                    required
                  />
                  {isSearchingPlaca ? (
                    <Loader2 className="w-4 h-4 animate-spin text-cda-yellow-400 absolute right-3 top-3.5" />
                  ) : (
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {showPlacaDropdown && placaSugerencias.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-cda-dark-900 border border-cda-yellow-500/40 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                    {placaSugerencias.map((sug) => (
                      <button
                        key={sug.id}
                        type="button"
                        onClick={() => handleSelectPlacaSugerencia(sug)}
                        className="w-full px-3 py-2.5 text-left text-xs hover:bg-cda-dark-800 border-b border-cda-dark-800 last:border-0 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-cda-yellow-400">{formatPlaca(sug.placa)}</span>
                          <span className="text-slate-300 font-medium">{sug.marca} {sug.linea}</span>
                          <span className="text-[10px] bg-cda-dark-950 text-slate-400 px-1.5 py-0.5 rounded">
                            {sug.categoria}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          Prop: {sug.propietario?.nombresRazonSocial || 'Sin asignar'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Kilometraje */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kilometraje de Ingreso *
                </label>
                <input
                  type="number"
                  value={kilometraje}
                  onChange={(e) => setKilometraje(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ej. 45000"
                  min={0}
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-xl px-3 py-3 focus:border-cda-yellow-500 focus:outline-none"
                  required
                />
              </div>

              {/* Tipo de Servicio */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipo de Servicio *
                </label>
                <select
                  value={tipoServicio}
                  onChange={(e) => setTipoServicio(e.target.value)}
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-xl px-3 py-3 focus:border-cda-yellow-500 focus:outline-none"
                >
                  <option value="RTM_LEGAL">🔍 RTM y Emisiones Contaminantes (Legal)</option>
                  <option value="REINSPECCION_GRATUITA">🎁 2da Revisión / Reinspección Gratuita (15 Días - $0)</option>
                  <option value="REVISION_PREVENTIVA">🛠️ Revisión Preventiva / Viaje</option>
                  <option value="PERITAJE">📋 Peritaje Completo</option>
                </select>
              </div>
            </div>

            {/* Banner de Reinspección Gratuita (15 Días) */}
            {reinspeccionVerif && reinspeccionVerif.tieneReinspeccionGratuita && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs space-y-2 shadow-xl animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-black text-white text-sm">
                        ¡Vehículo Elegible para 2da Revisión / Reinspección Gratuita!
                      </div>
                      <div className="text-[11px] text-emerald-200">
                        {reinspeccionVerif.mensaje} • Turno Inicial: <strong className="font-mono text-emerald-400">#{reinspeccionVerif.consecutivoOrdenRechazada}</strong>
                      </div>
                    </div>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 shrink-0 text-center">
                    TARIFA $0 COP (GRATIS)
                  </span>
                </div>

                {reinspeccionVerif.pruebasRechazadas && reinspeccionVerif.pruebasRechazadas.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-cda-dark-900/90 border border-emerald-500/20 text-[11px] flex items-center gap-2 text-slate-300">
                    <span className="font-bold text-amber-400 shrink-0">Pruebas No Conformes a Repetir:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {reinspeccionVerif.pruebasRechazadas.map((p) => (
                        <span key={p} className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          {p.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {reinspeccionVerif && !reinspeccionVerif.tieneReinspeccionGratuita && reinspeccionVerif.placa && reinspeccionVerif.fechaRechazo && (
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs space-y-1.5 shadow-lg animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-sm">Plazo Legal de 15 Días Calendario Vencido</div>
                    <div className="text-[11px] text-rose-200">{reinspeccionVerif.mensaje}</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 pl-7">
                  Conforme a la regulación del Ministerio de Transporte, al haber superado los 15 días calendario de gracia, este reingreso se tramita y factura como una <strong>Revisión Completa con Cobro (100%)</strong> con ejecución de las 4 pruebas reglamentarias.
                </p>
              </div>
            )}

            {/* Vehicle Recognition Card (if found) */}
            {vehiculoEncontrado && (
              <div className="p-4 rounded-2xl bg-cda-dark-900/90 border border-cda-yellow-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cda-yellow-500/10 text-cda-yellow-400">
                    {getCategoryIcon(vehiculoEncontrado.categoria)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {vehiculoEncontrado.marca} {vehiculoEncontrado.linea} ({vehiculoEncontrado.modelo})
                      </span>
                      <span className="text-[10px] bg-cda-dark-800 text-slate-300 px-2 py-0.5 rounded border border-cda-dark-700">
                        {vehiculoEncontrado.categoria}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Propietario asignado: <strong className="text-slate-200">{vehiculoEncontrado.propietario?.nombresRazonSocial || 'Sin asignar'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  {vehiculoEncontrado.soatVencido ? (
                    <span className="text-rose-400 font-bold bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">SOAT Vencido</span>
                  ) : (
                    <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">SOAT Vigente</span>
                  )}
                  {vehiculoEncontrado.rtmVencido ? (
                    <span className="text-rose-400 font-bold bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">RTM Vencida</span>
                  ) : (
                    <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">RTM Vigente</span>
                  )}
                </div>
              </div>
            )}

            {/* If Vehicle is NEW: Inline Quick Inputs */}
            {isVehiculoNuevo && placaInput.length >= 5 && (
              <div className="p-4 rounded-2xl bg-cda-dark-900/60 border border-cda-dark-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-cda-yellow-400">
                  <Plus className="w-4 h-4" />
                  <span>Vehículo no registrado previamente. Completa los datos técnicos:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Categoría</label>
                    <select
                      value={nuevoVehCategoria}
                      onChange={(e) => setNuevoVehCategoria(e.target.value as CategoriaVehiculo)}
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-2.5 py-2"
                    >
                      <option value="LIVIANO">🚗 Liviano</option>
                      <option value="MOTO">🏍️ Moto</option>
                      <option value="PESADO">🚚 Pesado</option>
                      <option value="PUBLICO">🚕 Público</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Marca</label>
                    <input
                      type="text"
                      value={nuevoVehMarca}
                      onChange={(e) => setNuevoVehMarca(e.target.value)}
                      placeholder="Ej. RENAULT"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2 uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Línea</label>
                    <input
                      type="text"
                      value={nuevoVehLinea}
                      onChange={(e) => setNuevoVehLinea(e.target.value)}
                      placeholder="Ej. DUSTER"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2 uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Modelo</label>
                    <input
                      type="number"
                      value={nuevoVehModelo}
                      onChange={(e) => setNuevoVehModelo(Number(e.target.value))}
                      min={1970}
                      max={new Date().getFullYear() + 2}
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Vence SOAT</label>
                    <input
                      type="date"
                      min="1950-01-01"
                      max="2099-12-31"
                      value={nuevoVehSoat}
                      onChange={(e) => setNuevoVehSoat(e.target.value)}
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-2.5 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Vence RTM</label>
                    <input
                      type="date"
                      min="1950-01-01"
                      max="2099-12-31"
                      value={nuevoVehRtm}
                      onChange={(e) => setNuevoVehRtm(e.target.value)}
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-2.5 py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section: Propietario Oficial del Vehículo */}
            <div className="p-4 sm:p-5 rounded-2xl bg-cda-dark-900/80 border border-cda-dark-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <User className="w-4 h-4 text-cda-yellow-400" />
                  <span>Datos del Propietario Legal del Vehículo</span>
                </div>
                {propietarioEncontrado && !isEditingPropietario && (
                  <button
                    type="button"
                    onClick={() => setIsEditingPropietario(true)}
                    className="text-[11px] font-bold text-cda-yellow-400 hover:text-cda-yellow-300"
                  >
                    🔄 Cambiar / Modificar Propietario
                  </button>
                )}
              </div>

            {propietarioEncontrado && !isEditingPropietario ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-cda-dark-950 border border-cda-dark-800 text-xs">
                <div>
                  <p className="font-bold text-white text-sm">{propietarioEncontrado.nombresRazonSocial}</p>
                  <p className="text-[11px] font-mono text-slate-400">
                    {propietarioEncontrado.tipoDocumento} {formatDocumento(propietarioEncontrado.numeroDocumento)} • Cel: {formatPhone(propietarioEncontrado.celular)}
                  </p>
                </div>
                {propietarioEncontrado.email && (
                  <span className="text-[11px] text-slate-400 bg-cda-dark-900 px-2.5 py-1 rounded-lg border border-cda-dark-800">
                    ✉️ {propietarioEncontrado.email}
                  </span>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex gap-2">
                  <select
                    value={propietarioTipoDoc}
                    onChange={(e) => setPropietarioTipoDoc(e.target.value as TipoDocumento)}
                    className="w-20 bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-2 py-2"
                  >
                    <option value="CC">CC</option>
                    <option value="NIT">NIT</option>
                    <option value="CE">CE</option>
                    <option value="PASAPORTE">PAS</option>
                  </select>
                  <input
                    type="text"
                    value={propietarioDoc}
                    onChange={(e) => {
                      setPropietarioDoc(e.target.value);
                      handleBuscarPropietarioDoc(e.target.value);
                    }}
                    placeholder="Documento / NIT *"
                    className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2 font-mono"
                    required
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={propietarioNombre}
                    onChange={(e) => setPropietarioNombre(e.target.value)}
                    placeholder="Nombres o Razón Social *"
                    className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={propietarioCelular}
                    onChange={(e) => setPropietarioCelular(handlePhoneInput(e.target.value))}
                    placeholder="Celular WhatsApp *"
                    className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2 font-mono"
                    required
                  />
                </div>

                <div>
                  <input
                    type="email"
                    value={propietarioEmail}
                    onChange={(e) => setPropietarioEmail(e.target.value)}
                    placeholder="Correo Electrónico (Opcional)"
                    className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Driver vs Owner Toggle (Core Requirement) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">¿Quién entrega el vehículo en ventanilla?</span>
              <div className="flex bg-cda-dark-900 p-1 rounded-xl border border-cda-dark-800">
                <button
                  type="button"
                  onClick={() => setConductorEsPropietario(true)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    conductorEsPropietario
                      ? 'bg-cda-yellow-500 text-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  El mismo Propietario
                </button>
                <button
                  type="button"
                  onClick={() => setConductorEsPropietario(false)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    !conductorEsPropietario
                      ? 'bg-cda-yellow-500 text-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Conductor / Tercero
                </button>
              </div>
            </div>

            {/* If Driver is NOT the owner */}
            {!conductorEsPropietario && (
              <div className="p-4 rounded-2xl bg-cda-dark-900/60 border border-cda-dark-800 space-y-3">
                <div className="text-xs font-bold text-slate-300">
                  <span>Datos del Conductor que ingresa el vehículo:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex gap-2">
                    <select
                      value={conductorTipoDoc}
                      onChange={(e) => setConductorTipoDoc(e.target.value as TipoDocumento)}
                      className="w-20 bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-2 py-2"
                    >
                      <option value="CC">CC</option>
                      <option value="NIT">NIT</option>
                      <option value="CE">CE</option>
                    </select>
                    <input
                      type="text"
                      value={conductorDoc}
                      onChange={(e) => {
                        setConductorDoc(e.target.value);
                        handleBuscarConductorDoc(e.target.value);
                      }}
                      placeholder="Cédula Conductor *"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={conductorNombre}
                      onChange={(e) => setConductorNombre(e.target.value)}
                      placeholder="Nombre Completo Conductor *"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={conductorCelular}
                      onChange={(e) => setConductorCelular(handlePhoneInput(e.target.value))}
                      placeholder="Celular Conductor *"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3 py-2 font-mono"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Observaciones de Recepción / Estado Inicial (Opcional)
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej. Rayón en puerta derecha, viene con llanta de repuesto..."
              className="w-full bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
            />
          </div>

          {/* Submit Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isSubmitting || isSearchingPlaca}
              className="flex-1 bg-gradient-to-r from-cda-yellow-500 to-amber-500 hover:from-cda-yellow-400 hover:to-amber-400 text-black font-black py-3.5 px-6 rounded-xl shadow-lg hover:shadow-cda-yellow-500/20 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Registrar e Ir a Facturar Directo</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={isSubmitting || isSearchingPlaca}
              className="flex-1 bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-200 border border-cda-dark-700 font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-cda-yellow-400" />
              <span>Solo Registrar Turno</span>
            </button>
          </div>
        </form>
      </div>
      )}

      {/* TAB 2: TURNOS DE HOY / HISTORIAL DE RECEPCIÓN */}
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
                  placeholder="Buscar por placa, # turno o nombre del propietario..."
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cda-yellow-500 focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={filterEstado}
                  onChange={(e) => {
                    setFilterEstado(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-cda-yellow-500 focus:outline-none"
                >
                  <option value="TODOS">Todos los Estados</option>
                  <option value="INGRESADO">En Espera de Pista</option>
                  <option value="EN_INSPECCION">En Pista de Pruebas</option>
                  <option value="APROBADO">RTM Aprobada</option>
                  <option value="RECHAZADO">RTM Rechazada</option>
                  <option value="FACTURADO">Facturados</option>
                </select>
              </div>
            </div>
          </div>

          {/* MOBILE CARDS VIEW (< md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredIngresos.length === 0 ? (
              <div className="cda-glass rounded-2xl p-6 text-center text-slate-500 text-xs">
                No hay vehículos registrados para los filtros seleccionados.
              </div>
            ) : (
              filteredIngresos
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((i) => (
                  <div key={i.id} className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-cda-yellow-500/10">
                          {getCategoryIcon(i.vehiculo?.categoria)}
                        </div>
                        <div>
                          <span className="font-mono font-black text-cda-yellow-400 text-sm">
                            {formatPlaca(i.vehiculo?.placa)}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {i.vehiculo?.marca} {i.vehiculo?.linea} • Turno #{i.consecutivo || 'S/N'}
                          </p>
                        </div>
                      </div>
                      <div>{getEstadoBadge(i.estado)}</div>
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-0.5 pt-2 border-t border-cda-dark-800">
                      <p>Prop: <strong className="text-white">{i.vehiculo?.propietario?.nombresRazonSocial || 'No registrado'}</strong></p>
                      <p>Km: <span className="font-mono text-slate-200">{i.kilometraje?.toLocaleString('es-CO')} km</span></p>
                      {i.observaciones && <p className="text-slate-400 italic">"{i.observaciones}"</p>}
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-cda-dark-800 gap-2">
                      <button
                        onClick={() => setSelectedTicketOrden(i)}
                        className="px-2.5 py-1.5 rounded-lg bg-cda-dark-800 text-slate-300 border border-cda-dark-700 text-xs flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Ticket</span>
                      </button>

                      <div className="flex gap-1.5">
                        <Link
                          to={`/pista?ordenId=${i.id}`}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Pista</span>
                        </Link>

                        {!i.facturado && i.estado !== 'FACTURADO' ? (
                          <Link
                            to={`/facturacion?ingresoId=${i.id}`}
                            className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Facturar</span>
                          </Link>
                        ) : (
                          <Link
                            to={`/facturacion?ingresoId=${i.id}`}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Facturado</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* DESKTOP TABLE VIEW (>= md) */}
          <div className="hidden md:block cda-glass rounded-2xl border border-cda-dark-700/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 bg-cda-dark-900/80 border-b border-cda-dark-800">
                  <tr>
                    <th className="p-3.5 font-semibold">Turno / Vehículo</th>
                    <th className="p-3.5 font-semibold">Propietario & Contacto</th>
                    <th className="p-3.5 font-semibold">Kilometraje & Servicio</th>
                    <th className="p-3.5 font-semibold">Estado en Pista</th>
                    <th className="p-3.5 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cda-dark-800 text-slate-200">
                  {filteredIngresos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No hay vehículos registrados para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredIngresos
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((i) => (
                        <tr key={i.id} className="hover:bg-cda-dark-800/40 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-cda-yellow-500/10">
                                {getCategoryIcon(i.vehiculo?.categoria)}
                              </div>
                              <div>
                                <span className="font-mono font-black text-cda-yellow-400 text-sm">
                                  {formatPlaca(i.vehiculo?.placa)}
                                </span>
                                <p className="text-[10px] text-slate-400">
                                  {i.vehiculo?.marca} {i.vehiculo?.linea} • Turno #{i.consecutivo || 'S/N'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <p className="font-bold text-white">{i.vehiculo?.propietario?.nombresRazonSocial || 'No asignado'}</p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {formatPhone(i.vehiculo?.propietario?.celular)}
                            </p>
                          </td>

                          <td className="p-3.5">
                            <p className="font-mono text-slate-200">{i.kilometraje?.toLocaleString('es-CO')} km</p>
                            <p className="text-[10px] text-slate-400">{i.tipoServicio}</p>
                          </td>

                          <td className="p-3.5">
                            {getEstadoBadge(i.estado)}
                          </td>

                          <td className="p-3.5 text-right space-x-1.5">
                            <button
                              onClick={() => setSelectedTicketOrden(i)}
                              className="inline-flex items-center gap-1 bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-cda-dark-700 text-xs transition-colors"
                              title="Imprimir ticket de turno"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Ticket</span>
                            </button>

                            <Link
                              to={`/pista?ordenId=${i.id}`}
                              className="inline-flex items-center gap-1 bg-blue-600/90 hover:bg-blue-600 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs shadow transition-all"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Pista</span>
                            </Link>

                            {!i.facturado && i.estado !== 'FACTURADO' ? (
                              <Link
                                to={`/facturacion?ingresoId=${i.id}`}
                                className="inline-flex items-center gap-1 bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-3 py-1.5 rounded-lg text-xs shadow-md shadow-cda-yellow-500/10 transition-all"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Facturar</span>
                              </Link>
                            ) : (
                              <Link
                                to={`/facturacion?ingresoId=${i.id}`}
                                className="inline-flex items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1.5 rounded-lg text-xs shadow-md transition-all"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Facturado</span>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredIngresos.length / itemsPerPage) || 1}
            totalItems={filteredIngresos.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}

      {/* Ticket Modal (Opcional - solo si el usuario pulsa Imprimir) */}
      {selectedTicketOrden && (
        <TicketTermicoModal
          onClose={() => setSelectedTicketOrden(null)}
          orden={selectedTicketOrden}
        />
      )}
    </div>
  );
}
