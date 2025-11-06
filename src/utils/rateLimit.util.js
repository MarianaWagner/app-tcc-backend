import { db } from '../config/db.js';
import { shareAccessLogTable } from '../db/schema.js';
import { eq, and, gte, sql } from 'drizzle-orm';

/**
 * Serviço de rate limiting para OTP
 * Limita requisições de envio de OTP e tentativas de validação
 */
export class RateLimitUtil {
  /**
   * Verifica rate limit para envio de OTP
   * Máximo 5 solicitações de envio de OTP por 1 hora por shareId + IP
   * @param {string} shareId - ID do compartilhamento
   * @param {string} ipAddress - Endereço IP
   * @returns {Promise<{allowed: boolean, remaining: number, resetAt: Date}>}
   */
  static async checkOTPSendLimit(shareId, ipAddress) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [result] = await db
      .select({ count: sql`count(*)::int` })
      .from(shareAccessLogTable)
      .where(
        and(
          eq(shareAccessLogTable.shareId, shareId),
          eq(shareAccessLogTable.event, 'OTP_SENT'),
          sql`${shareAccessLogTable.ipAddress}::text = ${ipAddress}`,
          gte(shareAccessLogTable.createdAt, oneHourAgo)
        )
      )
      .limit(1);

    const count = result?.count || 0;
    const maxRequests = 5;
    const allowed = count < maxRequests;

    return {
      allowed,
      remaining: Math.max(0, maxRequests - count),
      resetAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  }

  /**
   * Verifica rate limit para tentativas de validação de OTP
   * Máximo 5 tentativas de verificação por código OTP
   * @param {string} shareId - ID do compartilhamento
   * @param {string} ipAddress - Endereço IP
   * @returns {Promise<{allowed: boolean, remaining: number}>}
   */
  static async checkOTPVerifyLimit(shareId, ipAddress) {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const [result] = await db
      .select({ count: sql`count(*)::int` })
      .from(shareAccessLogTable)
      .where(
        and(
          eq(shareAccessLogTable.shareId, shareId),
          sql`${shareAccessLogTable.event} LIKE 'OTP_VERIFY%'`,
          sql`${shareAccessLogTable.ipAddress}::text = ${ipAddress}`,
          gte(shareAccessLogTable.createdAt, tenMinutesAgo)
        )
      )
      .limit(1);

    const count = result?.count || 0;
    const maxAttempts = 5;
    const allowed = count < maxAttempts;

    return {
      allowed,
      remaining: Math.max(0, maxAttempts - count),
    };
  }
}

