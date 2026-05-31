import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import request from '../api/request'

export default function AuthLayout() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    request.post('index.php?m=index&c=index&f=checkLogin').then((res: any) => {
      if (res?.result?.error === 0) {
        // loginTemplete: 1=管理端, 2=企业端, null/3=坐席端
        const lt = res?.data?.loginTemplete
        if (lt === 1 || lt === 2) {
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/call-popup', { replace: true })
        }
      } else {
        setChecking(false)
      }
    }).catch(() => setChecking(false))
  }, [])

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' }}>
        <Spin size="large" tip="验证登录状态..." style={{ color: '#fff' }} />
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
      <Outlet />
    </div>
  )
}
