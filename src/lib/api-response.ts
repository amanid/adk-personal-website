/**
 * Client-side helpers for reading a fetch() response that is *supposed* to be
 * JSON but might not be.
 *
 * This app is served through Cloudflare in front of Render. When something goes
 * wrong at either hop — a body over the proxy's limit, an origin that ran out of
 * memory, a request that outlived the 100s origin timeout — the browser gets an
 * HTML error page, not our JSON. Calling `res.json()` on that throws
 *
 *     Unexpected token '<', "<!DOCTYPE "... is not valid JSON
 *
 * which tells the person staring at the admin screen nothing at all. These
 * helpers turn the same situation into a message that names what happened and
 * what to do about it.
 */

/** What a failed request should say, based on the status the proxy returned. */
function messageForStatus(status: number, fallback: string): string {
  switch (status) {
    case 401:
    case 403:
      return "Your session has expired. Sign in again and retry.";
    case 413:
      return "That file is too large to upload. Try a smaller file.";
    case 429:
      return "Too many requests. Wait a moment and try again.";
    case 502:
    case 503:
      return "The server restarted while handling this request — it usually means the file was too heavy to process. Try a smaller file, or retry in a minute.";
    case 504:
    case 524:
      return "The server took too long to respond. Large files can exceed the time limit — try a smaller file, or retry.";
    default:
      return status >= 500
        ? `${fallback} (server error ${status}).`
        : `${fallback} (HTTP ${status}).`;
  }
}

/**
 * Read a response body as JSON, never throwing a parse error.
 *
 * Returns the parsed object on success. On a non-OK response, or a body that
 * isn't JSON, throws an Error carrying a human-readable message: the API's own
 * `error` field when there is one, otherwise something derived from the status.
 *
 * `fallback` names the action for the generic case, e.g. "Upload failed".
 */
export async function readJson<T = Record<string, unknown>>(
  res: Response,
  fallback = "Request failed"
): Promise<T> {
  const raw = await res.text();

  let parsed: unknown = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Not JSON — an HTML error page from the proxy, or an empty body.
      parsed = null;
    }
  }

  if (!res.ok) {
    const apiError =
      parsed && typeof parsed === "object" && typeof (parsed as { error?: unknown }).error === "string"
        ? (parsed as { error: string }).error
        : null;
    throw new Error(apiError || messageForStatus(res.status, fallback));
  }

  if (parsed === null) {
    // A 200 that isn't JSON means something in front of the app answered for it.
    throw new Error(`${fallback}: the server returned an unexpected response.`);
  }

  return parsed as T;
}

/**
 * Same as readJson, but returns an error message instead of throwing.
 * Handy where a caller wants to set an error state rather than catch.
 */
export async function tryReadJson<T = Record<string, unknown>>(
  res: Response,
  fallback = "Request failed"
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    return { data: await readJson<T>(res, fallback), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : fallback };
  }
}
