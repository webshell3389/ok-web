import { Tag } from 'antd'

const statusConfig: Record<string, { color: string; text: string }> = {
  online: { color: 'green', text: '在线' },
  offline: { color: 'default', text: '离线' },
  busy: { color: 'red', text: '通话中' },
  pause: { color: 'orange', text: '小休' },
  ringing: { color: 'blue', text: '振铃中' },
}

export default function AgentStatusTag({ status }: { status: string }) {
  const cfg = statusConfig[status] || { color: 'default', text: status }
  return <Tag color={cfg.color}>{cfg.text}</Tag>
}
