import { db } from '../config/db.js';
import { shareAccessLogTable } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';

export class ShareAccessLogRepository {
  async create(data) {
    const [log] = await db.insert(shareAccessLogTable).values(data).returning();
    return log;
  }

  async findByShareId(shareId, query = {}) {
    const {
      page = 1,
      limit = 50,
    } = query;

    const offset = (page - 1) * limit;

    const logs = await db
      .select()
      .from(shareAccessLogTable)
      .where(eq(shareAccessLogTable.shareId, shareId))
      .orderBy(desc(shareAccessLogTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(shareAccessLogTable)
      .where(eq(shareAccessLogTable.shareId, shareId));

    return { logs, total: Number(count) };
  }

  async countByShareId(shareId) {
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(shareAccessLogTable)
      .where(eq(shareAccessLogTable.shareId, shareId));

    return Number(count);
  }

  async deleteByShareId(shareId) {
    const result = await db
      .delete(shareAccessLogTable)
      .where(eq(shareAccessLogTable.shareId, shareId));

    return result.rowCount || 0;
  }
}

