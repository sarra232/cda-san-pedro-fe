import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Factura } from '../../types/factura';
import { facturaService } from '../../services/facturaService';
import { siigoService } from '../../services/siigoService';
import { formatPlaca, formatDocumento } from '../../utils/formatters';
import { 
  CheckCircle2, 
  X, 
  Printer, 
  FileText, 
  Send, 
  Mail, 
  Loader2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface InvoiceSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  factura: Factura | null;
  onFacturaUpdated?: (updated: Factura) => void;
}

export const InvoiceSuccessModal: React.FC<InvoiceSuccessModalProps> = ({
  isOpen,
  onClose,
  factura,
  onFacturaUpdated,
}) => {
  const [dianData, setDianData] = useState<{
    estadoDian?: string;
    numeroFacturaSiigo?: string;
    pdfSiigoUrl?: string;
    cufe?: string;
    mensajeRespuesta?: string;
  }>({});

  const [transmittingDian, setTransmittingDian] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (factura) {
      setDianData({
        estadoDian: factura.estadoDian || 'PENDIENTE',
        numeroFacturaSiigo: factura.numeroFacturaSiigo,
        pdfSiigoUrl: factura.pdfSiigoUrl,
        cufe: factura.cufe,
        mensajeRespuesta: factura.mensajeRespuestaDian,
      });
      setWhatsappSent(false);
      setEmailSent(false);
    }
  }, [factura]);

  if (!isOpen || !factura) return null;

  const handleTransmitirDian = async () => {
    try {
      setTransmittingDian(true);
      const res = await siigoService.emitirFacturaDian(factura.id);
      setDianData({
        estadoDian: res.estadoDian,
        numeroFacturaSiigo: res.numeroFacturaSiigo,
        pdfSiigoUrl: res.pdfSiigoUrl,
        cufe: res.cufe,
        mensajeRespuesta: res.mensajeRespuesta,
      });

      if (onFacturaUpdated) {
        onFacturaUpdated({
          ...factura,
          estadoDian: res.estadoDian,
          numeroFacturaSiigo: res.numeroFacturaSiigo,
          pdfSiigoUrl: res.pdfSiigoUrl,
          cufe: res.cufe,
          mensajeRespuestaDian: res.mensajeRespuesta,
        });
      }
    } catch (err: any) {
      alert('Error al transmitir factura a SIIGO: ' + (err?.response?.data?.message || err.message));
    } finally {
      setTransmittingDian(false);
    }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      await facturaService.viewPdfInTab(factura.id);
    } catch {
      alert('Error al abrir la vista de impresión.');
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await facturaService.downloadPdf(factura.id, factura.numeroFactura);
    } catch {
      alert('Error al descargar comprobante PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendWhatsapp = () => {
    const rawTel = factura.clienteFactura?.celular?.replace(/\D/g, '') || '';
    if (!rawTel) {
      alert('El cliente no cuenta con un número celular registrado.');
      return;
    }
    const cleanTel = rawTel.startsWith('57') && rawTel.length > 10 ? rawTel : `57${rawTel}`;
    const placa = formatPlaca(factura.ordenIngreso?.vehiculo?.placa);
    const clienteNombre = factura.clienteFactura?.nombresRazonSocial || 'Estimado(a) cliente';
    const numFacturaOficial = dianData.numeroFacturaSiigo || factura.numeroFactura;

    let msg = `🚗 *CDA SAN PEDRO S.A.S.*\n`;
    msg += `Hola *${clienteNombre}*, confirmamos la emisión de tu Factura de Venta *N° ${numFacturaOficial}* para el vehículo con placa *${placa}*.\n\n`;
    msg += `💰 *Total Liquidado:* $${factura.total?.toLocaleString('es-CO')} COP\n`;
    
    if (dianData.pdfSiigoUrl) {
      msg += `📄 *Factura Electrónica Oficial DIAN (SIIGO):*\n${dianData.pdfSiigoUrl}\n\n`;
    }
    
    msg += `¡Gracias por confiar en CDA San Pedro!\n`;
    msg += `📍 Cra. 50 # 48-20, San Pedro de los Milagros\n`;
    msg += `📞 (604) 868 6060 • WhatsApp: 311 345 6789`;

    const url = `https://wa.me/${cleanTel}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    setWhatsappSent(true);
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      await facturaService.enviarFactura(factura.id);
      setEmailSent(true);
    } catch (err: any) {
      alert('Error al despachar notificación por correo: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSendingEmail(false);
    }
  };

  const esEmitida = dianData.estadoDian === 'EMITIDA';

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Principal */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-emerald-500/20 to-transparent border-b border-slate-800 text-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-2.5 shadow-lg shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white">¡Factura Emitida en Caja!</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprobante oficial N° <strong className="text-white font-mono">{factura.numeroFactura}</strong>
          </p>
        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          
          {/* SECCIÓN ESPECIAL: ESTADO FISCAL SIIGO / DIAN */}
          <div className={`p-4 rounded-2xl border shadow-lg space-y-2.5 ${
            esEmitida 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
              : dianData.estadoDian === 'FALLIDA' || dianData.estadoDian === 'RECHAZADA'
              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${
                  esEmitida 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : dianData.estadoDian === 'FALLIDA'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {esEmitida ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="font-black text-white text-sm">
                    {esEmitida 
                      ? `Factura DIAN: ${dianData.numeroFacturaSiigo || 'SIIGO'}` 
                      : 'Factura Electrónica Pendiente ante DIAN'}
                  </div>
                  <div className="text-[11px] opacity-80">
                    {esEmitida 
                      ? 'Validada y transmitida exitosamente vía SIIGO Cloud' 
                      : 'Pendiente de emisión fiscal oficial ante SIIGO / DIAN'}
                  </div>
                </div>
              </div>

              {/* Botón de Transmitir / Reintentar SIIGO si no está emitida */}
              {!esEmitida ? (
                <button
                  type="button"
                  onClick={handleTransmitirDian}
                  disabled={transmittingDian}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all self-start sm:self-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${transmittingDian ? 'animate-spin' : ''}`} />
                  <span>{transmittingDian ? 'Transmitiendo...' : 'Transmitir DIAN'}</span>
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-center self-start sm:self-center">
                  EMITIDA DIAN
                </span>
              )}
            </div>

            {/* Enlace al Visor Web Oficial de SIIGO */}
            {esEmitida && dianData.pdfSiigoUrl && (
              <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-200 truncate">
                  Visualización pública de factura en SIIGO Cloud disponible
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (dianData.pdfSiigoUrl) {
                      window.open(dianData.pdfSiigoUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-all shrink-0 cursor-pointer shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver en SIIGO</span>
                </button>
              </div>
            )}

            {/* Mensaje de Error si la emisión falló */}
            {!esEmitida && dianData.mensajeRespuesta && (
              <div className="p-2 rounded-xl bg-slate-950/80 border border-rose-500/20 text-[10px] text-rose-300">
                {dianData.mensajeRespuesta}
              </div>
            )}
          </div>

          {/* Voucher / Resumen Interno */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono">
            <div className="text-center pb-2 border-b border-slate-800">
              <div className="font-bold text-white text-sm">CDA SAN PEDRO S.A.S.</div>
              <div className="text-[10px] text-slate-400">NIT 901.558.942-1 • San Pedro de los Milagros</div>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Placa:</span>
                <span className="font-bold text-amber-400">{formatPlaca(factura.ordenIngreso?.vehiculo?.placa)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cliente Pagador:</span>
                <span className="text-white truncate max-w-[200px] text-right font-sans">
                  {factura.clienteFactura?.nombresRazonSocial}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Documento:</span>
                <span className="text-slate-300">
                  {factura.clienteFactura?.tipoDocumento} {formatDocumento(factura.clienteFactura?.numeroDocumento)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Método de Pago:</span>
                <span className="text-slate-300 uppercase font-sans font-bold">{factura.metodoPago}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>${factura.subtotal?.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>IVA (19%):</span>
                <span>${factura.iva?.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold text-sm pt-1 border-t border-slate-800">
                <span>TOTAL:</span>
                <span>${factura.total?.toLocaleString('es-CO')} COP</span>
              </div>
            </div>
          </div>

          {/* ACCIONES DE DESPACHO Y COMPARTIR (WhatsApp, Correo, Imprimir, PDF) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Opciones de Envío & Descarga:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSendWhatsapp}
                className="py-2.5 px-3 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs shadow-md shadow-emerald-950/40"
                title="Enviar notificación por WhatsApp con enlace oficial de SIIGO"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>{whatsappSent ? '¡WhatsApp Abierto!' : 'Enviar WhatsApp'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="py-2.5 px-3 bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-500/40 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs shadow-md shadow-blue-950/40"
                title="Enviar factura al correo electrónico del cliente"
              >
                {sendingEmail ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>{emailSent ? '¡Correo Despachado!' : 'Enviar Correo'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={printing}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all text-xs"
                title="Abrir vista de impresión térmica"
              >
                {printing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
                <span>Imprimir Ticket</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all text-xs"
                title="Descargar comprobante en PDF"
              >
                {downloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors font-bold"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
