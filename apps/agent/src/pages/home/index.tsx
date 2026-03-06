import React, { useEffect, useRef, useState } from 'react';
import { Input, Button, Card, Space, Typography, Avatar } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import Markdown from '@ant-design/x-markdown';

const { TextArea } = Input;
const { Title } = Typography;

type Msg = { role: 'user' | 'assistant'; content: string; id: string };

function Home() {
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function send() {
    const content = value.trim();
    if (!content) return;
    const userMsg: Msg = { role: 'user', content, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setValue('');
    setLoading(true);

    // 模拟 AI 响应（这里可以替换为真实 API 调用）
    setTimeout(() => {
      const answer = `**模拟回答：**\n\n你问的是：\n> ${content}\n\n我目前是本地模拟回复，若需要接入真实 AI，请在 agent 中调用后端或第三方 API。`;
      const assistantMsg: Msg = { role: 'assistant', content: answer, id: Date.now().toString() + '_a' };
      setMessages(prev => [...prev, assistantMsg]);
      setLoading(false);
    }, 900);
  }
  useEffect(() => {
    // auto-scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 980 }}>
        <Title level={2}>AI 问答</Title>

        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <TextArea rows={4} value={value} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)} placeholder="请输入你的问题，例如：如何进行前端性能优化？" />
            <div style={{ textAlign: 'right' }}>
              <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={send}>发送</Button>
            </div>
          </Space>
        </Card>

        <div
          ref={scrollRef}
          style={{
            height: 480,
            overflow: 'auto',
            padding: '12px 8px',
            background: '#fafafa',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.04)'
          }}
        >
          {messages.map((item) => {
            const isUser = item.role === 'user';
            return (
              <div key={item.id} style={{ display: 'flex', marginBottom: 12, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                {!isUser && (
                  <div style={{ marginRight: 8 }}>
                    <Avatar size={36} icon={<RobotOutlined />} />
                  </div>
                )}

                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  <div
                    style={{
                      background: isUser ? '#0050b3' : '#fff',
                      color: isUser ? '#fff' : '#222',
                      padding: '10px 14px',
                      borderRadius: 18,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word'
                    }}
                  >
                    {item.role === 'assistant' ? <Markdown>{item.content}</Markdown> : <div>{item.content}</div>}
                  </div>
                </div>

                {isUser && (
                  <div style={{ marginLeft: 8 }}>
                    <Avatar size={36} icon={<UserOutlined />} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Home;
