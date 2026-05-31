import request from './request'

export function getCallTaskMeta() {
  return request.post('index.php?m=service&c=callTask')
}

export function queryTasks(params?: Record<string, any>) {
  return request.post('index.php?m=service&c=callTask&f=query', params)
}

export function createTask(params: Record<string, any>) {
  return request.post('index.php?m=service&c=callTask&f=edit', params)
}

export function startTask(id: string) {
  return request.post('index.php?m=service&c=callTask&f=startTask', { id })
}

export function stopTask(id: string) {
  return request.post('index.php?m=service&c=callTask&f=stopTask', { id })
}

export function deleteTask(id: string) {
  return request.post('index.php?m=service&c=callTask&f=delete', { id })
}

export function getTaskGraphData(id: string) {
  return request.post('index.php?m=service&c=callTask&f=getResultGraphData', { id })
}

export function getResultGraphData(id: string) {
  return request.post('index.php?m=service&c=callTask&f=getResultGraphData', { id })
}

export function getSupportMode() {
  return request.post('index.php?m=service&c=callTask&f=getSupportMode')
}

export function getAgentGroupList() {
  return request.post('index.php?m=service&c=callTask&f=getAgentGroupList')
}
