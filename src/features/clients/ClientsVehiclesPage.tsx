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
  RefreshCw
} from 'lucide-react';
import { Vehiculo, CategoriaVehiculo, VehiculoFormData } from '../../types/vehiculo';
import { Cliente, ClienteFormData } from '../../types/cliente';
import { vehiculoService } from '../../services/vehiculoService';
import { clienteService } from '../../services/clienteService';
import { VehiculoModal } from './VehiculoModal';
import { ClienteModal } from './ClienteModal';
import { Pagination } from '../../components/common/Pagination';
import { Link } from 'react-router-dom';
import { formatPlaca, formatPhone, formatDocumento } from '../../utils/formatters';

export function ClientsVehiclesPage() {
  const [activeTab, setActiveTab] = useState<'VEHICULOS' | 'CLIENTES'>('VEHICULOS');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters - Vehicles
  const [filterCategoria, setFilterCategoria] = useState<string>('TODAS');
  const [filterVigencia, setFilterVigencia] = useState<string>('TODOS');

  // Filters - Clients
  const [filterTipoDoc, setFilterTipoDoc] = useState<string>('TODOS');

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

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filterCategoria, filterVigencia, filterTipoDoc]);

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

    return matchesSearch && matchesTipoDoc;
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Directorio de Clientes & Vehículos</span>
            <span className="text-xs font-extrabold text-cda-yellow-400 bg-cda-yellow-400/10 px-2.5 py-0.5 rounded-full border border-cda-yellow-400/20">
              Registros
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Búsqueda instantánea, alertas preventivas de vencimiento, filtros y gestión de parque automotor
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-cda-dark-900 border border-cda-dark-700 text-slate-300 hover:text-white transition-colors"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

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

      {/* Tabs & Search & Filter Bar */}
      <div className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-3">
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
              placeholder={activeTab === 'VEHICULOS' ? "Buscar por placa, marca, propietario..." : "Buscar por cédula, nombre, celular..."}
              className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Badges Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cda-dark-800/80 text-xs">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </span>

          {activeTab === 'VEHICULOS' ? (
            <>
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
            </>
          ) : (
            <select
              value={filterTipoDoc}
              onChange={(e) => setFilterTipoDoc(e.target.value)}
              className="bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:border-cda-yellow-500 focus:outline-none"
            >
              <option value="TODOS">📄 Todos los Tipos de Doc</option>
              <option value="CC">Cédula de Ciudadanía (CC)</option>
              <option value="NIT">NIT (Empresa)</option>
              <option value="CE">Cédula de Extranjería (CE)</option>
              <option value="PASAPORTE">Pasaporte</option>
            </select>
          )}

          {(filterCategoria !== 'TODAS' || filterVigencia !== 'TODOS' || filterTipoDoc !== 'TODOS' || searchQuery) && (
            <button
              onClick={() => {
                setFilterCategoria('TODAS');
                setFilterVigencia('TODOS');
                setFilterTipoDoc('TODOS');
                setSearchQuery('');
              }}
              className="text-[11px] text-cda-yellow-400 hover:underline ml-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
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
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Propietario: <strong className="text-slate-200">{v.propietario?.nombresRazonSocial || 'No asignado'}</strong>
                    </p>
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
                            <div>
                              <p className="font-semibold text-white">{v.propietario.nombresRazonSocial}</p>
                              <p className="text-[11px] text-slate-400">{v.propietario.tipoDocumento} {formatDocumento(v.propietario.numeroDocumento)}</p>
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
          {/* CLIENTS LIST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:hidden">
            {paginatedClientes.length === 0 ? (
              <div className="col-span-full cda-glass rounded-2xl p-6 text-center text-slate-500 text-xs">
                {isLoading ? 'Cargando clientes...' : 'No se encontraron clientes registrados con los filtros aplicados.'}
              </div>
            ) : (
              paginatedClientes.map((c) => (
                <div key={c.id} className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-300 text-xs bg-cda-dark-900 px-2 py-0.5 rounded border border-cda-dark-800">
                      {c.tipoDocumento} {formatDocumento(c.numeroDocumento)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditCliente(c)}
                        className="p-1.5 rounded-lg bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 hover:text-white border border-cda-dark-700"
                        title="Editar cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="font-bold text-white text-sm">{c.nombresRazonSocial}</p>

                  <div className="space-y-1 text-xs pt-1 border-t border-cda-dark-800">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-cda-yellow-400 shrink-0" />
                      <span>{formatPhone(c.celular)}</span>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
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
                    <th className="p-4 font-semibold">Documento</th>
                    <th className="p-4 font-semibold">Nombre / Razón Social</th>
                    <th className="p-4 font-semibold">Contacto (Celular / Email)</th>
                    <th className="p-4 font-semibold">Dirección</th>
                    <th className="p-4 font-semibold">Cumpleaños</th>
                    <th className="p-4 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cda-dark-800 text-slate-200">
                  {paginatedClientes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        {isLoading ? 'Cargando clientes...' : 'No se encontraron clientes registrados.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedClientes.map((c) => (
                      <tr key={c.id} className="hover:bg-cda-dark-800/40 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-white bg-cda-dark-900 px-2 py-1 rounded border border-cda-dark-700">
                            {c.tipoDocumento} {formatDocumento(c.numeroDocumento)}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-white">{c.nombresRazonSocial}</td>
                        <td className="p-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-cda-yellow-400" />
                            <span>{formatPhone(c.celular)}</span>
                          </div>
                          {c.email && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                              <Mail className="w-3.5 h-3.5 text-blue-400" />
                              <span>{c.email}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-slate-400">{c.direccion || '-'}</td>
                        <td className="p-4 text-slate-400">
                          {c.fechaNacimiento ? (
                            <div className="flex items-center gap-1 text-slate-300">
                              <Calendar className="w-3.5 h-3.5 text-pink-400" />
                              <span>{c.fechaNacimiento}</span>
                            </div>
                          ) : '-'}
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
                    ))
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
