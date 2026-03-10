import { Card, Typography, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

const apps = [
  { key: 'agent', title: 'Agent 子应用', description: '演示第一个子应用' },
  { key: 'blog', title: 'Blog 子应用', description: '演示博客子应用' },
  { key: 'login', title: 'Login 子应用', description: '演示登录/注册子应用' }
];

function Home() {
  const navigate = useNavigate();

  return (
    <Card>
      <Typography.Title level={4}>父应用控制台</Typography.Title>
      <Typography.Title level={5}>子应用列表</Typography.Title>
      <Space size={12}>

        {apps.map(app => (

          <Button type="primary" key={app.key} onClick={() => navigate('/' + app.key)}>
            {app.title}
          </Button>

        ))}
      </Space>

    </Card>
  );
}

export default Home;
