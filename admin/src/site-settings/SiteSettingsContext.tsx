import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { defaultSiteSettings, getSiteSettings } from '../api/siteSettings';
import type { SiteSettings } from '../api/siteSettings';

interface SiteSettingsContextValue {
  settings: SiteSettings;
  setSettings: (settings: SiteSettings) => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

function syncBrowserIdentity(settings: SiteSettings): void {
  document.title = settings.admin.siteTitle;
  let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!settings.admin.iconUrl) {
    icon?.remove();
    return;
  }
  if (!icon) {
    icon = document.createElement('link');
    icon.rel = 'icon';
    document.head.appendChild(icon);
  }
  icon.href = settings.admin.iconUrl;
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => {
    let active = true;
    void getSiteSettings().then((result) => {
      if (active && result.success) setSettings(result.data);
    }).catch(() => {
      // 后端不可用时保留基础框架默认名称，认证层会显示连接错误。
    });
    return () => { active = false; };
  }, []);

  useEffect(() => { syncBrowserIdentity(settings); }, [settings]);

  return <SiteSettingsContext.Provider value={{ settings, setSettings }}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettingsContextValue {
  const value = useContext(SiteSettingsContext);
  if (!value) throw new Error('SiteSettingsProvider 未挂载');
  return value;
}
