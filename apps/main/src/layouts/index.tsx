import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Layout, Menu } from "antd";
import type { MenuProps } from 'antd';

const { Sider, Content, Header } = Layout;

function Layouts() {
  const navigate = useNavigate();
  const location = useLocation();

  // 当路径以 /login 开头时，不展示主应用的左侧导航（登录页为独立子应用）
  const isShowMain = !location.pathname.startsWith("/login");
  const selectedKey = location.pathname?.split('/')[1] || '';



  const items: MenuProps['items'] = [
    { key: 'home', label: '首页' },
    { key: 'agent', label: '子应用[Agent]' },
    { key: 'blog', label: '子应用[Blog]' },
    { key: 'login', label: '登录' }
  ];

  const onMenuSelect: MenuProps['onSelect'] = ({ key }) => {
    if (key === 'home') navigate('/home');
    else if (key === 'login') navigate('/login');
    else navigate('/' + key);
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {isShowMain && (
        <Sider width={220} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
          <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>主应用</div>
          <Menu mode="inline" selectedKeys={[selectedKey]} items={items} onSelect={onMenuSelect} />
        </Sider>
      )}

      <Layout>
        {isShowMain && <Header style={{ background: '#fff', padding: '0 16px', height: 64 }}>欢迎来到主应用</Header>}
        <Content style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
          {isShowMain && <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}><Outlet /></div>}

          <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <div id='sub-app' style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default Layouts;
