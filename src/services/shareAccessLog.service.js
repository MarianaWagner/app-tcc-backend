import { ShareAccessLogRepository } from '../repositories/shareAccessLog.repository.js';
import { ShareLinkRepository } from '../repositories/shareLink.repository.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.util.js';

export class ShareAccessLogService {
  constructor() {
    this.shareAccessLogRepository = new ShareAccessLogRepository();
    this.shareLinkRepository = new ShareLinkRepository();
  }

  formatLogResponse(log) {
    return {
      id: log.id,
      shareId: log.shareId,
      event: log.event,
      emailInput: log.emailInput,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt?.toISOString() || new Date().toISOString(),
    };
  }

  async createLog(data) {
    // Esta função é geralmente chamada internamente pelo sistema
    const log = await this.shareAccessLogRepository.create(data);
    return this.formatLogResponse(log);
  }

  async getLogsByShareId(userId, shareId, query) {
    // Validar que o share link existe e pertence ao usuário
    const shareLink = await this.shareLinkRepository.findById(shareId);
    if (!shareLink) {
      throw new NotFoundError('Share link not found');
    }

    if (shareLink.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view these logs');
    }

    const { logs, total } = await this.shareAccessLogRepository.findByShareId(shareId, query);

    const page = query.page || 1;
    const limit = query.limit || 50;

    return {
      data: logs.map(log => this.formatLogResponse(log)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLogStats(userId, shareId) {
    // Validar que o share link existe e pertence ao usuário
    const shareLink = await this.shareLinkRepository.findById(shareId);
    if (!shareLink) {
      throw new NotFoundError('Share link not found');
    }

    if (shareLink.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view these logs');
    }

    const { logs } = await this.shareAccessLogRepository.findByShareId(shareId, {});

    // Agrupar por tipo de evento
    const eventCounts = {};
    logs.forEach(log => {
      eventCounts[log.event] = (eventCounts[log.event] || 0) + 1;
    });

    return {
      total: logs.length,
      events: eventCounts,
      lastAccess: logs.length > 0 
        ? logs[0].createdAt?.toISOString() 
        : null,
    };
  }

  async deleteLogsByShareId(userId, shareId) {
    // Validar que o share link existe e pertence ao usuário
    const shareLink = await this.shareLinkRepository.findById(shareId);
    if (!shareLink) {
      throw new NotFoundError('Share link not found');
    }

    if (shareLink.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete these logs');
    }

    const deletedCount = await this.shareAccessLogRepository.deleteByShareId(shareId);

    return { deletedCount };
  }
}

