import { useState, useEffect } from 'react';
import { 
  Car, 
  Users, 
  Search, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Bike, 
  Truck, 
  Bus,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Edit2,
  Filter,
  RefreshCw,
  Gift,
  MessageSquare,
  Building2,
  User,
  Clock
} from 'lucide-react';
import { Vehiculo, CategoriaVehiculo, VehiculoFormData } from '../../types/vehiculo';
import { Cliente, ClienteFormData } from '../../types/cliente';
import { vehiculoService } from '../../services/vehiculoService';
import { clienteService } from '../../services/clienteService';
import { siigoService } from '../../services/siigoService';
import { VehiculoModal } from './VehiculoModal';
import { ClienteModal } from './ClienteModal';
import { Pagination } from '../../components/common/Pagination';
import { Link } from 'react-router-dom';
import { formatPlaca, formatPhone, formatDocumento } from '../../utils/formatters';

export type FilterCumpleanosOption = 'TODOS' | 'HOY' | 'PROXIMOS_7' | 'ULTIMOS_7' | 'ESTE_MES' | 'RANGO';

interface BirthdayDetails {
  day: number;
  month: number; // 0-11
  monthName: string;
  diffDays: number;
  isToday: boolean;
  isProximos7: boolean;
  isUltimos7: boolean;
  isThisMonth: boolean;
  turningAge?: number;
  formattedDate: string;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function ClientsVehiclesPage() {
  const [activeTab, setActiveTab] = useState<'VEHICULOS' | 'CLIENTES'>('VEHICULOS');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingSiigo, setIsSyncingSiigo] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Filters - Vehicles
  const [filterCategoria, setFilterCategoria] = useState<string>('TODAS');
  const [filterVigencia, setFilterVigencia] = useState<string>('TODOS');

