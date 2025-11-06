import { z } from 'zod';

export const createReminderSchema = z.object({
  body: z.object({
    examId: z.string().uuid('Invalid exam ID').optional().nullable(),
    title: z.string().min(1, 'Title is required').max(255),
    reminderDate: z.string().datetime({ offset: true }, 'Invalid reminder date format'),
    requiresFasting: z.boolean().optional(),
    fastingDuration: z.number().int().positive().optional().nullable(),
    fastingAlertTime: z.string().datetime({ offset: true }, 'Invalid fasting alert time format').optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
  }),
});

export const updateReminderSchema = z.object({
  body: z.object({
    examId: z.string().uuid('Invalid exam ID').optional().nullable(),
    title: z.string().min(1).max(255).optional(),
    reminderDate: z.string().datetime({ offset: true }, 'Invalid reminder date format').optional(),
    requiresFasting: z.boolean().optional(),
    fastingDuration: z.number().int().positive().optional().nullable(),
    fastingAlertTime: z.string().datetime({ offset: true }, 'Invalid fasting alert time format').optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid reminder ID'),
  }),
});

export const getReminderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid reminder ID'),
  }),
});

export const deleteReminderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid reminder ID'),
  }),
});

export const listRemindersSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
    upcoming: z.string().transform(val => val === 'true').optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
});

export const listRemindersByExamSchema = z.object({
  params: z.object({
    examId: z.string().uuid('Invalid exam ID'),
  }),
});

export const deleteRemindersByExamSchema = z.object({
  params: z.object({
    examId: z.string().uuid('Invalid exam ID'),
  }),
});

export const getUpcomingRemindersSchema = z.object({
  query: z.object({
    daysAhead: z.string().transform(Number).pipe(z.number().int().positive().max(30)).optional(),
  }).optional(),
});


