import { db } from '../config/db.js';
import { examTable } from '../db/schema.js';
import { eq, and, isNull, ilike, or, gte, lte, desc, sql } from 'drizzle-orm';

export class ExamRepository {
  async create(data) {
    const [exam] = await db.insert(examTable).values(data).returning();
    return exam;
  }

  async findById(id, userId, includeDeleted = false) {
    const conditions = [eq(examTable.id, id), eq(examTable.userId, userId)];
    
    if (!includeDeleted) {
      conditions.push(isNull(examTable.deletedAt));
    }

    const [exam] = await db
      .select()
      .from(examTable)
      .where(and(...conditions))
      .limit(1);

    return exam;
  }

  async findByUserId(userId, query = {}) {
    const {
      page = 1,
      limit = 10,
      tags,
      search,
      startDate,
      endDate,
      includeDeleted = false,
    } = query;

    const offset = (page - 1) * limit;
    const conditions = [eq(examTable.userId, userId)];

    if (!includeDeleted) {
      conditions.push(isNull(examTable.deletedAt));
    }

    if (search) {
      conditions.push(
        or(
          ilike(examTable.name, `%${search}%`),
          ilike(examTable.notes, `%${search}%`)
        )
      );
    }

    if (tags && tags.length > 0) {
      conditions.push(sql`${examTable.tags} && ARRAY[${tags.join(',')}]::text[]`);
    }

    if (startDate) {
      conditions.push(gte(examTable.examDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(examTable.examDate, endDate));
    }

    const exams = await db
      .select()
      .from(examTable)
      .where(and(...conditions))
      .orderBy(desc(examTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(examTable)
      .where(and(...conditions));

    return { exams, total: Number(count) };
  }

  async update(id, userId, data) {
    const [updated] = await db
      .update(examTable)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(examTable.id, id), eq(examTable.userId, userId), isNull(examTable.deletedAt)))
      .returning();

    return updated;
  }

  async softDelete(id, userId) {
    const [deleted] = await db
      .update(examTable)
      .set({ deletedAt: new Date() })
      .where(and(eq(examTable.id, id), eq(examTable.userId, userId), isNull(examTable.deletedAt)))
      .returning();

    return deleted;
  }

  async hardDelete(id, userId) {
    const result = await db
      .delete(examTable)
      .where(and(eq(examTable.id, id), eq(examTable.userId, userId)));

    return result.rowCount !== null && result.rowCount > 0;
  }

  async restore(id, userId) {
    const [restored] = await db
      .update(examTable)
      .set({ deletedAt: null })
      .where(and(eq(examTable.id, id), eq(examTable.userId, userId)))
      .returning();

    return restored;
  }
}

