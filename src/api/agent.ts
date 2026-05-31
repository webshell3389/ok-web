import request from './request'

export function getAgentMonitorMeta() {
  return request.post('index.php?m=service&c=agentMonitor')
}

export function queryAgents(params?: Record<string, any>) {
  return request.post('index.php?m=service&c=agentMonitor&f=queryAgents', {
    p: JSON.stringify(params || { pagination: { current: 1, pageSize: 20 }, filter: {} }),
  })
}

export function queryAgentStatus(ids: Array<string | number>) {
  return request.post('index.php?m=service&c=agentMonitor&f=queryAgentStatus', {
    ids: JSON.stringify(ids.map(String)),
  })
}

export function agentCallCtrl(params: { action: string; agentID: string }) {
  return request.post('index.php?m=common&c=agentActions&f=agentCallCtrl', params)
}
