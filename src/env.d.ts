/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    requestId?: string;
    user?: {
      id: string;
      email: string;
      role: 'admin' | 'editor';
    };
  }
}
