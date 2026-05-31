import request from './request'

export function getCallLogMeta() {
  return request.post('index.php?m=cdr&c=cdr')
}

export function queryCallLogs(params?: Record<string, any>) {
  return request.post('index.php?m=cdr&c=cdr&f=query', params)
}

export function queryCallLogAgents(params?: Record<string, any>) {
  return request.post('index.php?m=cdr&c=cdr&f=queryAgent', params)
}

export function queryCallLogTasks(params?: Record<string, any>) {
  return request.post('index.php?m=cdr&c=cdr&f=queryTask', params)
}

export function getRecordMeta() {
  return request.post('index.php?m=cdr&c=record')
}

export function queryRecords(params?: Record<string, any>) {
  return request.post('index.php?m=cdr&c=record&f=query', params)
}

export function queryRecordAgents(params?: Record<string, any>) {
  return request.post('index.php?m=cdr&c=record&f=queryAgent', params)
}

export function queryRecordTasks(params?: Record<string, any>) {
  return request.post('index.php?m=cdr&c=record&f=queryTask', params)
}
