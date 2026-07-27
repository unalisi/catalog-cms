import { integer, primaryKey, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { media } from './media';
import { seoMeta } from './seo';
import { brands, categories } from './taxonomy';

export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    sku: text('sku').unique(),
    name: text('name').notNull(),
    description: text('description'),
    price: integer('price').notNull().default(0),
    compareAtPrice: integer('compare_at_price'),
    currency: text('currency').notNull().default('TRY'),
    stock: integer('stock').notNull().default(0),
    status: text('status', { enum: ['draft', 'published', 'archived'] })
      .notNull()
      .default('draft'),
    brandId: text('brand_id').references(() => brands.id),
    seoId: text('seo_id').references(() => seoMeta.id),
    primaryMediaId: text('primary_media_id').references(() => media.id),
    publishedAt: text('published_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [
    index('products_status_updated_idx').on(t.status, t.updatedAt),
    index('products_brand_idx').on(t.brandId),
  ],
);

export const productVariants = sqliteTable('product_variants', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  sku: text('sku').unique(),
  name: text('name').notNull(),
  price: integer('price').notNull().default(0),
  stock: integer('stock').notNull().default(0),
  attributesJson: text('attributes_json'),
  position: integer('position').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const productCategories = sqliteTable(
  'product_categories',
  {
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] })],
);

export const productMedia = sqliteTable(
  'product_media',
  {
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    mediaId: text('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.productId, t.mediaId] })],
);

export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
