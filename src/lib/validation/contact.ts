import { z } from 'zod';

export const contactMessageSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(160),
  phone: z.string().max(40).optional().default(''),
  message: z.string().min(1).max(4000),
  website: z.string().max(200).optional().default(''), // honeypot
});
