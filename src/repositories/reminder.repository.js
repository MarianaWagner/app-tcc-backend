import { db } from '../config/db.js';
import { reminderTable, examTable } from '../db/schema.js';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

export class ReminderRepository {
  async create(data) {
    const [reminder] = await db.insert(reminderTable).values(data).returning();
    return reminder;
  }

  async findById(id) {
    const [reminder] = await db
      .select()
      .from(reminderTable)
      .where(eq(reminderTable.id, id))
      .limit(1);

    return reminder;
  }

  async findByIdWithExam(id) {
    const [result] = await db
      .select({
        reminder: reminderTable,
        exam: examTable,
      })
      .from(reminderTable)
      .leftJoin(examTable, eq(reminderTable.examId, examTable.id))
      .where(eq(reminderTable.id, id))
      .limit(1);

    return result;
  }

  async findByUserId(userId, query = {}) {
    const {
      page = 1,
      limit = 50,
      upcoming = false,
      startDate,
      endDate,
    } = query;

    const offset = (page - 1) * limit;
    const conditions = [eq(reminderTable.userId, userId)];

    if (upcoming) {
      // Lembretes futuros (a partir de hoje)
      conditions.push(gte(reminderTable.reminderDate, new Date()));
    }

    if (startDate) {
      conditions.push(gte(reminderTable.reminderDate, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(reminderTable.reminderDate, new Date(endDate)));
    }

    const reminders = await db
      .select()
      .from(reminderTable)
      .where(and(...conditions))
      .orderBy(reminderTable.reminderDate)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(reminderTable)
      .where(and(...conditions));

    return { reminders, total: Number(count) };
  }

  async findByExamId(examId, userId) {
    const reminders = await db
      .select()
      .from(reminderTable)
      .where(and(eq(reminderTable.examId, examId), eq(reminderTable.userId, userId)))
      .orderBy(reminderTable.reminderDate);

    return reminders;
  }

  async findUpcoming(userId, daysAhead = 3) {
    // Início do dia atual em UTC (00:00:00)
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    
    // Final do dia futuro em UTC (23:59:59)
    const futureDate = new Date(today);
    futureDate.setUTCDate(futureDate.getUTCDate() + daysAhead);
    futureDate.setUTCHours(23, 59, 59, 999);

    const reminders = await db
      .select({
        reminder: reminderTable,
        exam: examTable,
      })
      .from(reminderTable)
      .leftJoin(examTable, eq(reminderTable.examId, examTable.id))
      .where(
        and(
          eq(reminderTable.userId, userId),
          gte(reminderTable.reminderDate, today),
          lte(reminderTable.reminderDate, futureDate)
        )
      )
      .orderBy(reminderTable.reminderDate);

    return reminders;
  }

  async update(id, data) {
    const [updated] = await db
      .update(reminderTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reminderTable.id, id))
      .returning();

    return updated;
  }

  async delete(id) {
    const result = await db
      .delete(reminderTable)
      .where(eq(reminderTable.id, id));

    return result.rowCount !== null && result.rowCount > 0;
  }

  async deleteByExamId(examId) {
    const result = await db
      .delete(reminderTable)
      .where(eq(reminderTable.examId, examId));

    return result.rowCount || 0;
  }

  async countByUserId(userId) {
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(reminderTable)
      .where(eq(reminderTable.userId, userId));

    return Number(count);
  }

  async countUpcomingByUserId(userId) {
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(reminderTable)
      .where(
        and(
          eq(reminderTable.userId, userId),
          gte(reminderTable.reminderDate, new Date())
        )
      );

    return Number(count);
  }
}


