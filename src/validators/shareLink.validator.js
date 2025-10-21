import { z } from 'zod';

export const createShareLinkSchema = z.object({
  body: z.object({
    contact: z.string().email('Invalid email format').max(255),
    examIds: z.array(z.string().uuid('Invalid exam ID')).min(1, 'At least one exam is required').max(50),
    expiresInHours: z.number().int().positive().max(8760).optional(), // Máximo 1 ano (365 dias)
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
  }).optional(),
});

export const requestAccessSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    contact: z.string().email('Invalid email format').max(255),
  }),
});

export const validateOTPSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    contact: z.string().email('Invalid email format').max(255),
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only numbers'),
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


