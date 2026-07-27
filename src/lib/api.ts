export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string> };
};
export type ApiResult<T> = ApiOk<T> | ApiErr;

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ ok: true, data } satisfies ApiOk<T>, init);
}

export function jsonErr(
  code: string,
  message: string,
  status = 400,
  fields?: Record<string, string>,
): Response {
  return Response.json(
    { ok: false, error: { code, message, fields } } satisfies ApiErr,
    { status },
  );
}
