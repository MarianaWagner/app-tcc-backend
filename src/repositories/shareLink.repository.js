import { db } from '../config/db.js';
import { shareLinkTable, sharedExamTable, examTable } from '../db/schema.js';
import { eq, and, desc, gte, sql } from 'drizzle-orm';

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

  async findByToken(token) {
    const [shareLink] = await db
      .select()
      .from(shareLinkTable)
      .where(eq(shareLinkTable.token, token))
      .limit(1);

    return shareLink;
  }

  async findByUserId(userId, query = {}) {
    const {
      page = 1,
      limit = 50,
      active = false,
    } = query;

    const offset = (page - 1) * limit;
    const conditions = [eq(shareLinkTable.userId, userId)];

    if (active) {
      // Apenas links ainda válidos (não expirados e não usados)
      conditions.push(gte(shareLinkTable.expiresAt, new Date()));
    }

    const shareLinks = await db
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

  async findByIdWithExams(id) {
    const [shareLink] = await db
      .select()
      .from(shareLinkTable)
      .where(eq(shareLinkTable.id, id))
      .limit(1);

    if (!shareLink) return null;

    // Buscar exames compartilhados
    const sharedExams = await db
      .select({
        sharedExam: sharedExamTable,
        exam: examTable,
      })
      .from(sharedExamTable)
      .innerJoin(examTable, eq(sharedExamTable.examId, examTable.id))
      .where(eq(sharedExamTable.shareId, id));

    return {
      shareLink,
      exams: sharedExams.map(item => item.exam),
    };
  }

  async findByTokenWithExams(token) {
    const [shareLink] = await db
      .select()
      .from(shareLinkTable)
      .where(eq(shareLinkTable.token, token))
      .limit(1);

    if (!shareLink) return null;

    // Buscar exames compartilhados
    const sharedExams = await db
      .select({
        sharedExam: sharedExamTable,
        exam: examTable,
      })
      .from(sharedExamTable)
      .innerJoin(examTable, eq(sharedExamTable.examId, examTable.id))
      .where(eq(sharedExamTable.shareId, shareLink.id));

    return {
      shareLink,
      exams: sharedExams.map(item => item.exam),
    };
  }

  async update(id, data) {
    const [updated] = await db
      .update(shareLinkTable)
      .set(data)
      .where(eq(shareLinkTable.id, id))
      .returning();

    return updated;
  }

  async updateByToken(token, data) {
    const [updated] = await db
      .update(shareLinkTable)
      .set(data)
      .where(eq(shareLinkTable.token, token))
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
          gte(shareLinkTable.expiresAt, new Date())
        )
      );

    return Number(count);
  }
}

