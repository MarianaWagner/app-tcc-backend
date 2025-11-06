import crypto from 'crypto';

/**
 * Base62 alphabet para códigos curtos
 */
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export class TokenUtil {
  /**
   * Gera um código curto e não previsível para URLs públicas
   * Usa base62 para gerar código de 12 caracteres (ex: /s/abc123xyz)
   * @param {number} length - Tamanho do código (padrão: 12)
   * @returns {string} Código em base62
   */
  static generateShareCode(length = 12) {
    const bytes = crypto.randomBytes(length);
    let code = '';
    for (let i = 0; i < length; i++) {
      code += BASE62[bytes[i] % BASE62.length];
    }
    return code;
  }

  /**
   * Gera um token único e seguro (legado, mantido para compatibilidade)
   * @param {number} length - Tamanho do token (padrão: 32 bytes = 64 caracteres hex)
   * @returns {string} Token em formato hexadecimal
   */
  static generateShareToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Gera um código OTP numérico de 6 dígitos
   * @returns {string} Código OTP de 6 dígitos
   */
  static generateOTP() {
    // Gera um número aleatório de 6 dígitos (100000 a 999999)
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Gera uma data de expiração a partir de agora
   * @param {number} minutes - Minutos até expirar
   * @returns {Date} Data de expiração
   */
  static generateExpirationDate(minutes) {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  }

  /**
   * Verifica se uma data já expirou
   * @param {Date} expirationDate - Data de expiração
   * @returns {boolean} true se expirou, false caso contrário
   */
  static isExpired(expirationDate) {
    if (!expirationDate) return true;
    return new Date() > new Date(expirationDate);
  }

  /**
   * Normaliza email para comparação (remove espaços e converte para minúsculas)
   * @param {string} email - Email a ser normalizado
   * @returns {string} Email normalizado
   */
  static normalizeEmail(email) {
    return email.trim().toLowerCase();
  }

  /**
   * Normaliza contato (legado, mantido para compatibilidade)
   * @param {string} contact - Contato a ser normalizado
   * @returns {string} Contato normalizado
   */
  static normalizeContact(contact) {
    return this.normalizeEmail(contact);
  }
}


