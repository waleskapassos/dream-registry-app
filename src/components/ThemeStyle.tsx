import { useQuery } from "@tanstack/react-query";

import { settingsQuery } from "@/lib/wedding";

function isLight(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return true;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Applies the colors saved in the admin panel as CSS variables. */
export function ThemeStyle() {
  const { data: settings } = useQuery(settingsQuery);
  if (!settings) return null;

  const rules: string[] = [];

  if (HEX.test(settings.theme_primary)) {
    const fg = isLight(settings.theme_primary) ? "oklch(0.28 0.014 92)" : "oklch(0.985 0.008 92)";
    rules.push(
      `--primary:${settings.theme_primary};--ring:${settings.theme_primary};--gold:${settings.theme_primary};--primary-foreground:${fg};`,
    );
  }
  if (HEX.test(settings.theme_background)) {
    const fg = isLight(settings.theme_background) ? "oklch(0.33 0.014 92)" : "oklch(0.96 0.01 92)";
    rules.push(
      `--background:${settings.theme_background};--foreground:${fg};--card:color-mix(in oklab, ${settings.theme_background} 92%, white);--card-foreground:${fg};--secondary:color-mix(in oklab, ${settings.theme_background} 88%, black);--muted:color-mix(in oklab, ${settings.theme_background} 92%, black);`,
    );
  }
  if (HEX.test(settings.theme_accent)) {
    rules.push(`--accent:${settings.theme_accent};--sand:${settings.theme_accent};`);
  }

  if (rules.length === 0) return null;

  return <style dangerouslySetInnerHTML={{ __html: `:root{${rules.join("")}}` }} />;
}
