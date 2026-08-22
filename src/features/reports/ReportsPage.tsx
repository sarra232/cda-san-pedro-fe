import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Calendar, 
  Download, 
  DollarSign, 
  Car, 
  Receipt, 
  CreditCard, 
  Bike, 
  Truck, 
  Bus, 
  ExternalLink,
  Search
} from 'lucide-react';
import { reporteService, ReporteVentas } from '../../services/reporteService';
import { facturaService } from '../../services/facturaService';
import { formatPlaca, formatCOP, formatDocumento } from '../../utils/formatters';
import { Pagination } from '../../components/common/Pagination';

export function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [fechaInicio, setFechaInicio] = useState(thirtyDaysAgo);
  const [fechaFin, setFechaFin] = useState(today);
  const [reporte, setReporte] = useState<ReporteVentas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadReporte = async () => {
    setIsLoading(true);
    try {
      const data = await reporteService.getReporteVentas(fechaInicio, fechaFin);
      setReporte(data);
    } catch {
      // Manejo silencioso
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReporte();
  }, []);

  const handleQuickFilter = (type: 'HOY' | '7_DIAS' | 'MES' | 'ANO') => {
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0];
    let startStr = nowStr;

    if (type === '7_DIAS') {
      startStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (type === 'MES') {
      startStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else if (type === 'ANO') {
      startStr = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    }

    setFechaInicio(startStr);
    setFechaFin(nowStr);
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await reporteService.downloadCsv(fechaInicio, fechaFin);
    } catch {
      // Ignorar
    } finally {
      setIsExporting(false);
    }
  };

  const filteredFacturas = reporte?.facturas.filter((f) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      f.numeroFactura.toLowerCase().includes(q) ||
      f.ordenIngreso?.vehiculo?.placa.toLowerCase().includes(q) ||
      f.clienteFactura?.nombresRazonSocial.toLowerCase().includes(q) ||
      f.clienteFactura?.numeroDocumento.includes(q)
    );
  }) || [];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'MOTO': return <Bike className="w-4 h-4 text-cda-yellow-400" />;
      case 'PESADO': return <Truck className="w-4 h-4 text-amber-400" />;
      case 'PUBLICO': return <Bus className="w-4 h-4 text-emerald-400" />;
      default: return <Car className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Reportes Analíticos y Filtros por Fechas</span>
            <span className="text-xs font-extrabold text-cda-yellow-400 bg-cda-yellow-400/10 px-2.5 py-0.5 rounded-full border border-cda-yellow-400/20">
              Gerencial
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Consolidado financiero, afluencia vehicular por categoría y exportación a Excel
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={isExporting}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generando Excel...' : 'Exportar a Excel (CSV)'}</span>
        </button>
      </div>

      {/* Date Range Selector Box */}
      <div className="cda-glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-cda-yellow-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cda-yellow-400" />
            <span>Selecciona el rango de fechas a consultar:</span>
          </span>

          {/* Quick filter pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleQuickFilter('HOY')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-cda-dark-900 text-slate-300 hover:text-white border border-cda-dark-700"
            >
              Hoy
            </button>
            <button
              onClick={() => handleQuickFilter('7_DIAS')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-cda-dark-900 text-slate-300 hover:text-white border border-cda-dark-700"
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => handleQuickFilter('MES')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-cda-dark-900 text-slate-300 hover:text-white border border-cda-dark-700"
            >
              Este Mes
            </button>
            <button
              onClick={() => handleQuickFilter('ANO')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-cda-dark-900 text-slate-300 hover:text-white border border-cda-dark-700"
            >
              Año 2026
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Fecha Inicial (Desde)</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3.5 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Fecha Final (Hasta)</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full bg-cda-dark-950 border border-cda-dark-700 text-white text-xs rounded-xl px-3.5 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
            />
          </div>

          <button
            onClick={loadReporte}
            disabled={isLoading}
            className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isLoading ? 'Consultando...' : 'Aplicar Filtro'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards for the Selected Range */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="cda-glass rounded-2xl p-5 border border-cda-dark-700/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Recaudado en Periodo</span>
            <div className="p-2 rounded-xl bg-cda-yellow-500/10 text-cda-yellow-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">
            {formatCOP(reporte?.totalRecaudado)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Con IVA 19% discriminado</p>
        </div>

        <div className="cda-glass rounded-2xl p-5 border border-cda-dark-700/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Vehículos Atendidos</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">
            {reporte?.totalVehiculos || 0}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Inspecciones RTM completadas</p>
        </div>

        <div className="cda-glass rounded-2xl p-5 border border-cda-dark-700/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Facturas Emitidas</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">
            {reporte?.totalFacturas || 0}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">100% con título valor DIAN</p>
        </div>
      </div>

      {/* Breakdown Grids: Categories & Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicles by Category */}
        <div className="cda-glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-cda-dark-700/80 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Car className="w-4 h-4 text-cda-yellow-400" />
            <span>Afluencia por Categoría Vehicular en el Rango</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {['MOTO', 'LIVIANO', 'PESADO', 'PUBLICO'].map((cat) => {
              const count = reporte?.vehiculosPorCategoria[cat] || 0;
              return (
                <div key={cat} className="p-3.5 rounded-2xl bg-cda-dark-900/80 border border-cda-dark-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-cda-dark-950">
                      {getCategoryIcon(cat)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{cat}</span>
                      <span className="text-[10px] text-slate-400">Categoría</span>
                    </div>
                  </div>
                  <span className="text-xl font-black text-cda-yellow-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incomes by Payment Method */}
        <div className="cda-glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-cda-dark-700/80 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cda-yellow-400" />
            <span>Ingresos por Medio de Pago en el Rango</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {['EFECTIVO', 'TRANSFERENCIA', 'DATAFONO_TARJETA', 'SISTECREDITO'].map((met) => {
              const amount = reporte?.ingresosPorMetodoPago[met] || 0;
              return (
                <div key={met} className="p-3.5 rounded-2xl bg-cda-dark-900/80 border border-cda-dark-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 block truncate">{met}</span>
                  <span className="text-base font-black text-white block font-mono">{formatCOP(amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Invoices Detailed Table / Mobile Cards */}
      <div className="space-y-4 pt-4 border-t border-cda-dark-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Detalle de Facturas en el Periodo</span>
              <span className="text-xs font-bold text-cda-yellow-400 bg-cda-yellow-400/10 px-2.5 py-0.5 rounded-full border border-cda-yellow-400/20">
                {filteredFacturas.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400">Listado detallado de comprobantes emitidos en las fechas seleccionadas</p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar en el reporte..."
              className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
            />
          </div>
        </div>

        {/* MOBILE CARDS VIEW (< md) */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredFacturas.length === 0 ? (
            <div className="cda-glass rounded-2xl p-6 text-center text-slate-500 text-xs">
              No se encontraron facturas en el periodo seleccionado.
            </div>
          ) : (
            filteredFacturas
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((f) => (
                <div key={f.id} className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cda-yellow-400 font-mono text-sm">{f.numeroFactura}</span>
                    <span className="font-mono font-black text-white text-base">{formatCOP(f.total)}</span>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="text-white font-semibold">{f.clienteFactura?.nombresRazonSocial}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Placa: <strong className="text-slate-200 font-mono">{formatPlaca(f.ordenIngreso?.vehiculo?.placa)}</strong></span>
                      <span>•</span>
                      <span>{f.metodoPago}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-cda-dark-800">
                    <span className="text-[10px] text-slate-500">
                      {f.fechaEmision ? new Date(f.fechaEmision).toLocaleDateString() : ''}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => facturaService.downloadPdf(f.id, f.numeroFactura)}
                        className="bg-cda-dark-800 hover:bg-cda-dark-700 text-cda-yellow-400 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 border border-cda-dark-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => facturaService.viewPdfInTab(f.id)}
                        className="bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 font-semibold px-2.5 py-1.5 rounded-lg text-xs border border-cda-dark-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
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
                  <th className="p-4 font-semibold">No. Factura</th>
                  <th className="p-4 font-semibold">Fecha Emisión</th>
                  <th className="p-4 font-semibold">Cliente / Pagador</th>
                  <th className="p-4 font-semibold">Placa Vehículo</th>
                  <th className="p-4 font-semibold">Método Pago</th>
                  <th className="p-4 font-semibold">Subtotal</th>
                  <th className="p-4 font-semibold">IVA (19%)</th>
                  <th className="p-4 font-semibold">Total Pagado</th>
                  <th className="p-4 font-semibold text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cda-dark-800 text-slate-200">
                {filteredFacturas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No se encontraron facturas en el periodo seleccionado.
                    </td>
                  </tr>
                ) : (
                  filteredFacturas
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((f) => (
                      <tr key={f.id} className="hover:bg-cda-dark-800/40 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-cda-yellow-400">{f.numeroFactura}</span>
                        </td>
                        <td className="p-4 text-slate-300">
                          {f.fechaEmision ? new Date(f.fechaEmision).toLocaleDateString() : ''}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-white">{f.clienteFactura?.nombresRazonSocial}</p>
                          <p className="text-[11px] text-slate-400">{f.clienteFactura?.tipoDocumento} {formatDocumento(f.clienteFactura?.numeroDocumento)}</p>
                        </td>
                        <td className="p-4">
                          <span className="font-mono font-bold text-white bg-cda-dark-900 px-2 py-0.5 rounded border border-cda-dark-700">
                            {formatPlaca(f.ordenIngreso?.vehiculo?.placa)}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300">{f.metodoPago}</td>
                        <td className="p-4 font-mono">{formatCOP(f.subtotal)}</td>
                        <td className="p-4 font-mono text-slate-400">{formatCOP(f.iva)}</td>
                        <td className="p-4 font-mono font-bold text-cda-yellow-400">{formatCOP(f.total)}</td>
                        <td className="p-4 text-right space-x-1.5">
                          <button
                            onClick={() => facturaService.downloadPdf(f.id, f.numeroFactura)}
                            className="p-1.5 rounded-lg bg-cda-yellow-500/15 hover:bg-cda-yellow-500 hover:text-black text-cda-yellow-400 border border-cda-yellow-500/30 transition-all inline-flex"
                            title="Descargar PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => facturaService.viewPdfInTab(f.id)}
                            className="p-1.5 rounded-lg bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 border border-cda-dark-700 transition-all inline-flex"
                            title="Ver en pestaña"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
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
          totalPages={Math.ceil(filteredFacturas.length / itemsPerPage) || 1}
          totalItems={filteredFacturas.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
    </div>
  );
}
