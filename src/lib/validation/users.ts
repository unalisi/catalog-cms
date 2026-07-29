import { z } from 'zod';
import { PERMISSIONS, type Permission } from '../auth/permissions';

const permissionEnum = z.enum(PERMISSIONS as unknown as [Permission, ...Permission[]]);

export const userCreateSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  roleId: z.string().min(1).max(64),
});

export const userUpdateSchema = z
  .object({
    email: z.string().email().max(200).optional(),
    password: z.string().min(8).max(200).optional(),
    roleId: z.string().min(1).max(64).optional(),
  })
  .refine((v) => v.email !== undefined || v.password !== undefined || v.roleId !== undefined, {
    message: 'En az bir alan gerekli',
  });

export const roleCreateSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug küçük harf ve tire olmalı')
    .optional(),
  description: z.string().max(300).default(''),
  permissions: z.array(permissionEnum).default([]),
});

export const roleUpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(300).optional(),
  permissions: z.array(permissionEnum).optional(),
});
