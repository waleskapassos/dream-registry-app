export function getYouTubeVideoId(value: string): string | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = url.pathname.split("/")[1] ?? "";
    if (host === "youtube.com" || host === "m.youtube.com") {
      id = url.searchParams.get("v") ?? "";
      if (!id && (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/"))) {
        id = url.pathname.split("/")[2] ?? "";
      }
    }
    return /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
