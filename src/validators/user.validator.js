import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255),
    email: z.string().email('Invalid email format').max(255),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255).optional(),
    email: z.string().email('Invalid email format').max(255).optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
    search: z.string().optional(),
    includeDeleted: z.string().transform(val => val === 'true').optional(),
  }).optional(),
});


