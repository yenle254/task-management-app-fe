import { useEffect, useState } from 'react';
import { getPreviewUrl, releasePreview } from '../services/fileService';
import { subscribeTokenChanged } from '../services/tokenManager';
export const usePrivatePreviews = attachments => {
  const [urls, setUrls] = useState({});
  const key = JSON.stringify((Array.isArray(attachments) ? attachments : []).map(item => item.url).filter(Boolean));
  useEffect(() => {
    let active = true;
    const resolved = {};
    const loading = new Set();
    const load = async () => {
      await Promise.all(JSON.parse(key).map(async url => {
        if (resolved[url] || loading.has(url)) return;
        loading.add(url);
        try {
          const preview = await getPreviewUrl(url);
          if (active) { resolved[url] = preview; setUrls({ ...resolved }); }
          else await releasePreview(preview);
        } catch { /* Retry unresolved previews after connectivity/authentication recovers. */ }
        finally { loading.delete(url); }
      }));
    };
    setUrls({});
    load();
    const unsubscribe = subscribeTokenChanged(load);
    return () => { active = false; unsubscribe(); Object.values(resolved).forEach(uri => { releasePreview(uri); }); };
  }, [key]);
  return urls;
};
