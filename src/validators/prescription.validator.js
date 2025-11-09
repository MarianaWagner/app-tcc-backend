import { z } from 'zod';

const STATUS_VALUES = ['em_uso', 'concluida', 'suspensa'];

const prescriptionItemSchema = z.object({
  name: z.string().min(1).max(255),
  dosage: z.string().min(1).max(255).optional(),
  route: z.string().min(1).max(255).optional(),
  frequency: z.string().min(1).max(255).optional(),
  duration: z.string().min(1).max(255).optional(),
  notes: z.string().min(1).max(1000).optional(),
});

const tagsSchema = z
  .union([z.string(), z.array(z.string().max(50)).max(20)])
  .optional()
  .transform((value) => {
    if (typeof value === 'string') {
      if (!value.trim()) {
        return undefined;
      }
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(tag => tag.toString());
        }
      } catch {
        return value
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean);
      }
    }
    return value;
  });

const itemsSchema = z
  .union([z.string(), z.array(prescriptionItemSchema).max(50)])
  .optional();

const statusSchema = z
  .string()
  .min(1)
  .transform(value => value.trim().toLowerCase().replace(/\s+/g, '_'))
  .refine(value => STATUS_VALUES.includes(value), 'Status inválido. Valores permitidos: em_uso, concluida, suspensa.')
  .optional();

const optionalUuidSchema = z
  .string()
  .uuid()
  .or(z.string().length(0))
  .optional();

export const createPrescriptionSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    issueDate: z.string().date('Data de emissão inválida. Use YYYY-MM-DD'),
    posology: z.string().min(1).max(5000),
    status: statusSchema,
    notes: z.string().max(5000).optional(),
    professional: z.string().max(255).optional(),
    tags: tagsSchema,
    examId: optionalUuidSchema,
    items: itemsSchema,
  }).strict(),
});

export const updatePrescriptionSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    issueDate: z.string().date('Data de emissão inválida. Use YYYY-MM-DD').optional(),
    posology: z.string().min(1).max(5000).optional(),
    status: statusSchema,
    notes: z.string().max(5000).optional().nullable(),
    professional: z.string().max(255).optional().nullable(),
    tags: tagsSchema,
    examId: optionalUuidSchema,
    items: itemsSchema,
  }).strict(),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getPrescriptionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const deletePrescriptionSchema = getPrescriptionSchema;

export const downloadPrescriptionSchema = getPrescriptionSchema;

export const listPrescriptionsSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    tags: tagsSchema,
    sortField: z.enum(['issueDate', 'title', 'status', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }).optional(),
});

