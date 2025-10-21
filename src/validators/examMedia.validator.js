import { z } from 'zod';

const mediaTypes = ['image', 'pdf', 'video', 'document', 'other'];

export const createMediaSchema = z.object({
  body: z.object({
    examId: z.string().uuid('Invalid exam ID'),
    mediaType: z.enum(['image', 'pdf', 'video', 'document', 'other'], {
      errorMap: () => ({ message: `Media type must be one of: ${mediaTypes.join(', ')}` })
    }),
    filePath: z.string().min(1, 'File path is required').max(1000),
    metadata: z.record(z.any()).optional(),
  }),
});

export const updateMediaSchema = z.object({
  body: z.object({
    mediaType: z.enum(['image', 'pdf', 'video', 'document', 'other'], {
      errorMap: () => ({ message: `Media type must be one of: ${mediaTypes.join(', ')}` })
    }).optional(),
    filePath: z.string().min(1).max(1000).optional(),
    metadata: z.record(z.any()).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid media ID'),
  }),
});

export const getMediaSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid media ID'),
  }),
});

export const deleteMediaSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid media ID'),
  }),
});

export const listMediaByExamSchema = z.object({
  params: z.object({
    examId: z.string().uuid('Invalid exam ID'),
  }),
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
    mediaType: z.enum(['image', 'pdf', 'video', 'document', 'other']).optional(),
  }).optional(),
});

export const deleteMediaByExamSchema = z.object({
  params: z.object({
    examId: z.string().uuid('Invalid exam ID'),
  }),
});

export const getMediaCountSchema = z.object({
  params: z.object({
    examId: z.string().uuid('Invalid exam ID'),
  }),
});


