/* ======================================================
   Ganit Calculator — Share Card Generator
   Canvas-based share image with brand watermark
   Calculator ~ by Ganit Technology | Dhurta Organisation
   ====================================================== */

import { BRAND } from './brand.js';

export async function generateShareCard({ expression, result, tool = 'Calculator', theme = {} }) {
  const W = 1200, H = 630;
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const bg      = theme.bg      ?? '#0F172A';
  const surface = theme.surface ?? '#1E293B';
  const primary = theme.primary ?? '#4F46E5';
  const accent  = theme.accent  ?? '#F59E0B';
  const text     = theme.text    ?? '#E2E8F0';
  const muted    = theme.muted   ?? '#94A3B8';

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Top accent bar
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, W, 6);

  // Surface card
  roundRect(ctx, 60, 80, W - 120, H - 160, 20);
  ctx.fillStyle = surface;
  ctx.fill();

  // Brand top-left
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillStyle = primary;
  ctx.fillText('Calculator', 100, 150);
  ctx.font = '16px system-ui';
  ctx.fillStyle = muted;
  ctx.fillText('by Ganit Technology · Powered by Dhurta Organisation', 100, 175);

  // Divider
  ctx.strokeStyle = primary + '55';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(100, 195); ctx.lineTo(W - 100, 195); ctx.stroke();

  // Tool name
  ctx.font = '500 18px system-ui';
  ctx.fillStyle = accent;
  ctx.fillText(tool, 100, 235);

  // Expression
  if (expression) {
    ctx.font = '300 26px Courier New, monospace';
    ctx.fillStyle = muted;
    ctx.fillText(truncate(expression, 60), 100, 290);
  }

  // Result
  const resultStr = String(result ?? '');
  const fontSize = resultStr.length > 20 ? 48 : resultStr.length > 10 ? 64 : 80;
  ctx.font = `bold ${fontSize}px Courier New, monospace`;
  ctx.fillStyle = text;
  ctx.fillText(truncate(resultStr, 25), 100, 380);

  // Bottom: version + url
  ctx.font = '14px system-ui';
  ctx.fillStyle = muted;
  ctx.fillText(`v${BRAND.version}  ·  ${BRAND.links.app}`, 100, H - 100);

  // Circle brand mark top-right
  ctx.beginPath();
  ctx.arc(W - 120, 140, 40, 0, Math.PI * 2);
  ctx.strokeStyle = primary;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = '36px Georgia, serif';
  ctx.fillStyle = primary;
  ctx.textAlign = 'center';
  ctx.fillText('π', W - 120, 152);
  ctx.textAlign = 'left';

  return canvas;
}

export function downloadShareCard(canvas, filename = 'ganit-share.png') {
  const url = canvas.toDataURL('image/png');
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
}

export async function shareCard(canvas, title = 'Calculator ~ by Ganit Technology') {
  if (!navigator.share || !navigator.canShare) return downloadShareCard(canvas);
  canvas.toBlob(async blob => {
    const file = new File([blob], 'ganit-share.png', { type: 'image/png' });
    try {
      await navigator.share({ title, files: [file] });
    } catch {
      downloadShareCard(canvas);
    }
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}
