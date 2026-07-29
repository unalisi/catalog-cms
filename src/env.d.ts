/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    requestId?: string;
    user?: {
      id: string;
      email: string;
      roleId: string;
      roleSlug: string;
      roleName: string;
      permissions: string[];
      mustChangePassword: boolean;
    };
  }
}
