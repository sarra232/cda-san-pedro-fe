import React, { useState, useMemo } from 'react';
import { OrdenIngreso } from '../../types/ingreso';
import { Factura } from '../../types/factura';
import { Tarifa } from '../../types/tarifa';
import { formatPlaca, formatDocumento } from '../../utils/formatters';
import { 
  Search, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Send, 
  Car, 
  Bike, 
  Truck, 
  Bus, 
  Wrench, 
  ShieldCheck
} from 'lucide-react';
import { SiigoBadge } from './SiigoBadge';

export type BillingFilterTab = 'TODAS' | 'PENDIENTES' | 'COMPLETADOS' | 'RECHAZADOS';

interface BillingOrdersListProps {
  ordenes: OrdenIngreso[];
  facturas: Factura[];
  tarifas: Tarifa[];
  onSelectOrdenParaFacturar: (orden: OrdenIngreso) => void;
  onVerFactura: (factura: Factura) => void;
  onDownloadPdf: (facturaId: string, numeroFactura: string) => void;
  onSendWhatsapp: (facturaId: string) => void;
}

export const BillingOrdersList: React.FC<BillingOrdersListProps> = ({
  ordenes,
  facturas,
  tarifas,
  onSelectOrdenParaFacturar,
  onVerFactura,
  onDownloadPdf,
  onSendWhatsapp,
}) => {
  const [activeFilter, setActiveFilter] = useState<BillingFilterTab>('PENDIENTES');
  const [searchQuery, setSearchQuery] = useState('');

  // Mapa de facturas por ordenIngresoId para lookup instantáneo
  const facturasPorOrdenId = useMemo(() => {
    const map = new Map<string, Factura>();
    facturas.forEach((f) => {
      if (f.ordenIngreso?.id) {
        map.set(f.ordenIngreso.id, f);
      }
    });
    return map;
  }, [facturas]);

  const getTarifa = (categoria?: string, esReinspeccion?: boolean) => {
    if (esReinspeccion) return 0;
    if (!categoria) return 320000;
    const found = tarifas.find((t) => t.categoria === categoria);
    return found ? found.precio : 320000;
  };

  const getCategoryIcon = (categoria?: string) => {
    switch (categoria) {
      case 'MOTO': return <Bike className="w-4 h-4 text-amber-400" />;
      case 'PESADO': return <Truck className="w-4 h-4 text-rose-400" />;
      case 'PUBLICO': return <Bus className="w-4 h-4 text-purple-400" />;
      default: return <Car className="w-4 h-4 text-amber-400" />;
    }
  };

  // Calcular días transcurridos para una orden
  const getDiasTranscurridos = (fechaStr?: string) => {
    if (!fechaStr) return 0;
    const fecha = new Date(fechaStr);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  // Filtrar y ordenar la lista según el filtro activo y búsqueda
  const itemsFiltrados = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return ordenes.filter((orden) => {
      // Búsqueda textual
      const matchPlaca = orden.vehiculo?.placa?.toLowerCase().includes(q) || false;
      const matchConsecutivo = orden.consecutivo?.toString().includes(q) || false;
      const matchPropietario = orden.vehiculo?.propietario?.nombresRazonSocial?.toLowerCase().includes(q) || false;
      const matchDoc = orden.vehiculo?.propietario?.numeroDocumento?.includes(q) || false;
      
      const factura = facturasPorOrdenId.get(orden.id);
      const matchFactura = factura?.numeroFactura?.toLowerCase().includes(q) || false;

      const coincideBusqueda = !q || matchPlaca || matchConsecutivo || matchPropietario || matchDoc || matchFactura;
      if (!coincideBusqueda) return false;

      // Filtros por pestaña
      if (activeFilter === 'PENDIENTES') {
        // En pista o aprobadas pendientes de cobro (no facturadas ni rechazadas)
        return orden.estado === 'INGRESADO' || orden.estado === 'EN_INSPECCION' || orden.estado === 'APROBADO';
      }

      if (activeFilter === 'COMPLETADOS') {
        // Órdenes que ya tienen factura emitida
        return orden.estado === 'FACTURADO' || Boolean(factura);
      }

      if (activeFilter === 'RECHAZADOS') {
        if (orden.estado !== 'RECHAZADO') return false;
        // REGLA: "si supera los 15 dias calendarios de creados no mostrar mas defecto"
        const dias = getDiasTranscurridos(orden.fechaIngreso || orden.createdAt);
        return dias <= 15;
      }

      return true; // TODAS
    }).sort((a, b) => {
      // Ordenamiento por defecto:
      // Para rechazados: descendente de acuerdo al tiempo (más recientes primero)
      const fechaA = new Date(a.fechaIngreso || a.createdAt || 0).getTime();
      const fechaB = new Date(b.fechaIngreso || b.createdAt || 0).getTime();
      return fechaB - fechaA;
    });
  }, [ordenes, facturasPorOrdenId, activeFilter, searchQuery]);

  // Conteo de items para las pestañas
  const counts = useMemo(() => {
    let pendientes = 0;
    let completados = 0;
    let rechazados = 0;

    ordenes.forEach((o) => {
      if (o.estado === 'INGRESADO' || o.estado === 'EN_INSPECCION' || o.estado === 'APROBADO') pendientes++;
      if (o.estado === 'FACTURADO' || facturasPorOrdenId.has(o.id)) completados++;
      if (o.estado === 'RECHAZADO') {
        const dias = getDiasTranscurridos(o.fechaIngreso || o.createdAt);
        if (dias <= 15) rechazados++;
      }
    });

    return { todas: ordenes.length, pendientes, completados, rechazados };
  }, [ordenes, facturasPorOrdenId]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros de Pestañas y Búsqueda */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        {/* Pestañas de Filtro */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveFilter('PENDIENTES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeFilter === 'PENDIENTES'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendientes ({counts.pendientes})</span>
          </button>

          <button
            onClick={() => setActiveFilter('COMPLETADOS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeFilter === 'COMPLETADOS'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completados ({counts.completados})</span>
          </button>

          <button
            onClick={() => setActiveFilter('RECHAZADOS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeFilter === 'RECHAZADOS'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'text-slate-400 hover:text-red-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Rechazados Vigentes ({counts.rechazados})</span>
          </button>

          <button
            onClick={() => setActiveFilter('TODAS')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'TODAS'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({counts.todas})
          </button>
        </div>

        {/* Input de Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por placa, # turno, cliente o factura..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Vista de Lista Responsiva (Mobile-First: Tarjetas en celular, Tabla en escritorio) */}
      
      {/* 1. Vista Móvil (< 768px) */}
      <div className="grid grid-cols-1 md:hidden gap-3">
        {itemsFiltrados.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-3xl border border-slate-800 text-xs">
            No se encontraron registros para el filtro actual.
          </div>
        ) : (
          itemsFiltrados.map((orden) => {
            const factura = facturasPorOrdenId.get(orden.id);
            const diasTrans = getDiasTranscurridos(orden.fechaIngreso || orden.createdAt);
            const tarifaEstimada = getTarifa(orden.vehiculo?.categoria, Boolean(orden.esReinspeccion));

            return (
              <div
                key={orden.id}
                onClick={() => {
                  if (orden.estado === 'FACTURADO' && factura) {
                    onVerFactura(factura);
                  } else {
                    onSelectOrdenParaFacturar(orden);
                  }
                }}
                className="p-4 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl space-y-3 cursor-pointer transition-all shadow-lg active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                      {getCategoryIcon(orden.vehiculo?.categoria)}
                    </div>
                    <div>
                      <span className="font-mono font-black text-base text-amber-400 tracking-wider">
                        {formatPlaca(orden.vehiculo?.placa)}
                      </span>
                      <div className="text-[11px] text-slate-400">
                        Turno #{orden.consecutivo || 'S/N'} • {orden.vehiculo?.marca} {orden.vehiculo?.linea}
                      </div>
                    </div>
                  </div>

                  {/* Badge de Estado */}
                  <div>
                    {orden.estado === 'FACTURADO' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Facturado</span>
                      </span>
                    ) : orden.estado === 'RECHAZADO' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Día {diasTrans} de 15</span>
                      </span>
                    ) : orden.estado === 'APROBADO' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Listo Cobro</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                        <Wrench className="w-3 h-3 animate-spin" />
                        <span>En Pista</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 border-t border-slate-800/80 pt-2.5">
                  <div className="truncate max-w-[180px]">
                    <span className="text-slate-500">Cliente: </span>
                    <strong className="text-slate-200">
                      {orden.vehiculo?.propietario?.nombresRazonSocial || 'No asignado'}
                    </strong>
                  </div>
                  <div className="text-right font-mono font-bold text-amber-400">
                    {factura ? `$${factura.total?.toLocaleString('es-CO')}` : `$${tarifaEstimada.toLocaleString('es-CO')}`}
                  </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="flex items-center justify-end gap-2 pt-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  {factura ? (
                    <>
                      <SiigoBadge 
                        facturaId={factura.id}
                        estadoDian={factura.estadoDian}
                        numeroFacturaSiigo={factura.numeroFacturaSiigo}
                        pdfSiigoUrl={factura.pdfSiigoUrl}
                        cufe={factura.cufe}
                        mensajeRespuestaDian={factura.mensajeRespuestaDian}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadPdf(factura.id, factura.numeroFactura);
                        }}
                        className="px-3 py-1.5 bg-slate-800 text-amber-400 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendWhatsapp(factura.id);
                        }}
                        className="px-3 py-1.5 bg-emerald-950/80 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/30 flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrdenParaFacturar(orden);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Completar Factura</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Vista de Tabla Escritorio (>= 768px) */}
      <div className="hidden md:block bg-slate-900/90 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-bold">
              <th className="py-4 px-4">Turno / Placa</th>
              <th className="py-4 px-4">Vehículo & Servicio</th>
              <th className="py-4 px-4">Cliente / Propietario</th>
              <th className="py-4 px-4">Estado Operativo</th>
              <th className="py-4 px-4">Fecha / Antigüedad</th>
              <th className="py-4 px-4 text-right">Monto Liquidado</th>
              <th className="py-4 px-4 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {itemsFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No hay órdenes o facturas que coincidan con el filtro seleccionado.
                </td>
              </tr>
            ) : (
              itemsFiltrados.map((orden) => {
                const factura = facturasPorOrdenId.get(orden.id);
                const diasTrans = getDiasTranscurridos(orden.fechaIngreso || orden.createdAt);
                const tarifaEstimada = getTarifa(orden.vehiculo?.categoria, Boolean(orden.esReinspeccion));

                return (
                  <tr
                    key={orden.id}
                    onClick={() => {
                      if (orden.estado === 'FACTURADO' && factura) {
                        onVerFactura(factura);
                      } else {
                        onSelectOrdenParaFacturar(orden);
                      }
                    }}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Turno y Placa */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 group-hover:border-amber-500/40 transition-colors">
                          {getCategoryIcon(orden.vehiculo?.categoria)}
                        </div>
                        <div>
                          <span className="font-mono font-black text-amber-400 text-sm tracking-wider block">
                            {formatPlaca(orden.vehiculo?.placa)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Turno #{orden.consecutivo || 'S/N'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Vehículo y Tipo de Servicio */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">
                        {orden.vehiculo?.marca} {orden.vehiculo?.linea}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>{orden.tipoServicio}</span>
                        {orden.esReinspeccion && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                            Reinspección $0
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cliente / Propietario */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200 truncate max-w-[200px]">
                        {orden.vehiculo?.propietario?.nombresRazonSocial || 'Sin asignar'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {orden.vehiculo?.propietario?.tipoDocumento} {formatDocumento(orden.vehiculo?.propietario?.numeroDocumento)}
                      </div>
                    </td>

                    {/* Estado Operativo */}
                    <td className="py-3.5 px-4">
                      {orden.estado === 'FACTURADO' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Facturado {factura ? `(#${factura.numeroFactura})` : ''}</span>
                        </span>
                      ) : orden.estado === 'RECHAZADO' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Rechazado (Día {diasTrans} de 15)</span>
                          </span>
                          <span className="block text-[10px] text-red-400/80 mt-0.5 font-medium">
                            {15 - diasTrans} días para 2da revisión
                          </span>
                        </div>
                      ) : orden.estado === 'APROBADO' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Aprobado (Listo Cobro)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          <Wrench className="w-3.5 h-3.5 animate-spin" />
                          <span>En Pista de Pruebas</span>
                        </span>
                      )}
                    </td>

                    {/* Fecha / Antigüedad */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      <div>
                        {orden.fechaIngreso ? new Date(orden.fechaIngreso).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {diasTrans === 0 ? 'Hoy' : `Hace ${diasTrans} día${diasTrans > 1 ? 's' : ''}`}
                      </div>
                    </td>

                    {/* Monto Liquidado */}
                    <td className="py-3.5 px-4 text-right">
                      {factura ? (
                        <div>
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            ${factura.total?.toLocaleString('es-CO')}
                          </span>
                          <span className="block text-[10px] text-slate-500 uppercase">{factura.metodoPago}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-mono font-bold text-amber-400 text-sm">
                            ${tarifaEstimada.toLocaleString('es-CO')}
                          </span>
                          <span className="block text-[10px] text-slate-500">Tarifa Estimada</span>
                        </div>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-center">
                      {factura ? (
                        <div className="flex items-center justify-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <SiigoBadge 
                            facturaId={factura.id}
                            estadoDian={factura.estadoDian}
                            numeroFacturaSiigo={factura.numeroFacturaSiigo}
                            pdfSiigoUrl={factura.pdfSiigoUrl}
                            cufe={factura.cufe}
                            mensajeRespuestaDian={factura.mensajeRespuestaDian}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownloadPdf(factura.id, factura.numeroFactura);
                            }}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 transition-colors"
                            title="Descargar PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSendWhatsapp(factura.id);
                            }}
                            className="p-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/40 rounded-xl transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOrdenParaFacturar(orden);
                          }}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1 mx-auto"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Facturar</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
