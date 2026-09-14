/**
 * Convierte links normales de Spotify/YouTube en URLs embebibles.
 * Devuelve null si el link no matchea un patrón conocido.
 */

export function toSpotifyEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    if (!u.hostname.includes('spotify.com')) return null;
    // /track/ID, /album/ID, /artist/ID, /playlist/ID, /episode/ID, /show/ID
    const match = u.pathname.match(/\/(track|album|artist|playlist|episode|show)\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  } catch {
    return null;
  }
}

export function spotifyEmbedHeight(url: string): number {
  return /\/(track|episode)\//.test(url) ? 152 : 352;
}

export function toYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    let videoId: string | null = null;

    if (u.hostname.includes('youtu.be')) {
      videoId = u.pathname.slice(1);
    } else if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') {
        videoId = u.searchParams.get('v');
      } else if (u.pathname.startsWith('/embed/')) {
        videoId = u.pathname.replace('/embed/', '');
      } else if (u.pathname.startsWith('/shorts/')) {
        videoId = u.pathname.replace('/shorts/', '');
      }
    }

    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}
