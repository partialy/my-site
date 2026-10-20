import { Col, Form, Input, Row, Typography } from 'antd';
import type { FormInstance } from 'antd';
import { Building2 } from 'lucide-react';

export interface SetupFormValues {
  projectName: string;
  siteSettings: {
    admin: { siteTitle: string; systemName: string };
    client: { siteTitle: string; systemName: string };
  };
  username: string;
  password: string;
  confirmPassword: string;
  setupKey: string;
}

export function SetupProjectFields({ form }: { form: FormInstance<SetupFormValues> }) {
  const fillNames = () => {
    const name = form.getFieldValue('projectName')?.trim();
    if (!name) return;
    const current = form.getFieldValue('siteSettings') as SetupFormValues['siteSettings'] | undefined;
    form.setFieldsValue({ siteSettings: {
      admin: {
        siteTitle: current?.admin?.siteTitle || `${name} 管理后台`,
        systemName: current?.admin?.systemName || `${name}管理系统`,
      },
      client: {
        siteTitle: current?.client?.siteTitle || name,
        systemName: current?.client?.systemName || name,
      },
    } });
  };

  return <section className="setup-project-section">
    <div className="setup-section-heading"><Building2 size={17} /><span>项目信息</span></div>
    <Form.Item label="项目名称" name="projectName" rules={[{ required: true, whitespace: true, message: '请输入项目名称' }]}>
      <Input maxLength={100} placeholder="例如：我的项目" onBlur={fillNames} />
    </Form.Item>
    <Typography.Text type="secondary" className="setup-section-hint">站点名称会在填写项目名称后自动补齐，也可以分别修改。</Typography.Text>
    <Row gutter={[12, 0]}>
      <Col xs={24} sm={12}>
        <div className="setup-site-heading">管理后台</div>
        <Form.Item label="浏览器标签名称" name={['siteSettings', 'admin', 'siteTitle']}
          rules={[{ required: true, whitespace: true, message: '请输入后台标签名称' }]}>
          <Input maxLength={100} placeholder="显示在浏览器标签上" />
        </Form.Item>
        <Form.Item label="系统名称" name={['siteSettings', 'admin', 'systemName']}
          rules={[{ required: true, whitespace: true, message: '请输入后台系统名称' }]}>
          <Input maxLength={100} placeholder="显示在登录页和侧栏" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <div className="setup-site-heading">前台项目</div>
        <Form.Item label="浏览器标签名称" name={['siteSettings', 'client', 'siteTitle']}
          rules={[{ required: true, whitespace: true, message: '请输入前台标签名称' }]}>
          <Input maxLength={100} placeholder="供后续 client 使用" />
        </Form.Item>
        <Form.Item label="系统名称" name={['siteSettings', 'client', 'systemName']}
          rules={[{ required: true, whitespace: true, message: '请输入前台系统名称' }]}>
          <Input maxLength={100} placeholder="供后续 client 使用" />
        </Form.Item>
      </Col>
    </Row>
  </section>;
}
