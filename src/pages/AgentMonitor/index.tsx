import { useEffect, useState } from 'react'
import { Table, Card, Row, Col, Segmented, Button, Space, Checkbox } from 'antd'
import { TeamOutlined, PhoneOutlined, PauseCircleOutlined, MinusCircleOutlined } from '@ant-design/icons'
import AgentStatusTag from '../../components/AgentStatusTag'
import StatCard from '../../components/StatCard'
import { queryAgents, queryAgentStatus } from '../../api/agent'
import { unwrapRows } from '../../utils/format'

interface Agent {
  key: string
  StaffNo: string
  Name: string
  sipNu: string
  AgentGroup1?: string
  AgentGroup2?: string
  status: string
  registered?: boolean
}

export default function AgentMonitor() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ online: 0, busy: 0, pause: 0, offline: 0 })
  const [view, setView] = useState<'table' | 'card'>('card')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  const fetchAgents = (current = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    queryAgents({ pagination: { current, pageSize }, filter: {} })
      .then((res: any) => {
        const list: Agent[] = unwrapRows(res).map((item: Agent) => ({
          ...item,
          status: item.status || 'unregistered',
          registered: Boolean(item.status && item.status !== 'unregistered'),
        }))
        setAgents(list)
        setPagination({ current, pageSize, total: Number(res?.data?.total || list.length) })
        const counts = { online: 0, busy: 0, pause: 0, offline: 0 }
        list.forEach((a: Agent) => {
          if (a.status in counts) counts[a.status as keyof typeof counts]++
          else counts.offline++
        })
        setStats(counts)
      })
      .finally(() => setLoading(false))
  }

  const fetchStatus = (list = agents) => {
    const ids = list.map((item) => item.key).filter(Boolean)
    if (!ids.length) return Promise.resolve()
    return queryAgentStatus(ids).catch(() => undefined)
  }

  useEffect(() => {
    fetchAgents()
    const timer = setInterval(() => {
      fetchStatus()
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const columns = [
    { title: '工号', dataIndex: 'StaffNo', key: 'StaffNo' },
    { title: '姓名', dataIndex: 'Name', key: 'Name' },
    { title: '分机号', dataIndex: 'sipNu', key: 'sipNu' },
    { title: '班组1', dataIndex: 'AgentGroup1', key: 'AgentGroup1' },
    { title: '班组2', dataIndex: 'AgentGroup2', key: 'AgentGroup2' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <AgentStatusTag status={s} />,
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>坐席监控</h2>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <StatCard title="在线" value={stats.online} icon={<TeamOutlined />} color="#52c41a" />
        </Col>
        <Col span={6}>
          <StatCard title="通话中" value={stats.busy} icon={<PhoneOutlined />} color="#ff4d4f" />
        </Col>
        <Col span={6}>
          <StatCard title="小休" value={stats.pause} icon={<PauseCircleOutlined />} color="#faad14" />
        </Col>
        <Col span={6}>
          <StatCard title="离线" value={stats.offline} icon={<MinusCircleOutlined />} color="#999" />
        </Col>
      </Row>
      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Button onClick={() => fetchAgents()}>刷 新</Button>
        <Button>设 置</Button>
        <Button>全 部</Button>
        <Button disabled>置忙</Button>
        <Button disabled>置闲</Button>
        <Button disabled>离线</Button>
        <Button disabled>长签</Button>
        <Button disabled>退出长签</Button>
        <Segmented value={view} onChange={(v) => setView(v as any)} options={[{ label: '磁贴', value: 'card' }, { label: '列表', value: 'table' }]} />
      </Space>
      <Card>
        <Table
          dataSource={agents}
          columns={columns}
          rowKey="key"
          loading={loading}
          pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, onChange: (current, pageSize) => fetchAgents(current, pageSize || 20) }}
          style={{ display: view === 'table' ? 'block' : 'none' }}
        />
        {view === 'card' && <Row gutter={[16, 16]}>{agents.map((agent) => <Col xs={24} sm={12} md={8} lg={6} key={agent.key}><Card size="small" title={<Space><Checkbox />工号: {agent.StaffNo}</Space>}><p>姓名: {agent.Name}</p><p>状态: <AgentStatusTag status={agent.status} /></p><p>分机号: {agent.sipNu}{agent.registered ? '' : '未注册'}</p></Card></Col>)}</Row>}
      </Card>
    </div>
  )
}
