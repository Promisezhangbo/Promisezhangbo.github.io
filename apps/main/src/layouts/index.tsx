import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Layout, Menu } from "antd";
import { useEffect, useState } from "react";
const { Content, Header } = Layout;
function Layouts() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentMenu, setCurrentMenu] = useState<string>('home');
  // 当路径以 /login 开头时，不展示主应用的左侧导航（登录页为独立子应用）
  const isShowMain = !['login'].includes(currentMenu);
  const items = [
    { value: 'home', label: '首页', key: 'home' },
    { value: 'agent', label: '子应用[Agent]', key: 'agent' },
    { value: 'blog', label: '子应用[Blog]', key: 'blog' },
    { value: 'login', label: '登录', key: 'login' }
  ];
  useEffect(() => {
    const currantApp = location.pathname?.split('/')[1] || 'home';
    setCurrentMenu(currantApp);
  }, [location.pathname])
  const onMenuSelect = (key: string) => {
    if (key) {
      setCurrentMenu(key);
      if (key === 'home') navigate('/home');
      else if (key === 'login') navigate('/login');
      else navigate('/' + key);
    }
  };
  return (
    <Layout>
      {isShowMain && (
        <Header style={{ background: '#fff' }}>
          <Menu
            mode="horizontal"
            selectedKeys={[currentMenu]}
            items={items}
            style={{ flex: 1, minWidth: 0 }}
            onSelect={(e) => onMenuSelect(e.key)}
          />
        </Header>
      )}
      <Content >
        <Outlet />
        <div id='sub-app' />
      </Content>
    </Layout>
  );
}
export default Layouts;
