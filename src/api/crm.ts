import request from './request'

export function getClientInfo(params: { number: string; isPopup?: string }) {
  const fd = new URLSearchParams()
  fd.append('number', params.number)
  if (params.isPopup) fd.append('isPopup', params.isPopup)
  return request.post('index.php?m=crm&c=clientInfo&f=getClient', fd, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export function queryLocation(numbers: string) {
  const fd = new URLSearchParams()
  fd.append('numbers', numbers)
  return request.post('index.php?m=crm&c=clientInfo&f=queryLocation', fd, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}
