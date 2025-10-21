import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255),
    email: z.string().email('Invalid email format').max(255),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').max(255),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
  }),
});

export const verifyTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
});

