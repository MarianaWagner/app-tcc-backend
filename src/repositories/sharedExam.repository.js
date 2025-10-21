import { db } from '../config/db.js';
import { sharedExamTable } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

export class SharedExamRepository {
  async create(data) {
    const [sharedExam] = await db.insert(sharedExamTable).values(data).returning();
    return sharedExam;
  }

  async createMany(dataArray) {
    if (dataArray.length === 0) return [];
    const sharedExams = await db.insert(sharedExamTable).values(dataArray).returning();
    return sharedExams;
  }

  async findByShareId(shareId) {
    const sharedExams = await db
      .select()
      .from(sharedExamTable)
      .where(eq(sharedExamTable.shareId, shareId));

    return sharedExams;
  }

  async findByExamId(examId) {
    const sharedExams = await db
      .select()
      .from(sharedExamTable)
      .where(eq(sharedExamTable.examId, examId));

    return sharedExams;
  }

  async exists(shareId, examId) {
    const [result] = await db
      .select()
      .from(sharedExamTable)
      .where(
        and(
          eq(sharedExamTable.shareId, shareId),
          eq(sharedExamTable.examId, examId)
        )
      )
      .limit(1);

    return !!result;
  }

  async delete(shareId, examId) {
    const result = await db
      .delete(sharedExamTable)
      .where(
        and(
          eq(sharedExamTable.shareId, shareId),
          eq(sharedExamTable.examId, examId)
        )
      );

    return result.rowCount !== null && result.rowCount > 0;
  }

  async deleteByShareId(shareId) {
    const result = await db
      .delete(sharedExamTable)
      .where(eq(sharedExamTable.shareId, shareId));

    return result.rowCount || 0;
  }

  async deleteByExamId(examId) {
    const result = await db
      .delete(sharedExamTable)
      .where(eq(sharedExamTable.examId, examId));

    return result.rowCount || 0;
  }

  async countByShareId(shareId) {
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(sharedExamTable)
      .where(eq(sharedExamTable.shareId, shareId));

    return Number(count);
  }
}


