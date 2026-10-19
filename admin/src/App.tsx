import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { RouterProvider } from 'react-router-dom';
import { adminTheme } from './styles/theme';
import { AuthProvider } from './auth';
import { router } from './router';
import { SiteSettingsProvider } from './site-settings/SiteSettingsContext';
import { MenuProvider } from './menus/MenuContext';

// 配置 dayjs 中文语言
dayjs.locale('zh-cn');

export const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN} theme={adminTheme}>
      <AntdApp>
        <SiteSettingsProvider>
          <AuthProvider>
            <MenuProvider>
              <RouterProvider router={router} />
            </MenuProvider>
          </AuthProvider>
        </SiteSettingsProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
