import { db } from '../config/db.js';
import { shareLinkTable, examTable, sharedExamTable } from '../db/schema.js';
import { eq, and, desc, gte, isNull, sql, inArray } from 'drizzle-orm';

export class ShareLinkRepository {
  async create(data) {
    const [shareLink] = await db.insert(shareLinkTable).values(data).returning();
    return shareLink;
  }

  async findById(id) {
    const [shareLink] = await db
      .select()
      .from(shareLinkTable)
      .where(eq(shareLinkTable.id, id))
      .limit(1);

    return shareLink;
  }

  /**
   * Busca por código curto (para URL pública /s/:code)
   */
  async findByCode(code) {
    const [shareLink] = await db
      .select()
      .from(shareLinkTable)
      .where(eq(shareLinkTable.code, code))
      .limit(1);

    return shareLink;
  }

  /**
   * Busca por código com exames associados
   */
  async findByCodeWithExams(code) {
    const shareLink = await this.findByCode(code);
    if (!shareLink) return null;

    const exams = await db
      .select({
        id: examTable.id,
        userId: examTable.userId,
        name: examTable.name,
        examDate: examTable.examDate,
        notes: examTable.notes,
        tags: examTable.tags,
        createdAt: examTable.createdAt,
        updatedAt: examTable.updatedAt,
      })
      .from(sharedExamTable)
      .innerJoin(examTable, eq(sharedExamTable.examId, examTable.id))
      .where(eq(sharedExamTable.shareId, shareLink.id));

    return {
      shareLink,
      exams,
    };
  }

  /**
   * Busca por código com exame associado (DEPRECATED - usar findByCodeWithExams)
   * Mantido para compatibilidade, retorna o primeiro exame
   */
  async findByCodeWithExam(code) {
    const result = await this.findByCodeWithExams(code);
    if (!result || result.exams.length === 0) return null;

    return {
      shareLink: result.shareLink,
      exam: result.exams[0],
    };
  }

  /**
   * Busca por ID com exames associados
   */
  async findByIdWithExams(id) {
    const shareLink = await this.findById(id);
    if (!shareLink) return null;

    const exams = await db
      .select({
        id: examTable.id,
        userId: examTable.userId,
        name: examTable.name,
        examDate: examTable.examDate,
        notes: examTable.notes,
        tags: examTable.tags,
        createdAt: examTable.createdAt,
        updatedAt: examTable.updatedAt,
      })
      .from(sharedExamTable)
      .innerJoin(examTable, eq(sharedExamTable.examId, examTable.id))
      .where(eq(sharedExamTable.shareId, id));

    return {
      shareLink,
      exams,
    };
  }

  /**
   * Busca por ID com exame associado (DEPRECATED - usar findByIdWithExams)
   * Mantido para compatibilidade, retorna o primeiro exame
   */
  async findByIdWithExam(id) {
    const result = await this.findByIdWithExams(id);
    if (!result || result.exams.length === 0) return null;

    return {
      shareLink: result.shareLink,
      exam: result.exams[0],
    };
  }

  /**
   * Busca compartilhamentos por usuário (dono do exame)
   */
  async findByUserId(userId, query = {}) {
    const {
      page = 1,
      limit = 50,
      active = false,
      examId = null,
    } = query;

    const offset = (page - 1) * limit;
    let conditions = [eq(shareLinkTable.userId, userId)];

    if (active) {
      // Apenas links ainda válidos (não expirados, não revogados, não atingiram max_uses)
      conditions.push(gte(shareLinkTable.expiresAt, new Date()));
      conditions.push(isNull(shareLinkTable.revokedAt));
    }

    // Se há filtro por examId, buscar através de sharedExam
    let shareLinks;
    if (examId) {
      // Buscar shareIds que têm esse exame
      const sharedExams = await db
        .select({ shareId: sharedExamTable.shareId })
        .from(sharedExamTable)
        .where(eq(sharedExamTable.examId, examId));

      const shareIds = sharedExams.map(se => se.shareId);
      
      if (shareIds.length === 0) {
        return { shareLinks: [], total: 0 };
      }

      conditions.push(inArray(shareLinkTable.id, shareIds));
    }

    shareLinks = await db
      .select()
      .from(shareLinkTable)
      .where(and(...conditions))
      .orderBy(desc(shareLinkTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(shareLinkTable)
      .where(and(...conditions));

    return { shareLinks, total: Number(count) };
  }

  /**
   * Busca compartilhamentos por examId (para listagem na tela do exame)
   * Agora busca através de sharedExam
   */
  async findByExamId(examId, userId) {
    // Buscar shareIds que têm esse exame e pertencem ao usuário
    const shareLinks = await db
      .select({
        id: shareLinkTable.id,
        userId: shareLinkTable.userId,
        code: shareLinkTable.code,
        email: shareLinkTable.email,
        expiresAt: shareLinkTable.expiresAt,
        maxUses: shareLinkTable.maxUses,
        timesUsed: shareLinkTable.timesUsed,
        revokedAt: shareLinkTable.revokedAt,
        otpHash: shareLinkTable.otpHash,
        otpExpiresAt: shareLinkTable.otpExpiresAt,
        otpAttempts: shareLinkTable.otpAttempts,
        otpSentAt: shareLinkTable.otpSentAt,
        otpSentCount: shareLinkTable.otpSentCount,
        createdAt: shareLinkTable.createdAt,
        updatedAt: shareLinkTable.updatedAt,
      })
      .from(sharedExamTable)
      .innerJoin(shareLinkTable, eq(sharedExamTable.shareId, shareLinkTable.id))
      .where(
        and(
          eq(sharedExamTable.examId, examId),
          eq(shareLinkTable.userId, userId)
        )
      )
      .orderBy(desc(shareLinkTable.createdAt));

    return shareLinks;
  }

  async update(id, data) {
    const [updated] = await db
      .update(shareLinkTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shareLinkTable.id, id))
      .returning();

    return updated;
  }

  async updateByCode(code, data) {
    const [updated] = await db
      .update(shareLinkTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shareLinkTable.code, code))
      .returning();

    return updated;
  }

  /**
   * Incrementa contador de usos
   */
  async incrementTimesUsed(id) {
    const [updated] = await db
      .update(shareLinkTable)
      .set({
        timesUsed: sql`${shareLinkTable.timesUsed} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(shareLinkTable.id, id))
      .returning();

    return updated;
  }

  /**
   * Revoga compartilhamento
   */
  async revoke(id) {
    const [updated] = await db
      .update(shareLinkTable)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(shareLinkTable.id, id))
      .returning();

    return updated;
  }

  async delete(id) {
    const result = await db
      .delete(shareLinkTable)
      .where(eq(shareLinkTable.id, id));

    return result.rowCount !== null && result.rowCount > 0;
  }

  async countByUserId(userId) {
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(shareLinkTable)
      .where(eq(shareLinkTable.userId, userId));

    return Number(count);
  }

  async countActiveByUserId(userId) {
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(shareLinkTable)
      .where(
        and(
          eq(shareLinkTable.userId, userId),
          gte(shareLinkTable.expiresAt, new Date()),
          isNull(shareLinkTable.revokedAt)
        )
      );

    return Number(count);
  }
}

