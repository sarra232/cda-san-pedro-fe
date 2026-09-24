import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Calendar, 
  Download, 
  DollarSign, 
  Car, 
  Receipt, 
  Bike, 
  Truck, 
  Bus, 
  ExternalLink,
  Search,
  PieChart as PieIcon,
  ShieldCheck,
  Building2,
  TrendingUp,
  Percent
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
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [activeTab, setActiveTab] = useState<'FACTURAS' | 'LIQUIDACION'>('FACTURAS');
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

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await reporteService.downloadExcel(fechaInicio, fechaFin);
    } catch {
      // Ignorar
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      await reporteService.downloadCsv(fechaInicio, fechaFin);
    } catch {
      // Ignorar
    } finally {
      setIsExportingCsv(false);
    }
  };

  const filteredFacturas = reporte?.facturas.filter((f) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      f.numeroFactura.toLowerCase().includes(q) ||
      f.ordenIngreso?.vehiculo?.placa?.toLowerCase().includes(q) ||
      f.clienteFactura?.nombresRazonSocial?.toLowerCase().includes(q) ||
      f.clienteFactura?.numeroDocumento?.includes(q)
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
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap">
            <span>Reporte Financiero & Liquidación RTM</span>
            <span className="text-xs font-extrabold text-cda-yellow-400 bg-cda-yellow-400/10 px-2.5 py-0.5 rounded-full border border-cda-yellow-400/20">
              Gerencial / Contable
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Desglose de recaudo bruto, dispersión obligatoria a terceros (RUNT/SICOV/ANSV), IVA y utilidad neta real del CDA.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            title="Descargar libro Excel .xlsx multi-hoja con estilos y fórmulas"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>{isExportingExcel ? 'Generando Excel...' : 'Exportar a Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExportingCsv}
            className="bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 font-semibold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-cda-dark-700 transition-all"
            title="Exportar en formato CSV simple"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV</span>
          </button>
        </div>
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
            className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isLoading ? 'Consultando...' : 'Aplicar Filtro'}</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards (Total Recaudado, Terceros, IVA, y GANANCIA NETA CDA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recaudo Total */}
        <div className="cda-glass rounded-2xl p-5 border border-cda-dark-700/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Recaudo Bruto en Caja</span>
            <div className="p-2 rounded-xl bg-cda-yellow-500/10 text-cda-yellow-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">
            {formatCOP(reporte?.totalRecaudado || 0)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">100% total pagado por clientes</p>
        </div>

        {/* Dispersión a Terceros */}
        <div className="cda-glass rounded-2xl p-5 border border-rose-500/30 bg-gradient-to-b from-rose-950/20 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">Dispersión Terceros</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-300 mt-2">
            {formatCOP(reporte?.totalTerceros || 0)}
          </h3>
          <p className="text-[11px] text-rose-200/70 mt-1">RUNT, SICOV, ANSV y Operador</p>
        </div>

        {/* IVA 19% */}
        <div className="cda-glass rounded-2xl p-5 border border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-300">Impuesto a las Ventas (IVA)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-blue-300 mt-2">
            {formatCOP(reporte?.totalIva || 0)}
          </h3>
          <p className="text-[11px] text-blue-200/70 mt-1">19% de la tarifa base gravable</p>
        </div>

        {/* GANANCIA NETA CDA */}
        <div className="cda-glass rounded-2xl p-5 border border-cda-yellow-500/50 bg-gradient-to-b from-amber-950/40 to-cda-dark-900 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cda-yellow-400 uppercase tracking-wider">
              Ganancia Neta CDA
            </span>
            <div className="p-2 rounded-xl bg-cda-yellow-500/20 text-cda-yellow-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cda-yellow-400 via-amber-300 to-yellow-200 mt-2">
            {formatCOP(reporte?.totalGananciaCda || 0)}
          </h3>
          <p className="text-[11px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
            <span>{reporte?.margenCdaPorcentaje || 0}% de Margen Neto</span>
            <span className="text-slate-400 font-normal">({reporte?.totalVehiculos || 0} vehículos)</span>
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-cda-dark-800 pb-3">
        <button
          onClick={() => setActiveTab('FACTURAS')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'FACTURAS'
              ? 'bg-cda-yellow-500 text-black shadow-lg shadow-cda-yellow-500/20'
              : 'bg-cda-dark-900 text-slate-400 hover:text-white border border-cda-dark-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>1. Desglose Factura por Factura ({filteredFacturas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LIQUIDACION')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'LIQUIDACION'
              ? 'bg-cda-yellow-500 text-black shadow-lg shadow-cda-yellow-500/20'
              : 'bg-cda-dark-900 text-slate-400 hover:text-white border border-cda-dark-700'
          }`}
        >
          <PieIcon className="w-4 h-4" />
          <span>2. Liquidación y Rentabilidad por Categoría</span>
        </button>
      </div>

      {/* TAB 1: DESGLOSE FACTURA POR FACTURA */}
      {activeTab === 'FACTURAS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Detalle de Facturación con Dispersión RTM</span>
              </h2>
              <p className="text-xs text-slate-400">
                Visualiza el desglose exacto de lo recaudado, el valor pagado a entidades de tránsito y lo que le queda al CDA.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar por placa, cliente o factura..."
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
                  <div key={f.id} className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-3">
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

                    {/* Desglose Móvil */}
                    <div className="grid grid-cols-3 gap-2 bg-cda-dark-950 p-2.5 rounded-xl border border-cda-dark-800 text-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Terceros</span>
                        <span className="text-[11px] font-bold text-rose-400">{formatCOP(f.totalTerceros || 0)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">IVA</span>
                        <span className="text-[11px] font-bold text-blue-400">{formatCOP(f.iva || 0)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-cda-yellow-400 block uppercase font-bold">CDA</span>
                        <span className="text-[11px] font-black text-cda-yellow-400">{formatCOP(f.valorServicioCda || 0)}</span>
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
                    <th className="p-3.5 font-semibold">No. Factura</th>
                    <th className="p-3.5 font-semibold">Fecha</th>
                    <th className="p-3.5 font-semibold">Placa / Cat</th>
                    <th className="p-3.5 font-semibold">Cliente</th>
                    <th className="p-3.5 font-semibold text-right">Recaudo Total</th>
                    <th className="p-3.5 font-semibold text-right text-rose-400">RUNT</th>
                    <th className="p-3.5 font-semibold text-right text-rose-400">SICOV</th>
                    <th className="p-3.5 font-semibold text-right text-rose-400">ANSV</th>
                    <th className="p-3.5 font-semibold text-right text-rose-300">Total Terceros</th>
                    <th className="p-3.5 font-semibold text-right text-blue-400">IVA 19%</th>
                    <th className="p-3.5 font-semibold text-right text-cda-yellow-400">Ganancia CDA</th>
                    <th className="p-3.5 font-semibold text-right">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cda-dark-800 text-slate-200">
                  {filteredFacturas.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-slate-500">
                        No se encontraron facturas en el periodo seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filteredFacturas
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((f) => (
                        <tr key={f.id} className="hover:bg-cda-dark-800/40 transition-colors">
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-cda-yellow-400">{f.numeroFactura}</span>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            {f.fechaEmision ? new Date(f.fechaEmision).toLocaleDateString() : ''}
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-white bg-cda-dark-900 px-1.5 py-0.5 rounded border border-cda-dark-700">
                              {formatPlaca(f.ordenIngreso?.vehiculo?.placa)}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{f.ordenIngreso?.vehiculo?.categoria}</span>
                          </td>
                          <td className="p-3.5 max-w-[150px] truncate">
                            <p className="font-semibold text-white truncate">{f.clienteFactura?.nombresRazonSocial}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{formatDocumento(f.clienteFactura?.numeroDocumento)}</p>
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-white">{formatCOP(f.total)}</td>
                          <td className="p-3.5 text-right font-mono text-rose-300/80">{formatCOP(f.runt || 0)}</td>
                          <td className="p-3.5 text-right font-mono text-rose-300/80">{formatCOP(f.sicov || 0)}</td>
                          <td className="p-3.5 text-right font-mono text-rose-300/80">{formatCOP(f.seguridadVial || 0)}</td>
                          <td className="p-3.5 text-right font-mono font-semibold text-rose-400">{formatCOP(f.totalTerceros || 0)}</td>
                          <td className="p-3.5 text-right font-mono text-blue-300">{formatCOP(f.iva || 0)}</td>
                          <td className="p-3.5 text-right font-mono font-black text-cda-yellow-400 bg-cda-yellow-500/5">
                            {formatCOP(f.valorServicioCda || 0)}
                          </td>
                          <td className="p-3.5 text-right space-x-1">
                            <button
                              onClick={() => facturaService.downloadPdf(f.id, f.numeroFactura)}
                              className="p-1.5 rounded-lg bg-cda-yellow-500/15 hover:bg-cda-yellow-500 hover:text-black text-cda-yellow-400 border border-cda-yellow-500/30 transition-all inline-flex"
                              title="Descargar PDF"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => facturaService.viewPdfInTab(f.id)}
                              className="p-1.5 rounded-lg bg-cda-dark-800 hover:bg-cda-dark-700 text-slate-300 border border-cda-dark-700 transition-all inline-flex"
                              title="Ver en pestaña"
                            >
                              <ExternalLink className="w-3 h-3" />
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
      )}

      {/* TAB 2: LIQUIDACIÓN Y RENTABILIDAD POR CATEGORÍA */}
      {activeTab === 'LIQUIDACION' && (
        <div className="space-y-6">
          {/* Executive Summary Table */}
          <div className="cda-glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-cda-dark-700/80 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cda-yellow-400" />
              <span>Consolidado de Liquidación y Retenciones Financieras</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-cda-dark-900 text-slate-400 border-b border-cda-dark-800">
                  <tr>
                    <th className="p-3 font-semibold">Concepto Financiero</th>
                    <th className="p-3 font-semibold text-right">Valor Total ($ COP)</th>
                    <th className="p-3 font-semibold text-right">% Participación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cda-dark-800">
                  <tr className="bg-cda-dark-950 font-bold text-white">
                    <td className="p-3.5">(+) RECAUDO BRUTO TOTAL EN CAJA / BANCOS</td>
                    <td className="p-3.5 text-right font-mono text-sm text-white">{formatCOP(reporte?.totalRecaudado || 0)}</td>
                    <td className="p-3.5 text-right font-mono text-slate-400">100.0%</td>
                  </tr>
                  <tr className="text-rose-300">
                    <td className="p-3 font-semibold">(-) TOTAL DISPERSIÓN A TERCEROS</td>
                    <td className="p-3 text-right font-mono font-semibold">{formatCOP(reporte?.totalTerceros || 0)}</td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      {reporte?.totalRecaudado ? ((reporte.totalTerceros / reporte.totalRecaudado) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="text-slate-400 text-[11px]">
                    <td className="p-2.5 pl-8">• Retención Tasas RUNT</td>
                    <td className="p-2.5 text-right font-mono">{formatCOP(reporte?.totalRunt || 0)}</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                  </tr>
                  <tr className="text-slate-400 text-[11px]">
                    <td className="p-2.5 pl-8">• Retención Pines SICOV (Vigia / Indra)</td>
                    <td className="p-2.5 text-right font-mono">{formatCOP(reporte?.totalSicov || 0)}</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                  </tr>
                  <tr className="text-slate-400 text-[11px]">
                    <td className="p-2.5 pl-8">• Retención Fondo ANSV (Seguridad Vial)</td>
                    <td className="p-2.5 text-right font-mono">{formatCOP(reporte?.totalSeguridadVial || 0)}</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                  </tr>
                  <tr className="text-slate-400 text-[11px]">
                    <td className="p-2.5 pl-8">• Operador Financiero, Bancario y Pólizas</td>
                    <td className="p-2.5 text-right font-mono">{formatCOP(reporte?.totalOperadorYOtros || 0)}</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                  </tr>
                  <tr className="text-blue-300">
                    <td className="p-3 font-semibold">(-) IMPUESTO A LAS VENTAS (IVA 19%)</td>
                    <td className="p-3 text-right font-mono font-semibold">{formatCOP(reporte?.totalIva || 0)}</td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      {reporte?.totalRecaudado ? ((reporte.totalIva / reporte.totalRecaudado) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="bg-amber-500/10 font-black text-cda-yellow-400 border-t-2 border-cda-yellow-500">
                    <td className="p-4 text-sm">(=) GANANCIA NETA REAL GENERADA POR EL CDA</td>
                    <td className="p-4 text-right font-mono text-lg text-cda-yellow-400">
                      {formatCOP(reporte?.totalGananciaCda || 0)}
                    </td>
                    <td className="p-4 text-right font-mono text-emerald-400 font-extrabold text-sm">
                      {reporte?.margenCdaPorcentaje || 0}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Rentability by Category */}
          <div className="cda-glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-cda-dark-700/80 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-cda-yellow-400" />
              <span>Rentabilidad por Categoría de Vehículo</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-cda-dark-900 text-slate-400 border-b border-cda-dark-800">
                  <tr>
                    <th className="p-3.5 font-semibold">Categoría</th>
                    <th className="p-3.5 font-semibold text-center">Inspecciones</th>
                    <th className="p-3.5 font-semibold text-right">Recaudo Total</th>
                    <th className="p-3.5 font-semibold text-right text-rose-400">Dispersión Terceros</th>
                    <th className="p-3.5 font-semibold text-right text-cda-yellow-400">Ganancia Neta CDA</th>
                    <th className="p-3.5 font-semibold text-center text-emerald-400">Margen %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cda-dark-800">
                  {['MOTO', 'LIVIANO', 'PESADO', 'PUBLICO'].map((cat) => {
                    const qty = reporte?.vehiculosPorCategoria[cat] || 0;
                    const rec = reporte?.recaudoPorCategoria?.[cat] || 0;
                    const ter = reporte?.tercerosPorCategoria?.[cat] || 0;
                    const gan = reporte?.gananciaPorCategoria?.[cat] || 0;
                    const pct = rec > 0 ? ((gan / rec) * 100).toFixed(1) : '0.0';

                    return (
                      <tr key={cat} className="hover:bg-cda-dark-800/40 transition-colors">
                        <td className="p-3.5 flex items-center gap-2 font-bold text-white">
                          {getCategoryIcon(cat)}
                          <span>Vehículos {cat}</span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-300">{qty}</td>
                        <td className="p-3.5 text-right font-mono">{formatCOP(rec)}</td>
                        <td className="p-3.5 text-right font-mono text-rose-300">{formatCOP(ter)}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-cda-yellow-400 bg-cda-yellow-500/5">
                          {formatCOP(gan)}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-emerald-400">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

