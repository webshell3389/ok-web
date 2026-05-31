import request from './request'

export function getLoginPageInfo() {
  return request.post('index.php?m=login&c=login&f=index')
}

export function doLogin(params: {
  customerName: string
  userName: string
  password: string
  code?: string
  client?: string
  rememberMe?: boolean
}) {
  const fd = new URLSearchParams()
  fd.append('customerName', params.customerName)
  fd.append('userName', params.userName)
  fd.append('password', params.password)
  if (params.client) fd.append('client', params.client)
  fd.append('rememberMe', params.rememberMe ? 'true' : 'false')
  if (params.code) fd.append('code', params.code)
  return request.post('index.php?m=login&c=login&f=login', fd, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export function getRefreshCaptcha() {
  return request.get('index.php?m=login&c=login&f=getRefreshCaptcha')
}
