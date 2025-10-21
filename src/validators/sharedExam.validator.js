import { z } from 'zod';

export const addExamToShareSchema = z.object({
  body: z.object({
    shareId: z.string().uuid('Invalid share link ID'),
    examId: z.string().uuid('Invalid exam ID'),
  }),
});

export const removeExamFromShareSchema = z.object({
  params: z.object({
    shareId: z.string().uuid('Invalid share link ID'),
    examId: z.string().uuid('Invalid exam ID'),
  }),
});

export const getSharedExamsByShareIdSchema = z.object({
  params: z.object({
    shareId: z.string().uuid('Invalid share link ID'),
  }),
});

export const getSharedExamsByExamIdSchema = z.object({
  params: z.object({
    examId: z.string().uuid('Invalid exam ID'),
  }),
});

export const getSharedExamCountSchema = z.object({
  params: z.object({
    shareId: z.string().uuid('Invalid share link ID'),
  }),
});

