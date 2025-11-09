import { JwtUtil } from '../utils/jwt.util.js';
import { ShareLinkRepository } from '../repositories/shareLink.repository.js';
import { TokenUtil } from '../utils/token.util.js';
import { UnauthorizedError, ValidationError, ForbiddenError } from '../utils/errors.util.js';

/**
 * Middleware para validar token temporário de acesso a compartilhamento
 * Token deve ter: { sub: shareId, kind: "share_access", code: shareCode }
 */
export const validateShareAccess = async (req, res, next) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token && typeof req.query?.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    // Verificar e decodificar token
    let decoded;
    try {
      decoded = JwtUtil.verify(token);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired access token');
    }

    // Verificar tipo de token
    if (decoded.kind !== 'share_access') {
      throw new UnauthorizedError('Invalid token type');
    }

    // Buscar compartilhamento
    const shareLinkRepository = new ShareLinkRepository();
    const shareLink = await shareLinkRepository.findById(decoded.sub);

    if (!shareLink) {
      throw new UnauthorizedError('Share link not found');
    }

    // Verificar se o código do token bate com o do compartilhamento
    if (shareLink.code !== decoded.code) {
      throw new UnauthorizedError('Token code mismatch');
    }

    // Verificar se está revogado
    if (shareLink.revokedAt) {
      throw new ValidationError('This share link has been revoked');
    }

    // Verificar se expirou
    if (TokenUtil.isExpired(shareLink.expiresAt)) {
      throw new ValidationError('This share link has expired');
    }

    // Verificar se atingiu max_uses
    if (shareLink.timesUsed > shareLink.maxUses) {
      throw new ValidationError('This share link has reached maximum uses');
    }

    // Adicionar informações ao request
    req.shareId = shareLink.id;
    req.shareLink = shareLink;

    next();
  } catch (error) {
    next(error);
  }
};

