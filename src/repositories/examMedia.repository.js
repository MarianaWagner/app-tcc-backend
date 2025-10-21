import { db } from '../config/db.js';
import { examMediaTable, examTable } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';

export class ExamMediaRepository {
  async create(data) {
    const [media] = await db.insert(examMediaTable).values(data).returning();
    return media;
  }

  async findById(id) {
    const [media] = await db
      .select()
      .from(examMediaTable)
      .where(eq(examMediaTable.id, id))
      .limit(1);

    return media;
  }

  async findByExamId(examId, query = {}) {
    const {
      page = 1,
      limit = 50,
      mediaType,
    } = query;

    const offset = (page - 1) * limit;
    const conditions = [eq(examMediaTable.examId, examId)];

    if (mediaType) {
      conditions.push(eq(examMediaTable.mediaType, mediaType));
    }

    const medias = await db
      .select()
      .from(examMediaTable)
      .where(and(...conditions))
      .orderBy(desc(examMediaTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(examMediaTable)
      .where(and(...conditions));

    return { medias, total: Number(count) };
  }

  async findByIdWithExam(id) {
    const [result] = await db
      .select({
        media: examMediaTable,
        exam: examTable,
      })
      .from(examMediaTable)
      .innerJoin(examTable, eq(examMediaTable.examId, examTable.id))
      .where(eq(examMediaTable.id, id))
      .limit(1);

    return result;
  }

  async update(id, data) {
    const [updated] = await db
      .update(examMediaTable)
      .set(data)
      .where(eq(examMediaTable.id, id))
      .returning();

    return updated;
  }

  async delete(id) {
    const result = await db
      .delete(examMediaTable)
      .where(eq(examMediaTable.id, id));

    return result.rowCount !== null && result.rowCount > 0;
  }

  async deleteByExamId(examId) {
    const result = await db
      .delete(examMediaTable)
      .where(eq(examMediaTable.examId, examId));

    return result.rowCount || 0;
  }

  async countByExamId(examId) {
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(examMediaTable)
      .where(eq(examMediaTable.examId, examId));

    return Number(count);
  }
}


