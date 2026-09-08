import React, { useState, useEffect } from 'react';
import { terceroService } from '../../services/terceroService';
import { Tercero, TerceroFormData } from '../../types/tercero';
import { ProveedorModal } from './ProveedorModal';
import { 
  Building2, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Edit3, 
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

export const ProveedoresPage: React.FC = () => {
  const [proveedores, setProveedores] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [proveedorAEditar, setProveedorAEditar] = useState<Tercero | null>(null);

  const cargarProveedores = async () => {
    try {
      setLoading(true);
      const data = await terceroService.listarProveedores();
      setProveedores(data);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const handleSave = async (data: TerceroFormData) => {
    if (proveedorAEditar) {
      await terceroService.actualizarProveedor(proveedorAEditar.id, data);
    } else {
      await terceroService.crearProveedor(data);
    }
    await cargarProveedores();
  };

  const proveedoresFiltrados = proveedores.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.razonSocialONombre.toLowerCase().includes(q) ||
      p.numeroDocumento.toLowerCase().includes(q) ||
      p.celularPrincipal.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-w-0 flex-1 overflow-x-hidden">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Directorio de Proveedores y Acreedores
              </h1>
              <p className="text-sm text-slate-400">
                Gestión unificada de empresas prestadoras de calibración, insumos, software y servicios
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={cargarProveedores}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setProveedorAEditar(null);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proveedor</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por razón social, NIT/Cédula o celular..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 px-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span>Total: <strong className="text-white">{proveedoresFiltrados.length}</strong></span>
        </div>
      </div>

      {/* Vista Móvil (Tarjetas Táctiles) */}
      <div className="grid grid-cols-1 md:hidden gap-3.5">
        {loading ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
            Cargando directorio de proveedores...
          </div>
        ) : proveedoresFiltrados.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
            No se encontraron proveedores con ese criterio de búsqueda.
          </div>
        ) : (
          proveedoresFiltrados.map((p) => (
            <div
              key={p.id}
              className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-3 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {p.tipoDocumento}: {p.numeroDocumento} {p.digitoVerificacion ? `-${p.digitoVerificacion}` : ''}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{p.razonSocialONombre}</h3>
                </div>
                <button
                  onClick={() => {
                    setProveedorAEditar(p);
                    setModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{p.celularPrincipal}</span>
                </div>
                {p.emailPrincipal && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{p.emailPrincipal}</span>
                  </div>
                )}
                {p.direccion && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{p.direccion}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vista de Escritorio (Tabla Estilizada) */}
      <div className="hidden md:block bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">Documento / NIT</th>
              <th className="py-3.5 px-4">Razón Social / Proveedor</th>
              <th className="py-3.5 px-4">Contacto & Celular</th>
              <th className="py-3.5 px-4">Correo Electrónico</th>
              <th className="py-3.5 px-4">Ubicación</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                  Cargando directorio...
                </td>
              </tr>
            ) : proveedoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No hay proveedores registrados.
                </td>
              </tr>
            ) : (
              proveedoresFiltrados.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-amber-400">
                    {p.tipoDocumento} {p.numeroDocumento}{p.digitoVerificacion ? `-${p.digitoVerificacion}` : ''}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">
                    {p.razonSocialONombre}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{p.celularPrincipal}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {p.emailPrincipal ? (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate max-w-[200px]">{p.emailPrincipal}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">
                    {p.municipioDane || p.direccion || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        setProveedorAEditar(p);
                        setModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Editar Proveedor"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Registro / Edición */}
      <ProveedorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        proveedorAEditar={proveedorAEditar}
      />
    </div>
  );
};
