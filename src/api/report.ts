import request from './request'

export function queryTrafficReport(params?: Record<string, any>) {
  return request.post('index.php?m=report&c=traffic&f=query', params)
}

export function queryAgentReport(params?: Record<string, any>) {
  return request.post('index.php?m=report&c=agentReport&f=query', params)
}

export function queryConsumeReport(params?: Record<string, any>) {
  return request.post('index.php?m=report&c=consume&f=query', params)
}

export function exportConsumeReport(params?: Record<string, any>) {
  return request.post('index.php?m=report&c=consume&f=export', params)
}
