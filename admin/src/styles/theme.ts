import type { ThemeConfig } from 'antd';

export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: '#2563eb', // 沉稳现代的靛青蓝
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    borderRadius: 8,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    colorBgBase: '#ffffff',
    colorTextBase: '#1e293b',
    colorBorderSecondary: '#f1f5f9',
    boxShadow:
      '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  },
  components: {
    Button: {
      controlHeight: 38,
      borderRadius: 8,
      fontWeight: 500,
    },
    Input: {
      controlHeight: 40,
      borderRadius: 8,
    },
    Card: {
      borderRadiusLG: 12,
      boxShadowTertiary:
        '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    },
    Layout: {
      headerBg: '#ffffff',
      bodyBg: '#f8fafc',
      siderBg: '#ffffff',
    },
    Menu: {
      itemBg: '#ffffff',
      itemSelectedBg: '#eff6ff',
      itemSelectedColor: '#2563eb',
      itemHoverBg: '#f8fafc',
      itemHoverColor: '#1d4ed8',
      itemBorderRadius: 8,
      itemMarginInline: 12,
    },
  },
};
