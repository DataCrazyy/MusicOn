export type ShareResult = 'shared' | 'copied' | 'error';

export async function shareLink(data: { title: string; text: string; url: string }): Promise<ShareResult> {
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };

  if (nav.share) {
    try {
      await nav.share(data);
      return 'shared';
    } catch {
      // el usuario canceló el share nativo o falló — probamos copiar el link igual
    }
  }

  try {
    await navigator.clipboard.writeText(data.url);
    return 'copied';
  } catch {
    return 'error';
  }
}
