import crypto from 'crypto';

export class TokenUtil {
  /**
   * Gera um token único e seguro para links de compartilhamento
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
  static normalizeContact(contact) {
    return contact.trim().toLowerCase();
  }
}


