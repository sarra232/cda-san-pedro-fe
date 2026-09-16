import { useState, useEffect } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  Car, 
  Bike, 
  Truck, 
  Bus, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  Receipt, 
  Eye, 
  Gauge, 
  Lightbulb, 
  Wind, 
  Filter, 
  X, 
  Printer,
  Search,
  Check,
  RotateCcw,
  Camera,
  AlertTriangle
} from 'lucide-react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ingresoService } from '../../services/ingresoService';
import { OrdenIngreso, PruebaInspeccion, TipoPrueba, EstadoPrueba, EstadoOrden } from '../../types/ingreso';
import { formatPlaca, formatPhone, formatDocumento } from '../../utils/formatters';
import { Pagination } from '../../components/common/Pagination';
import { TicketTermicoModal } from '../reception/TicketTermicoModal';

export function InspectionPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrdenId = searchParams.get('ordenId') || '';

  // State
  const [ingresos, setIngresos] = useState<OrdenIngreso[]>([]);
  const [selectedOrden, setSelectedOrden] = useState<OrdenIngreso | null>(null);
  const [pruebas, setPruebas] = useState<PruebaInspeccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Pagination State
  const [searchFilter, setSearchFilter] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('ABIERTOS');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal Principal de Gestión de la Orden
  const [modalPistaOpen, setModalPistaOpen] = useState(false);

  // Modal Especializado de Registro de Rechazo con Evidencia y Motivo
  const [modalRechazoOpen, setModalRechazoOpen] = useState(false);
  const [rechazoOrden, setRechazoOrden] = useState<OrdenIngreso | null>(null);
  const [rechazoMotivo, setRechazoMotivo] = useState('');
  const [rechazoEvidencia, setRechazoEvidencia] = useState('');
  const [rechazoPruebas, setRechazoPruebas] = useState<TipoPrueba[]>([]);
  const [isSavingRechazo, setIsSavingRechazo] = useState(false);

  // Mini-Modal de Prueba Individual (Opcional)
  const [modalPruebaOpen, setModalPruebaOpen] = useState(false);
  const [selectedTipoPrueba, setSelectedTipoPrueba] = useState<TipoPrueba | null>(null);
  const [pruebaEstado, setPruebaEstado] = useState<EstadoPrueba>('APROBADO');
  const [pruebaObservaciones, setPruebaObservaciones] = useState('');
  const [isSavingPrueba, setIsSavingPrueba] = useState(false);

  // Ticket Modal
  const [selectedTicketOrden, setSelectedTicketOrden] = useState<OrdenIngreso | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const list = await ingresoService.getIngresosHoy();
      setIngresos(list);

      if (initialOrdenId) {
        const found = list.find((i) => i.id === initialOrdenId);
        if (found) {
          setSelectedOrden(found);
          await loadPruebasOrden(found.id);
          setModalPistaOpen(true);
        }
      }
    } catch {
      // Ignorar
    } finally {
      setIsLoading(false);
    }
  };

  const loadPruebasOrden = async (ordenId: string) => {
    try {
      const pList = await ingresoService.getPruebas(ordenId);
      setPruebas(pList);
    } catch {
      setPruebas([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [initialOrdenId]);

  const urlFiltro = searchParams.get('filtro') || searchParams.get('estado');
  useEffect(() => {
    if (urlFiltro) {
      setFilterEstado(urlFiltro.toUpperCase());
      setCurrentPage(1);
    }
  }, [urlFiltro]);

  const totalAbiertos = ingresos.filter((i) => i.estado === 'INGRESADO' || i.estado === 'EN_INSPECCION').length;
  const totalAprobados = ingresos.filter((i) => i.estado === 'APROBADO').length;
  const totalRechazados = ingresos.filter((i) => i.estado === 'RECHAZADO').length;
  const totalFacturados = ingresos.filter((i) => i.estado === 'FACTURADO').length;
  const totalTodos = ingresos.length;

  const handleSelectFiltro = (filtro: string) => {
    setFilterEstado(filtro);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (filtro === 'TODOS') {
      newParams.delete('filtro');
      newParams.delete('estado');
    } else {
      newParams.set('filtro', filtro);
    }
    setSearchParams(newParams);
  };

  const handleOpenPistaModal = async (orden: OrdenIngreso) => {
    setSelectedOrden(orden);
    setSearchParams({ ordenId: orden.id });
    await loadPruebasOrden(orden.id);
    setModalPistaOpen(true);
  };

  const handleClosePistaModal = () => {
    setModalPistaOpen(false);
    setSearchParams({});
  };

  // 1. Aprobación Rápida Directa (Sin firmas ni trabas)
  const handleAprobarDirecto = async (orden: OrdenIngreso) => {
    try {
      const updated = await ingresoService.updateEstado(
        orden.id,
        'APROBADO',
        'Aprobado conforme en inspección'
      );
      setIngresos((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (selectedOrden?.id === orden.id) {
        setSelectedOrden(updated);
        await loadPruebasOrden(updated.id);
      }
    } catch {
      // Ignorar
    }
  };

  // 2. Abrir Modal de Rechazo
  const handleOpenRechazoModal = (orden: OrdenIngreso) => {
    setRechazoOrden(orden);
    setRechazoMotivo(orden.motivoRechazo || orden.observaciones || '');
    setRechazoEvidencia(orden.evidenciaRechazo || '');
    setRechazoPruebas([]);
    setModalRechazoOpen(true);
  };

  const toggleRechazoPrueba = (tipo: TipoPrueba) => {
    setRechazoPruebas((prev) => 
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  // 3. Confirmar Rechazo con Motivo, Evidencia y Pruebas
  const handleGuardarRechazo = async () => {
    if (!rechazoOrden || !rechazoMotivo.trim()) return;
    setIsSavingRechazo(true);
    try {
      const updated = await ingresoService.rechazarOrden(rechazoOrden.id, {
        motivo: rechazoMotivo.trim(),
        evidencia: rechazoEvidencia.trim() || undefined,
        pruebasRechazadas: rechazoPruebas
      });
      setIngresos((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (selectedOrden?.id === rechazoOrden.id) {
        setSelectedOrden(updated);
        await loadPruebasOrden(updated.id);
      }
      setModalRechazoOpen(false);
    } catch {
      // Ignorar
    } finally {
      setIsSavingRechazo(false);
    }
  };

  // Mini modal para editar una prueba individual
  const handleOpenPruebaModal = (tipo: TipoPrueba, defaultEstado: EstadoPrueba = 'APROBADO') => {
    const existing = pruebas.find((p) => p.tipoPrueba === tipo);
    setSelectedTipoPrueba(tipo);
    setPruebaEstado(existing?.estado !== 'PENDIENTE' ? (existing?.estado || defaultEstado) : defaultEstado);
    setPruebaObservaciones(existing?.observaciones || '');
    setModalPruebaOpen(true);
  };

  const handleGuardarPrueba = async () => {
    if (!selectedOrden || !selectedTipoPrueba) return;
    setIsSavingPrueba(true);

    try {
      await ingresoService.updatePrueba(
        selectedOrden.id,
        selectedTipoPrueba,
        pruebaEstado,
        pruebaObservaciones
      );
      setModalPruebaOpen(false);
      await loadPruebasOrden(selectedOrden.id);
      
      const updatedOrden = await ingresoService.getIngresoById(selectedOrden.id);
      setSelectedOrden(updatedOrden);
      setIngresos((prev) => prev.map((item) => (item.id === updatedOrden.id ? updatedOrden : item)));
    } catch {
      // Ignorar
    } finally {
      setIsSavingPrueba(false);
    }
  };

  const getTestTitle = (tipo: TipoPrueba) => {
    switch (tipo) {
      case 'SENSORIAL_VISUAL':
        return {
          name: '1. Inspección Sensorial & Defectos Visuales',
          short: 'Sensorial/Visual',
          icon: <Eye className="w-5 h-5 text-amber-400" />,
          desc: 'Luces, llantas, vidrios, espejos, carrocería, cinturones y chasis',
        };
      case 'FRENOS_SUSPENSION':
        return {
          name: '2. Frenómetro & Suspensión',
          short: 'Frenos/Suspensión',
          icon: <Gauge className="w-5 h-5 text-rose-400" />,
          desc: 'Eficacia de frenado (Eje 1 y 2), freno de mano y desequilibrio dinámico',
        };
      case 'LUCES_ALINEACION':
        return {
          name: '3. Luxómetro & Alineación al Paso',
          short: 'Luces/Alineación',
          icon: <Lightbulb className="w-5 h-5 text-yellow-400" />,
          desc: 'Intensidad en Kilocandelas (kcd), inclinación y desviación lateral',
        };
      case 'GASES_EMISIONES':
        return {
          name: '4. Emisiones de Gases & Opacidad / Ruido',
          short: 'Gases/Emisiones',
          icon: <Wind className="w-5 h-5 text-cyan-400" />,
          desc: 'HC, CO, CO2, O2, opacímetro (humo diésel) y sonometría reglamentaria',
        };
    }
  };

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
            <Clock className="w-3 h-3" />
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

  const filteredIngresos = ingresos.filter((i) => {
    const matchesSearch = 
      (i.vehiculo?.placa && i.vehiculo.placa.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (i.vehiculo?.propietario?.nombresRazonSocial && i.vehiculo.propietario.nombresRazonSocial.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (i.consecutivo && i.consecutivo.toString().includes(searchFilter));

    const matchesEstado = 
      filterEstado === 'TODOS' || 
      (filterEstado === 'ABIERTOS' 
        ? (i.estado === 'INGRESADO' || i.estado === 'EN_INSPECCION')
        : i.estado === filterEstado);

    return matchesSearch && matchesEstado;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Pista de Inspección Técnica</span>
            <span className="text-xs font-extrabold text-cda-yellow-400 bg-cda-yellow-400/10 px-2.5 py-0.5 rounded-full border border-cda-yellow-400/20">
              Operación Ágil
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Aprobación directa por defecto o rechazo con registro de motivo, evidencia y plazo de 15 días
          </p>
        </div>
      </div>

      {/* Quick Filter Tabs (Pista / Abiertos / Aprobados / Rechazados / Facturados / Todos) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          type="button"
          onClick={() => handleSelectFiltro('ABIERTOS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
            filterEstado === 'ABIERTOS'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
              : 'bg-cda-dark-900 text-slate-400 border-cda-dark-800 hover:text-slate-200 hover:border-cda-dark-700'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <Wrench className="w-3.5 h-3.5 text-amber-400" />
          <span>En Pista (Procesos Abiertos)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            filterEstado === 'ABIERTOS' ? 'bg-amber-500 text-black' : 'bg-cda-dark-800 text-amber-400'
          }`}>
            {totalAbiertos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectFiltro('APROBADO')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
            filterEstado === 'APROBADO'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
              : 'bg-cda-dark-900 text-slate-400 border-cda-dark-800 hover:text-slate-200 hover:border-cda-dark-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Aprobados Hoy</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            filterEstado === 'APROBADO' ? 'bg-emerald-500 text-black' : 'bg-cda-dark-800 text-emerald-400'
          }`}>
            {totalAprobados}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectFiltro('RECHAZADO')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
            filterEstado === 'RECHAZADO'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/30'
              : 'bg-cda-dark-900 text-slate-400 border-cda-dark-800 hover:text-slate-200 hover:border-cda-dark-700'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Rechazados (Con Evidencia)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            filterEstado === 'RECHAZADO' ? 'bg-rose-500 text-white' : 'bg-cda-dark-800 text-rose-400'
          }`}>
            {totalRechazados}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectFiltro('FACTURADO')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
            filterEstado === 'FACTURADO'
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
              : 'bg-cda-dark-900 text-slate-400 border-cda-dark-800 hover:text-slate-200 hover:border-cda-dark-700'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-blue-400" />
          <span>Facturados</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            filterEstado === 'FACTURADO' ? 'bg-blue-500 text-white' : 'bg-cda-dark-800 text-blue-400'
          }`}>
            {totalFacturados}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectFiltro('TODOS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
            filterEstado === 'TODOS'
              ? 'bg-cda-yellow-500 text-black border-cda-yellow-500 font-extrabold shadow-lg shadow-cda-yellow-500/20'
              : 'bg-cda-dark-900 text-slate-400 border-cda-dark-800 hover:text-slate-200 hover:border-cda-dark-700'
          }`}
        >
          <span>Todos ({totalTodos})</span>
        </button>
      </div>

      {/* Toolbar: Search and Filter */}
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

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterEstado}
              onChange={(e) => handleSelectFiltro(e.target.value)}
              className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-cda-yellow-500 focus:outline-none"
            >
              <option value="ABIERTOS">En Pista (Procesos Abiertos) ({totalAbiertos})</option>
              <option value="TODOS">Todos los Estados ({ingresos.length})</option>
              <option value="INGRESADO">En Espera de Pista</option>
              <option value="EN_INSPECCION">En Pista de Pruebas</option>
              <option value="APROBADO">RTM Aprobada</option>
              <option value="RECHAZADO">RTM Rechazada</option>
              <option value="FACTURADO">Facturados</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-cda-yellow-400" />
          <span>Cargando vehículos en pista...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* MOBILE CARDS VIEW (< md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredIngresos.length === 0 ? (
              <div className="cda-glass rounded-2xl p-6 text-center text-slate-500 text-xs">
                No hay vehículos en pista para los filtros seleccionados.
              </div>
            ) : (
              filteredIngresos
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((i) => {
                  const isOpen = i.estado === 'INGRESADO' || i.estado === 'EN_INSPECCION';
                  const isRechazado = i.estado === 'RECHAZADO';

                  return (
                    <div key={i.id} className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-cda-yellow-500/10">
                            {getCategoryIcon(i.vehiculo?.categoria)}
                          </div>
                          <div>
                            <span className="whitespace-nowrap inline-flex items-center px-2 py-0.5 rounded bg-cda-yellow-400 text-black font-mono font-black text-xs tracking-wider">
                              {formatPlaca(i.vehiculo?.placa)}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {i.vehiculo?.marca} {i.vehiculo?.linea} • Turno #{i.consecutivo || 'S/N'}
                            </p>
                          </div>
                        </div>
                        <div>{getEstadoBadge(i.estado)}</div>
                      </div>

                      {/* Rejection Highlight Banner on Mobile */}
                      {isRechazado && (
                        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Motivo de Rechazo:</span>
                          </div>
                          <p className="text-[11px] text-slate-200 italic">
                            "{i.motivoRechazo || i.observaciones || 'Defecto técnico detectado en pista'}"
                          </p>
                          {i.evidenciaRechazo && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-300 pt-0.5">
                              <Camera className="w-3 h-3" />
                              <span>Evidencia: {i.evidenciaRechazo}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-300 space-y-0.5 pt-2 border-t border-cda-dark-800">
                        <p>Prop: <strong className="text-white">{i.vehiculo?.propietario?.nombresRazonSocial || 'No asignado'}</strong></p>
                        <p>Km: <span className="font-mono text-slate-200">{i.kilometraje?.toLocaleString('es-CO')} km</span></p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-cda-dark-800 gap-1.5 flex-wrap">
                        {isOpen ? (
                          <>
                            <button
                              onClick={() => handleAprobarDirecto(i)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 shadow"
                              title="Aprobar inspección directamente"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Aprobar</span>
                            </button>

                            <button
                              onClick={() => handleOpenRechazoModal(i)}
                              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 shadow"
                              title="Rechazar con motivo y evidencia"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>

                            <button
                              onClick={() => handleOpenPistaModal(i)}
                              className="p-1.5 rounded-lg bg-cda-dark-800 text-slate-300 border border-cda-dark-700 hover:text-white"
                              title="Detalle completo"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>
                          </>
                        ) : isRechazado ? (
                          <>
                            <button
                              onClick={() => {
                                navigate(`/recepcion?placa=${i.vehiculo?.placa}&ordenPadreId=${i.id}&esReinspeccion=true`);
                              }}
                              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 shadow"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>2da Revisión ($0)</span>
                            </button>

                            <button
                              onClick={() => handleOpenPistaModal(i)}
                              className="px-2.5 py-1.5 rounded-lg bg-cda-dark-800 text-slate-300 border border-cda-dark-700 text-xs"
                            >
                              Ver Detalle
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenPistaModal(i)}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Ver Detalle</span>
                            </button>

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
                          </>
                        )}

                        <button
                          onClick={() => setSelectedTicketOrden(i)}
                          className="p-1.5 rounded-lg bg-cda-dark-800 text-slate-300 border border-cda-dark-700 text-xs"
                          title="Ticket"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
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
                    <th className="p-3.5 font-semibold">Estado / Dictamen</th>
                    <th className="p-3.5 font-semibold text-right">Acciones Operativas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cda-dark-800 text-slate-200">
                  {filteredIngresos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No hay vehículos en pista para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredIngresos
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((i) => {
                        const isOpen = i.estado === 'INGRESADO' || i.estado === 'EN_INSPECCION';
                        const isRechazado = i.estado === 'RECHAZADO';

                        return (
                          <tr key={i.id} className="hover:bg-cda-dark-800/40 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-cda-yellow-500/10">
                                  {getCategoryIcon(i.vehiculo?.categoria)}
                                </div>
                                <div>
                                  <span className="whitespace-nowrap inline-flex items-center px-2 py-0.5 rounded bg-cda-yellow-400 text-black font-mono font-black text-xs tracking-wider">
                                    {formatPlaca(i.vehiculo?.placa)}
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {i.vehiculo?.marca} {i.vehiculo?.linea} ({i.vehiculo?.modelo}) • Turno #{i.consecutivo || 'S/N'}
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
                              <div>{getEstadoBadge(i.estado)}</div>
                              {isRechazado && (
                                <div className="mt-1 text-[10px] text-rose-300 max-w-xs truncate" title={i.motivoRechazo || i.observaciones}>
                                  <strong>Motivo:</strong> {i.motivoRechazo || i.observaciones || 'Defecto técnico'}
                                </div>
                              )}
                              {isRechazado && i.evidenciaRechazo && (
                                <div className="text-[9px] text-amber-300 flex items-center gap-1 mt-0.5">
                                  <Camera className="w-3 h-3" />
                                  <span className="truncate max-w-[180px]">Evidencia: {i.evidenciaRechazo}</span>
                                </div>
                              )}
                            </td>

                            <td className="p-3.5 text-right space-x-1.5">
                              {isOpen ? (
                                <>
                                  <button
                                    onClick={() => handleAprobarDirecto(i)}
                                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-1.5 rounded-lg text-xs shadow transition-all"
                                    title="Aprobar inspección por defecto"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Aprobar</span>
                                  </button>

                                  <button
                                    onClick={() => handleOpenRechazoModal(i)}
                                    className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow transition-all"
                                    title="Rechazar con motivo y evidencia"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    <span>Rechazar</span>
                                  </button>

                                  <button
                                    onClick={() => handleOpenPistaModal(i)}
                                    className="inline-flex items-center gap-1 bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-cda-dark-700 text-xs transition-colors"
                                    title="Ver detalle"
                                  >
                                    <Wrench className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : isRechazado ? (
                                <>
                                  <button
                                    onClick={() => {
                                      navigate(`/recepcion?placa=${i.vehiculo?.placa}&ordenPadreId=${i.id}&esReinspeccion=true`);
                                    }}
                                    className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3 py-1.5 rounded-lg text-xs shadow transition-all"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>2da Revisión ($0)</span>
                                  </button>

                                  <button
                                    onClick={() => handleOpenPistaModal(i)}
                                    className="inline-flex items-center gap-1 bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-cda-dark-700 text-xs"
                                  >
                                    <span>Detalle</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleOpenPistaModal(i)}
                                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow transition-all"
                                  >
                                    <Wrench className="w-3.5 h-3.5" />
                                    <span>Detalle</span>
                                  </button>

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
                                </>
                              )}

                              <button
                                onClick={() => setSelectedTicketOrden(i)}
                                className="inline-flex items-center gap-1 bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-cda-dark-700 text-xs transition-colors"
                                title="Imprimir ticket"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
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

      {/* POP-UP / MODAL PRINCIPAL: GESTIÓN DE LA ORDEN Y PRUEBAS EN PISTA */}
      {modalPistaOpen && selectedOrden && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="cda-glass rounded-3xl max-w-4xl w-full border border-cda-yellow-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Header del Pop-up */}
            <div className="p-5 bg-cda-dark-900/90 border-b border-cda-dark-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cda-yellow-500/10 text-cda-yellow-400">
                  {getCategoryIcon(selectedOrden.vehiculo?.categoria)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap inline-flex items-center px-2.5 py-0.5 rounded-lg bg-cda-yellow-400 text-black font-mono font-black text-sm tracking-wider">
                      {formatPlaca(selectedOrden.vehiculo?.placa)}
                    </span>
                    <span className="text-xs bg-cda-dark-950 text-slate-300 font-mono px-2 py-0.5 rounded border border-cda-dark-700">
                      Turno #{selectedOrden.consecutivo || 'S/N'}
                    </span>
                    {getEstadoBadge(selectedOrden.estado)}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedOrden.vehiculo?.marca} {selectedOrden.vehiculo?.linea} ({selectedOrden.vehiculo?.modelo}) • {selectedOrden.kilometraje?.toLocaleString('es-CO')} km
                  </p>
                </div>
              </div>

              <button
                onClick={handleClosePistaModal}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-cda-dark-800 transition-colors"
                title="Cerrar modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Banner Destacado si fue RECHAZADO con Detalle de Motivo y Evidencia */}
              {selectedOrden.estado === 'RECHAZADO' && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs shadow-xl space-y-3 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 shrink-0 mt-0.5">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-black text-white text-sm flex items-center gap-2">
                          <span>Revisión Técnico-Mecánica Rechazada</span>
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                            Plazo 15 Días
                          </span>
                        </div>
                        <p className="text-xs text-rose-200">
                          <strong className="text-white">Motivo del Rechazo:</strong> {selectedOrden.motivoRechazo || selectedOrden.observaciones || 'No especificado'}
                        </p>
                        {selectedOrden.evidenciaRechazo && (
                          <p className="text-xs text-amber-300 flex items-center gap-1.5 pt-0.5">
                            <Camera className="w-3.5 h-3.5" />
                            <strong>Evidencia Registrada:</strong> 
                            <span className="font-mono bg-cda-dark-900 px-2 py-0.5 rounded text-white border border-amber-500/30">
                              {selectedOrden.evidenciaRechazo}
                            </span>
                          </p>
                        )}
                        <p className="text-[11px] text-slate-300 pt-1">
                          Quedan <strong className="text-white">{selectedOrden.diasRestantesReinspeccion ?? 15} días calendario</strong> para presentarse a 2da revisión sin costo ($0 COP).
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleClosePistaModal();
                        navigate(`/recepcion?placa=${selectedOrden.vehiculo?.placa}&ordenPadreId=${selectedOrden.id}&esReinspeccion=true`);
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shrink-0"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Iniciar 2da Revisión ($0)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Banner de Estado APROBADO */}
              {selectedOrden.estado === 'APROBADO' && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs shadow-xl animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-black text-white text-sm">
                          ¡Revisión Técnico-Mecánica Aprobada!
                        </div>
                        <div className="text-[11px] text-emerald-200">
                          Vehículo apto para certificación RTM oficial • Listo para facturación y entrega
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!selectedOrden.facturado ? (
                        <Link
                          to={`/facturacion?ingresoId=${selectedOrden.id}`}
                          className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cda-yellow-500/20 transition-all"
                        >
                          <Receipt className="w-4 h-4" />
                          <span>Pasar a Facturación</span>
                        </Link>
                      ) : (
                        <Link
                          to={`/facturacion?ingresoId=${selectedOrden.id}`}
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-extrabold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Ver Factura</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Propietario & Conductor Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-cda-dark-900/80 p-3.5 rounded-2xl border border-cda-dark-800">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Propietario Legal:</span>
                  <p className="font-bold text-white mt-0.5">{selectedOrden.vehiculo?.propietario?.nombresRazonSocial || 'No asignado'}</p>
                  <p className="text-[11px] font-mono text-slate-400">
                    {selectedOrden.vehiculo?.propietario?.tipoDocumento} {formatDocumento(selectedOrden.vehiculo?.propietario?.numeroDocumento)} • Cel: {formatPhone(selectedOrden.vehiculo?.propietario?.celular)}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Conductor en Ventanilla:</span>
                  <p className="font-bold text-white mt-0.5">
                    {selectedOrden.conductor?.nombresRazonSocial || selectedOrden.vehiculo?.propietario?.nombresRazonSocial || 'El mismo propietario'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">
                    {selectedOrden.conductor ? `Cel: ${formatPhone(selectedOrden.conductor.celular)}` : 'Mismos datos de propietario'}
                  </p>
                </div>
              </div>

              {/* PANEL DE DECISIÓN OPERATIVA INMEDIATA (Aprobar o Rechazar con Motivo) */}
              {(selectedOrden.estado === 'INGRESADO' || selectedOrden.estado === 'EN_INSPECCION') && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cda-dark-900 via-cda-dark-850 to-cda-dark-900 border border-cda-yellow-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
                  <div>
                    <h3 className="font-black text-white text-sm flex items-center gap-1.5">
                      <span>Dictamen Operativo en Pista</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full font-bold">
                        Aceptado por defecto
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Si el vehículo está en orden, pulsa <strong>Aprobar</strong>. Si presenta fallas, pulsa <strong>Rechazar</strong> para detallar motivo y evidencia.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAprobarDirecto(selectedOrden)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>✓ Aprobar Vehículo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenRechazoModal(selectedOrden)}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>✕ Rechazar con Motivo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Pruebas Técnicas Opcionales / Referenciales */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Pruebas en Pista (Opcionales para especificar motivo)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Por defecto todas quedan aceptadas a menos que se registre un rechazo puntual
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(['SENSORIAL_VISUAL', 'FRENOS_SUSPENSION', 'LUCES_ALINEACION', 'GASES_EMISIONES'] as TipoPrueba[]).map((tipo) => {
                    const prueba = pruebas.find((p) => p.tipoPrueba === tipo);
                    const meta = getTestTitle(tipo);
                    const isAprobada = prueba?.estado === 'APROBADO' || selectedOrden.estado === 'APROBADO';
                    const isRechazada = prueba?.estado === 'RECHAZADO';
                    const isPendiente = (!prueba || prueba.estado === 'PENDIENTE') && selectedOrden.estado !== 'APROBADO';

                    return (
                      <div
                        key={tipo}
                        className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                          isRechazada
                            ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                            : isAprobada
                            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                            : 'cda-glass border-cda-dark-700/80 hover:border-cda-dark-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-cda-dark-900 border border-cda-dark-800">
                              {meta.icon}
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-xs">{meta.name}</h4>
                              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{meta.desc}</p>
                            </div>
                          </div>

                          <div>
                            {isRechazada && (
                              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded-full text-[10px] font-black">
                                RECHAZADA
                              </span>
                            )}
                            {isAprobada && !isRechazada && (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-black">
                                ACEPTADA
                              </span>
                            )}
                            {isPendiente && (
                              <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                EN PISTA
                              </span>
                            )}
                          </div>
                        </div>

                        {prueba?.observaciones && (
                          <div className="p-2 rounded-xl bg-cda-dark-900/80 border border-cda-dark-800 text-[10px] text-slate-300 italic">
                            "{prueba.observaciones}"
                          </div>
                        )}

                        {/* Botón rápido para marcar rechazo individual si se desea */}
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenPruebaModal(tipo, isRechazada ? 'APROBADO' : 'RECHAZADO')}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                          >
                            <Wrench className="w-3 h-3 text-cda-yellow-400" />
                            <span>Ajustar prueba</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer del Pop-up */}
            <div className="p-4 bg-cda-dark-900/90 border-t border-cda-dark-800 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClosePistaModal}
                className="px-4 py-2 rounded-xl bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 font-bold text-xs"
              >
                Volver a la Lista
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicketOrden(selectedOrden)}
                  className="px-3 py-2 rounded-xl bg-cda-dark-800 text-slate-300 border border-cda-dark-700 text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Ticket</span>
                </button>

                {!selectedOrden.facturado && selectedOrden.estado !== 'FACTURADO' ? (
                  <Link
                    to={`/facturacion?ingresoId=${selectedOrden.id}`}
                    className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Ir a Facturación</span>
                  </Link>
                ) : (
                  <Link
                    to={`/facturacion?ingresoId=${selectedOrden.id}`}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Factura Emitida</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL ESPECIALIZADO: REGISTRAR RECHAZO CON EVIDENCIA Y MOTIVO */}
      {/* ========================================================================= */}
      {modalRechazoOpen && rechazoOrden && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cda-glass rounded-3xl p-6 max-w-lg w-full border border-rose-500/50 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-cda-dark-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">
                    Registrar Rechazo de Inspección
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Deja constancia del motivo técnico y evidencia del defecto
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalRechazoOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Placa y Vehículo */}
            <div className="p-3 rounded-2xl bg-cda-dark-900 border border-cda-dark-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap inline-flex items-center px-2.5 py-0.5 rounded-lg bg-cda-yellow-400 text-black font-mono font-black text-sm tracking-wider">
                  {formatPlaca(rechazoOrden.vehiculo?.placa)}
                </span>
                <span className="text-xs text-slate-300 font-semibold">
                  {rechazoOrden.vehiculo?.marca} {rechazoOrden.vehiculo?.linea}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
                15 Días de Gracia
              </span>
            </div>

            {/* 1. Selección de Pruebas Fallidas (Opcional) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-200">
                1. ¿En cuáles pruebas se detectó el defecto? (Opcional):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['SENSORIAL_VISUAL', 'FRENOS_SUSPENSION', 'LUCES_ALINEACION', 'GASES_EMISIONES'] as TipoPrueba[]).map((tipo) => {
                  const meta = getTestTitle(tipo);
                  const isSelected = rechazoPruebas.includes(tipo);

                  return (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => toggleRechazoPrueba(tipo)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all text-left ${
                        isSelected
                          ? 'bg-rose-500/25 text-rose-200 border-rose-500/60 shadow ring-1 ring-rose-500/40'
                          : 'bg-cda-dark-900 border-cda-dark-800 text-slate-400 hover:text-white hover:border-cda-dark-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                        isSelected ? 'bg-rose-500 text-white border-rose-400' : 'border-slate-600'
                      }`}>
                        {isSelected ? '✓' : ''}
                      </div>
                      <span className="text-[11px] truncate">{meta.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Descripción / Motivo del Rechazo (Obligatorio) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>2. Descripción detallada del motivo del rechazo <span className="text-rose-400">*</span></span>
                <span className="text-[10px] text-slate-400 font-normal">Obligatorio</span>
              </label>
              <textarea
                value={rechazoMotivo}
                onChange={(e) => setRechazoMotivo(e.target.value)}
                placeholder="Ejemplo: Desgaste severo en banda de rodadura de llanta delantera izquierda (<1.6 mm) y fuga visible de gases en ducto de escape."
                rows={3}
                className="w-full bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-xl p-3 focus:border-rose-500 focus:outline-none resize-none placeholder:text-slate-500"
              />
            </div>

            {/* 3. Evidencia / Registro Fotográfico (Opcional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cda-yellow-400" />
                <span>3. Evidencia / Soporte Fotográfico o Referencia:</span>
              </label>
              <input
                type="text"
                value={rechazoEvidencia}
                onChange={(e) => setRechazoEvidencia(e.target.value)}
                placeholder="Ej: Foto_Llanta_Del_Izq.jpg o URL de imagen o código de defecto #F-102"
                className="w-full bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:border-cda-yellow-500 focus:outline-none placeholder:text-slate-500 font-mono"
              />
              <p className="text-[10px] text-slate-400">
                Puedes registrar el nombre del archivo de la foto tomada en pista, una URL o la referencia del defecto.
              </p>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalRechazoOpen(false)}
                className="w-1/3 py-2.5 rounded-xl bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarRechazo}
                disabled={isSavingRechazo || !rechazoMotivo.trim()}
                className="w-2/3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all"
              >
                {isSavingRechazo ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
                <span>Confirmar Rechazo (15 Días)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini-Modal de Prueba Específica (Opcional) */}
      {modalPruebaOpen && selectedTipoPrueba && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cda-glass rounded-3xl p-6 max-w-md w-full border border-cda-yellow-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cda-dark-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cda-yellow-400" />
                <h3 className="font-black text-white text-base">
                  Ajustar Prueba Específica
                </h3>
              </div>
              <button
                onClick={() => setModalPruebaOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-xs font-bold text-white block">
                {getTestTitle(selectedTipoPrueba).name}
              </span>
              <p className="text-[11px] text-slate-400">
                {getTestTitle(selectedTipoPrueba).desc}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPruebaEstado('APROBADO')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  pruebaEstado === 'APROBADO'
                    ? 'bg-emerald-500 text-black border-emerald-500 shadow'
                    : 'bg-cda-dark-900 border-cda-dark-800 text-slate-300 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ Aceptada</span>
              </button>

              <button
                type="button"
                onClick={() => setPruebaEstado('RECHAZADO')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  pruebaEstado === 'RECHAZADO'
                    ? 'bg-rose-500 text-white border-rose-500 shadow'
                    : 'bg-cda-dark-900 border-cda-dark-800 text-slate-300 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>✕ Reprobada</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Observaciones Técnicas (Opcional):
              </label>
              <textarea
                value={pruebaObservaciones}
                onChange={(e) => setPruebaObservaciones(e.target.value)}
                placeholder="Parámetros medidos o notas..."
                rows={3}
                className="w-full bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-xl p-3 focus:border-cda-yellow-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalPruebaOpen(false)}
                className="w-1/3 py-2.5 rounded-xl bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarPrueba}
                disabled={isSavingPrueba}
                className="w-2/3 py-2.5 rounded-xl bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cda-yellow-500/20"
              >
                {isSavingPrueba ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {selectedTicketOrden && (
        <TicketTermicoModal
          onClose={() => setSelectedTicketOrden(null)}
          orden={selectedTicketOrden}
        />
      )}
    </div>
  );
}
