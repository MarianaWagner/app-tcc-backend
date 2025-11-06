import { z } from 'zod';

export const acceptTermSchema = z.object({
  body: z.object({
    version: z.string().min(1, 'Term version is required'),
  }),
});

