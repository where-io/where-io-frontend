export const TAG_PALETTE = [
  { name: 'Coral', value: '#FF6B5E' },
  { name: 'Aqua', value: '#4DE1C1' },
  { name: 'Violet', value: '#8B7CFF' },
  { name: 'Amber', value: '#FFB84D' },
  { name: 'Lime', value: '#7CFF6B' },
  { name: 'Sky', value: '#5EBBFF' },
] as const;

export function resolveTagHex(cor: string | undefined | null): string {
  if (cor == null || String(cor).trim() === '') return '#FF6B5E';
  const s = String(cor).trim();
  if (s.startsWith('#')) {
    const body = s.slice(1);
    if (body.length === 3 || body.length === 6) return `#${body}`;
    return s;
  }
  if (/^[\dA-Fa-f]{3}$|^[\dA-Fa-f]{6}$/i.test(s)) return `#${s}`;
  return '#FF6B5E';
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = resolveTagHex(hex);
  if (!normalized.startsWith('#')) return `rgba(255,255,255,${alpha})`;
  const clean = normalized.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  if (full.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
