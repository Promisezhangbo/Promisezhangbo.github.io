import reactLogo from "@/assets/react.svg";
import { useNavigate } from "react-router-dom";
import { message, Row, Card, Typography, Image, Button, Flex } from "antd";
import { ProForm, ProFormText, ProFormCheckbox } from '@ant-design/pro-components';

function Singin() {
  const navigate = useNavigate();

  const onFinish = async (_values: Record<string, unknown>) => {
    const hide = message.loading({ content: '正在登录...', key: 'login' });
    try {
      // 模拟请求
      await new Promise((res) => setTimeout(res, 800));
      hide();
      message.success({ content: '登录成功', key: 'login' });
      // 登录成功后跳转到主应用首页（根据你的路由调整）
      navigate('/home');
    } catch {
      hide();
      message.error('登录失败');
    }
  };

  return (
    <Row justify="center" align="middle" style={{ height: '80vh' }}>
      <Card style={{ width: 360, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
        <Flex vertical gap={12} align="center">
          <Image src={reactLogo} alt="logo" width={64} preview={false} />
          <Typography.Title level={4} style={{ marginTop: 8 }}>欢迎登录</Typography.Title>
        </Flex>

        <ProForm
          onFinish={onFinish}
          initialValues={{ remember: true }}
          submitter={{ searchConfig: { submitText: '登录' }, submitButtonProps: { style: { width: '100%' } } }}
        >
          <ProFormText
            name="username"
            label="用户名"
            placeholder="用户名或邮箱"
            rules={[{ required: true, message: '请输入用户名' }]}
          />

          <ProFormText
            name="password"
            label="密码"
            placeholder="密码"
            fieldProps={{ type: 'password' }}
            rules={[{ required: true, message: '请输入密码' }]}
          />

          <Flex justify="space-between" align="center" style={{ marginBlock: 8 }}>
            <ProFormCheckbox name="remember" noStyle>记住我</ProFormCheckbox>
            <Button type="link" onClick={() => navigate('/login/register')}>注册账号</Button>
          </Flex>
        </ProForm>
      </Card>
    </Row>
  );
}

export default Singin;
