import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  return (
    <div>
      "父应用首页"
      <button onClick={() => navigate("/agent")}>子应用1 Home</button>
      <button onClick={() => navigate("/blog")}>子应用2 Home</button>
      <button onClick={() => navigate("/singin")}>去登录页</button>
    </div>
  );
}

export default Home;
