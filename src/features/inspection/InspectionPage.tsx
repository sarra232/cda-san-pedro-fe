import { useState, useEffect } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  User, 
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
  ArrowRight
} from 'lucide-react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ingresoService } from '../../services/ingresoService';
import { OrdenIngreso, PruebaInspeccion, TipoPrueba, EstadoPrueba, EstadoOrden } from '../../types/ingreso';
import { formatPlaca, formatPhone, formatDocumento } from '../../utils/formatters';
import { Pagination } from '../../components/common/Pagination';
import { TicketTermicoModal } from '../reception/TicketTermicoModal';

export function InspectionPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canCertify = user?.rol === 'ADMINISTRADOR' || user?.rol === 'DIRECTOR_TECNICO';

  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrdenId = searchParams.get('ordenId') || '';

  // State
  const [ingresos, setIngresos] = useState<OrdenIngreso[]>([]);
  const [selectedOrden, setSelectedOrden] = useState<OrdenIngreso | null>(null);
  const [pruebas, setPruebas] = useState<PruebaInspeccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Pagination State
  const [searchFilter, setSearchFilter] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal Principal de Gestión de Pruebas de la Orden
  const [modalPistaOpen, setModalPistaOpen] = useState(false);

  // Mini-Modal / Formulario de Resultado de Prueba Individual
  const [modalPruebaOpen, setModalPruebaOpen] = useState(false);
  const [selectedTipoPrueba, setSelectedTipoPrueba] = useState<TipoPrueba | null>(null);
  const [pruebaEstado, setPruebaEstado] = useState<EstadoPrueba>('APROBADO');
  const [pruebaObservaciones, setPruebaObservaciones] = useState('');
  const [isSavingPrueba, setIsSavingPrueba] = useState(false);

  // Modal de Dictamen Final
  const [modalDictamenOpen, setModalDictamenOpen] = useState(false);
  const [dictamenEstado, setDictamenEstado] = useState<EstadoOrden>('APROBADO');
  const [dictamenObservaciones, setDictamenObservaciones] = useState('');
  const [isSavingDictamen, setIsSavingDictamen] = useState(false);

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
      
      // Recargar la orden para reflejar cambios de estado
      const updatedOrden = await ingresoService.getIngresoById(selectedOrden.id);
      setSelectedOrden(updatedOrden);
      setIngresos((prev) => prev.map((item) => (item.id === updatedOrden.id ? updatedOrden : item)));
    } catch {
      // Ignorar
    } finally {
      setIsSavingPrueba(false);
    }
  };

  const handleOpenDictamenModal = (estado: EstadoOrden) => {
    setDictamenEstado(estado);
    setDictamenObservaciones(selectedOrden?.observaciones || '');
    setModalDictamenOpen(true);
  };

  const handleGuardarDictamen = async () => {
    if (!selectedOrden) return;
    setIsSavingDictamen(true);
    try {
      const updated = await ingresoService.updateEstado(
        selectedOrden.id,
        dictamenEstado,
        dictamenObservaciones
      );
      setSelectedOrden(updated);
      setIngresos((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setModalDictamenOpen(false);
    } catch {
      // Ignorar
    } finally {
      setIsSavingDictamen(false);
    }
  };

  const getTestTitle = (tipo: TipoPrueba) => {
    switch (tipo) {
      case 'SENSORIAL_VISUAL':
        return {
          name: '1. Inspección Sensorial & Defectos Visuales',
          icon: <Eye className="w-5 h-5 text-amber-400" />,
          desc: 'Luces, llantas, vidrios, espejos, carrocería, cinturones y chasis',
        };
      case 'FRENOS_SUSPENSION':
        return {
          name: '2. Frenómetro & Suspensión',
          icon: <Gauge className="w-5 h-5 text-rose-400" />,
          desc: 'Eficacia de frenado (Eje 1 y 2), freno de mano y desequilibrio dinámico',
        };
      case 'LUCES_ALINEACION':
        return {
          name: '3. Luxómetro & Alineación al Paso',
          icon: <Lightbulb className="w-5 h-5 text-yellow-400" />,
          desc: 'Intensidad en Kilocandelas (kcd), inclinación y desviación lateral',
        };
      case 'GASES_EMISIONES':
        return {
          name: '4. Emisiones de Gases & Opacidad / Ruido',
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

  const pruebasCompletadas = pruebas.filter((p) => p.estado !== 'PENDIENTE').length;
  const pruebasAprobadas = pruebas.filter((p) => p.estado === 'APROBADO').length;
  const pruebasRechazadas = pruebas.filter((p) => p.estado === 'RECHAZADO').length;

  const filteredIngresos = ingresos.filter((i) => {
    const matchesSearch = 
      (i.vehiculo?.placa && i.vehiculo.placa.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (i.vehiculo?.propietario?.nombresRazonSocial && i.vehiculo.propietario.nombresRazonSocial.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (i.consecutivo && i.consecutivo.toString().includes(searchFilter));

    const matchesEstado = filterEstado === 'TODOS' || i.estado === filterEstado;
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
              Pruebas NTC 5375
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Control de 4 pruebas reglamentarias, trazabilidad de técnicos y dictamen oficial RTM
          </p>
        </div>
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
              onChange={(e) => {
                setFilterEstado(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-cda-yellow-500 focus:outline-none"
            >
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
                .map((i) => (
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

                    <div className="text-[11px] text-slate-300 space-y-0.5 pt-2 border-t border-cda-dark-800">
                      <p>Prop: <strong className="text-white">{i.vehiculo?.propietario?.nombresRazonSocial || 'No asignado'}</strong></p>
                      <p>Km: <span className="font-mono text-slate-200">{i.kilometraje?.toLocaleString('es-CO')} km</span></p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-cda-dark-800 gap-2">
                      <button
                        onClick={() => setSelectedTicketOrden(i)}
                        className="px-2.5 py-1.5 rounded-lg bg-cda-dark-800 text-slate-300 border border-cda-dark-700 text-xs flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Ticket</span>
                      </button>

                      <button
                        onClick={() => handleOpenPistaModal(i)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Gestionar Pista</span>
                      </button>

                      {i.estado !== 'FACTURADO' && (
                        <Link
                          to={`/facturacion?ingresoId=${i.id}`}
                          className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Facturar</span>
                        </Link>
                      )}
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
                      .map((i) => (
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

                            <button
                              onClick={() => handleOpenPistaModal(i)}
                              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow transition-all"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Gestionar Pruebas</span>
                            </button>

                            {i.estado !== 'FACTURADO' && (
                              <Link
                                to={`/facturacion?ingresoId=${i.id}`}
                                className="inline-flex items-center gap-1 bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-3 py-1.5 rounded-lg text-xs shadow-md shadow-cda-yellow-500/10 transition-all"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Facturar</span>
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

      {/* POP-UP / MODAL PRINCIPAL: GESTIÓN DE LAS 4 PRUEBAS EN PISTA */}
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

            {/* Body con Scroll Interno si es necesario */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Banner Informativo si es Reinspección */}
              {selectedOrden.esReinspeccion && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-bold text-white text-sm">
                          2da Revisión / Reinspección en Pista (Tarifa $0 COP)
                        </div>
                        <div className="text-[11px] text-amber-200">
                          Asociada a Turno Inicial <strong className="font-mono text-amber-400">#{selectedOrden.consecutivoOrdenPadre || 'Previo'}</strong>
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 text-center">
                      REINSPECCIÓN ACTIVA
                    </span>
                  </div>
                  {selectedOrden.pruebasRechazadasPrevias && selectedOrden.pruebasRechazadasPrevias.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-cda-dark-900/90 border border-amber-500/20 text-[11px] space-y-1">
                      <span className="font-bold text-amber-400">Pruebas Reprobadas en el 1er Intento:</span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {selectedOrden.pruebasRechazadasPrevias.map((p) => (
                          <span key={p} className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            {p.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                      <p className="text-slate-400 text-[10px]">
                        Las pruebas aprobadas inicialmente se han precargado para agilizar el proceso en pista.
                      </p>
                    </div>
                  )}
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
                          Vigencia Legal de 1 Año Certificada • Información transmitida ante RUNT y SICOV
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/facturacion?ingresoId=${selectedOrden.id}`}
                        className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cda-yellow-500/20 transition-all"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>Pasar a Facturación</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setSelectedTicketOrden(selectedOrden)}
                        className="bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 border border-cda-dark-700 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Printer className="w-4 h-4 text-cda-yellow-400" />
                        <span>Ticket / Certificado</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Banner de Estado RECHAZADO con Cronómetro de 15 Días */}
              {selectedOrden.estado === 'RECHAZADO' && (
                selectedOrden.esReinspeccionVigente !== false ? (
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs shadow-xl space-y-3 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-black text-white text-sm flex items-center gap-2">
                            <span>Plazo de 15 Días para 2da Revisión Gratuita</span>
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                              Día {(selectedOrden.diasTranscurridosRechazo ?? 0) + 1} de 15
                            </span>
                          </div>
                          <div className="text-[11px] text-amber-200 mt-0.5">
                            Quedan <strong className="text-white">{selectedOrden.diasRestantesReinspeccion ?? 15} días calendario</strong> de gracia legal para reingresar a pista sin costo adicional ($0 COP).
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            handleClosePistaModal();
                            navigate(`/recepcion?placa=${selectedOrden.vehiculo?.placa}&ordenPadreId=${selectedOrden.id}&esReinspeccion=true`);
                          }}
                          className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Iniciar 2da Revisión ($0)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs shadow-xl space-y-3 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 shrink-0">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-black text-white text-sm">
                            Plazo Legal de 15 Días Calendario Vencido
                          </div>
                          <div className="text-[11px] text-rose-200 mt-0.5">
                            El beneficio de reinspección gratuita ha expirado conforme a la Resolución 3768. Cualquier reintento requiere el cobro de la tarifa plena (100%).
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            handleClosePistaModal();
                            navigate(`/recepcion?placa=${selectedOrden.vehiculo?.placa}`);
                          }}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all"
                        >
                          <ArrowRight className="w-4 h-4" />
                          <span>Nueva Revisión (Con Cobro)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
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

              {/* Barra de Progreso de Pruebas */}
              <div className="space-y-1.5 p-4 rounded-2xl bg-cda-dark-900/60 border border-cda-dark-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Progreso de Pruebas Reglamentarias:</span>
                  <span className="font-mono font-black text-cda-yellow-400">
                    {pruebasCompletadas} de 4 completadas ({Math.round((pruebasCompletadas / 4) * 100)}%)
                  </span>
                </div>

                <div className="w-full bg-cda-dark-950 h-3 rounded-full overflow-hidden border border-cda-dark-800 flex">
                  <div
                    className={`h-full transition-all duration-500 ${
                      pruebasRechazadas > 0
                        ? 'bg-rose-500'
                        : pruebasAprobadas === 4
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-cda-yellow-500 to-amber-500'
                    }`}
                    style={{ width: `${(pruebasCompletadas / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Las 4 Pruebas Reglamentarias en Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    4 Pruebas Reglamentarias NTC 5375
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Registra el veredicto y observaciones por técnico responsable
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(['SENSORIAL_VISUAL', 'FRENOS_SUSPENSION', 'LUCES_ALINEACION', 'GASES_EMISIONES'] as TipoPrueba[]).map((tipo) => {
                    const prueba = pruebas.find((p) => p.tipoPrueba === tipo);
                    const meta = getTestTitle(tipo);
                    const isAprobada = prueba?.estado === 'APROBADO';
                    const isRechazada = prueba?.estado === 'RECHAZADO';
                    const isPendiente = !prueba || prueba.estado === 'PENDIENTE';
                    const wasReprobadaPreviamente = selectedOrden.pruebasRechazadasPrevias?.includes(tipo);

                    return (
                      <div
                        key={tipo}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          wasReprobadaPreviamente && isPendiente
                            ? 'bg-amber-950/30 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                            : isAprobada
                            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                            : isRechazada
                            ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
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
                            {isAprobada && (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-black">
                                APROBADA
                              </span>
                            )}
                            {isRechazada && (
                              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded-full text-[10px] font-black">
                                RECHAZADA
                              </span>
                            )}
                            {isPendiente && (
                              <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {wasReprobadaPreviamente ? 'REINSPECCIÓN' : 'PENDIENTE'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Responsable & Observaciones */}
                        {prueba && prueba.estado !== 'PENDIENTE' && (
                          <div className="p-2.5 rounded-xl bg-cda-dark-900/80 border border-cda-dark-800 text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-cda-yellow-400" />
                                <strong className="text-white">{prueba.usuarioResponsableNombre || 'Técnico'}</strong> ({prueba.usuarioResponsableRol || 'PISTA'})
                              </span>
                              <span className="font-mono text-[10px]">
                                {prueba.fechaEjecucion ? new Date(prueba.fechaEjecucion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            {prueba.observaciones && (
                              <p className="text-slate-300 italic text-[10px]">"{prueba.observaciones}"</p>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenPruebaModal(tipo, 'APROBADO')}
                            className="w-1/2 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>✓ Aprobar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenPruebaModal(tipo, 'RECHAZADO')}
                            className="w-1/2 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>✕ Rechazar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Panel de Dictamen Final */}
              <div className="p-5 rounded-2xl bg-cda-dark-900 border border-cda-yellow-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    Dictamen Final & Certificación RTM
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {pruebasCompletadas === 4
                      ? 'Las 4 pruebas técnicas han finalizado. Emite el veredicto oficial.'
                      : 'Puedes emitir dictamen inmediato o continuar completando las pruebas.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {canCertify ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenDictamenModal('APROBADO')}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>✓ Aprobar RTM Oficial</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDictamenModal('RECHAZADO')}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>✕ Rechazar RTM</span>
                      </button>
                    </>
                  ) : (
                    <div className="bg-cda-dark-950 border border-cda-dark-800 px-3.5 py-2.5 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Firma y dictamen exclusivo del <strong>Director Técnico</strong> o <strong>Administrador</strong></span>
                    </div>
                  )}
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
                Volver a la Lista de Vehículos
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

                {selectedOrden.estado !== 'FACTURADO' && (
                  <Link
                    to={`/facturacion?ingresoId=${selectedOrden.id}`}
                    className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Ir a Facturación</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini-Modal de Registro / Actualización de Prueba Específica */}
      {modalPruebaOpen && selectedTipoPrueba && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cda-glass rounded-3xl p-6 max-w-md w-full border border-cda-yellow-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cda-dark-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cda-yellow-400" />
                <h3 className="font-black text-white text-base">
                  Registrar Resultado de Prueba
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

            {/* Selector de Resultado */}
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
                <span>✓ Aprobada</span>
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
                <span>✕ Rechazada</span>
              </button>
            </div>

            {/* Observaciones Técnicas */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Observaciones Técnicas / Parámetros Medidos (Opcional):
              </label>
              <textarea
                value={pruebaObservaciones}
                onChange={(e) => setPruebaObservaciones(e.target.value)}
                placeholder={pruebaEstado === 'APROBADO' ? 'Ej. Eficacia 58%, Desequilibrio 12% (Dentro de norma)' : 'Ej. Fuga en línea de escape, CO: 4.8% (Excede límite 3.5%)'}
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
                <span>Guardar Prueba</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Dictamen Final */}
      {modalDictamenOpen && selectedOrden && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cda-glass rounded-3xl p-6 max-w-md w-full border border-cda-yellow-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cda-dark-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cda-yellow-400" />
                <h3 className="font-black text-white text-base">
                  Dictamen Final de Inspección
                </h3>
              </div>
              <button
                onClick={() => setModalDictamenOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-cda-dark-900 border border-cda-dark-800 flex items-center justify-between">
              <span className="whitespace-nowrap inline-flex items-center px-2.5 py-0.5 rounded-lg bg-cda-yellow-400 text-black font-mono font-black text-sm tracking-wider">
                {formatPlaca(selectedOrden.vehiculo?.placa)}
              </span>
              <span className="text-xs text-white font-bold">
                {dictamenEstado === 'APROBADO' ? '✓ APROBAR RTM' : '✕ RECHAZAR RTM'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Observaciones Generales para el Certificado / Informe:
              </label>
              <textarea
                value={dictamenObservaciones}
                onChange={(e) => setDictamenObservaciones(e.target.value)}
                placeholder="Observaciones de cierre..."
                rows={3}
                className="w-full bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-xl p-3 focus:border-cda-yellow-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalDictamenOpen(false)}
                className="w-1/3 py-2.5 rounded-xl bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarDictamen}
                disabled={isSavingDictamen}
                className="w-2/3 py-2.5 rounded-xl bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cda-yellow-500/20"
              >
                {isSavingDictamen ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Confirmar Dictamen</span>
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
