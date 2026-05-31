import request from './request'

export function getCustomerMeta() {
  return request.post('index.php?m=crm&c=clientInfo')
}

export function queryCustomers(params?: Record<string, any>) {
  return request.post('index.php?m=crm&c=clientInfo&f=query', params)
}

export function getCustomer(id: string) {
  return request.post('index.php?m=crm&c=clientInfo&f=getClient', { id })
}

export function saveCustomer(params: Record<string, any>) {
  return request.post('index.php?m=crm&c=clientInfo&f=edit', params)
}

export function deleteCustomer(id: string) {
  return request.post('index.php?m=crm&c=clientInfo&f=delete', { id })
}

export function deleteCustomers(ids: string[]) {
  return request.post('index.php?m=crm&c=clientInfo&f=deleteList', { ids: JSON.stringify(ids) })
}

export function queryBatchList(params?: Record<string, any>) {
  return request.post('index.php?m=crm&c=clientInfo&f=queryBatchList', params)
}

export function queryCustomerType() {
  return request.post('index.php?m=crm&c=clientInfo&f=queryCustomerType')
}

export function exportCustomers(params?: Record<string, any>) {
  return request.post('index.php?m=crm&c=clientInfo&f=export', params)
}
