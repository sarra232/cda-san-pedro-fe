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
 * Ejemplo: "1020304050" -> "1.020.304.050"
 */
export function formatDocumento(doc?: string | null): string {
  if (!doc) return '';
  const clean = doc.trim();
  // Si contiene solo números, formatear con separadores de miles
  if (/^\d+$/.test(clean)) {
    return new Intl.NumberFormat('es-CO').format(Number(clean));
  }
  return clean;
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
