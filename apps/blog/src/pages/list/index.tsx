import { useNavigate } from "react-router-dom";
import { posts } from '@/data/posts';
import { Card, Typography, List as AntList, Button } from 'antd';
import { ArrowRightOutlined, BookOutlined } from '@ant-design/icons';
import type { Post } from '@/data/posts';

const { Title, Paragraph, Link: TyLink } = Typography;

function List() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 980 }}>
        <Title level={2} style={{ marginBottom: 24 }}>博客列表</Title>

        <AntList
          dataSource={posts}
          renderItem={(p: Post) => (
            <AntList.Item style={{ padding: 0, border: 'none' }}>
              <Card size="default" style={{ width: '100%', borderRadius: 8 }}>
                <div>
                  <TyLink onClick={() => navigate(`/blog/detail/${p.id}`)} style={{ color: '#1677ff', fontSize: 18, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                    <BookOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    {p.title}
                  </TyLink>
                </div>
                <Paragraph style={{ margin: '8px 0 0', color: '#6b6b6b' }}>{p.summary}</Paragraph>
                <div style={{ marginTop: 12 }}>
                  <Button type="link" onClick={() => navigate(`/blog/detail/${p.id}`)} icon={<ArrowRightOutlined />}>
                    查看详情
                  </Button>
                </div>
              </Card>
            </AntList.Item>
          )}
        />
      </div>
    </div>
  );
}

export default List;
