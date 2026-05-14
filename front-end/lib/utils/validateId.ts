/**
 * Sanitiza um identificador antes de interpolar em uma URL de API.
 *
 * Aceita apenas formatos seguros (UUID v4, cuid, ou alfanumérico com '-' e '_').
 * Rejeita strings vazias, caracteres de path traversal ou URLs completas.
 *
 * Necessário para mitigar SSRF (CodeQL: js/request-forgery) em server actions
 * que recebem IDs vindos do usuário e os concatenam no path de chamadas HTTP.
 */
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export function validateId(value: unknown, fieldName = 'id'): string {
  if (typeof value !== 'string') {
    throw new Error(`Parâmetro inválido: ${fieldName} deve ser uma string.`);
  }
  if (!SAFE_ID_PATTERN.test(value)) {
    throw new Error(`Parâmetro inválido: ${fieldName} possui formato não permitido.`);
  }
  return value;
}
