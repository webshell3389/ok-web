import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Button, Spin } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import request from '../api/request'

export default function AgentLayout() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    request.post('index.php?m=index&c=index&f=checkLogin').then((res: any) => {
      if (res?.result?.error === 0) {
        const lt = res?.data?.loginTemplete
        // 如果是管理员（1或2），重定向到后台
        if (lt === 1 || lt === 2) {
          navigate('/dashboard', { replace: true })
        } else {
          setChecking(false) // 是座席，显示页面
        }
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
    } catch { /* ignore */ }
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
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 顶部操作栏 — 只保留退出按钮 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        padding: '8px 12px', background: '#fff', borderBottom: '1px solid #f0f0f0',
      }}>
        <Button type="text" size="small" icon={<LogoutOutlined />} onClick={handleLogout}>
          退出
        </Button>
      </div>
      {/* 主内容 — 全屏，移动端友好 */}
      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '12px 12px 24px',
        boxSizing: 'border-box',
      }}>
        <Outlet />
      </div>
    </div>
  )
}
