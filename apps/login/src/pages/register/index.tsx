import { message, Row, Card, Typography, Flex, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { ProForm, ProFormText, type ProFormInstance } from '@ant-design/pro-components';
import { useRef } from "react";

function Register() {
  const navigate = useNavigate();
  const formRef = useRef<ProFormInstance>(null);

  const onFinish = async (_values: Record<string, unknown>) => {
    const hide = message.loading({ content: '正在注册...', key: 'register' });
    try {
      await new Promise((res) => setTimeout(res, 800));
      hide();
      message.success({ content: '注册成功，请登录', key: 'register' });
      navigate('/login/singin');
    } catch {
      hide();
      message.error('注册失败');
    }
  };

  return (
    <Row justify="center" align="middle" style={{ height: '80vh' }}>
      <Card style={{ width: 420, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.09)', borderRadius: 8 }}>
        <Typography.Title level={4} style={{ textAlign: 'center', marginBottom: 16 }}>注册新账号</Typography.Title>
        <ProForm onFinish={onFinish} formRef={formRef} submitter={{ searchConfig: { submitText: '注册' }, resetButtonProps: { style: { display: 'none' } }, submitButtonProps: { style: { width: '100%' } } }}>
          <ProFormText name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]} />
          <ProFormText name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入正确的邮箱' }]} />
          <ProFormText name="password" label="密码" fieldProps={{ type: 'password' }} rules={[{ required: true, message: '请输入密码' }]} />
          <ProFormText name="confirm" label="确认密码" fieldProps={{ type: 'password' }} rules={[{ required: true, message: '请再次输入密码' }, ({ getFieldValue }) => ({
            validator(_, value?: string) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致'));
            }
          })]} />
          <Flex justify="space-between" style={{ marginBottom: 8 }}>
            <Button onClick={() => formRef.current?.resetFields()}>重置</Button>
            <Button type="link" onClick={() => navigate('/login/singin')}>已有账号？立即登录</Button>
          </Flex>
        </ProForm>
      </Card>
    </Row>
  );
}

export default Register;
