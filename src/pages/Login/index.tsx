import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Checkbox, message, Spin, Alert } from 'antd'
import { UserOutlined, LockOutlined, BankOutlined } from '@ant-design/icons'
import CryptoJS from 'crypto-js'
import { getLoginPageInfo, doLogin, getRefreshCaptcha } from '../../api/login'
import request from '../../api/request'
import './index.css'

export default function Login() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [pageInfo, setPageInfo] = useState<any>(null)
  const [captchaImg, setCaptchaImg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    getLoginPageInfo().then((res: any) => {
      setPageInfo(res)
      document.title = res?.oem?.pageTitle || '企业综合管理平台'
      // 如果后端返回了验证码图片则显示
      if (res?.img) setCaptchaImg(res.img)
    })
  }, [])

  const handleRefreshCaptcha = async () => {
    const res: any = await getRefreshCaptcha()
    if (res?.data?.img) setCaptchaImg(res.data.img)
  }

  const onFinish = async (values: any) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const passwordHash = CryptoJS.SHA512(values.password).toString()
      const screen = `${window.screen.width}*${window.screen.height}`
      const res: any = await doLogin({
        customerName: values.customerName,
        userName: values.userName,
        password: passwordHash,
        code: values.code,
        client: screen,
        rememberMe: values.rememberMe,
      })
      console.log('登录返回原始数据:', JSON.stringify(res))
      console.log('res?.result:', res?.result)
      console.log('res?.result?.error:', res?.result?.error, '类型:', typeof res?.result?.error)
      console.log('===0结果:', res?.result?.error === 0)
      if (res?.result?.error === 0) {
        console.log('登录成功，检查角色')
        // 查角色后跳转
        try {
          await request.post('index.php?m=index&c=index&f=checkLogin')
          const target = '/dashboard'
          console.log('商户后台登录成功，跳转到:', target)
          message.success('登录成功')
          setTimeout(() => navigate(target, { replace: true }), 300)
        } catch {
          message.success('登录成功')
          setTimeout(() => navigate('/dashboard', { replace: true }), 300)
        }
      } else {
        const errMsg = res?.result?.msg || res?.result?.errno?.toString() || '登录失败'
        console.log('登录失败，错误码:', res?.result?.error, '消息:', errMsg)
        setErrorMsg(errMsg)
        handleRefreshCaptcha()
        if (res?.data?.img) setCaptchaImg(res.data.img)
      }
    } catch (e) {
      const err = e as any
      console.error('登录请求失败:', err?.message || err)
      console.error('响应内容:', err?.response?.data || '无')
      const msg = err?.response?.data?.result?.msg || err?.message || '网络错误，请重试'
      setErrorMsg(msg)
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">{pageInfo?.oem?.productName || '企业综合管理平台'}</h1>
        <Spin spinning={loading}>
          <Form form={form} onFinish={onFinish} size="large" initialValues={{ rememberMe: true }}>
            <Form.Item name="customerName" rules={[{ required: true, message: '请输入客户名称' }]}>
              <Input prefix={<BankOutlined />} placeholder="客户名称" />
            </Form.Item>
            <Form.Item name="userName" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" autoComplete="new-password" />
            </Form.Item>
            {captchaImg && (
              <Form.Item name="code">
                <Input
                  placeholder="验证码"
                  addonAfter={
                    <img
                      src={captchaImg}
                      style={{ height: 28, cursor: 'pointer' }}
                      onClick={handleRefreshCaptcha}
                      alt="验证码"
                    />
                  }
                />
              </Form.Item>
            )}
            {errorMsg && (
              <Form.Item>
                <Alert message={errorMsg} type="error" showIcon closable onClose={() => setErrorMsg('')} />
              </Form.Item>
            )}
            <Form.Item name="rememberMe" valuePropName="checked">
              <Checkbox style={{ color: '#fff' }}>记住我</Checkbox>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                登 录
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </div>
    </div>
  )
}
