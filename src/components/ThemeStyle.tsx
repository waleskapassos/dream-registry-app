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
const FONTS = {
  elegant: '"Cormorant Garamond", Georgia, serif',
  "great-vibes": '"Great Vibes", cursive',
  "dancing-script": '"Dancing Script", cursive',
  playfair: '"Playfair Display", Georgia, serif',
  lora: "Lora, Georgia, serif",
  "libre-baskerville": '"Libre Baskerville", Georgia, serif',
  classic: 'Georgia, "Times New Roman", serif',
  modern: "Karla, ui-sans-serif, system-ui, sans-serif",
  montserrat: "Montserrat, ui-sans-serif, system-ui, sans-serif",
  poppins: "Poppins, ui-sans-serif, system-ui, sans-serif",
  roboto: "Roboto, ui-sans-serif, system-ui, sans-serif",
  "open-sans": '"Open Sans", ui-sans-serif, system-ui, sans-serif',
} as const;

/** Applies the colors saved in the admin panel as CSS variables. */
export function ThemeStyle() {
  const { data: settings } = useQuery(settingsQuery);
  if (!settings) return null;

  const rules: string[] = [];
  const overlayOpacity = Math.min(100, Math.max(0, settings.hero_overlay_opacity));
  rules.push(`--hero-overlay-opacity:${overlayOpacity}%;`);
  rules.push(
    `--font-display:${FONTS[settings.font_heading as keyof typeof FONTS] ?? FONTS.elegant};--font-sans:${FONTS[settings.font_body as keyof typeof FONTS] ?? FONTS.modern};--heading-font-weight:${settings.font_heading_weight === 700 ? 700 : 300};--body-font-weight:${settings.font_body_weight === 700 ? 700 : 400};--heading-font-style:${settings.font_heading_style === "italic" ? "italic" : "normal"};--body-font-style:${settings.font_body_style === "italic" ? "italic" : "normal"};`,
  );

  const typography = settings.typography_styles;
  const typographyRules = Object.entries(typography)
    .map(([key, style]) => {
      const font = FONTS[style.font] ?? FONTS.modern;
      const color = HEX.test(style.color) ? style.color : "inherit";
      return `--type-${key}-font:${font};--type-${key}-color:${color};--type-${key}-size:${style.size}px;--type-${key}-weight:${style.bold ? 700 : 400};--type-${key}-style:${style.italic ? "italic" : "normal"};`;
    })
    .join("");
  rules.push(typographyRules);

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
  if (HEX.test(settings.theme_text)) {
    rules.push(
      `--foreground:${settings.theme_text};--card-foreground:${settings.theme_text};--popover-foreground:${settings.theme_text};--secondary-foreground:${settings.theme_text};--accent-foreground:${settings.theme_text};--muted-foreground:color-mix(in oklab, ${settings.theme_text} 72%, var(--background));`,
    );
  }

  if (rules.length === 0) return null;

  return <style dangerouslySetInnerHTML={{ __html: `:root{${rules.join("")}}` }} />;
}
