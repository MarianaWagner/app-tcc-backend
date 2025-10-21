import { db } from '../config/db.js';
import { userTable } from '../db/schema.js';
import { eq, and, isNull, ilike, desc, sql } from 'drizzle-orm';

export class UserRepository {
  async create(data) {
    const [user] = await db.insert(userTable).values(data).returning();
    return user;
  }

  async findById(id, includeDeleted = false) {
    const conditions = [eq(userTable.id, id)];
    
    if (!includeDeleted) {
      conditions.push(isNull(userTable.deletedAt));
    }

    const [user] = await db
      .select()
      .from(userTable)
      .where(and(...conditions))
      .limit(1);

    return user;
  }

  async findByEmail(email, includeDeleted = false) {
    const conditions = [sql`lower(${userTable.email}) = lower(${email})`];
    
    if (!includeDeleted) {
      conditions.push(isNull(userTable.deletedAt));
    }

    const [user] = await db
      .select()
      .from(userTable)
      .where(and(...conditions))
      .limit(1);

    return user;
  }

  async findAll(query = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      includeDeleted = false,
    } = query;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (!includeDeleted) {
      conditions.push(isNull(userTable.deletedAt));
    }

    if (search) {
      conditions.push(
        sql`(
          lower(${userTable.name}) LIKE lower(${`%${search}%`}) OR
          lower(${userTable.email}) LIKE lower(${`%${search}%`})
        )`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const users = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
        deletedAt: userTable.deletedAt,
      })
      .from(userTable)
      .where(whereClause)
      .orderBy(desc(userTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(userTable)
      .where(whereClause);

    return { users, total: Number(count) };
  }

  async update(id, data) {
    const [updated] = await db
      .update(userTable)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(userTable.id, id), isNull(userTable.deletedAt)))
      .returning();

    return updated;
  }

  async softDelete(id) {
    const [deleted] = await db
      .update(userTable)
      .set({ deletedAt: new Date() })
      .where(and(eq(userTable.id, id), isNull(userTable.deletedAt)))
      .returning();

    return deleted;
  }

  async hardDelete(id) {
    const result = await db
      .delete(userTable)
      .where(eq(userTable.id, id));

    return result.rowCount !== null && result.rowCount > 0;
  }

  async restore(id) {
    const [restored] = await db
      .update(userTable)
      .set({ deletedAt: null })
      .where(eq(userTable.id, id))
      .returning();

    return restored;
  }
}

