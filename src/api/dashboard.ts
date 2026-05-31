import request from './request'

export function getOnlineAgentAmount() {
  return request.post('index.php?m=home&c=home&f=getOnlineAgentAmount')
}

export function getCallVolumeToday() {
  return request.post('index.php?m=home&c=home&f=getCallVolumeToday')
}

export function getConsumeToday() {
  return request.post('index.php?m=home&c=home&f=getConsumeToday')
}

export function getCallConcurrent() {
  return request.post('index.php?m=home&c=home&f=getCallConcurrent')
}
