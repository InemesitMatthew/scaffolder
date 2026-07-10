export type TemplateVars = Record<string, string | number>;

/** Strip trailing `.tmpl` so `foo.dart.tmpl` → `foo.dart` (multi-lang safe). */
export function stripTmplExtension(relPath: string): string {
  return relPath.replace(/\.tmpl$/i, '');
}

/** Replace {{key}} placeholders. Keys are matched case-sensitively. */
export function renderTemplate(content: string, vars: TemplateVars): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in vars)) {
      return `{{${key}}}`;
    }
    return String(vars[key]);
  });
}

export function toPackageName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^([0-9])/, '_$1');
}

export function toAppClassName(packageName: string): string {
  const parts = packageName.split('_').filter(Boolean);
  const pascal = parts.map((p) => p[0]!.toUpperCase() + p.slice(1)).join('');
  return pascal.endsWith('App') ? pascal : `${pascal}App`;
}

export function toAppTitle(packageName: string): string {
  return packageName
    .split('_')
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join(' ');
}

/** Normalize hex like FF002F06 / 0xFF002F06 / #002F06 → 0xff002f06.
 *  Returns empty string when invalid (callers should throw).
 */
export function normalizeDartColor(input: string, fallback: string): string {
  let raw = input.trim().replace(/^#/, '');
  if (raw.toLowerCase().startsWith('0x')) {
    raw = raw.slice(2);
  }
  raw = raw.replace(/[^0-9a-fA-F]/g, '');
  if (raw.length === 6) {
    raw = `ff${raw}`;
  }
  if (raw.length !== 8) {
    return fallback;
  }
  return `0x${raw.toLowerCase()}`;
}

export function darkenPrimary(primary: string): string {
  // primary is 0xffrrggbb — nudge green channel slightly for basePrimary default
  const hex = primary.replace(/^0x/i, '');
  if (hex.length !== 8) return primary;
  const r = parseInt(hex.slice(2, 4), 16);
  const g = Math.min(255, parseInt(hex.slice(4, 6), 16) + 18);
  const b = parseInt(hex.slice(6, 8), 16);
  const to = (n: number) => n.toString(16).padStart(2, '0');
  return `0x${hex.slice(0, 2)}${to(r)}${to(g)}${to(b)}`;
}
