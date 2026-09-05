/**
 * Runtime shims for the PDF rasteriser (unpdf → pdf.js).
 *
 * pdf.js assumes APIs that only exist on newer Node releases:
 *   - `ArrayBuffer.prototype.transferToFixedLength` (Node 21+)
 *   - `URL.parse` (Node 22.1+)
 *
 * On Node 20 their absence does not throw outright — pdf.js catches the
 * TypeError, logs "ignoring errors during GetOperatorList" and renders a blank
 * white page. That silent failure is worse than a crash, so we install minimal
 * equivalents instead of pinning the deployment to a Node minor version.
 *
 * Both shims are no-ops on runtimes that already provide the API.
 */

// Deliberately not `extends ArrayBuffer`: newer lib.dom typings declare
// `transfer` as required, which we cannot satisfy while probing for it.
type MaybeTransferable = {
  transferToFixedLength?: (newLength?: number) => ArrayBuffer;
  transfer?: (newLength?: number) => ArrayBuffer;
};

let installed = false;

export function ensurePdfRuntimePolyfills(): void {
  if (installed) return;
  installed = true;

  const urlCtor = URL as unknown as {
    parse?: (input: string, base?: string) => URL | null;
  };
  if (typeof urlCtor.parse !== "function") {
    urlCtor.parse = (input, base) => {
      try {
        return base === undefined ? new URL(input) : new URL(input, base);
      } catch {
        return null;
      }
    };
  }

  // A copy rather than a true detaching transfer. pdf.js only reads the result,
  // so the observable behaviour it depends on is preserved.
  const proto = ArrayBuffer.prototype as unknown as MaybeTransferable;
  const copyInto = function (this: ArrayBuffer, newLength?: number): ArrayBuffer {
    const size = newLength ?? this.byteLength;
    const out = new ArrayBuffer(size);
    new Uint8Array(out).set(new Uint8Array(this, 0, Math.min(size, this.byteLength)));
    return out;
  };
  if (typeof proto.transferToFixedLength !== "function") {
    proto.transferToFixedLength = copyInto;
  }
  if (typeof proto.transfer !== "function") {
    proto.transfer = copyInto;
  }
}

/**
 * Run heavy pdf.js work one job at a time, process-wide.
 *
 * Both rasterising a page and walking its text layer pull the document into the
 * heap (rasterising also spins up a native canvas). Two of those overlapping is
 * enough to push a small instance over its memory limit, and an OOM restart
 * reaches the browser as an HTML error page — which any `res.json()` caller
 * reports as a JSON parse error. The cost is latency, which is far cheaper.
 */
let pdfChain: Promise<unknown> = Promise.resolve();

export function queuePdfWork<T>(task: () => Promise<T>): Promise<T> {
  const run = pdfChain.then(task, task);
  // Keep the chain alive regardless of individual outcomes.
  pdfChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}
