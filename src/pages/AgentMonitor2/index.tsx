import { useEffect, useState, useRef } from 'react'
import { Table, Card, Row, Col, Button, Space, Tag } from 'antd'
import { TeamOutlined, PhoneOutlined, MinusCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import StatCard from '../../components/StatCard'
import { queryAgents, queryAgentStatus } from '../../api/agent'
import { queryTasks } from '../../api/task'
import { unwrapRows, formatUnixTime } from '../../utils/format'

interface Agent {
  key: string
  StaffNo: string
  Name: string
  sipNu: string
  AgentGroup1?: string
  AgentGroup2?: string
  status: string
  registered?: boolean
  callStartTime?: number
}

// 格式化秒数为 HH:MM:SS
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function AgentMonitor2() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ concurrent: 0, inCall: 0, online: 0 })
  const [tasks, setTasks] = useState<any[]>([])
  const [, setTick] = useState(0)
  const callStartTimes = useRef<Record<string, number>>({})

  const fetchAgents = () => {
    setLoading(true)
    queryAgents({ pagination: { current: 1, pageSize: 100 }, filter: {} })
      .then(async (res: any) => {
        const rows = unwrapRows(res)
        const agentIds = rows.map((item: any) => item.key)
        
        // 获取坐席状态
        let statusMap: Record<string, any> = {}
        try {
          const statusRes: any = await queryAgentStatus(agentIds)
          statusMap = statusRes?.data?.result || {}
        } catch {
          // ignore
        }
        
        // 记录通话开始时间
        const now = Date.now()
        rows.forEach((item: any) => {
          const st = statusMap[item.key]
          const isInCall = st?.s === '2'
          if (isInCall && !callStartTimes.current[item.key]) {
            callStartTimes.current[item.key] = now
          } else if (!isInCall && callStartTimes.current[item.key]) {
            delete callStartTimes.current[item.key]
          }
        })
        
        // 合并状态 - w=1 表示工作中
        const list: Agent[] = rows.map((item: any) => {
          const st = statusMap[item.key]
          let status = 'offline'
          let registered = false
          
          if (st) {
            registered = st.sipStatus === '1'
            if (st.w === '1') {
              // w=1 就是工作中，s=2 表示通话中，s=1 表示空闲/在线
              status = 'online'
            } else {
              status = registered ? 'offline' : 'unregistered'
            }
          }
          
          return { ...item, status, registered }
        })
        
        setAgents(list)
        
        const counts = { concurrent: 0, inCall: 0, online: 0 }
        list.forEach((a: Agent) => {
          if (a.status === 'online') counts.online++
        })
        setStats(counts)
      })
      .finally(() => setLoading(false))
  }

  // 每秒刷新通话时长显示
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // 获取通话时长
  const getCallDuration = (agentKey: string) => {
    const start = callStartTimes.current[agentKey]
    if (!start) return null
    return formatDuration(Math.floor((Date.now() - start) / 1000))
  }

  const fetchTasks = () => {
    queryTasks({ pagination: { current: 1, pageSize: 20 }, filter: {} })
      .then((res: any) => {
        setTasks(unwrapRows(res))
      })
  }

  useEffect(() => {
    fetchAgents()
    fetchTasks()
    // 不自动刷新坐席列表，只在用户点击刷新时更新
  }, [])

  const statusImageMap: Record<string, string> = {
    online: 'idle-lg.png',
    incall: 'busy-lg.png',
    pause: 'rest-lg.png',
    offline: 'offline-lg.png',
    unregistered: 'offline-lg.png',
  }

  const statusColorMap: Record<string, string> = {
    online: '#52c41a',
    incall: '#ff4d4f',
    pause: '#faad14',
    offline: '#d9d9d9',
    unregistered: '#d9d9d9',
  }

  const taskColumns = [
    { title: 'ID', dataIndex: 'taskId', key: 'taskId', width: 60 },
    { title: '任务名称', dataIndex: 'name', key: 'name', width: 120 },
    { title: '总数', dataIndex: 'calleeAmount', key: 'calleeAmount', width: 60 },
    { title: '已呼叫', dataIndex: 'calledCount', key: 'calledCount', width: 60 },
    { title: '接通率', dataIndex: 'completionRate', key: 'completionRate', width: 80 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160, render: formatUnixTime },
    { title: '状态', dataIndex: 'runningStatus', key: 'runningStatus', width: 80 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: string) => v === '正常' ? <Tag color="success">✓ 正常</Tag> : <Tag color="error">× 删除</Tag> },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>坐席监控2</h2>
      
      {/* 顶部统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <StatCard title="当前并发" value={stats.concurrent} icon={<TeamOutlined />} color="#1677ff" />
        </Col>
        <Col span={8}>
          <StatCard title="通话中" value={stats.inCall} icon={<PhoneOutlined />} color="#ff4d4f" />
        </Col>
        <Col span={8}>
          <StatCard title="当前在线" value={stats.online} icon={<MinusCircleOutlined />} color="#52c41a" />
        </Col>
      </Row>

      {/* 主体区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* 左侧：坐席列表 */}
        <Col xs={24} lg={14}>
          <Card 
            title="坐席列表" 
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={fetchAgents}>刷新</Button>
              </Space>
            }
            bodyStyle={{ maxHeight: 500, overflowY: 'auto' }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 20 }}>加载中...</div>
            ) : (
              <Row gutter={[8, 8]}>
                {agents.map((agent) => (
                  <Col key={agent.key} xs={6} sm={4} md={3} lg={2}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      padding: 4,
                      border: `1px solid ${statusColorMap[agent.status] || '#d9d9d9'}`,
                      borderRadius: 4,
                      background: '#fafafa',
                      position: 'relative'
                    }}>
                      <div style={{ 
                        position: 'absolute', 
                        top: 4, 
                        right: 4, 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        background: statusColorMap[agent.status] || '#d9d9d9' 
                      }} />
                      <img 
                        src={`/static/agent/${statusImageMap[agent.status] || 'offline-lg.png'}`} 
                        alt={agent.status}
                        style={{ width: 32, height: 32, objectFit: 'contain' }}
                      />
                      <span style={{ marginTop: 2, fontSize: 10, fontWeight: 'bold', textAlign: 'center' }}>
                        {agent.StaffNo}
                      </span>
                      {agent.status === 'incall' && (
                        <span style={{ fontSize: 8, color: '#ff4d4f', fontWeight: 'bold' }}>
                          {getCallDuration(agent.key)}
                        </span>
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
        
        {/* 右侧：通话信息 */}
        <Col xs={24} lg={10}>
          <Card title="通话信息">
            {stats.inCall > 0 ? (
              <div style={{ padding: 8 }}>
                {agents.filter(a => a.status === 'incall').map(agent => (
                  <div key={agent.key} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '8px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <span><strong>分机号:</strong> {agent.sipNu}</span>
                    <span><strong>工号:</strong> {agent.StaffNo}</span>
                    <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                      {getCallDuration(agent.key)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                <p>暂无通话</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 底部：任务列表 */}
      <Card title="任务列表">
        <Table
          dataSource={tasks}
          columns={taskColumns}
          rowKey="taskId"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>
    </div>
  )
}
