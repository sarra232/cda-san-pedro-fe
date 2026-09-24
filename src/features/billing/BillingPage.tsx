import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ingresoService } from '../../services/ingresoService';
import { facturaService } from '../../services/facturaService';
import { tarifaService } from '../../services/tarifaService';
import { OrdenIngreso } from '../../types/ingreso';
import { Factura, FacturaFormData } from '../../types/factura';
import { Tarifa } from '../../types/tarifa';
import { BillingOrdersList } from './BillingOrdersList';
import { CompleteInvoiceModal } from './CompleteInvoiceModal';
import { InvoiceSuccessModal } from './InvoiceSuccessModal';
import { TarifasTab } from './TarifasTab';
import { 
  Receipt, 
  Tag, 
  RefreshCw, 
  DollarSign, 
  Clock, 
  CheckCircle2
} from 'lucide-react';

export function BillingPage() {

  const [searchParams] = useSearchParams();
  const initialIngresoId = searchParams.get('ingresoId') || '';

  // Tab State: 'FACTURACION' | 'TARIFAS'
  const [activeMainTab, setActiveMainTab] = useState<'FACTURACION' | 'TARIFAS'>('FACTURACION');

  // Data States
  const [ordenes, setOrdenes] = useState<OrdenIngreso[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modales
  const [selectedOrdenParaFacturar, setSelectedOrdenParaFacturar] = useState<OrdenIngreso | null>(null);
  const [facturaEmitidaModal, setFacturaEmitidaModal] = useState<Factura | null>(null);

  const loadData = async (silent = false) => {
    try {
      if (!silent) {
        if (ordenes.length === 0) setLoading(true);
        setIsRefreshing(true);
      }
      const [ordList, facts, tList] = await Promise.all([
        ingresoService.getIngresos(),
        facturaService.getFacturas(),
        tarifaService.getTarifas(),
      ]);

      setOrdenes(ordList);
      setFacturas(facts);
      setTarifas(tList);

      // Si hay una orden seleccionada para facturar abierta, sincronizarla silenciosamente
      setSelectedOrdenParaFacturar((current) => {
        if (!current) return null;
        const fresh = ordList.find((o) => o.id === current.id);
        return fresh || current;
      });

      // Si viene un parametro ingresoId en la URL, abrir directamente el formulario o la factura de esa orden
      if (initialIngresoId && !silent) {
        const target = ordList.find((o) => o.id === initialIngresoId);
        if (target) {
          const facturaExistente = facts.find(
            (f) => f.ordenIngreso?.id === target.id || f.id === target.facturaId
          );
          if (facturaExistente || target.facturado || target.estado === 'FACTURADO') {
            if (facturaExistente) {
              setFacturaEmitidaModal(facturaExistente);
            }
          } else {
            setSelectedOrdenParaFacturar(target);
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar datos de facturación:', error);
    } finally {
      if (!silent) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadData(false);

    // 1. Polling reactivo cada 6 segundos para sincronización entre puestos de trabajo
    const interval = setInterval(() => {
      loadData(true);
    }, 6000);

    // 2. Revalidación inmediata al volver al navegador o cambiar pestaña
    const handleRevalidate = () => {
      loadData(true);
    };

    window.addEventListener('focus', handleRevalidate);
    document.addEventListener('visibilitychange', handleRevalidate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleRevalidate);
      document.removeEventListener('visibilitychange', handleRevalidate);
    };
  }, [initialIngresoId]);

  const handleEmitirFactura = async (formData: FacturaFormData): Promise<Factura> => {
    const res = await facturaService.emitirFactura(formData);
    setFacturaEmitidaModal(res);
    await loadData(false);
    return res;
  };

  const handleDownloadPdf = async (facturaId: string, numeroFactura: string) => {
    try {
      await facturaService.downloadPdf(facturaId, numeroFactura);
    } catch {
      alert('Error al descargar el PDF de la factura.');
    }
  };

  const handleSendWhatsapp = async (facturaId: string) => {
    const f = facturas.find(item => item.id === facturaId);
    if (f && f.clienteFactura?.celular) {
      const rawTel = f.clienteFactura.celular.replace(/\D/g, '');
      if (rawTel) {
        const cleanTel = rawTel.startsWith('57') && rawTel.length > 10 ? rawTel : `57${rawTel}`;
        const placa = f.ordenIngreso?.vehiculo?.placa || 'N/A';
        const clienteNombre = f.clienteFactura.nombresRazonSocial || 'Estimado(a) cliente';
        const numFacturaOficial = f.numeroFacturaSiigo || f.numeroFactura;

        let msg = `🚗 *CDA SAN PEDRO S.A.S.*\n`;
        msg += `Hola *${clienteNombre}*, confirmamos la emisión de tu Factura de Venta *N° ${numFacturaOficial}* para el vehículo con placa *${placa}*.\n\n`;
        msg += `💰 *Total Liquidado:* $${f.total?.toLocaleString('es-CO')} COP\n`;
        if (f.pdfSiigoUrl) {
          msg += `📄 *Factura Electrónica Oficial DIAN (SIIGO):*\n${f.pdfSiigoUrl}\n\n`;
        }
        msg += `¡Gracias por confiar en CDA San Pedro!\n`;
        msg += `📍 Cra. 50 # 48-20, San Pedro de los Milagros\n`;
        msg += `📞 (604) 868 6060 • WhatsApp: 311 345 6789`;

        const url = `https://wa.me/${cleanTel}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        return;
      }
    }
    try {
      await facturaService.enviarFactura(facturaId);
      alert('¡Comprobante de factura despachado exitosamente!');
    } catch {
      alert('Error al despachar la notificación.');
    }
  };

  // KPIs
  const totalRecaudoHoy = facturas.reduce((acc, f) => acc + (f.total || 0), 0);
  const totalPendientes = ordenes.filter((o) => o.estado === 'INGRESADO' || o.estado === 'EN_INSPECCION' || o.estado === 'APROBADO').length;
  const totalFacturadas = facturas.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-w-0 flex-1 overflow-x-hidden">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Módulo de Facturación & Caja
              </h1>
              <p className="text-xs text-slate-400">
                Liquidación de servicios RTM, recaudo en caja y emisión de facturas oficiales
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Botón Refrescar */}
        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveMainTab('FACTURACION')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeMainTab === 'FACTURACION'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Facturación & Turnos</span>
            </button>

            <button
              onClick={() => setActiveMainTab('TARIFAS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeMainTab === 'TARIFAS'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Tarifas Oficiales</span>
            </button>
          </div>

          <button
            onClick={() => loadData(false)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all disabled:opacity-50"
            title="Refrescar datos en tiempo real"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards (Resumen del Día) */}
      {activeMainTab === 'FACTURACION' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Pendientes por Facturar
              </span>
              <div className="text-2xl font-black text-white">
                {totalPendientes} <span className="text-xs font-normal text-slate-400">vehículos</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              ⏳
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Facturas Emitidas
              </span>
              <div className="text-2xl font-black text-white">
                {totalFacturadas} <span className="text-xs font-normal text-slate-400">comprobantes</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              🧾
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Total Recaudado
              </span>
              <div className="text-2xl font-black text-emerald-400">
                ${totalRecaudoHoy.toLocaleString('es-CO')} <span className="text-xs font-normal text-slate-400">COP</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              💰
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal de Pestañas */}
      {activeMainTab === 'FACTURACION' ? (
        <BillingOrdersList
          ordenes={ordenes}
          facturas={facturas}
          tarifas={tarifas}
          onSelectOrdenParaFacturar={(orden) => setSelectedOrdenParaFacturar(orden)}
          onVerFactura={(factura) => setFacturaEmitidaModal(factura)}
          onDownloadPdf={handleDownloadPdf}
          onSendWhatsapp={handleSendWhatsapp}
        />
      ) : (
        <TarifasTab
          tarifas={tarifas}
          onTarifasUpdated={loadData}
        />
      )}

      {/* Modal para Completar y Emitir Factura */}
      <CompleteInvoiceModal
        isOpen={Boolean(selectedOrdenParaFacturar)}
        onClose={() => setSelectedOrdenParaFacturar(null)}
        orden={selectedOrdenParaFacturar}
        tarifas={tarifas}
        onEmitir={handleEmitirFactura}
      />

      {/* Modal de Éxito / Visualización de Factura */}
      <InvoiceSuccessModal
        isOpen={Boolean(facturaEmitidaModal)}
        onClose={() => setFacturaEmitidaModal(null)}
        factura={facturaEmitidaModal}
        onFacturaUpdated={(updated) => {
          setFacturaEmitidaModal(updated);
          loadData();
        }}
      />
    </div>
  );
}
