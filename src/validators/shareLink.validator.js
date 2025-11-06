import { z } from 'zod';

// Schema para criar compartilhamento (múltiplos exames)
export const createShareLinkSchema = z.object({
  body: z.object({
    examIds: z.array(z.string().uuid('Invalid exam ID'))
      .min(1, 'At least one exam ID is required')
      .max(50, 'Maximum 50 exams per share link'),
    email: z.string().email('Invalid email format').max(255),
    expiresInDays: z.number().int().positive().min(1).max(365).optional(), // Default 7, máximo 1 ano
    maxUses: z.number().int().positive().min(1).max(100).optional(), // Default 1, máximo 100
    message: z.string().max(1000, 'Message must be at most 1000 characters').optional(), // Mensagem opcional
  }),
});

export const getShareLinkSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid share link ID'),
  }),
});

export const deleteShareLinkSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid share link ID'),
  }),
});

export const listShareLinksSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
    active: z.string().transform(val => val === 'true').optional(),
    examId: z.string().uuid('Invalid exam ID').optional(),
  }).optional(),
});

// Schema para solicitar acesso (via código)
export const requestAccessSchema = z.object({
  params: z.object({
    code: z.string().min(1, 'Code is required'),
  }),
  body: z.object({
    email: z.string().email('Invalid email format').max(255),
  }),
});

// Schema para validar OTP
export const validateOTPSchema = z.object({
  params: z.object({
    code: z.string().min(1, 'Code is required'),
  }),
  body: z.object({
    email: z.string().email('Invalid email format').max(255),
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only numbers'),
  }),
});

// Schema para atualizar expiração
export const updateExpirationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid share link ID'),
  }),
  body: z.object({
    expiresInDays: z.number().int().positive().min(1).max(365),
  }),
});

export const getAccessLogsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid share link ID'),
  }),
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  }).optional(),
});

// Schema para código público
export const getShareByCodeSchema = z.object({
  params: z.object({
    code: z.string().min(1, 'Code is required'),
  }),
});
