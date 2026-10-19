import { ShieldCheck } from 'lucide-react';

interface SiteIconProps {
  url: string | null;
  size: number;
}

export function SiteIcon({ url, size }: SiteIconProps) {
  return url
    ? <img src={url} alt="系统图标" width={size} height={size} style={{ width: size, height: size, objectFit: 'contain' }} />
    : <ShieldCheck size={size} />;
}
