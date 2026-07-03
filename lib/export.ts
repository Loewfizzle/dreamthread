import type { Dream } from '@/lib/dreams';
import { parseDreamDate } from '@/lib/dream-utils';

function toMarkdown(dreams: Dream[]): string {
  const lines: string[] = ['# Dreamthread journal', ''];
  const sorted = [...dreams].sort(
    (a, b) => parseDreamDate(b.dream_date).getTime() - parseDreamDate(a.dream_date).getTime()
  );

  sorted.forEach(d => {
    const date = parseDreamDate(d.dream_date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    lines.push(`## ${d.title || 'Untitled dream'}`);
    lines.push('');
    const meta = [
      date,
      d.mood ? `Mood: ${d.mood}` : null,
      d.is_lucid ? 'Lucid' : null,
      d.tags && d.tags.length > 0 ? `Tags: ${d.tags.join(', ')}` : null,
    ].filter(Boolean);
    lines.push(`*${meta.join(' · ')}*`);
    lines.push('');
    lines.push(d.content);
    lines.push('');
  });

  return lines.join('\n');
}

export function downloadExport(dreams: Dream[], format: 'markdown' | 'json'): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const [content, mime, ext] =
    format === 'json'
      ? [JSON.stringify(dreams, null, 2), 'application/json', 'json']
      : [toMarkdown(dreams), 'text/markdown', 'md'];

  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dreamthread-${stamp}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
