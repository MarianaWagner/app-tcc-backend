import { db } from '../config/db.js';
import { prescriptionItemTable, prescriptionTable } from '../db/schema.js';
import { and, asc, desc, eq, gte, ilike, isNull, lte, sql } from 'drizzle-orm';

export class PrescriptionRepository {
  async create(prescriptionData) {
    const [created] = await db.insert(prescriptionTable).values(prescriptionData).returning();
    return created;
  }

  async addItems(prescriptionId, items) {
    if (!items || items.length === 0) {
      return [];
    }

    const payload = items.map(item => ({
      prescriptionId,
      name: item.name,
      dosage: item.dosage ?? null,
      route: item.route ?? null,
      frequency: item.frequency ?? null,
      duration: item.duration ?? null,
      notes: item.notes ?? null,
    }));

    return db.insert(prescriptionItemTable).values(payload).returning();
  }

  async deleteItemsByPrescriptionId(prescriptionId) {
    return db
      .delete(prescriptionItemTable)
      .where(eq(prescriptionItemTable.prescriptionId, prescriptionId));
  }

  async findById(id, userId, { includeDeleted = false } = {}) {
    const conditions = [eq(prescriptionTable.id, id), eq(prescriptionTable.userId, userId)];

    if (!includeDeleted) {
      conditions.push(isNull(prescriptionTable.deletedAt));
    }

    const [prescription] = await db
      .select()
      .from(prescriptionTable)
      .where(and(...conditions))
      .limit(1);

    if (!prescription) {
      return null;
    }

    const items = await db
      .select()
      .from(prescriptionItemTable)
      .where(eq(prescriptionItemTable.prescriptionId, id))
      .orderBy(desc(prescriptionItemTable.createdAt));

    return { prescription, items };
  }

  async findByUserId(userId, query = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      startDate,
      endDate,
      tags,
      includeDeleted = false,
      sortField = 'issueDate',
      sortOrder = 'desc',
    } = query;

    const offset = (page - 1) * limit;
    const conditions = [eq(prescriptionTable.userId, userId)];

    if (!includeDeleted) {
      conditions.push(isNull(prescriptionTable.deletedAt));
    }

    if (status) {
      conditions.push(eq(prescriptionTable.status, status));
    }

    if (search) {
      const likeQuery = `%${search}%`;
      conditions.push(
        ilike(prescriptionTable.title, likeQuery)
      );
    }

    if (startDate) {
      conditions.push(gte(prescriptionTable.issueDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(prescriptionTable.issueDate, endDate));
    }

    if (tags && tags.length > 0) {
      const tagSqlArray = sql.join(tags.map(tag => sql`${tag}`), sql`, `);
      conditions.push(sql`${prescriptionTable.tags} && ARRAY[${tagSqlArray}]::text[]`);
    }

    const orderByColumn = (() => {
      switch (sortField) {
        case 'title':
          return prescriptionTable.title;
        case 'status':
          return prescriptionTable.status;
        case 'createdAt':
          return prescriptionTable.createdAt;
        default:
          return prescriptionTable.issueDate;
      }
    })();

    const orderByClause = sortOrder === 'asc'
      ? asc(orderByColumn)
      : desc(orderByColumn);

    const prescriptions = await db
      .select()
      .from(prescriptionTable)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(prescriptionTable)
      .where(and(...conditions));

    return {
      prescriptions,
      total: Number(count),
    };
  }

  async update(id, userId, data) {
    const [updated] = await db
      .update(prescriptionTable)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(prescriptionTable.id, id), eq(prescriptionTable.userId, userId), isNull(prescriptionTable.deletedAt)))
      .returning();

    return updated;
  }

  async softDelete(id, userId) {
    const [deleted] = await db
      .update(prescriptionTable)
      .set({ deletedAt: new Date() })
      .where(and(eq(prescriptionTable.id, id), eq(prescriptionTable.userId, userId), isNull(prescriptionTable.deletedAt)))
      .returning();

    return deleted;
  }

  async hardDelete(id, userId) {
    const result = await db
      .delete(prescriptionTable)
      .where(and(eq(prescriptionTable.id, id), eq(prescriptionTable.userId, userId)));

    return result.rowCount !== null && result.rowCount > 0;
  }
}

