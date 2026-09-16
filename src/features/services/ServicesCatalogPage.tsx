import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Search, 
  X, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Save, 
  Loader2, 
  Car, 
  Bike, 
  Truck, 
  Bus, 
  Lock,
  Sparkles
} from 'lucide-react';
import { tarifaService } from '../../services/tarifaService';
import { useAuthStore } from '../../store/useAuthStore';
import { Tarifa, TarifaCreateRequest, TarifaUpdateRequest } from '../../types/tarifa';
import { CategoriaVehiculo } from '../../types/vehiculo';
import { Pagination } from '../../components/common/Pagination';

export function ServicesCatalogPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'ADMINISTRADOR';

  const [servicios, setServicios] = useState<Tarifa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('TODAS');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal Create / Edit State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [categoria, setCategoria] = useState<CategoriaVehiculo>('LIVIANO');
  const [tipoServicio, setTipoServicio] = useState('RTM_LEGAL');
  const [nombreServicio, setNombreServicio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [valorServicio, setValorServicio] = useState<number | ''>('');
  const [iva, setIva] = useState<number | ''>('');
  const [runt, setRunt] = useState<number | ''>('');
  const [sicov, setSicov] = useState<number | ''>('');
  const [operador, setOperador] = useState<number | ''>('');
  const [seguridadVial, setSeguridadVial] = useState<number | ''>('');
  const [fupa, setFupa] = useState<number | ''>('');
  const [ivaPorcentaje, setIvaPorcentaje] = useState<number>(19);
  const [activo, setActivo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const totalCalculado =
    (Number(valorServicio) || 0) +
    (Number(iva) || 0) +
    (Number(runt) || 0) +
    (Number(sicov) || 0) +
    (Number(operador) || 0) +
    (Number(seguridadVial) || 0) +
    (Number(fupa) || 0);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<Tarifa | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await tarifaService.getTarifas();
      setServicios(data);
    } catch {
      setError('Error al cargar el catálogo de servicios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setCodigo('');
    setCategoria('LIVIANO');
    setTipoServicio('RTM_LEGAL');
    setNombreServicio('');
    setDescripcion('');
    setValorServicio('');
    setIva('');
    setRunt('');
    setSicov('');
    setOperador('');
    setSeguridadVial('');
    setFupa('');
    setIvaPorcentaje(19);
    setActivo(true);
    setModalOpen(true);
    setError(null);
  };

  const handleOpenEdit = (t: Tarifa) => {
    setEditingId(t.id);
    setCodigo(t.codigo || '');
    setCategoria(t.categoria);
    setTipoServicio(t.tipoServicio || 'RTM_LEGAL');
    setNombreServicio(t.nombreServicio);
    setDescripcion(t.descripcion || '');
    setValorServicio(t.valorServicio || Math.round(t.precio / 1.19));
    setIva(t.iva || (t.precio - Math.round(t.precio / 1.19)));
    setRunt(t.runt || 0);
    setSicov(t.sicov || 0);
    setOperador(t.operador || 0);
    setSeguridadVial(t.seguridadVial || 0);
    setFupa(t.fupa || 0);
    setIvaPorcentaje(t.ivaPorcentaje || 19);
    setActivo(t.activo);
    setModalOpen(true);
    setError(null);
  };

  const handleAutoCalcIva = (valServ: number) => {
    setValorServicio(valServ);
    const ivaCalc = Math.round(valServ * 0.19);
    setIva(ivaCalc);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreServicio.trim() || totalCalculado < 0) {
      setError('Por favor completa todos los campos requeridos y valores válidos.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const basePayload = {
        codigo: codigo.trim() || undefined,
        categoria,
        tipoServicio,
        nombreServicio: nombreServicio.trim(),
        descripcion: descripcion.trim() || undefined,
        valorServicio: Number(valorServicio) || 0,
        iva: Number(iva) || 0,
        runt: Number(runt) || 0,
        sicov: Number(sicov) || 0,
        operador: Number(operador) || 0,
        seguridadVial: Number(seguridadVial) || 0,
        fupa: Number(fupa) || 0,
        precio: totalCalculado,
        ivaPorcentaje,
        activo,
      };

      if (editingId) {
        await tarifaService.updateTarifa(editingId, basePayload as TarifaUpdateRequest);
      } else {
        await tarifaService.createTarifa(basePayload as TarifaCreateRequest);
      }

      setModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      let msg = 'Error al guardar el servicio';
      if (err && typeof err === 'object' && 'response' in err) {
        const resData = (err as { response: { data?: { message?: string } } }).response?.data;
        if (resData?.message) msg = resData.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await tarifaService.deleteTarifa(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (err: unknown) {
      let msg = 'Error al eliminar el servicio';
      if (err && typeof err === 'object' && 'response' in err) {
        const resData = (err as { response: { data?: { message?: string } } }).response?.data;
        if (resData?.message) msg = resData.message;
      }
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered list
  const filteredServicios = servicios.filter((s) => {
    const matchesSearch = 
      s.nombreServicio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.codigo && s.codigo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.descripcion && s.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategoria = filterCategoria === 'TODAS' || s.categoria === filterCategoria;
    const matchesEstado = 
      filterEstado === 'TODOS' || 
      (filterEstado === 'ACTIVOS' && s.activo) || 
      (filterEstado === 'INACTIVOS' && !s.activo);

    return matchesSearch && matchesCategoria && matchesEstado;
  });

  const getCategoryIcon = (cat: CategoriaVehiculo) => {
    switch (cat) {
      case 'MOTO': return <Bike className="w-4 h-4 text-amber-400" />;
      case 'PESADO': return <Truck className="w-4 h-4 text-rose-400" />;
      case 'PUBLICO': return <Bus className="w-4 h-4 text-purple-400" />;
      default: return <Car className="w-4 h-4 text-cda-yellow-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Catálogo de Servicios & Tarifas</span>
            <span className="text-xs font-extrabold text-cda-yellow-400 bg-cda-yellow-400/10 px-2.5 py-0.5 rounded-full border border-cda-yellow-400/20">
              Precios Oficiales
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión completa de servicios, categorías vehiculares, precios anuales y tarifas RTM oficiales
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-cda-yellow-500 to-amber-500 hover:from-cda-yellow-400 hover:to-amber-400 text-black font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cda-yellow-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" />
            <span>Nuevo Servicio</span>
          </button>
        ) : (
          <span className="text-xs bg-cda-dark-800 text-slate-400 border border-cda-dark-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5" />
            <span>Modo Consulta</span>
          </span>
        )}
      </div>

      {/* Error Alert */}
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

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Servicios</span>
          <p className="text-xl font-black text-white font-mono mt-0.5">{servicios.length}</p>
        </div>

        <div className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Servicios Activos</span>
          <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
            {servicios.filter((s) => s.activo).length}
          </p>
        </div>

        <div className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Categorías</span>
          <p className="text-xl font-black text-cda-yellow-400 font-mono mt-0.5">4 Categorías</p>
        </div>

        <div className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Permisos</span>
          <p className="text-xs font-bold text-slate-200 mt-1.5 flex items-center gap-1">
            {isAdmin ? <Sparkles className="w-3.5 h-3.5 text-cda-yellow-400" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
            <span>{isAdmin ? 'Edición Total' : 'Solo Consulta'}</span>
          </p>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por código, nombre o descripción..."
              className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cda-yellow-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategoria}
              onChange={(e) => {
                setFilterCategoria(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-cda-yellow-500 focus:outline-none"
            >
              <option value="TODAS">Todas las Categorías</option>
              <option value="MOTO">🏍️ Motocicletas (MOTO)</option>
              <option value="LIVIANO">🚗 Livianos / Particulares</option>
              <option value="PUBLICO">🚕 Servicio Público</option>
              <option value="PESADO">🚚 Pesados & Camiones</option>
            </select>
          </div>

          {/* Status Filter */}
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
              <option value="ACTIVOS">✓ Solo Activos</option>
              <option value="INACTIVOS">✕ Inactivos / Pausados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Desktop Table & Mobile Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cda-yellow-400" />
          <span className="text-xs">Cargando catálogo de servicios...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block cda-glass rounded-2xl border border-cda-dark-700/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 bg-cda-dark-900/80 border-b border-cda-dark-800">
                  <tr>
                    <th className="p-3.5 font-semibold">Código / Servicio</th>
                    <th className="p-3.5 font-semibold">Categoría / Tipo</th>
                    <th className="p-3.5 font-semibold">Descripción</th>
                    <th className="p-3.5 font-semibold">Precio Oficial ($ COP)</th>
                    <th className="p-3.5 font-semibold">Estado</th>
                    {isAdmin && <th className="p-3.5 font-semibold text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cda-dark-800 text-slate-200">
                  {filteredServicios.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-slate-500">
                        No se encontraron servicios registrados con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredServicios
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-cda-dark-800/40 transition-colors">
                          <td className="p-3.5">
                            <span className="font-bold text-white block text-xs">{s.nombreServicio}</span>
                            <span className="text-[10px] font-mono text-cda-yellow-400/90 bg-cda-dark-950 px-1.5 py-0.5 rounded border border-cda-dark-800 inline-block mt-0.5">
                              {s.codigo || 'S/C'}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              {getCategoryIcon(s.categoria)}
                              <span className="font-bold text-white text-xs">{s.categoria}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {s.tipoServicio || 'RTM_LEGAL'}
                            </span>
                          </td>

                          <td className="p-3.5 max-w-xs">
                            <p className="text-slate-300 text-xs line-clamp-2">{s.descripcion || 'Sin descripción'}</p>
                          </td>

                          <td className="p-3.5">
                            <span className="font-mono font-black text-cda-yellow-400 text-sm block">
                              $ {s.precio?.toLocaleString('es-CO')} COP
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Base: $ {Math.round(s.precio / 1.19).toLocaleString('es-CO')}
                            </span>
                          </td>

                          <td className="p-3.5">
                            {s.activo ? (
                              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                Activo
                              </span>
                            ) : (
                              <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                Inactivo
                              </span>
                            )}
                          </td>

                          {isAdmin && (
                            <td className="p-3.5 text-right space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(s)}
                                className="bg-cda-dark-800 hover:bg-cda-yellow-500 hover:text-black text-slate-300 p-2 rounded-xl border border-cda-dark-700 transition-all"
                                title="Editar Servicio / Precio"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteTarget(s)}
                                className="bg-cda-dark-800 hover:bg-rose-600 hover:text-white text-rose-400 p-2 rounded-xl border border-cda-dark-700 transition-all"
                                title="Eliminar Servicio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {filteredServicios.length === 0 ? (
              <div className="p-8 text-center text-slate-500 cda-glass rounded-2xl border border-cda-dark-700">
                No se encontraron servicios.
              </div>
            ) : (
              filteredServicios
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((s) => (
                  <div
                    key={s.id}
                    className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-3 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-cda-yellow-500/10">
                          {getCategoryIcon(s.categoria)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs">{s.nombreServicio}</h4>
                          <span className="text-[10px] font-mono text-cda-yellow-400">
                            {s.codigo || 'S/C'} • {s.categoria}
                          </span>
                        </div>
                      </div>

                      {s.activo ? (
                        <span className="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                          Activo
                        </span>
                      ) : (
                        <span className="bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded text-[10px] font-bold">
                          Inactivo
                        </span>
                      )}
                    </div>

                    {s.descripcion && (
                      <p className="text-xs text-slate-400 line-clamp-2">{s.descripcion}</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-cda-dark-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Precio Oficial:</span>
                        <span className="font-mono font-black text-cda-yellow-400 text-sm">
                          $ {s.precio?.toLocaleString('es-CO')} COP
                        </span>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            className="bg-cda-dark-800 text-slate-300 px-2.5 py-1.5 rounded-xl border border-cda-dark-700 text-xs font-bold flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(s)}
                            className="bg-rose-500/15 text-rose-400 p-1.5 rounded-xl border border-rose-500/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredServicios.length / itemsPerPage) || 1}
            totalItems={filteredServicios.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}

      {/* Modal: Crear / Editar Servicio */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cda-glass rounded-3xl p-6 max-w-lg w-full border border-cda-yellow-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-cda-dark-800">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-cda-yellow-400" />
                <h3 className="font-black text-white text-base">
                  {editingId ? 'Editar Servicio / Tarifa' : 'Registrar Nuevo Servicio'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Código */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Código del Servicio:</label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ej. RTM-MOTO-2026"
                    className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white rounded-xl px-3 py-2 font-mono uppercase focus:border-cda-yellow-500 focus:outline-none"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Categoría Vehicular *:</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as CategoriaVehiculo)}
                    className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white rounded-xl px-3 py-2 focus:border-cda-yellow-500 focus:outline-none"
                    required
                  >
                    <option value="MOTO">🏍️ Motocicletas (MOTO)</option>
                    <option value="LIVIANO">🚗 Livianos / Particulares</option>
                    <option value="PUBLICO">🚕 Servicio Público</option>
                    <option value="PESADO">🚚 Pesados & Camiones</option>
                  </select>
                </div>
              </div>

              {/* Nombre del Servicio */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre Oficial del Servicio *:</label>
                <input
                  type="text"
                  value={nombreServicio}
                  onChange={(e) => setNombreServicio(e.target.value)}
                  placeholder="Ej. Revisión Preventiva de Frenos y Luces"
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white rounded-xl px-3 py-2 focus:border-cda-yellow-500 focus:outline-none"
                  required
                />
              </div>

              {/* Tipo de Servicio */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Tipo de Servicio:</label>
                <select
                  value={tipoServicio}
                  onChange={(e) => setTipoServicio(e.target.value)}
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white rounded-xl px-3 py-2 focus:border-cda-yellow-500 focus:outline-none"
                >
                  <option value="RTM_LEGAL">RTM Obligatoria Legal</option>
                  <option value="PREVENTIVA">Revisión Preventiva</option>
                  <option value="PERITAJE">Peritaje Comercial</option>
                  <option value="REINSPECCION">Reinspección (2do Intento)</option>
                  <option value="OTRO">Otro Servicio / Adicional</option>
                </select>
              </div>

              {/* Desglose de 7 Rubros */}
              <div className="p-3.5 bg-cda-dark-900/90 rounded-2xl border border-cda-dark-800 space-y-3">
                <span className="text-[11px] font-bold text-cda-yellow-400 block uppercase">
                  Desglose de Tarifas Reguladas ($ COP):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">1. Servicio CDA (Base *):</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={valorServicio}
                      onChange={(e) => handleAutoCalcIva(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="Ej. 281508"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white font-mono font-bold rounded-xl px-3 py-2 focus:border-cda-yellow-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">2. IVA (19% s/Servicio *):</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={iva}
                      onChange={(e) => setIva(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="Ej. 53487"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white font-mono font-bold rounded-xl px-3 py-2 focus:border-cda-yellow-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">3. Tasa RUNT ($):</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={runt}
                      onChange={(e) => setRunt(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="Ej. 5500"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white font-mono font-bold rounded-xl px-3 py-2 focus:border-cda-yellow-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">4. SICOV ($):</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={sicov}
                      onChange={(e) => setSicov(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="Ej. 35492"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white font-mono font-bold rounded-xl px-3 py-2 focus:border-cda-yellow-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">5. Operador / Recaudo ($):</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={operador}
                      onChange={(e) => setOperador(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="Ej. 10329"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white font-mono font-bold rounded-xl px-3 py-2 focus:border-cda-yellow-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">6. Seguridad Vial (ANSV $):</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={seguridadVial}
                      onChange={(e) => setSeguridadVial(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="Ej. 0"
                      className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white font-mono font-bold rounded-xl px-3 py-2 focus:border-cda-yellow-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">7. FUPA / Certificado ($):</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={fupa}
                    onChange={(e) => setFupa(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="Ej. 0"
                    className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white font-mono font-bold rounded-xl px-3 py-2 focus:border-cda-yellow-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Vista previa en vivo del total regulado */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 uppercase font-bold block">Total Tarifa al Público (Suma):</span>
                  <span className="text-xs text-slate-300 font-mono">Servicio + IVA + RUNT + SICOV + Operador + ANSV + FUPA</span>
                </div>
                <span className="text-lg font-black font-mono text-cda-yellow-400">
                  $ {totalCalculado.toLocaleString('es-CO')} COP
                </span>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Descripción / Alcance:</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles sobre lo que incluye la inspección..."
                  rows={2}
                  className="w-full bg-cda-dark-900 border border-cda-dark-700 text-slate-300 rounded-xl px-3 py-2 resize-none focus:border-cda-yellow-500 focus:outline-none"
                />
              </div>

              {/* Activo Switch */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-cda-dark-900 border border-cda-dark-800">
                <span className="text-slate-300 font-bold">Estado del Servicio en Caja & Ventanilla:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-cda-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-2/3 py-2.5 rounded-xl bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cda-yellow-500/20"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4" />}
                  <span>{editingId ? 'Guardar Cambios' : 'Registrar Servicio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cda-glass rounded-3xl p-6 max-w-sm w-full border border-rose-500/40 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">¿Eliminar este servicio?</h3>
              <p className="text-xs text-slate-300 mt-1 font-bold">
                {deleteTarget.nombreServicio}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Esta acción retirará el servicio del catálogo de ventanilla.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="w-1/2 py-2.5 rounded-xl bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Trash2 className="w-4 h-4" />}
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
