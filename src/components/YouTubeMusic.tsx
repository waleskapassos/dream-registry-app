import { useQuery } from "@tanstack/react-query";
import { Music2, Pause, Play, X } from "lucide-react";
import { useState } from "react";

import { settingsQuery } from "@/lib/wedding";
import { useCart } from "@/lib/cart";
import { getYouTubeVideoId } from "@/lib/youtube";

export function YouTubeMusic() {
  const { data: settings } = useQuery(settingsQuery);
  const { count } = useCart();
  const [playing, setPlaying] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const videoId = getYouTubeVideoId(settings?.youtube_music_url ?? "");

  if (!videoId || dismissed) return null;

  if (!playing) {
    return (
      <div
        className={`fixed right-5 z-40 flex items-center gap-2 transition-[bottom] ${count > 0 ? "bottom-24" : "bottom-5"}`}
      >
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Ocultar música"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-[var(--shadow-button)] backdrop-blur"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="flex min-h-12 items-center gap-3 rounded-full border-2 border-primary bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-lift)] transition-transform hover:scale-105"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary-foreground/15">
            <Play className="size-4 fill-current" aria-hidden="true" />
          </span>
          Ouvir nossa música
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`fixed right-5 z-40 w-[min(260px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-lift)] transition-[bottom] ${count > 0 ? "bottom-24" : "bottom-5"}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Music2 className="size-4 text-primary" aria-hidden="true" />
          Nossa música
        </span>
        <button
          type="button"
          onClick={() => setPlaying(false)}
          className="flex size-9 items-center justify-center rounded-full border border-border bg-background"
          aria-label="Pausar música"
        >
          <Pause className="size-4" aria-hidden="true" />
        </button>
      </div>
      <iframe
        title="Nossa música no YouTube"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&playsinline=1`}
        width="236"
        height="200"
        className="w-full rounded-xl border-0"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </aside>
  );
}
