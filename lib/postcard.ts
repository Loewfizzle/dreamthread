import type { Dream } from '@/lib/dreams';
import { parseDreamDate } from '@/lib/dream-utils';

// Renders a dream as a 1080x1350 (4:5) postcard image and shares it via
// the Web Share API, falling back to a plain download. Entirely
// client-side — nothing leaves the device unless the user shares it.

const W = 1080;
const H = 1350;

const COLORS = {
  bg: '#07090e',
  bgDeep: '#040507',
  text: '#e5e7ee',
  textSoft: '#a9afbe',
  textFaint: '#555a67',
  accent: '#7c6cf0',
  border: '#1f2532',
};

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    // Without CORS approval the canvas would be tainted and unexportable,
    // so a failed/opaque load just means "postcard without image".
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 8000);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = url;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().replace(/\s+/g, ' ').split(' ');
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word;
    if (ctx.measureText(attempt).width <= maxWidth) {
      line = attempt;
    } else {
      if (line) lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) {
        // Last allowed line: truncate with an ellipsis
        while (ctx.measureText(line + '…').width > maxWidth && line.length > 1) {
          line = line.slice(0, -1);
        }
        lines.push(line + '…');
        return lines;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCrescent(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.fillStyle = COLORS.textSoft;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx + r * 0.38, cy - r * 0.18, r * 0.88, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

async function renderPostcard(dream: Dream): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = COLORS.bgDeep;
  ctx.fillRect(0, 0, W, H);

  // Image panel (top ~55%), fading into the background
  let textTop = 300;
  const img = dream.image_url ? await loadImage(dream.image_url) : null;
  if (img) {
    const panelH = 740;
    const scale = Math.max(W / img.width, panelH / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (W - dw) / 2, (panelH - dh) / 2, dw, dh);

    const fade = ctx.createLinearGradient(0, panelH - 340, 0, panelH);
    fade.addColorStop(0, 'rgba(4,5,7,0)');
    fade.addColorStop(1, 'rgba(4,5,7,1)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, panelH - 340, W, 340);
    textTop = panelH + 10;
  } else {
    // No image: the crescent carries the top half
    drawCrescent(ctx, W / 2, 330, 150);
    const dot = ctx.createRadialGradient(W / 2 + 210, 170, 0, W / 2 + 210, 170, 16);
    dot.addColorStop(0, COLORS.accent);
    dot.addColorStop(1, 'rgba(124,108,240,0)');
    ctx.fillStyle = dot;
    ctx.fillRect(W / 2 + 180, 140, 60, 60);
    textTop = 600;
  }

  // Frame
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  const left = 96;
  const maxWidth = W - left * 2;
  let y = textTop;

  // Date + meta line
  const date = parseDreamDate(dream.dream_date)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase();
  const meta = [date, dream.mood?.toUpperCase(), dream.is_lucid ? 'LUCID' : null]
    .filter(Boolean)
    .join('  ·  ');
  ctx.fillStyle = COLORS.textFaint;
  ctx.font = '500 26px system-ui, -apple-system, sans-serif';
  ctx.fillText(meta, left, y);
  y += 78;

  // Title
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 62px system-ui, -apple-system, sans-serif';
  for (const line of wrapText(ctx, dream.title || 'Untitled dream', maxWidth, 2)) {
    ctx.fillText(line, left, y);
    y += 74;
  }
  y += 24;

  // Excerpt
  ctx.fillStyle = COLORS.textSoft;
  ctx.font = '400 34px system-ui, -apple-system, sans-serif';
  for (const line of wrapText(ctx, dream.content, maxWidth, 6)) {
    ctx.fillText(line, left, y);
    y += 52;
  }

  // Footer wordmark
  ctx.fillStyle = COLORS.textFaint;
  ctx.font = '500 26px system-ui, -apple-system, sans-serif';
  const label = 'DREAMTHREAD';
  ctx.save();
  const spaced = label.split('').join(String.fromCharCode(8202)); // hair spaces
  const lw = ctx.measureText(spaced).width;
  ctx.fillText(spaced, (W - lw) / 2 + 26, H - 84);
  ctx.restore();
  drawCrescent(ctx, (W - lw) / 2 - 16, H - 93, 15);

  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'));
}

export type PostcardResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

export async function sharePostcard(dream: Dream): Promise<PostcardResult> {
  let blob: Blob | null;
  try {
    blob = await renderPostcard(dream);
  } catch {
    return 'failed';
  }
  if (!blob) return 'failed';

  const file = new File([blob], 'dreamthread-postcard.png', { type: 'image/png' });

  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: dream.title || 'A dream' });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
      // fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dreamthread-postcard.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
