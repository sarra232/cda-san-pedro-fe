/**
 * Utilidades de formateo y máscaras reactivas para CDA San Pedro
 */

/**
 * Formatea una placa colombiana agregando guión en el medio para efectos visuales:
 * - Automóviles (3 letras + 3 dígitos): "ABC123" -> "ABC-123"
 * - Motocicletas (3 letras + 2 dígitos + 1 letra): "XYZ12A" -> "XYZ-12A"
 * - Otras placas: aplica guión tras los primeros 3 caracteres.
 */
export function formatPlaca(value?: string | null): string {
  if (!value) return '';
  const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length <= 3) {
    return clean;
  }
  return `${clean.slice(0, 3)}-${clean.slice(3, 6)}`;
}

/**
 * Máscara reactiva para inputs de placas mientras el usuario escribe.
 * Limita a un máximo de 6 caracteres alfanuméricos y añade el guión automáticamente.
 */
export function handlePlacaInput(value: string): string {
  const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
  if (clean.length <= 3) {
    return clean;
  }
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
}

/**
 * Obtiene la placa limpia sin guiones ni espacios (para guardar en backend)
 */
export function cleanPlaca(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/**
 * Formatea un número de celular colombiano a formato legible (ej. "300 123 4567")
 */
export function formatPhone(value?: string | null): string {
  if (!value) return '';
  const clean = value.replace(/\D/g, '').slice(0, 10);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
}

/**
 * Máscara reactiva para inputs de celular
 */
export function handlePhoneInput(value: string): string {
  return formatPhone(value);
}

/**
 * Formatea un valor monetario en Pesos Colombianos (COP)
 * Ejemplo: 320000 -> "$ 320.000"
 */
export function formatCOP(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) return '$ 0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formatea un número de documento con puntos para mejor legibilidad
 * Ejemplos: 
 * - "1020304050" -> "1.020.304.050"
 * - "900123456-1" -> "900.123.456-1"
 * - "15.274.742" -> "15.274.742"
 */
export function formatDocumento(doc?: string | null): string {
  if (!doc) return '';
  const trimmed = doc.trim();
  if (!trimmed) return '';

  // Si tiene formato NIT con guión (ej: 900123456-1 o 900.123.456-1)
  if (trimmed.includes('-')) {
    const [base, dv] = trimmed.split('-');
    const cleanBase = base.replace(/\D/g, '');
    if (cleanBase) {
      const formattedBase = new Intl.NumberFormat('es-CO').format(Number(cleanBase));
      return `${formattedBase}-${dv.trim()}`;
    }
    return trimmed;
  }

  // Si contiene exclusivamente dígitos o dígitos con separadores estándar (. o espacio)
  const isOnlyDigitsAndSeparators = /^[\d\.\s,]+$/.test(trimmed);
  const cleanDigits = trimmed.replace(/\D/g, '');

  if (isOnlyDigitsAndSeparators && cleanDigits.length > 0 && cleanDigits.length <= 15) {
    return new Intl.NumberFormat('es-CO').format(Number(cleanDigits));
  }

  // Si es un documento con letras (ej: Pasaporte "PA10293", CE con prefijo, PEP), conservar formato íntegro
  return trimmed;
}

/**
 * Sanitiza y valida fechas en formato ISO YYYY-MM-DD para evitar años mal digitados
 * Ejemplo: "22025-07-01" -> "2025-07-01"
 */
export function sanitizeDate(dateStr?: string | null): string | undefined {
  if (!dateStr || !dateStr.trim()) return undefined;
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4,6})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    let year = match[1];
    if (year.length > 4) {
      year = year.slice(-4);
    }
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    const yNum = parseInt(year, 10);
    if (yNum < 1950 || yNum > 2099) {
      return undefined;
    }
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

export interface TipoServicioConfig {
  code: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  badgeClass: string;
}

/**
 * Obtiene la configuración de presentación visual de un tipo de servicio
 */
export function getTipoServicioConfig(tipoServicio?: string | null, esReinspeccion?: boolean): TipoServicioConfig {
  if (esReinspeccion || tipoServicio === 'REINSPECCION_GRATUITA' || tipoServicio === 'REINSPECCION') {
    return {
      code: 'REINSPECCION_GRATUITA',
      label: '2da Revisión / Reinspección ($0)',
      shortLabel: 'Reinspección $0',
      description: 'Reinspección reglamentaria gratuita (15 días calendario)',
      icon: '🎁',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    };
  }

  const normalized = (tipoServicio || 'RTM_LEGAL').trim().toUpperCase();

  switch (normalized) {
    case 'RTM_LEGAL':
    case 'PRIMERA_VEZ':
    case 'RTM':
      return {
        code: 'RTM_LEGAL',
        label: 'RTM & Emisiones Contaminantes',
        shortLabel: 'RTM Legal',
        description: 'Revisión Técnico-Mecánica y Emisiones de Gases reglamentaria',
        icon: '🔍',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      };

    case 'REVISION_PREVENTIVA':
    case 'PREVENTIVA':
      return {
        code: 'REVISION_PREVENTIVA',
        label: 'Revisión Preventiva / Pre-viaje',
        shortLabel: 'Preventiva',
        description: 'Diagnóstico técnico preventivo y estado general del vehículo',
        icon: '🛠️',
        badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      };

    case 'PERITAJE':
    case 'PERITAJE_VEHICULAR':
    case 'PERITAJE_AUTOMOTRIZ':
      return {
        code: 'PERITAJE',
        label: 'Peritaje Completo / Compraventa',
        shortLabel: 'Peritaje',
        description: 'Evaluación integral estructural, mecánica y documental',
        icon: '📋',
        badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      };

    default:
      return {
        code: normalized,
        label: normalized.replace(/_/g, ' '),
        shortLabel: normalized.replace(/_/g, ' '),
        description: 'Servicio CDA especializado',
        icon: '⚡',
        badgeClass: 'bg-slate-700/60 text-slate-200 border-slate-600/40',
      };
  }
}

/**
 * Formatea el nombre legible del servicio seleccionado
 */
export function formatTipoServicio(tipoServicio?: string | null, esReinspeccion?: boolean): string {
  return getTipoServicioConfig(tipoServicio, esReinspeccion).label;
}

/**
 * Formatea una fecha y hora completa en formato legible colombiano
 * Ejemplo: "23/09/2026 03:45 PM"
 */
export function formatFechaHora(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

/**
 * Formatea únicamente la hora en formato 12h con AM/PM
 * Ejemplo: "03:45 PM"
 */
export function formatHora(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

