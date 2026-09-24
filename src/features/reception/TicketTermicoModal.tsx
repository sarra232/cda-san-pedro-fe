import { useState } from 'react';
import { X, Printer, Receipt, Sparkles, CheckCircle2 } from 'lucide-react';
import { OrdenIngreso } from '../../types/ingreso';
import { formatPlaca, formatDocumento, formatPhone, formatTipoServicio } from '../../utils/formatters';
import { Link } from 'react-router-dom';

interface Props {
  orden: OrdenIngreso | null;
  onClose: () => void;
}

export function TicketTermicoModal({ orden, onClose }: Props) {
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');

  if (!orden) return null;

  const handlePrint = () => {
    window.print();
  };

  const fechaIngresoFormatted = orden.fechaIngreso 
    ? new Date(orden.fechaIngreso).toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'medium',
      })
    : new Date().toLocaleString('es-CO');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Container - On screen */}
      <div className="cda-glass rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-cda-yellow-500/40 shadow-2xl relative text-center space-y-4 max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cda-dark-800 shrink-0">
          <div className="flex items-center gap-2 text-left">
            <div className="p-2 rounded-xl bg-cda-yellow-500/10 text-cda-yellow-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Ticket Térmico de Turno POS</h3>
              <p className="text-[11px] text-slate-400">Comprobante de ingreso para pista y conductor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper width selector */}
            <div className="flex bg-cda-dark-900 rounded-lg p-0.5 border border-cda-dark-700 text-[10px] font-mono">
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-1 rounded transition-colors ${paperWidth === '80mm' ? 'bg-cda-yellow-500 text-black font-bold' : 'text-slate-400'}`}
              >
                80mm
              </button>
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-1 rounded transition-colors ${paperWidth === '58mm' ? 'bg-cda-yellow-500 text-black font-bold' : 'text-slate-400'}`}
              >
                58mm
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-cda-dark-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div className="flex-1 overflow-y-auto py-2 flex justify-center">
          {/* Thermal Paper Styling */}
          <div 
            id="ticket-termico-print"
            className={`bg-white text-black p-4 sm:p-5 rounded-lg shadow-xl font-mono text-left border border-slate-300 transition-all ${
              paperWidth === '80mm' ? 'w-[76mm] sm:w-[80mm]' : 'w-[58mm] text-[10px]'
            }`}
            style={{ color: '#000000', backgroundColor: '#ffffff' }}
          >
            {/* Header POS */}
            <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-black">
              <h2 className="font-black text-sm tracking-tight leading-tight">CDA SAN PEDRO S.A.S.</h2>
              <p className="text-[10px] font-semibold">NIT: 901.234.567-8</p>
              <p className="text-[9px] leading-tight">Cra. 50 # 48-20, San Pedro de los Milagros</p>
              <p className="text-[9px]">Tel: (604) 862-7000 • Cel: 312 890 4567</p>
              <p className="text-[8px] italic pt-0.5">Centro de Diagnóstico Automotor</p>
            </div>

            {/* Big Turn Number */}
            <div className="text-center py-2.5 my-2 border-y-2 border-black bg-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider block">TURNO DEL DÍA</span>
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block">
                #{orden.turnoDiario || orden.consecutivo}
              </span>
              <span className="text-[11px] font-bold block mt-0.5">
                ESTADO: {orden.estado}
              </span>
            </div>

            {/* Vehicle & Plate Info */}
            <div className="space-y-1.5 py-1 text-[11px] border-b border-dashed border-black">
              <div className="flex justify-between items-center bg-black text-white p-1 rounded">
                <span className="font-bold text-[10px]">PLACA:</span>
                <span className="font-black text-base tracking-widest">{formatPlaca(orden.vehiculo.placa)}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-bold">Categoría:</span>
                <span>{orden.vehiculo.categoria}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-bold">Vehículo:</span>
                <span className="truncate max-w-[130px]">{orden.vehiculo.marca} {orden.vehiculo.linea}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-bold">Modelo / Km:</span>
                <span>{orden.vehiculo.modelo} • {orden.kilometraje} km</span>
              </div>

              <div className="flex justify-between">
                <span className="font-bold">Servicio:</span>
                <span className="font-bold text-right">{formatTipoServicio(orden.tipoServicio, orden.esReinspeccion)}</span>
              </div>
            </div>

            {/* Driver / Customer Info */}
            <div className="space-y-1 py-1.5 text-[10px] border-b border-dashed border-black">
              <p className="font-bold underline">DATOS DEL CONDUCTOR / CLIENTE:</p>
              <p className="truncate font-semibold">{orden.conductor?.nombresRazonSocial || 'Propietario del Vehículo'}</p>
              {orden.conductor?.numeroDocumento && (
                <p>Doc: {orden.conductor.tipoDocumento} {formatDocumento(orden.conductor.numeroDocumento)}</p>
              )}
              {orden.conductor?.celular && (
                <p>Tel/WhatsApp: {formatPhone(orden.conductor.celular)}</p>
              )}
            </div>

            {/* Observations if any */}
            {orden.observaciones && (
              <div className="py-1.5 text-[9px] border-b border-dashed border-black">
                <span className="font-bold block">OBSERVACIONES:</span>
                <p className="break-words leading-tight">{orden.observaciones}</p>
              </div>
            )}

            {/* Date & Optical Barcode Simulation */}
            <div className="pt-2 text-center space-y-1.5">
              <p className="text-[9px]">Fecha Ingreso: {fechaIngresoFormatted}</p>

              {/* Pseudo Barcode */}
              <div className="py-1 flex flex-col items-center justify-center">
                <div className="flex items-center gap-[2px] h-7 w-36 justify-center bg-black/5 p-1">
                  {[4,2,3,1,4,2,1,3,2,4,1,3,2,1,4,2,3,1,2,4].map((w, idx) => (
                    <div 
                      key={idx} 
                      className="bg-black h-full" 
                      style={{ width: `${w * 1.5}px` }} 
                    />
                  ))}
                </div>
                <span className="text-[8px] font-mono tracking-widest mt-0.5">
                  CDA-{orden.consecutivo}-{orden.vehiculo.placa.toUpperCase()}
                </span>
              </div>

              {/* Footer text */}
              <p className="text-[8px] leading-tight text-slate-700 italic border-t border-dotted border-black pt-1">
                Conserve este ticket hasta la entrega de su vehículo. ¡Seguridad y precisión técnica para su viaje!
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-cda-dark-800 shrink-0">
          <button
            onClick={handlePrint}
            className="flex-1 bg-cda-dark-800 hover:bg-cda-dark-700 text-white font-bold py-2.5 px-4 rounded-xl border border-cda-dark-700 text-xs flex items-center justify-center gap-2 shadow transition-all"
          >
            <Printer className="w-4 h-4 text-cda-yellow-400" />
            <span>Imprimir Ticket Térmico</span>
          </button>

          {!orden.facturado && orden.estado !== 'FACTURADO' ? (
            <Link
              to={`/facturacion?ingresoId=${orden.id}`}
              onClick={onClose}
              className="flex-1 bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cda-yellow-500/10 transition-all"
            >
              <Receipt className="w-4 h-4" />
              <span>Proceder a Facturación</span>
            </Link>
          ) : (
            <Link
              to={`/facturacion?ingresoId=${orden.id}`}
              onClick={onClose}
              className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ver Factura Emitida</span>
            </Link>
          )}
        </div>
      </div>

      {/* Embedded CSS for Thermal Print Media */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ticket-termico-print, #ticket-termico-print * {
            visibility: visible;
          }
          #ticket-termico-print {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0 !important;
            padding: 4mm !important;
            width: ${paperWidth} !important;
            box-shadow: none !important;
            border: none !important;
            color: #000000 !important;
            background: #ffffff !important;
          }
          @page {
            size: ${paperWidth} auto;
            margin: 0mm;
          }
        }
      `}</style>
    </div>
  );
}
