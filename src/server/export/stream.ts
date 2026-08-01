import type { Db } from '../db';
import { streamProducts, type ExportFilter } from './query';
import { csvHeader, csvRow } from './formatters/csv';
import { xmlHeader, xmlFooter, xmlRow } from './formatters/xml';
import { jsonArrayOpen, jsonArrayItem, jsonArrayClose } from './formatters/woocommerce';

export type ExportFormat = 'csv' | 'xml' | 'woocommerce-json';

const CONTENT_TYPES: Record<ExportFormat, string> = {
  csv: 'text/csv; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  'woocommerce-json': 'application/json; charset=utf-8',
};

const FILE_EXTENSIONS: Record<ExportFormat, string> = {
  csv: 'csv',
  xml: 'xml',
  'woocommerce-json': 'json',
};

/**
 * Streaming export — pages from D1 and writes rows without loading the full catalog.
 */
export function createExportStream(
  db: Db,
  format: ExportFormat,
  filter: ExportFilter,
  origin?: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        let isFirst = true;

        if (format === 'csv') controller.enqueue(encoder.encode(csvHeader()));
        if (format === 'xml') controller.enqueue(encoder.encode(xmlHeader()));
        if (format === 'woocommerce-json') controller.enqueue(encoder.encode(jsonArrayOpen()));

        for await (const record of streamProducts(db, filter, origin)) {
          if (format === 'csv') controller.enqueue(encoder.encode(csvRow(record)));
          if (format === 'xml') controller.enqueue(encoder.encode(xmlRow(record)));
          if (format === 'woocommerce-json') {
            controller.enqueue(encoder.encode(jsonArrayItem(record, isFirst)));
          }
          isFirst = false;
        }

        if (format === 'xml') controller.enqueue(encoder.encode(xmlFooter()));
        if (format === 'woocommerce-json') controller.enqueue(encoder.encode(jsonArrayClose()));

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

export function exportContentType(format: ExportFormat): string {
  return CONTENT_TYPES[format];
}

export function exportFileName(format: ExportFormat): string {
  const date = new Date().toISOString().slice(0, 10);
  return `katalog-export-${date}.${FILE_EXTENSIONS[format]}`;
}

export function normalizeExportFormat(raw: string | null): ExportFormat | null {
  if (!raw) return null;
  if (raw === 'csv' || raw === 'xml' || raw === 'woocommerce-json') return raw;
  if (raw === 'woo-json') return 'woocommerce-json';
  return null;
}
