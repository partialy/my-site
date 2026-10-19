import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Dropdown,
  Avatar,
  Space,
  Button,
  Breadcrumb,
  Modal,
  Drawer,
  message,
  Alert,
  Spin,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  KeyRound,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
} from 'lucide-react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { SiteIcon } from '../components/SiteIcon';
import { useSiteSettings } from '../site-settings/SiteSettingsContext';
import { useMenus } from '../menus/MenuContext';
import { renderMenuIcon, sortedMenus } from '../menus/menuUtils';

const { Header, Sider, Content, Footer } = Layout;

export const AdminLayout: React.FC = () => {
  const { state, logout } = useAuth();
  const { settings } = useSiteSettings();
  const { items: menus, loading: menusLoading, error: menusError, reload: reloadMenus } = useMenus();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [openMenuKeys, setOpenMenuKeys] = useState<string[]>([]);

  // 监听窗口尺寸变化
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeMenu = menus.find((item) => item.type === 'route' && item.path === location.pathname);
  useEffect(() => {
    if (activeMenu?.parentKey) setOpenMenuKeys((previous) => previous.includes(activeMenu.parentKey!) ? previous : [...previous, activeMenu.parentKey!]);
  }, [activeMenu?.parentKey]);

  const adminName = state.admin?.username || '管理员';

  // 退出登录处理
  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出登录？',
      content: '退出将清除当前浏览器的会话 Token 并返回登录页。',
      okText: '确认退出',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        logout();
        message.info('已退出登录会话');
        navigate('/login', { replace: true });
      },
    });
  };

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{adminName}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            ID: {state.admin?.id ?? 1} · 系统管理员
          </div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'change-pwd',
      icon: <KeyRound size={16} />,
      label: '修改密码',
      onClick: () => setPasswordModalOpen(true),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      danger: true,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const menuItem = (item: typeof menus[number]): NonNullable<MenuProps['items']>[number] => ({
    key: item.key,
    icon: renderMenuIcon(item.icon),
    label: item.type === 'route' && item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
    onClick: item.type === 'action' ? () => {
      if (item.action === 'change-password') setPasswordModalOpen(true);
      else message.warning('此操作尚未接入管理端');
    } : undefined,
    ...(item.type === 'group' ? { children: sortedMenus(menus.filter((child) => child.parentKey === item.key && child.visible)).map(menuItem) } : {}),
  });

  const siderMenuItems: MenuProps['items'] = sortedMenus(menus.filter((item) => item.parentKey === null && item.visible))
    .map(menuItem);

  // 面包屑名称映射
  const getBreadcrumbs = () => {
    if (!activeMenu) return [{ title: '管理后台' }, { title: '当前页面' }];
    const parent = menus.find((item) => item.key === activeMenu.parentKey);
    return [{ title: '管理后台' }, ...(parent ? [{ title: parent.label }] : []), { title: activeMenu.label }];
  };

  const menuComponent = menusError ? <Alert type="error" message="菜单加载失败" description={menusError}
    action={<Button size="small" onClick={() => void reloadMenus()}>重试</Button>} style={{ margin: 12 }} /> : menusLoading && menus.length === 0
    ? <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div> : (
    <Menu
      theme="light"
      mode="inline"
      selectedKeys={activeMenu ? [activeMenu.key] : []}
      openKeys={openMenuKeys}
      onOpenChange={setOpenMenuKeys}
      items={siderMenuItems}
      style={{ borderRight: 0, marginTop: 8 }}
      onClick={() => {
        if (isMobile) setMobileDrawerOpen(false);
      }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 桌面端固定白色侧边栏 */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          trigger={null}
          width={230}
          collapsedWidth={70}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'sticky',
            top: 0,
            left: 0,
            zIndex: 101,
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
          }}
        >
          <div className="admin-sider-logo">
            <div className="admin-sider-logo-icon">
              <SiteIcon url={settings.admin.iconUrl} size={20} />
            </div>
            {!collapsed && (
              <span className="admin-sider-logo-text">{settings.admin.systemName}</span>
            )}
          </div>
          {menuComponent}
        </Sider>
      )}

      {/* 移动端白色抽屉侧边栏 */}
      {isMobile && (
        <Drawer
          placement="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          styles={{ body: { padding: 0, backgroundColor: '#ffffff' } }}
          width={240}
        >
          <div className="admin-sider-logo">
            <div className="admin-sider-logo-icon">
              <SiteIcon url={settings.admin.iconUrl} size={20} />
            </div>
            <span className="admin-sider-logo-text">{settings.admin.systemName}</span>
          </div>
          {menuComponent}
        </Drawer>
      )}

      <Layout style={{ minWidth: 0 }}>
        {/* 顶部 Header */}
        <Header className="admin-header">
          <Space size="middle">
            <Button
              type="text"
              icon={
                isMobile ? (
                  <PanelLeftOpen size={18} />
                ) : collapsed ? (
                  <PanelLeftOpen size={18} />
                ) : (
                  <PanelLeftClose size={18} />
                )
              }
              onClick={() => {
                if (isMobile) {
                  setMobileDrawerOpen(true);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
              }}
            />
            <Breadcrumb items={getBreadcrumbs()} />
          </Space>

          <Space size="middle">
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: 8,
                  transition: 'background 0.2s',
                }}
              >
                <Avatar
                  style={{
                    backgroundColor: '#2563eb',
                    verticalAlign: 'middle',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  icon={<User size={16} />}
                  size="default"
                />
                {!isMobile && (
                  <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>
                      {adminName}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>系统管理员</div>
                  </div>
                )}
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容主体 */}
        <Content className="admin-content-area">
          <Outlet />
        </Content>

        {/* 页脚 */}
        <Footer
          style={{
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: 13,
            backgroundColor: '#ffffff',
            borderTop: '1px solid #f1f5f9',
            padding: '14px 24px',
          }}
        >
          {settings.admin.systemName} © {new Date().getFullYear()} · 可复制的轻量管理端基础框架
        </Footer>
      </Layout>

      {/* 修改密码弹窗 */}
      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </Layout>
  );
};
