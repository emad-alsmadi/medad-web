/** How long a blob URL stays alive — long enough for a new tab or a download to pick it up. */
const REVOKE_AFTER_MS = 60_000;

/** Opens a fetched file (e.g. a PDF) in a new tab for preview/printing. */
export function openBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
}

/** Saves a fetched file under `filename`. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
}
