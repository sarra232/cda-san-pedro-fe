import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FacturaElectronicaDian } from '../../types/siigo';
import { siigoService } from '../../services/siigoService';
import { CheckCircle2, AlertTriangle, FileText, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';

interface SiigoBadgeProps {
  facturaId: string;
  estadoDian?: 'PENDIENTE' | 'EMITIDA' | 'RECHAZADA' | 'FALLIDA' | 'ANULADA';
  numeroFacturaSiigo?: string;
  pdfSiigoUrl?: string;
  cufe?: string;
  mensajeRespuestaDian?: string;
  dianData?: FacturaElectronicaDian | null;
  onUpdated?: (updated: FacturaElectronicaDian) => void;
}

export function SiigoBadge({
  facturaId,
  estadoDian,
  numeroFacturaSiigo,
  pdfSiigoUrl,
  cufe,
  mensajeRespuestaDian,
  dianData,
  onUpdated,
}: SiigoBadgeProps) {
  const [data, setData] = useState<{
    estadoDian?: string;
    numeroFacturaSiigo?: string;
    pdfSiigoUrl?: string;
    cufe?: string;
    mensajeRespuesta?: string;
  }>({
    estadoDian: dianData?.estadoDian || estadoDian || 'PENDIENTE',
    numeroFacturaSiigo: dianData?.numeroFacturaSiigo || numeroFacturaSiigo,
    pdfSiigoUrl: dianData?.pdfSiigoUrl || pdfSiigoUrl,
    cufe: dianData?.cufe || cufe,
    mensajeRespuesta: dianData?.mensajeRespuesta || mensajeRespuestaDian,
  });

  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setData({
      estadoDian: dianData?.estadoDian || estadoDian || 'PENDIENTE',
      numeroFacturaSiigo: dianData?.numeroFacturaSiigo || numeroFacturaSiigo,
      pdfSiigoUrl: dianData?.pdfSiigoUrl || pdfSiigoUrl,
      cufe: dianData?.cufe || cufe,
      mensajeRespuesta: dianData?.mensajeRespuesta || mensajeRespuestaDian,
    });
  }, [dianData, estadoDian, numeroFacturaSiigo, pdfSiigoUrl, cufe, mensajeRespuestaDian]);

  const handleEmitir = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      setLoading(true);
      const res = await siigoService.emitirFacturaDian(facturaId);
      setData({
        estadoDian: res.estadoDian,
        numeroFacturaSiigo: res.numeroFacturaSiigo,
        pdfSiigoUrl: res.pdfSiigoUrl,
        cufe: res.cufe,
        mensajeRespuesta: res.mensajeRespuesta,
      });
      if (onUpdated) onUpdated(res);
    } catch (err: any) {
      alert('Error en transmisión a SIIGO: ' + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPdf = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (data.pdfSiigoUrl) {
      window.open(data.pdfSiigoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (data.estadoDian === 'EMITIDA') {
    return (
      <>
        <div 
          className="inline-flex items-center gap-1.5" 
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowDetails(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-sm cursor-pointer"
            title={`Factura Electrónica SIIGO: ${data.numeroFacturaSiigo || 'FV'}`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>SIIGO {data.numeroFacturaSiigo || 'Emitida'}</span>
          </button>

          {data.pdfSiigoUrl && (
            <button
              type="button"
              onClick={handleOpenPdf}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors border border-transparent hover:border-emerald-500/20 cursor-pointer"
              title="Ver PDF Oficial DIAN / SIIGO"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Modal de Detalle Fiscal renderizado en Portal */}
        {showDetails && createPortal(
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowDetails(false);
            }}
          >
            <div 
              className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Factura Electrónica DIAN</h3>
                    <p className="text-xs text-emerald-400 font-bold">{data.numeroFacturaSiigo || 'SIIGO Cloud'}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  VALIDADA
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {data.cufe && (
                  <div>
                    <span className="text-slate-400 block mb-1 font-semibold">Código CUFE Oficial:</span>
                    <p className="font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-300 break-all select-all text-[10px]">
                      {data.cufe}
                    </p>
                  </div>
                )}

                {data.mensajeRespuesta && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                    {data.mensajeRespuesta}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                {data.pdfSiigoUrl && (
                  <button
                    type="button"
                    onClick={handleOpenPdf}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ver Factura en SIIGO</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowDetails(false);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  if (data.estadoDian === 'FALLIDA' || data.estadoDian === 'RECHAZADA') {
    return (
      <button
        onClick={handleEmitir}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 transition-all shadow-sm"
        title={data.mensajeRespuesta || 'Error en transmisión previa. Clic para reintentar con SIIGO'}
      >
        {loading ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        )}
        <span>{loading ? 'Reintentando...' : 'Reintentar SIIGO'}</span>
      </button>
    );
  }

  // Pendiente
  return (
    <button
      onClick={handleEmitir}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-sm"
      title="Transmitir y emitir Factura Electrónica ante la DIAN vía SIIGO"
    >
      <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
      <span>{loading ? 'Transmitiendo...' : 'Transmitir DIAN'}</span>
    </button>
  );
}
