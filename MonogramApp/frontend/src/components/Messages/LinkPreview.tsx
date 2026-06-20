import React, { useEffect, useState } from 'react';

interface LinkMeta {
  title: string;
  description: string;
  image: string;
  siteName: string;
}

export const LinkPreview: React.FC<{ url: string }> = ({ url }) => {
  const [meta, setMeta] = useState<LinkMeta | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchMeta = async () => {
      try {
        const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (mounted && data.status === 'success') {
          setMeta({
            title: data.data.title || url,
            description: data.data.description || '',
            image: data.data.image?.url || '',
            siteName: data.data.logo?.url || new URL(url).hostname,
          });
        }
      } catch {
        if (mounted) setError(true);
      }
    };
    fetchMeta();
    return () => { mounted = false; };
  }, [url]);

  if (error || !meta) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="link-preview" onClick={e => e.stopPropagation()}>
      {meta.image && (
        <div className="link-preview-image">
          <img src={meta.image} alt="" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
      <div className="link-preview-body">
        <span className="link-preview-site">{meta.siteName}</span>
        <span className="link-preview-title">{meta.title}</span>
        {meta.description && <span className="link-preview-desc">{meta.description.slice(0, 100)}</span>}
      </div>
    </a>
  );
};
