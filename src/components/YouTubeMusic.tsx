import { useQuery } from "@tanstack/react-query";

import { settingsQuery } from "@/lib/wedding";
import { getYouTubeVideoId } from "@/lib/youtube";

export function YouTubeMusic() {
  const { data: settings } = useQuery(settingsQuery);
  const videoId = getYouTubeVideoId(settings?.youtube_music_url ?? "");

  if (!videoId) return null;

  return (
    <iframe
      title="Nossa música no YouTube"
      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&playsinline=1`}
      width="1"
      height="1"
      className="pointer-events-none fixed -left-[9999px] size-px border-0 opacity-0"
      allow="autoplay; encrypted-media"
      referrerPolicy="strict-origin-when-cross-origin"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
