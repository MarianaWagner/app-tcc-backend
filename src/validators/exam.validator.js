import { z } from 'zod';

export const createExamSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    examDate: z.string().date().optional().or(z.literal('')),
    notes: z.string().max(5000).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
  }),
});

export const updateExamSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    examDate: z.string().datetime().optional().nullable().or(z.literal('')),
    notes: z.string().max(5000).optional().nullable(),
    tags: z.array(z.string().max(50)).max(20).optional().nullable(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getExamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const deleteExamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listExamsSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
      if (typeof val === 'string') return val.split(',');
      return val;
    }),
    search: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    includeDeleted: z.string().transform(val => val === 'true').optional(),
  }).optional(),
});

