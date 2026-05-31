import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, theme, Spin } from 'antd'
import {
  DashboardOutlined,
  MonitorOutlined,
  UserOutlined,
  PhoneOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SoundOutlined,
  LogoutOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import request from '../api/request'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/agent-monitor', icon: <MonitorOutlined />, label: '坐席监控' },
  { key: '/agent-monitor-2', icon: <TeamOutlined />, label: '坐席监控2' },
  { key: '/customers', icon: <UserOutlined />, label: '客户资料' },
  { key: '/call-popup', icon: <PhoneOutlined />, label: '来电弹屏' },
  { key: '/task-manage', icon: <UnorderedListOutlined />, label: '任务管理' },
  { key: '/cdr/calls', icon: <FileTextOutlined />, label: '通话清单' },
  { key: '/cdr/records', icon: <SoundOutlined />, label: '录音清单' },
  {
    key: 'report',
    icon: <BarChartOutlined />,
    label: '报表管理',
    children: [
      { key: '/report/traffic', label: '话务报表' },
      { key: '/report/agent', label: '坐席报表' },
      { key: '/report/consume', label: '消费报表' },
    ],
  },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [checking, setChecking] = useState(true)
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()

  useEffect(() => {
    request.post('index.php?m=index&c=index&f=checkLogin').then((res: any) => {
      if (res?.result?.error === 0) {
        setChecking(false)
      } else {
        navigate('/login', { replace: true })
      }
    }).catch(() => {
      navigate('/login', { replace: true })
    })
  }, [])

  const handleLogout = async () => {
    try {
      await request.post('index.php?m=login&c=login&f=logout')
    } catch {
      // ignore
    }
    window.location.href = '/merchant/login'
  }

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="验证登录状态..." />
      </div>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 64,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? '企管' : '企业综合管理平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['report']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </Header>
        <Content style={{ margin: 16 }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
