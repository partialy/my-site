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
} from 'antd';
import type { MenuProps } from 'antd';
import {
  LayoutDashboard,
  KeyRound,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Settings2,
  List,
  FileText,
  FolderOpen,
} from 'lucide-react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { SiteIcon } from '../components/SiteIcon';
import { useSiteSettings } from '../site-settings/SiteSettingsContext';

const { Header, Sider, Content, Footer } = Layout;

export const AdminLayout: React.FC = () => {
  const { state, logout } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

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

  // 侧边栏导航项
  const siderMenuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <LayoutDashboard size={18} />,
      label: <Link to="/">控制台首页</Link>,
    },
    {
      key: '/system-config',
      icon: <Settings2 size={18} />,
      label: <Link to="/system-config">系统管理</Link>,
    },
    {
      key: '/configs',
      icon: <List size={18} />,
      label: <Link to="/configs">配置管理</Link>,
    },
    {
      key: '/request-logs',
      icon: <FileText size={18} />,
      label: <Link to="/request-logs">请求日志</Link>,
    },
    {
      key: '/files',
      icon: <FolderOpen size={18} />,
      label: <Link to="/files">文件管理</Link>,
    },
    {
      key: 'pwd-action',
      icon: <KeyRound size={18} />,
      label: '修改密码',
      onClick: () => {
        if (isMobile) setMobileDrawerOpen(false);
        setPasswordModalOpen(true);
      },
    },
  ];

  // 面包屑名称映射
  const getBreadcrumbs = () => {
    if (location.pathname === '/') {
      return [{ title: '管理后台' }, { title: '控制台首页' }];
    }
    if (location.pathname === '/system-config') {
      return [{ title: '管理后台' }, { title: '系统管理' }];
    }
    if (location.pathname === '/configs') {
      return [{ title: '管理后台' }, { title: '配置管理' }];
    }
    if (location.pathname === '/request-logs') {
      return [{ title: '管理后台' }, { title: '请求日志' }];
    }
    if (location.pathname === '/files') {
      return [{ title: '管理后台' }, { title: '文件管理' }];
    }
    return [{ title: '管理后台' }, { title: '当前页面' }];
  };

  const menuComponent = (
    <Menu
      theme="light"
      mode="inline"
      selectedKeys={[location.pathname]}
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