  // Filters - Clients
  const [filterTipoDoc, setFilterTipoDoc] = useState<string>('TODOS');
  const [filterCumpleanos, setFilterCumpleanos] = useState<FilterCumpleanosOption>('TODOS');
  const [customRangeStart, setCustomRangeStart] = useState('');
  const [customRangeEnd, setCustomRangeEnd] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals state
  const [isVehiculoModalOpen, setIsVehiculoModalOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<Partial<VehiculoFormData> | undefined>(undefined);

  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Partial<ClienteFormData> | undefined>(undefined);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [vehs, cls] = await Promise.all([
        vehiculoService.getVehiculos(),
        clienteService.getClientes(),
      ]);
      setVehiculos(vehs);
      setClientes(cls);
    } catch {
      // Manejo silencioso
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper para cálculo detallado de cumpleaños
  const getBirthdayDetails = (fechaNacimiento?: string | null): BirthdayDetails | null => {
    if (!fechaNacimiento) return null;
    const parts = fechaNacimiento.trim().split(/[-/]/);
    if (parts.length < 3) return null;

    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1;
    let day = parseInt(parts[2], 10);

    // Ajuste si viene en formato DD-MM-YYYY
    if (parts[0].length <= 2 && parts[2].length === 4) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    }

    if (isNaN(month) || isNaN(day) || month < 0 || month > 11 || day < 1 || day > 31) return null;

    const today = new Date();
    const currentYear = today.getFullYear();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let bdayThisYear = new Date(currentYear, month, day);
    const msPerDay = 1000 * 60 * 60 * 24;
    let diffDays = Math.round((bdayThisYear.getTime() - todayZero.getTime()) / msPerDay);

    if (diffDays < -180) {
      bdayThisYear = new Date(currentYear + 1, month, day);
      diffDays = Math.round((bdayThisYear.getTime() - todayZero.getTime()) / msPerDay);
    } else if (diffDays > 180) {
      bdayThisYear = new Date(currentYear - 1, month, day);
      diffDays = Math.round((bdayThisYear.getTime() - todayZero.getTime()) / msPerDay);
    }

    const isToday = diffDays === 0;
    const isProximos7 = diffDays > 0 && diffDays <= 7;
    const isUltimos7 = diffDays >= -7 && diffDays < 0;
    const isThisMonth = month === today.getMonth();

    let turningAge: number | undefined;
    if (year > 1900 && year <= currentYear) {
      turningAge = currentYear - year;
    }

    const formattedDate = `${day} de ${MONTH_NAMES[month]}`;

    return {
      day,
      month,
      monthName: MONTH_NAMES[month],
      diffDays,
      isToday,
      isProximos7,
      isUltimos7,
      isThisMonth,
      turningAge,
      formattedDate,
    };
  };

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filterCategoria, filterVigencia, filterTipoDoc, filterCumpleanos, customRangeStart, customRangeEnd]);

  // Filtering Vehicles
  const filteredVehiculos = vehiculos.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      v.placa.toLowerCase().includes(q.replace(/[^a-z0-9]/g, '')) ||
      v.marca.toLowerCase().includes(q) ||
      v.linea.toLowerCase().includes(q) ||
      (v.propietario?.nombresRazonSocial && v.propietario.nombresRazonSocial.toLowerCase().includes(q)) ||
      (v.propietario?.numeroDocumento && v.propietario.numeroDocumento.includes(q))
    );

    const matchesCategoria = filterCategoria === 'TODAS' || v.categoria === filterCategoria;

    let matchesVigencia = true;
    if (filterVigencia === 'SOAT_VENCIDO') matchesVigencia = !!v.soatVencido;
    else if (filterVigencia === 'RTM_VENCIDO') matchesVigencia = !!v.rtmVencido;
    else if (filterVigencia === 'PROXIMO') matchesVigencia = !!v.soatProximoVencer || !!v.rtmProximoVencer;
    else if (filterVigencia === 'VIGENTE') matchesVigencia = !v.soatVencido && !v.rtmVencido && !v.soatProximoVencer && !v.rtmProximoVencer;

    return matchesSearch && matchesCategoria && matchesVigencia;
  });

  // Filtering Clients
  const filteredClientes = clientes.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      c.nombresRazonSocial.toLowerCase().includes(q) ||
      c.numeroDocumento.includes(q) ||
      c.celular.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );

    const matchesTipoDoc = filterTipoDoc === 'TODOS' || c.tipoDocumento === filterTipoDoc;

    let matchesCumple = true;
    if (filterCumpleanos !== 'TODOS') {
      const bInfo = getBirthdayDetails(c.fechaNacimiento);
      if (!bInfo) {
        matchesCumple = false;
      } else if (filterCumpleanos === 'HOY') {
        matchesCumple = bInfo.isToday;
      } else if (filterCumpleanos === 'PROXIMOS_7') {
        matchesCumple = bInfo.isToday || bInfo.isProximos7;
      } else if (filterCumpleanos === 'ULTIMOS_7') {
        matchesCumple = bInfo.isToday || bInfo.isUltimos7;
      } else if (filterCumpleanos === 'ESTE_MES') {
        matchesCumple = bInfo.isThisMonth;
      } else if (filterCumpleanos === 'RANGO') {
        if (!customRangeStart || !customRangeEnd) {
          matchesCumple = true;
        } else {
          // Parse start and end MM-DD
          const sParts = customRangeStart.split('-');
          const eParts = customRangeEnd.split('-');
          const startVal = parseInt(sParts[sParts.length - 2], 10) * 100 + parseInt(sParts[sParts.length - 1], 10);
          const endVal = parseInt(eParts[eParts.length - 2], 10) * 100 + parseInt(eParts[eParts.length - 1], 10);
          const bVal = (bInfo.month + 1) * 100 + bInfo.day;

          if (startVal <= endVal) {
            matchesCumple = bVal >= startVal && bVal <= endVal;
          } else {
            // Range wraps around new year (e.g. Dec to Jan)
            matchesCumple = bVal >= startVal || bVal <= endVal;
          }
        }
      }
    }

    return matchesSearch && matchesTipoDoc && matchesCumple;
  });

  // Dynamic Birthday Counts
  const cumpleHoyCount = clientes.filter(c => getBirthdayDetails(c.fechaNacimiento)?.isToday).length;
  const cumpleProximos7Count = clientes.filter(c => {
    const b = getBirthdayDetails(c.fechaNacimiento);
    return b && (b.isToday || b.isProximos7);
  }).length;
  const cumpleUltimos7Count = clientes.filter(c => {
    const b = getBirthdayDetails(c.fechaNacimiento);
    return b && (b.isToday || b.isUltimos7);
  }).length;
  const cumpleMesCount = clientes.filter(c => getBirthdayDetails(c.fechaNacimiento)?.isThisMonth).length;

  // Paginated Data Slices
  const totalItems = activeTab === 'VEHICULOS' ? filteredVehiculos.length : filteredClientes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedVehiculos = filteredVehiculos.slice(startIndex, startIndex + itemsPerPage);
  const paginatedClientes = filteredClientes.slice(startIndex, startIndex + itemsPerPage);

  const handleEditVehiculo = (veh: Vehiculo) => {
    setEditingVehiculo({
      placa: veh.placa,
      categoria: veh.categoria,
      marca: veh.marca,
      linea: veh.linea,
      modelo: veh.modelo,
      chasisVin: veh.chasisVin || '',
      fechaVencimientoSoat: veh.fechaVencimientoSoat || '',
      fechaVencimientoRtm: veh.fechaVencimientoRtm || '',
      propietarioId: veh.propietario?.id || '',
    });
    setIsVehiculoModalOpen(true);
  };

  const handleCreateVehiculo = () => {
    setEditingVehiculo(undefined);
    setIsVehiculoModalOpen(true);
  };

  const handleEditCliente = (cli: Cliente) => {
    setEditingCliente({
      tipoDocumento: cli.tipoDocumento,
      numeroDocumento: cli.numeroDocumento,
      nombresRazonSocial: cli.nombresRazonSocial,
      direccion: cli.direccion || '',
      celular: cli.celular,
      email: cli.email || '',
      fechaNacimiento: cli.fechaNacimiento || '',
    });
    setIsClienteModalOpen(true);
  };

  const handleCreateCliente = () => {
    setEditingCliente(undefined);
    setIsClienteModalOpen(true);
  };

  const getCategoryIcon = (cat: CategoriaVehiculo) => {
    switch (cat) {
      case 'MOTO': return <Bike className="w-4 h-4 text-cda-yellow-400" />;
      case 'PESADO': return <Truck className="w-4 h-4 text-amber-400" />;
      case 'PUBLICO': return <Bus className="w-4 h-4 text-emerald-400" />;
      default: return <Car className="w-4 h-4 text-blue-400" />;
    }
  };

  const getDocBadgeColor = (tipoDoc?: string) => {
    const tipo = (tipoDoc || 'CC').toUpperCase();
    if (tipo === 'NIT') return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    if (tipo === 'CE') return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    if (tipo === 'PASAPORTE') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (tipo === 'TI') return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  };

  const renderTipoBadge = (tipoDoc?: string) => {
    const tipo = (tipoDoc || 'CC').toUpperCase();
    const colorClass = getDocBadgeColor(tipo);
    return (
      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-black uppercase border ${colorClass} whitespace-nowrap text-center`}>
        {tipo}
      </span>
    );
  };

  const handleSyncSiigo = async () => {
    try {
      setIsSyncingSiigo(true);
      setSyncFeedback(null);
      const res = await siigoService.syncCustomers(20, 100);
      setSyncFeedback(res.mensaje);
      await loadData();
    } catch (err: any) {
      setSyncFeedback('Error al sincronizar con SIIGO: ' + (err?.response?.data?.message || err?.message || 'Error'));
    } finally {
      setIsSyncingSiigo(false);
    }
  };

  const openWhatsAppBirthday = (cliente: Cliente) => {
    const cleanNum = cliente.celular.replace(/\D/g, '');
    const msg = `¡Hola ${cliente.nombresRazonSocial}! 🎂 Desde CDA San Pedro te enviamos un afectuoso saludo de ¡Feliz Cumpleaños! 🎉 Esperamos que disfrutes tu día al máximo y que sigas rodando seguro con nosotros. 🚗✨`;
    window.open(`https://wa.me/57${cleanNum}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Car className="w-6 h-6 text-cda-yellow-500" />
            <span>Vehículos & Clientes</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Búsqueda instantánea, alertas preventivas de vencimiento, filtros de cumpleaños y gestión oficial SIIGO
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadData}
            disabled={isLoading || isSyncingSiigo}
            className="p-2 rounded-xl bg-cda-dark-900 border border-cda-dark-700 text-slate-300 hover:text-white transition-colors"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {activeTab === 'CLIENTES' && (
            <button
              onClick={handleSyncSiigo}
              disabled={isSyncingSiigo}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm"
              title="Importar y sincronizar catálogo histórico de clientes desde SIIGO Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSiigo ? 'animate-spin' : ''}`} />
              <span>{isSyncingSiigo ? 'Sincronizando...' : 'Sincronizar con SIIGO'}</span>
            </button>
          )}

          {activeTab === 'VEHICULOS' ? (
            <button
              onClick={handleCreateVehiculo}
              className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cda-yellow-500/10 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Vehículo</span>
            </button>
          ) : (
            <button
              onClick={handleCreateCliente}
              className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cda-yellow-500/10 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Sincronización SIIGO */}
      {syncFeedback && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-emerald-400 hover:text-white font-bold text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs & Search & Filter Bar */}
      <div className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Tabs Selector */}
          <div className="flex bg-cda-dark-900/90 p-1 rounded-xl border border-cda-dark-700 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('VEHICULOS')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'VEHICULOS'
                  ? 'bg-cda-yellow-500 text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Vehículos ({filteredVehiculos.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('CLIENTES')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'CLIENTES'
                  ? 'bg-cda-yellow-500 text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clientes ({filteredClientes.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'VEHICULOS' ? "Buscar por placa, marca, propietario..." : "Buscar por documento, nombre, celular..."}
              className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Fila de Filtros Especializados */}
        {activeTab === 'VEHICULOS' ? (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cda-dark-800/80 text-xs">
            <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros:</span>
            </span>

            {/* Category Filter */}
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:border-cda-yellow-500 focus:outline-none"
            >
              <option value="TODAS">🚗 Todas las Categorías</option>
              <option value="LIVIANO">Livianos</option>
              <option value="MOTO">Motos</option>
              <option value="PESADO">Pesados</option>
              <option value="PUBLICO">Públicos</option>
            </select>

            {/* Vigencia Filter */}
            <select
              value={filterVigencia}
              onChange={(e) => setFilterVigencia(e.target.value)}
              className="bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:border-cda-yellow-500 focus:outline-none"
            >
              <option value="TODOS">📋 Toda Vigencia</option>
              <option value="SOAT_VENCIDO">🔴 SOAT Vencido</option>
              <option value="RTM_VENCIDO">🔴 RTM Vencida</option>
              <option value="PROXIMO">🟡 Próximo a Vencer (&le; 15 días)</option>
              <option value="VIGENTE">🟢 100% Vigentes</option>
            </select>

            {(filterCategoria !== 'TODAS' || filterVigencia !== 'TODOS' || searchQuery) && (
              <button
                onClick={() => {
                  setFilterCategoria('TODAS');
                  setFilterVigencia('TODOS');
                  setSearchQuery('');
                }}
                className="text-[11px] text-cda-yellow-400 hover:underline ml-auto"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          /* FILTROS AVANZADOS DE CLIENTES Y CUMPLEAÑOS */
          <div className="pt-2 border-t border-cda-dark-800/80 space-y-2.5 text-xs">
            {/* Chips de filtro de cumpleaños */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mr-1">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>Cumpleaños:</span>
              </span>

              <button
                type="button"
                onClick={() => setFilterCumpleanos('HOY')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  filterCumpleanos === 'HOY'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400'
                    : 'bg-cda-dark-900 hover:bg-cda-dark-800 text-slate-300 border border-cda-dark-700'
                }`}
              >
                <span>🎂 Hoy</span>
                {cumpleHoyCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    filterCumpleanos === 'HOY' ? 'bg-black text-amber-400' : 'bg-amber-500 text-black animate-pulse'
                  }`}>
                    {cumpleHoyCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterCumpleanos('PROXIMOS_7')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  filterCumpleanos === 'PROXIMOS_7'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400'
                    : 'bg-cda-dark-900 hover:bg-cda-dark-800 text-slate-300 border border-cda-dark-700'
                }`}
              >
                <span>📅 Próximos 7 días</span>
                {cumpleProximos7Count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    filterCumpleanos === 'PROXIMOS_7' ? 'bg-black text-amber-400' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {cumpleProximos7Count}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterCumpleanos('ULTIMOS_7')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  filterCumpleanos === 'ULTIMOS_7'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400'
                    : 'bg-cda-dark-900 hover:bg-cda-dark-800 text-slate-300 border border-cda-dark-700'
                }`}
              >
                <span>⏳ Últimos 7 días</span>
                {cumpleUltimos7Count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    filterCumpleanos === 'ULTIMOS_7' ? 'bg-black text-amber-400' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {cumpleUltimos7Count}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterCumpleanos('ESTE_MES')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  filterCumpleanos === 'ESTE_MES'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400'
                    : 'bg-cda-dark-900 hover:bg-cda-dark-800 text-slate-300 border border-cda-dark-700'
                }`}
              >
                <span>🗓️ Este Mes</span>
                {cumpleMesCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    filterCumpleanos === 'ESTE_MES' ? 'bg-black text-amber-400' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {cumpleMesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterCumpleanos('RANGO')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  filterCumpleanos === 'RANGO'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400'
                    : 'bg-cda-dark-900 hover:bg-cda-dark-800 text-slate-300 border border-cda-dark-700'
                }`}
              >
                <span>📆 Rango de Fechas</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterCumpleanos('TODOS')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  filterCumpleanos === 'TODOS'
                    ? 'bg-slate-700 text-white shadow'
                    : 'bg-cda-dark-900 hover:bg-cda-dark-800 text-slate-400 border border-cda-dark-700'
                }`}
              >
                Todos
              </button>

              {/* Selector de Tipo de Documento */}
              <div className="ml-auto flex items-center gap-2">
                <select
                  value={filterTipoDoc}
                  onChange={(e) => setFilterTipoDoc(e.target.value)}
                  className="bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:border-cda-yellow-500 focus:outline-none"
                >
                  <option value="TODOS">📄 Todos los Tipos</option>
                  <option value="CC">Cédula (CC)</option>
                  <option value="NIT">NIT (Empresas)</option>
                  <option value="CE">Cédula Ext. (CE)</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>

                {(filterCumpleanos !== 'TODOS' || filterTipoDoc !== 'TODOS' || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilterCumpleanos('TODOS');
                      setFilterTipoDoc('TODOS');
                      setSearchQuery('');
                      setCustomRangeStart('');
                      setCustomRangeEnd('');
                    }}
                    className="text-[11px] text-cda-yellow-400 hover:underline ml-1"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Selector de Rango de Fechas Personalizado */}
            {filterCumpleanos === 'RANGO' && (
              <div className="p-3 bg-cda-dark-900/90 rounded-xl border border-amber-500/30 flex flex-wrap items-center gap-3 animate-fade-in text-xs">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Filtrar Cumpleaños por Rango (Día/Mes):</span>
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-slate-400 text-[11px]">Desde:</label>
                  <input
                    type="date"
                    value={customRangeStart}
                    onChange={(e) => setCustomRangeStart(e.target.value)}
                    className="bg-cda-dark-950 border border-cda-dark-700 text-white rounded-lg px-2 py-1 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-slate-400 text-[11px]">Hasta:</label>
                  <input
                    type="date"
                    value={customRangeEnd}
                    onChange={(e) => setCustomRangeEnd(e.target.value)}
                    className="bg-cda-dark-950 border border-cda-dark-700 text-white rounded-lg px-2 py-1 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  (Compara día y mes de nacimiento de los clientes)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      {activeTab === 'VEHICULOS' ? (
        <>
          {/* MOBILE CARDS VIEW (< md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {paginatedVehiculos.length === 0 ? (
              <div className="cda-glass rounded-2xl p-6 text-center text-slate-500 text-xs">
                {isLoading ? 'Cargando vehículos...' : 'No se encontraron vehículos con los filtros aplicados.'}
              </div>
            ) : (
              paginatedVehiculos.map((v) => (
                <div key={v.id} className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-cda-dark-900 border border-cda-dark-700">
                        {getCategoryIcon(v.categoria)}
                      </div>
                      <div>
                        <span className="font-mono font-black text-sm text-cda-yellow-400 bg-cda-yellow-400/10 px-2 py-0.5 rounded border border-cda-yellow-400/20">
                          {formatPlaca(v.placa)}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{v.categoria}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditVehiculo(v)}
                        className="p-1.5 rounded-lg bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 hover:text-white border border-cda-dark-700"
                        title="Editar vehículo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        to={`/recepcion?placa=${v.placa}`}
                        className="bg-cda-yellow-500/15 hover:bg-cda-yellow-500 hover:text-black text-cda-yellow-400 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 border border-cda-yellow-500/30 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ingresar</span>
                      </Link>
                    </div>
                  </div>

                  <div className="text-xs">
                    <p className="font-bold text-white">{v.marca} {v.linea} <span className="text-slate-400 font-normal">({v.modelo})</span></p>
                    <div className="text-slate-400 text-[11px] mt-1 flex items-center gap-1.5 flex-wrap">
                      <span>Propietario:</span>
                      <strong className="text-slate-200">{v.propietario?.nombresRazonSocial || 'No asignado'}</strong>
                      {v.propietario && (
                        <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          {renderTipoBadge(v.propietario.tipoDocumento)}
                          <span className="font-mono font-bold text-slate-200 text-xs">
                            {formatDocumento(v.propietario.numeroDocumento)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges SOAT & RTM */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cda-dark-800 text-[11px]">
                    <div className="bg-cda-dark-900/80 p-2 rounded-xl border border-cda-dark-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">SOAT:</span>
                      {v.fechaVencimientoSoat ? (
                        <div className="mt-0.5">
                          <span className="font-medium text-slate-200">{v.fechaVencimientoSoat}</span>
                          {v.soatVencido ? (
                            <span className="text-rose-400 font-bold block text-[10px]">🔴 Vencido</span>
                          ) : v.soatProximoVencer ? (
                            <span className="text-cda-yellow-400 font-bold block text-[10px]">🟡 Próximo</span>
                          ) : (
                            <span className="text-emerald-400 font-medium block text-[10px]">🟢 Vigente</span>
                          )}
                        </div>
                      ) : <span className="text-slate-500">-</span>}
                    </div>

                    <div className="bg-cda-dark-900/80 p-2 rounded-xl border border-cda-dark-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">RTM (Tecno):</span>
                      {v.fechaVencimientoRtm ? (
                        <div className="mt-0.5">
                          <span className="font-medium text-slate-200">{v.fechaVencimientoRtm}</span>
                          {v.rtmVencido ? (
                            <span className="text-rose-400 font-bold block text-[10px]">🔴 Vencida</span>
                          ) : v.rtmProximoVencer ? (
                            <span className="text-cda-yellow-400 font-bold block text-[10px]">🟡 Próxima</span>
                          ) : (
                            <span className="text-emerald-400 font-medium block text-[10px]">🟢 Vigente</span>
                          )}
                        </div>
                      ) : <span className="text-slate-500">-</span>}
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
                    <th className="p-4 font-semibold">Placa / Categoría</th>
                    <th className="p-4 font-semibold">Vehículo</th>
                    <th className="p-4 font-semibold">Propietario</th>
                    <th className="p-4 font-semibold">Vencimiento SOAT</th>
                    <th className="p-4 font-semibold">Vencimiento RTM</th>
                    <th className="p-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cda-dark-800 text-slate-200">
                  {paginatedVehiculos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        {isLoading ? 'Cargando vehículos...' : 'No se encontraron vehículos registrados con los filtros aplicados.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedVehiculos.map((v) => (
                      <tr key={v.id} className="hover:bg-cda-dark-800/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-cda-dark-900 border border-cda-dark-700">
                              {getCategoryIcon(v.categoria)}
                            </div>
                            <div>
                              <span className="font-mono font-extrabold text-sm text-cda-yellow-400 bg-cda-yellow-400/10 px-2 py-0.5 rounded border border-cda-yellow-400/20">
                                {formatPlaca(v.placa)}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5">{v.categoria}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-white">{v.marca} {v.linea}</p>
                          <p className="text-[11px] text-slate-400">Modelo {v.modelo}</p>
                        </td>

                        <td className="p-4">
                          {v.propietario ? (
                            <div className="space-y-1">
                              <p className="font-semibold text-white uppercase">{v.propietario.nombresRazonSocial}</p>
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                {renderTipoBadge(v.propietario.tipoDocumento)}
                                <span className="font-mono text-xs font-bold text-slate-200">
                                  {formatDocumento(v.propietario.numeroDocumento)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">No asignado</span>
                          )}
                        </td>

                        <td className="p-4">
                          {v.fechaVencimientoSoat ? (
                            <div className="space-y-1">
                              <span className="text-[11px] font-medium text-slate-300">{v.fechaVencimientoSoat}</span>
                              {v.soatVencido ? (
                                <div className="flex items-center gap-1 text-[10px] text-rose-400 font-bold">
                                  <XCircle className="w-3 h-3" />
                                  <span>Vencido</span>
                                </div>
                              ) : v.soatProximoVencer ? (
                                <div className="flex items-center gap-1 text-[10px] text-cda-yellow-400 font-bold">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Próximo a vencer</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Vigente</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        <td className="p-4">
                          {v.fechaVencimientoRtm ? (
                            <div className="space-y-1">
                              <span className="text-[11px] font-medium text-slate-300">{v.fechaVencimientoRtm}</span>
                              {v.rtmVencido ? (
                                <div className="flex items-center gap-1 text-[10px] text-rose-400 font-bold">
                                  <XCircle className="w-3 h-3" />
                                  <span>Vencida</span>
                                </div>
                              ) : v.rtmProximoVencer ? (
                                <div className="flex items-center gap-1 text-[10px] text-cda-yellow-400 font-bold">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Próxima a vencer</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Vigente</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        <td className="p-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleEditVehiculo(v)}
                            className="inline-flex items-center gap-1 bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 hover:text-white border border-cda-dark-700 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-all"
                            title="Editar datos del vehículo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <Link
                            to={`/recepcion?placa=${v.placa}`}
                            className="inline-flex items-center gap-1 bg-cda-yellow-500/10 hover:bg-cda-yellow-500 hover:text-black text-cda-yellow-400 border border-cda-yellow-500/20 font-bold px-3 py-1.5 rounded-lg text-xs transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Ingreso</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* CLIENTS LIST - MOBILE VIEW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:hidden">
            {paginatedClientes.length === 0 ? (
              <div className="col-span-full cda-glass rounded-2xl p-6 text-center text-slate-500 text-xs">
                {isLoading ? 'Cargando clientes...' : 'No se encontraron clientes registrados con los filtros aplicados.'}
              </div>
            ) : (
              paginatedClientes.map((c) => {
                const bInfo = getBirthdayDetails(c.fechaNacimiento);
                const isEmpresa = c.tipoDocumento === 'NIT';

                return (
                  <div key={c.id} className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 whitespace-nowrap">
                        {renderTipoBadge(c.tipoDocumento)}
                        <span className="font-mono font-bold text-slate-100 text-xs tracking-wider">
                          {formatDocumento(c.numeroDocumento)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditCliente(c)}
                          className="p-1.5 rounded-lg bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 hover:text-white border border-cda-dark-700"
                          title="Editar cliente"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-white text-sm flex items-center gap-1.5 uppercase">
                        {isEmpresa ? <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" /> : <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        <span>{c.nombresRazonSocial}</span>
                      </p>
                      {c.direccion && (
                        <p className="text-slate-400 text-[11px] mt-0.5 truncate">{c.direccion}</p>
                      )}
                    </div>

                    <div className="space-y-1 text-xs pt-2 border-t border-cda-dark-800">
                      <div className="flex items-center justify-between text-slate-300">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-cda-yellow-400 shrink-0" />
                          <span>{formatPhone(c.celular)}</span>
                        </div>
                        {c.celular && (
                          <a
                            href={`https://wa.me/57${c.celular.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 bg-emerald-500/15 text-emerald-400 rounded-lg hover:bg-emerald-500/25 text-[10px] font-bold flex items-center gap-1"
                            title="Chat WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Cumpleaños en móvil */}
                    {bInfo && (
                      <div className="pt-2 border-t border-cda-dark-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Gift className="w-3.5 h-3.5 text-amber-400" />
                          <span>{bInfo.formattedDate} {bInfo.turningAge ? `(${bInfo.turningAge} años)` : ''}</span>
                        </div>

                        {bInfo.isToday ? (
                          <button
                            onClick={() => openWhatsAppBirthday(c)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black animate-pulse flex items-center gap-1 shadow-md"
                          >
                            <span>🎂 ¡Hoy!</span>
                            <MessageSquare className="w-3 h-3" />
                          </button>
                        ) : bInfo.isProximos7 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            🎈 En {bInfo.diffDays} días
                          </span>
                        ) : bInfo.isUltimos7 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            ⏳ Hace {Math.abs(bInfo.diffDays)} días
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* CLIENTS LIST - DESKTOP TABLE VIEW */}
          <div className="hidden md:block cda-glass rounded-2xl border border-cda-dark-700/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 bg-cda-dark-900/80 border-b border-cda-dark-800">
                  <tr>
                    <th className="p-4 font-semibold w-24 text-center">Tipo Doc.</th>
                    <th className="p-4 font-semibold w-36">N° Documento</th>
                    <th className="p-4 font-semibold">Nombre / Razón Social</th>
                    <th className="p-4 font-semibold">Contacto (Celular / Email)</th>
                    <th className="p-4 font-semibold">Dirección</th>
                    <th className="p-4 font-semibold">Cumpleaños & Alertas</th>
                    <th className="p-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cda-dark-800 text-slate-200">
                  {paginatedClientes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        {isLoading ? 'Cargando clientes...' : 'No se encontraron clientes registrados con los filtros aplicados.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedClientes.map((c) => {
                      const bInfo = getBirthdayDetails(c.fechaNacimiento);
                      const isEmpresa = c.tipoDocumento === 'NIT';

                      return (
                        <tr key={c.id} className="hover:bg-cda-dark-800/40 transition-colors">
                          <td className="p-4 whitespace-nowrap text-center">
                            {renderTipoBadge(c.tipoDocumento)}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-100 text-xs tracking-wider">
                              {formatDocumento(c.numeroDocumento)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              {isEmpresa ? (
                                <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              ) : (
                                <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              )}
                              <span className="font-bold text-white text-xs uppercase">{c.nombresRazonSocial}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {isEmpresa ? 'Persona Jurídica (Empresa)' : 'Persona Natural'}
                            </span>
                          </td>
                          <td className="p-4 space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Phone className="w-3.5 h-3.5 text-cda-yellow-400" />
                              <span>{formatPhone(c.celular)}</span>
                              {c.celular && (
                                <a
                                  href={`https://wa.me/57${c.celular.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 ml-1"
                                  title="Enviar WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 inline" />
                                </a>
                              )}
                            </div>
                            {c.email && (
                              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                <Mail className="w-3.5 h-3.5 text-blue-400" />
                                <span className="truncate max-w-[180px]">{c.email}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-slate-400 max-w-[150px] truncate">
                            {c.direccion || '-'}
                          </td>
                          <td className="p-4">
                            {bInfo ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                                  <Calendar className="w-3.5 h-3.5 text-pink-400" />
                                  <span>{bInfo.formattedDate}</span>
                                  {bInfo.turningAge && (
                                    <span className="text-[10px] text-slate-400">({bInfo.turningAge} años)</span>
                                  )}
                                </div>

                                {bInfo.isToday ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black animate-pulse flex items-center gap-1 shadow-md shadow-amber-500/30">
                                      🎂 ¡Cumpleaños Hoy!
                                    </span>
                                    {c.celular && (
                                      <button
                                        onClick={() => openWhatsAppBirthday(c)}
                                        className="p-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black rounded-lg transition-colors text-[10px] font-bold flex items-center gap-1"
                                        title="Enviar felicitación por WhatsApp"
                                      >
                                        <MessageSquare className="w-3 h-3" />
                                        <span>Felicitar</span>
                                      </button>
                                    )}
                                  </div>
                                ) : bInfo.isProximos7 ? (
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300">
                                    <Clock className="w-3 h-3" />
                                    <span>En {bInfo.diffDays} día(s) ({bInfo.day}/{bInfo.month + 1})</span>
                                  </div>
                                ) : bInfo.isUltimos7 ? (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <span>Hace {Math.abs(bInfo.diffDays)} día(s)</span>
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs italic">No registrada</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleEditCliente(c)}
                              className="inline-flex items-center gap-1 bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 hover:text-white border border-cda-dark-700 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
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
        </>
      )}

      {/* Reusable Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {/* Modals */}
      <VehiculoModal
        isOpen={isVehiculoModalOpen}
        onClose={() => {
          setIsVehiculoModalOpen(false);
          setEditingVehiculo(undefined);
        }}
        onSuccess={() => {
          loadData();
          setIsVehiculoModalOpen(false);
          setEditingVehiculo(undefined);
        }}
        initialData={editingVehiculo}
      />

      <ClienteModal
        isOpen={isClienteModalOpen}
        onClose={() => {
          setIsClienteModalOpen(false);
          setEditingCliente(undefined);
        }}
        onSuccess={() => {
          loadData();
          setIsClienteModalOpen(false);
          setEditingCliente(undefined);
        }}
        initialData={editingCliente}
      />
    </div>
  );
}
