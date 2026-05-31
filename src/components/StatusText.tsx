import { Tag } from 'antd'

const taskStatusMap: Record<string, { color: string; text: string }> = {
  '0': { color: 'default', text: '未启动' },
  '1': { color: 'green', text: '运行中' },
  '2': { color: 'orange', text: '已暂停' },
  '3': { color: 'default', text: '已停止' },
  running: { color: 'green', text: '运行中' },
  stopped: { color: 'default', text: '已停止' },
  paused: { color: 'orange', text: '已暂停' },
  finished: { color: 'blue', text: '已完成' },
}

const callTypeMap: Record<string, { color: string; text: string }> = {
  '0': { color: 'blue', text: '播放语音任意键转坐席' },
  '2': { color: 'green', text: '直接转坐席' },
  '3': { color: 'purple', text: '播放语音后挂断' },
  '4': { color: 'cyan', text: '播放语音后转坐席' },
  '5': { color: 'geekblue', text: '先接通坐席再呼叫客户' },
  '7': { color: 'magenta', text: '呼叫语音机器人之后挂断' },
  '8': { color: 'volcano', text: '呼叫语音机器人之后转接坐席' },
  inbound: { color: 'blue', text: '呼入' },
  outbound: { color: 'green', text: '呼出' },
  internal: { color: 'purple', text: '内呼' },
}

export function TaskStatusText({ status }: { status: string }) {
  const cfg = taskStatusMap[status] || { color: 'default', text: status || '-' }
  return <Tag color={cfg.color}>{cfg.text}</Tag>
}

export function CallTypeText({ type }: { type: string }) {
  const cfg = callTypeMap[type] || { color: 'default', text: type || '-' }
  return <Tag color={cfg.color}>{cfg.text}</Tag>
}
