import { z } from 'zod';

export const createLogSchema = z.object({
  body: z.object({
    shareId: z.string().uuid('Invalid share link ID'),
    event: z.string().min(1, 'Event is required').max(100),
    emailInput: z.string().email().optional().nullable(),
    ipAddress: z.string().optional().nullable(),
    userAgent: z.string().optional().nullable(),
  }),
});

export const getLogsByShareIdSchema = z.object({
  params: z.object({
    shareId: z.string().uuid('Invalid share link ID'),
  }),
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  }).optional(),
});

export const getLogStatsSchema = z.object({
  params: z.object({
    shareId: z.string().uuid('Invalid share link ID'),
  }),
});

export const deleteLogsSchema = z.object({
  params: z.object({
    shareId: z.string().uuid('Invalid share link ID'),
  }),
});

