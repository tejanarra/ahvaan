const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 2400;
const MIN_QUALITY = 0.5;

// GIFs are never re-encoded here — canvas only ever captures one frame, so
// "compressing" an animated GIF would silently kill the animation. Every
// other allowed type (jpeg/png/webp) is a static photo, safe to redraw.
const COMPRESSIBLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

function drawToCanvas(bitmap: ImageBitmap, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

// Resizes/re-encodes an oversized image client-side rather than rejecting
// the upload outright — a guest-facing "your 8MB phone photo doesn't fit"
// error is a worse experience than us just quietly shrinking it to fit our
// own limit. Returns the original file untouched if it's already small
// enough or isn't a type we know how to safely re-encode.
export async function compressImageIfNeeded(file: File): Promise<File> {
  if (file.size <= MAX_BYTES || !COMPRESSIBLE_TYPES.has(file.type)) {
    return file;
  }

  const bitmap = await loadImageBitmap(file);
  let { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  let canvas = drawToCanvas(bitmap, width, height);
  let quality = 0.9;
  let blob = await canvasToBlob(canvas, quality);

  while (blob && blob.size > MAX_BYTES && quality > MIN_QUALITY) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, quality);
  }

  // Quality alone couldn't get it under the limit (very large source
  // dimensions) — shrink the pixel dimensions further and try again once.
  if (blob && blob.size > MAX_BYTES) {
    width = Math.round(width * 0.7);
    height = Math.round(height * 0.7);
    canvas = drawToCanvas(bitmap, width, height);
    blob = await canvasToBlob(canvas, MIN_QUALITY);
  }

  if (!blob) return file;

  const name = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}
