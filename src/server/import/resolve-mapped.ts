import { env } from 'cloudflare:workers';
import type { ImportRecord } from '../../lib/import/types';

type R2MappedPointer = { $r2: string };

function isR2MappedPointer(value: unknown): value is R2MappedPointer {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as R2MappedPointer).$r2 === 'string' &&
    Object.keys(value as object).length === 1
  );
}

/** Resolve mapped_json from D1 or R2 spill pointer. */
export async function resolveMappedRecord(
  mappedJson: string | null,
): Promise<ImportRecord | null> {
  if (!mappedJson) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(mappedJson);
  } catch {
    return null;
  }

  if (isR2MappedPointer(parsed)) {
    const object = await env.MEDIA.get(parsed.$r2);
    if (!object) return null;
    try {
      return JSON.parse(await object.text()) as ImportRecord;
    } catch {
      return null;
    }
  }

  return parsed as ImportRecord;
}
