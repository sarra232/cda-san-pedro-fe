import { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Mail, 
  Cake, 
  ShieldAlert, 
  Search,
  Loader2
} from 'lucide-react';
import { notificacionService } from '../../services/notificacionService';
import { Notificacion } from '../../types/notificacion';
import { Pagination } from '../../components/common/Pagination';

export function NotificationsPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterCanal, setFilterCanal] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [reloadingId, setReloadingId] = useState<string | null>(null);

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const [testTemplate, setTestTemplate] = useState<string>('RECORDATORIO_RTM');
  const [testNombre, setTestNombre] = useState<string>('Wilson Sarrazola');
  const [testPlaca, setTestPlaca] = useState<string>('KLI84G');
  const [testTotal, setTestTotal] = useState<number>(223774);
  const [testMetodo, setTestMetodo] = useState<string>('Efectivo');
  const [testDias, setTestDias] = useState<number>(15);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await notificacionService.getNotificaciones();
      setNotificaciones(data);
    } catch {
      // Manejo silencioso
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBarridoManual = async () => {
    setIsSweeping(true);
    try {
      await notificacionService.ejecutarBarrido();
      await loadData();
    } catch {
      // Ignorar
    } finally {
      setIsSweeping(false);
    }
  };

  const handleEnviarTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    setIsSendingTest(true);
    setTestFeedback(null);
    try {
      let msg = '';
      if (testTemplate === 'GENERAL') {
        msg = await notificacionService.enviarCorreoPrueba(testEmail.trim(), testMessage.trim());
      } else {
        msg = await notificacionService.enviarPlantillaReal({
          tipoPlantilla: testTemplate,
          destinatario: testEmail.trim(),
          nombreCliente: testNombre.trim(),
          placa: testPlaca.trim().toUpperCase(),
          categoriaVehiculo: testPlaca.endsWith('G') ? 'Motocicleta 4T' : 'Vehículo Liviano Particular',
          numeroFactura: 'FV-2-22470',
          total: testTotal,
          metodoPago: testMetodo,
          diasRestantes: testDias,
          cuponOBeneficio: '15% de descuento en tu próxima revisión preventiva durante el mes de tu cumpleaños.',
          mensaje: testMessage.trim(),
        });
      }
      setTestFeedback({ success: true, msg: msg || 'Plantilla de correo despachada exitosamente a tu bandeja.' });
    } catch (err: any) {
      setTestFeedback({ 
        success: false, 
        msg: err.response?.data?.message || 'Error al enviar el correo. Verifica las variables en .env.' 
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleReintentar = async (id: string) => {
    setReloadingId(id);
    try {
      await notificacionService.reintentar(id);
      await loadData();
    } catch {
      // Ignorar
    } finally {
      setReloadingId(null);
    }
  };

  const parseMensaje = (payloadStr: string) => {
    try {
      const parsed = JSON.parse(payloadStr);
      return parsed.mensaje || payloadStr;
    } catch {
      return payloadStr;
    }
  };

  const filtered = notificaciones.filter((n) => {
    const q = searchFilter.toLowerCase().trim();
    const matchesSearch = !q || (
      n.destinatario.toLowerCase().includes(q) ||
      (n.clienteNombre && n.clienteNombre.toLowerCase().includes(q)) ||
      n.tipo.toLowerCase().includes(q) ||
      n.cuerpoPayload.toLowerCase().includes(q)
    );
    const matchesEstado = filterEstado === 'TODOS' || n.estado === filterEstado;
    const matchesCanal = filterCanal === 'TODOS' || n.canal === filterCanal;
    return matchesSearch && matchesEstado && matchesCanal;
  });

  const totalEnviadas = notificaciones.filter((n) => n.estado === 'ENVIADO').length;
  const totalPendientes = notificaciones.filter((n) => n.estado === 'PENDIENTE').length;
  const totalFallidas = notificaciones.filter((n) => n.estado === 'FALLIDO').length;

  const getTipoIcon = (tipo: string) => {
    if (tipo.includes('CUMPLEANOS')) {
      return <Cake className="w-4 h-4 text-pink-400" />;
    } else if (tipo.includes('SOAT')) {
      return <ShieldAlert className="w-4 h-4 text-amber-400" />;
    } else {
      return <ShieldAlert className="w-4 h-4 text-cda-yellow-400" />;
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'ENVIADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Enviado</span>
          </span>
        );
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cda-yellow-400 bg-cda-yellow-500/10 px-2 py-0.5 rounded-full border border-cda-yellow-500/20">
            <Clock className="w-3 h-3" />
            <span>Pendiente</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            <span>Fallido</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-cda-yellow-500" />
            <span>Centro de Notificaciones & CRM</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Automatización de alertas de vencimiento RTM, SOAT, estados de pista, comprobantes y fidelización
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTestEmail('wilsonsarrazola@gmail.com');
              setTestFeedback(null);
              setIsTestModalOpen(true);
            }}
            className="cda-glass hover:bg-cda-dark-800 text-cda-yellow-400 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 border border-cda-yellow-500/30 transition-all shadow-sm"
          >
            <Mail className="w-4 h-4 text-cda-yellow-400" />
            <span>Probar Plantilla de Correo</span>
          </button>

          <button
            onClick={handleBarridoManual}
            disabled={isSweeping}
            className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-cda-yellow-500/10 disabled:opacity-50"
          >
            {isSweeping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ejecutando Barrido...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Ejecutar Barrido Diario</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de Envío de Plantillas Reales */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="cda-glass bg-cda-dark-900 border border-cda-dark-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-cda-dark-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cda-yellow-500/10 text-cda-yellow-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Despacho de Correos Transaccionales</h3>
                  <p className="text-[11px] text-slate-400">Prueba en vivo de las plantillas oficiales de CDA San Pedro</p>
                </div>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs p-1.5 rounded-lg hover:bg-cda-dark-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnviarTestEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Notificación / Plantilla *</label>
                <select
                  value={testTemplate}
                  onChange={(e) => setTestTemplate(e.target.value)}
                  className="w-full bg-cda-dark-950 border border-cda-dark-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cda-yellow-500"
                >
                  <option value="RECORDATORIO_RTM">🚨 Recordatorio de Vencimiento de Tecnomecánica (RTM)</option>
                  <option value="COMPROBANTE_PAGO">🧾 Comprobante de Pago & Factura Electrónica DIAN</option>
                  <option value="CUMPLEANOS">🎂 Felicitación de Cumpleaños & Bono de Fidelización</option>
                  <option value="INSPECCION_FINALIZADA">✅ Vehículo Aprobado / Inspección Finalizada</option>
                  <option value="GENERAL">✉️ Mensaje Personalizado Libre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Destinatario *</label>
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  className="w-full bg-cda-dark-950 border border-cda-dark-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cda-yellow-500"
                />
              </div>

              {testTemplate !== 'GENERAL' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-cda-dark-950/60 p-3 rounded-xl border border-cda-dark-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nombre Cliente</label>
                    <input
                      type="text"
                      value={testNombre}
                      onChange={(e) => setTestNombre(e.target.value)}
                      className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cda-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Placa Vehículo</label>
                    <input
                      type="text"
                      value={testPlaca}
                      onChange={(e) => setTestPlaca(e.target.value.toUpperCase())}
                      className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-cda-yellow-500"
                    />
                  </div>

                  {testTemplate === 'RECORDATORIO_RTM' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Días Restantes</label>
                      <input
                        type="number"
                        value={testDias}
                        onChange={(e) => setTestDias(Number(e.target.value))}
                        className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cda-yellow-500"
                      />
                    </div>
                  )}

                  {testTemplate === 'COMPROBANTE_PAGO' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Valor Total Pagado ($ COP)</label>
                        <input
                          type="number"
                          value={testTotal}
                          onChange={(e) => setTestTotal(Number(e.target.value))}
                          className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cda-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Método de Pago</label>
                        <select
                          value={testMetodo}
                          onChange={(e) => setTestMetodo(e.target.value)}
                          className="w-full bg-cda-dark-900 border border-cda-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cda-yellow-500"
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Transferencia Bancolombia / Nequi">Transferencia Bancaria</option>
                          <option value="Tarjeta Débito">Tarjeta Débito</option>
                          <option value="Tarjeta Crédito">Tarjeta Crédito</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {testTemplate === 'GENERAL' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mensaje Libre</label>
                  <textarea
                    rows={3}
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Escribe el contenido del mensaje..."
                    className="w-full bg-cda-dark-950 border border-cda-dark-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cda-yellow-500 resize-none"
                  />
                </div>
              )}

              {testFeedback && (
                <div className={`p-3 rounded-xl text-xs ${
                  testFeedback.success 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                }`}>
                  <p className="font-semibold">{testFeedback.msg}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-cda-dark-800 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="bg-cda-yellow-500 hover:bg-cda-yellow-400 text-black font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Despachando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Plantilla</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="cda-glass rounded-2xl p-4 sm:p-5 border border-cda-dark-700/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Mensajes Enviados</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">{totalEnviadas}</h3>
          <p className="text-[11px] text-emerald-400 mt-1">Despachados exitosamente</p>
        </div>

        <div className="cda-glass rounded-2xl p-4 sm:p-5 border border-cda-dark-700/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">En Cola / Pendientes</span>
            <div className="p-2 rounded-xl bg-cda-yellow-500/10 text-cda-yellow-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">{totalPendientes}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Programados para envío</p>
        </div>

        <div className="cda-glass rounded-2xl p-4 sm:p-5 border border-cda-dark-700/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Fallidos / Reintentables</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">{totalFallidas}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Con opción de reintento manual</p>
        </div>
      </div>

      {/* Notifications Queue List */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-cda-yellow-400" />
              <span>Cola de Despacho</span>
              <span className="text-xs font-bold text-cda-yellow-400 bg-cda-yellow-400/10 px-2 py-0.5 rounded-full border border-cda-yellow-400/20">
                {filtered.length} Mensajes
              </span>
            </h2>
            <p className="text-xs text-slate-400">Supervisión en vivo de los recordatorios generados por el cron</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <select
              value={filterEstado}
              onChange={(e) => {
                setFilterEstado(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
            >
              <option value="TODOS">📋 Todos los Estados</option>
              <option value="ENVIADO">🟢 Enviados</option>
              <option value="PENDIENTE">🟡 Pendientes</option>
              <option value="FALLIDO">🔴 Fallidos</option>
            </select>

            <select
              value={filterCanal}
              onChange={(e) => {
                setFilterCanal(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
            >
              <option value="TODOS">📡 Todos los Canales</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => {
                  setSearchFilter(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar destinatario..."
                className="w-full bg-cda-dark-900 border border-cda-dark-700 text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-cda-yellow-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* MOBILE CARDS VIEW (< md) */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {isLoading ? (
            <div className="cda-glass rounded-2xl p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cda-yellow-400" />
              <span>Cargando notificaciones...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="cda-glass rounded-2xl p-6 text-center text-slate-500 text-xs">
              No hay notificaciones en la cola con los filtros aplicados.
            </div>
          ) : (
            filtered
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((n) => (
                <div key={n.id} className="cda-glass rounded-2xl p-4 border border-cda-dark-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cda-dark-900">
                        {getTipoIcon(n.tipo)}
                      </div>
                      <span className="font-bold text-xs text-white">{n.tipo}</span>
                    </div>
                    {getStatusBadge(n.estado)}
                  </div>

                  <div className="p-3 rounded-xl bg-cda-dark-900/80 border border-cda-dark-800 text-xs text-slate-300">
                    <p className="line-clamp-2">{parseMensaje(n.cuerpoPayload)}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Destinatario:</span>
                      <strong className="text-white font-mono">{n.destinatario}</strong>
                    </div>
                    {n.estado === 'FALLIDO' && (
                      <button
                        onClick={() => handleReintentar(n.id)}
                        disabled={reloadingId === n.id}
                        className="bg-cda-dark-800 hover:bg-cda-dark-700 text-cda-yellow-400 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 border border-cda-dark-700"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${reloadingId === n.id ? 'animate-spin' : ''}`} />
                        <span>Reintentar</span>
                      </button>
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
                  <th className="p-4 font-semibold">Tipo & Canal</th>
                  <th className="p-4 font-semibold">Cliente / Destinatario</th>
                  <th className="p-4 font-semibold">Mensaje Enviado</th>
                  <th className="p-4 font-semibold">Estado</th>
                  <th className="p-4 font-semibold">Intentos</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cda-dark-800 text-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-cda-yellow-400 mb-2" />
                      <span>Cargando cola de notificaciones...</span>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No se encontraron mensajes en cola de notificaciones con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filtered
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((n) => (
                      <tr key={n.id} className="hover:bg-cda-dark-800/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-cda-dark-900">
                              {getTipoIcon(n.tipo)}
                            </div>
                            <div>
                              <span className="font-bold text-white block">{n.tipo}</span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                {n.canal === 'EMAIL' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3 text-emerald-400" />}
                                <span>{n.canal}</span>
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-white">{n.clienteNombre || 'Cliente'}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{n.destinatario}</p>
                        </td>

                        <td className="p-4 max-w-xs">
                          <p className="text-slate-300 line-clamp-2 text-[11px]">{parseMensaje(n.cuerpoPayload)}</p>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            {n.fechaEnviado ? new Date(n.fechaEnviado).toLocaleString() : 'Pendiente'}
                          </span>
                        </td>

                        <td className="p-4">
                          {getStatusBadge(n.estado)}
                        </td>

                        <td className="p-4 font-mono text-slate-300">
                          {n.intentos}
                        </td>

                        <td className="p-4 text-right">
                          {n.estado === 'FALLIDO' && (
                            <button
                              onClick={() => handleReintentar(n.id)}
                              disabled={reloadingId === n.id}
                              className="inline-flex items-center gap-1 bg-cda-dark-800 hover:bg-cda-dark-700 text-cda-yellow-400 font-bold px-3 py-1.5 rounded-lg text-xs border border-cda-dark-700 transition-all"
                            >
                              <RotateCw className={`w-3.5 h-3.5 ${reloadingId === n.id ? 'animate-spin' : ''}`} />
                              <span>Reintentar</span>
                            </button>
                          )}
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
          totalPages={Math.ceil(filtered.length / itemsPerPage) || 1}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
    </div>
  );
}
