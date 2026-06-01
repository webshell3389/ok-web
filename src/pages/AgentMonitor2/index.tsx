import { useEffect, useState, useRef, useCallback } from 'react'
import { Table, Card, Row, Col, Button, Space, Tag, Segmented, Input } from 'antd'
import {
  TeamOutlined,
  PhoneOutlined,
  MinusCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
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
  // 自定义状态
  status: 'incall_outbound' | 'incall_inbound' | 'online' | 'idle' | 'busy' | 'pause' | 'rest' | 'offline' | 'unregistered'
  statusLabel: string
  registered: boolean
}

// 状态映射配置
type AgentStatus = Agent['status']

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; bgColor: string; borderColor: string; img: string }> = {
  incall_outbound: { label: '呼出已接通', color: '#ff4d4f', bgColor: '#fff2f0', borderColor: '#ff4d4f', img: 'incall-lg.png' },
  incall_inbound:  { label: '呼入已接通', color: '#ff4d4f', bgColor: '#fff2f0', borderColor: '#ff4d4f', img: 'incall-lg.png' },
  online:          { label: '在线',       color: '#1677ff', bgColor: '#e6f4ff', borderColor: '#1677ff', img: 'idle-lg.png' },
  idle:            { label: '在线空闲',   color: '#52c41a', bgColor: '#f6ffed', borderColor: '#52c41a', img: 'idle-lg.png' },
  busy:            { label: '忙碌',       color: '#ff4d4f', bgColor: '#fff2f0', borderColor: '#ff4d4f', img: 'busy-lg.png' },
  pause:           { label: '小休',       color: '#faad14', bgColor: '#fffbe6', borderColor: '#faad14', img: 'rest-lg.png' },
  rest:            { label: '休息',       color: '#faad14', bgColor: '#fffbe6', borderColor: '#faad14', img: 'rest-lg.png' },
  offline:         { label: '离线',       color: '#d9d9d9', bgColor: '#fafafa', borderColor: '#d9d9d9', img: 'offline-lg.png' },
  unregistered:    { label: '未注册',     color: '#d9d9d9', bgColor: '#fafafa', borderColor: '#d9d9d9', img: 'offline-lg.png' },
}

// 格式化秒数为 MM:SS
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function AgentMonitor2() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ concurrent: 0, inCall: 0, online: 0, idle: 0, offline: 0 })
  const [tasks, setTasks] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchText, setSearchText] = useState('')
  const [, setTick] = useState(0)
  const callStartTimes = useRef<Record<string, number>>({})

  // 5色环统计卡片配置
  const statCards = [
    { key: 'inCall', title: '通话中', icon: <PhoneOutlined />, color: '#ff4d4f' },
    { key: 'online', title: '在线空闲', icon: <TeamOutlined />, color: '#52c41a' },
    { key: 'busy',   title: '忙碌',    icon: <MinusCircleOutlined />, color: '#faad14' },
    { key: 'offline',title: '离线/未注册', icon: <MinusCircleOutlined />, color: '#d9d9d9' },
  ]

  // ====== 数据获取 ======
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [agentRes, taskRes] = await Promise.all([
        queryAgents({ pagination: { current: 1, pageSize: 100 }, filter: {} }),
        queryTasks({ pagination: { current: 1, pageSize: 20 }, filter: {} }).catch(() => ({ data: { rows: [] } })),
      ])
      const rows = unwrapRows(agentRes)
      const agentIds = rows.map((item: any) => item.key)

      // 获取坐席状态
      let statusMap: Record<string, any> = {}
      try {
        const statusRes: any = await queryAgentStatus(agentIds)
        statusMap = statusRes?.data?.result || {}
      } catch { /* ignore */ }

        // 记录通话开始时间 - 前端追踪
        const now = Date.now()
        rows.forEach((item: any) => {
          const st = statusMap[item.key]
          const isInCall = st?.s === '2'
          const wasInCall = callStartTimes.current[item.key] !== undefined
          if (isInCall && !wasInCall) {
            // 刚进入通话，记录开始时间
            callStartTimes.current[item.key] = now
          } else if (!isInCall && wasInCall) {
            // 通话结束，清除
            delete callStartTimes.current[item.key]
          }
        })
        // 清理不在列表中的坐席
        Object.keys(callStartTimes.current).forEach(key => {
          if (!rows.find((r: any) => r.key === key)) {
            delete callStartTimes.current[key]
          }
        })

      // 合并状态 -> agent list
      const list: Agent[] = rows.map((item: any) => {
        const st = statusMap[item.key]
        let status: Agent['status'] = 'offline'
        let registered = false

        if (st) {
          registered = st.sipStatus === '1'
          const isWorking = st.w === '1'

          if (isWorking && registered) {
            if (st.s === '1') status = 'incall_outbound'
            else if (st.s === '2') status = 'incall_inbound'
            else status = 'online'
          } else if (registered) {
            status = 'idle'
          } else {
            status = 'unregistered'
          }
        }

        return {
          ...item,
          status,
          statusLabel: STATUS_CONFIG[status].label,
          registered,
        }
      })

      setAgents(list)
      setTasks(unwrapRows(taskRes))

      // 统计数据
      const counts = { inCall: 0, online: 0, idle: 0, busy: 0, offline: 0 }
      list.forEach((a: Agent) => {
        if (a.status === 'incall_outbound' || a.status === 'incall_inbound') counts.inCall++
        else if (a.status === 'online') counts.online++
        else if (a.status === 'idle') counts.idle++
        else if (a.status === 'busy' || a.status === 'pause' || a.status === 'rest') counts.busy++
        else counts.offline++
      })
      setStats(prev => ({ ...prev, ...counts }))
    } finally {
      setLoading(false)
    }
  }, [])

  // ====== 轮询 ======
  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 5000)
    return () => clearInterval(timer)
  }, [fetchData])

  // ====== 每秒更新通话时长 ======
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // ====== 获取通话时长 ======
  const getCallDuration = (agentKey: string): string | null => {
    const start = callStartTimes.current[agentKey]
    if (!start) return null
    return formatDuration(Math.floor((Date.now() - start) / 1000))
  }

  // ====== 筛选 ======
  const filteredAgents = agents.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    if (searchText) {
      const q = searchText.toLowerCase()
      if (!a.StaffNo.toLowerCase().includes(q) && !a.sipNu.toLowerCase().includes(q) && !a.Name.toLowerCase().includes(q)) return false
    }
    return true
  })

  // 分组
  const groupedByStatus: Record<string, Agent[]> = {}
  filteredAgents.forEach(a => {
    const g = a.status.startsWith('incall') ? 'incall' : a.status
    if (!groupedByStatus[g]) groupedByStatus[g] = []
    groupedByStatus[g].push(a)
  })

  // ====== 渲染 ======
  return (
    <div>
      {/* ====== 透明浮动悬浮窗 ====== */}
      <CallFloatingOverlay
        agents={agents}
        getCallDuration={getCallDuration}
      />

      <h2 style={{ marginBottom: 24 }}>坐席监控</h2>

      {/* ====== 顶部统计 ====== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statCards.map(c => (
          <Col xs={12} sm={6} key={c.key}>
            <StatCard
              title={c.title}
              value={(stats as any)[c.key] ?? 0}
              icon={c.icon}
              color={c.color}
              loading={loading}
            />
          </Col>
        ))}
      </Row>

      {/* ====== 工具栏 ====== */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
            >
              刷新
            </Button>
          </Col>
          <Col flex="auto">
            <Segmented
              value={filterStatus}
              onChange={(v) => setFilterStatus(v as string)}
              options={[
                { label: `全部(${agents.length})`, value: 'all' },
                { label: `通话中(${stats.inCall})`, value: 'incall' },
                { label: `在线空闲(${stats.idle})`, value: 'idle' },
                { label: `离线(${stats.offline})`, value: 'offline' },
              ]}
            />
          </Col>
          <Col>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索工号/分机/姓名"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
              style={{ width: 200 }}
            />
          </Col>
        </Row>
      </Card>

      {/* ====== 主内容 ====== */}
      <Row gutter={[16, 16]}>
        {/* 坐席网格 */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <TeamOutlined />
                <span>坐席列表</span>
                <Tag>{filteredAgents.length} 个坐席</Tag>
              </Space>
            }
            styles={{ body: { maxHeight: 600, overflowY: 'auto', padding: '12px 16px' } }}
          >
            {loading && agents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>加载中...</div>
            ) : filteredAgents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无匹配的坐席</div>
            ) : (
              <Row gutter={[10, 10]}>
                {filteredAgents.map(agent => (
                  <Col key={agent.key} xs={12} sm={8} md={6} lg={6}>
                    <AgentCard
                      agent={agent}
                      cfg={STATUS_CONFIG[agent.status]}
                      duration={getCallDuration(agent.key)}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>

        {/* 右侧：通话信息 */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <PhoneOutlined style={{ color: '#ff4d4f' }} />
                <span>通话信息</span>
                {stats.inCall > 0 && <Tag color="red">{stats.inCall} 路</Tag>}
              </Space>
            }
            styles={{ body: { maxHeight: 600, overflowY: 'auto' } }}
          >
            {agents.filter(a => a.status.startsWith('incall')).length > 0 ? (
              <div>
                {agents.filter(a => a.status.startsWith('incall')).map(agent => {
                  const cfg = STATUS_CONFIG[agent.status]
                  return (
                    <div
                      key={agent.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 8px',
                        marginBottom: 8,
                        borderRadius: 8,
                        background: cfg.bgColor,
                        border: `1px solid ${cfg.color}20`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={`/static/agent/${cfg.img}`}
                          alt={agent.status}
                          style={{ width: 36, height: 36 }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: 14 }}>{agent.sipNu}</div>
                          <div style={{ fontSize: 11, color: '#666' }}>工号: {agent.StaffNo}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Tag color={cfg.color} style={{ margin: 0, fontSize: 11 }}>{cfg.label}</Tag>
                        <div style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 16, marginTop: 2 }}>
                          {getCallDuration(agent.key) || '00:00'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column', gap: 8 }}>
                <PhoneOutlined style={{ fontSize: 36, opacity: 0.3 }} />
                <p style={{ margin: 0 }}>暂无通话</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ====== 任务列表 ====== */}
      <Card title="任务列表" style={{ marginTop: 16 }} styles={{ body: { padding: '8px 16px' } }}>
        <Table
          dataSource={tasks}
          columns={[
            { title: 'ID', dataIndex: 'taskId', key: 'taskId', width: 60 },
            { title: '任务名称', dataIndex: 'name', key: 'name' },
            { title: '总数', dataIndex: 'calleeAmount', key: 'calleeAmount', width: 60 },
            { title: '已呼叫', dataIndex: 'calledCount', key: 'calledCount', width: 60 },
            { title: '接通率', dataIndex: 'completionRate', key: 'completionRate', width: 80 },
            { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160, render: formatUnixTime },
            { title: '状态', dataIndex: 'runningStatus', key: 'runningStatus', width: 80 },
            {
              title: '状态', dataIndex: 'status', key: 'status', width: 80,
              render: (v: string) => v === '正常'
                ? <Tag color="success">正常</Tag>
                : <Tag color="error">删除</Tag>,
            },
          ]}
          rowKey="taskId"
          pagination={{ pageSize: 10, size: 'small' }}
          size="small"
        />
      </Card>
    </div>
  )
}

// ====== 坐席卡片组件 ======
function AgentCard({ agent, cfg, duration }: {
  agent: Agent
  cfg: typeof STATUS_CONFIG[AgentStatus]
  duration: string | null
}) {
  const isInCall = agent.status.startsWith('incall')
  return (
    <div
      style={{
        height: 82,
        border: `1px solid ${isInCall ? cfg.borderColor : '#e8e8e8'}`,
        borderRadius: 8,
        background: isInCall ? cfg.bgColor : '#fff',
        padding: 6,
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        transition: 'all 0.2s',
        cursor: 'default',
        boxShadow: isInCall ? `0 0 0 1px ${cfg.borderColor}40` : 'none',
      }}
    >
      {/* 状态指示灯 (左上角) */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: cfg.color,
          boxShadow: `0 0 4px ${cfg.color}`,
        }}
      />

      {/* 头像 */}
      <img
        src={`/static/agent/${cfg.img}`}
        alt={agent.status}
        style={{ width: 48, height: 48, marginRight: 8, flexShrink: 0 }}
      />

      {/* 信息 */}
      <div style={{ flex: 1, minWidth: 0, lineHeight: '18px', fontSize: 12 }}>
        <div style={{ fontWeight: 'bold', fontSize: 13 }}>{agent.sipNu}</div>
        <div style={{ color: '#666', fontSize: 11 }}>{agent.Name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '0 4px',
              fontSize: 10,
              lineHeight: '16px',
              borderRadius: 3,
              background: cfg.color + '20',
              color: cfg.color,
              fontWeight: 500,
            }}
          >
            {cfg.label}
          </span>
        </div>
        {isInCall && duration && (
          <div style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 11, marginTop: 1 }}>
            ⏱ {duration}
          </div>
        )}
      </div>
    </div>
  )
}

// ====== 透明浮动悬浮窗组件 ======
function CallFloatingOverlay({ agents, getCallDuration }: {
  agents: Agent[]
  getCallDuration: (key: string) => string | null
}) {
  const inCallAgents = agents.filter(a => a.status.startsWith('incall'))

  if (inCallAgents.length === 0 && !document.getElementById('__callFloatOverlay')) {
    return null
  }

  return (
    <div
      id="__callFloatOverlay"
      style={{
        position: 'fixed',
        top: 80,
        right: 20,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        color: '#fff',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        minWidth: 220,
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        display: inCallAgents.length === 0 ? 'none' : 'block',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.5)',
          marginBottom: 6,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: 5,
          letterSpacing: 0.5,
        }}
      >
        📞 通话实时监控
      </div>
      {inCallAgents.map(agent => {
        const cfg = STATUS_CONFIG[agent.status]
        const dur = getCallDuration(agent.key) || '00:00'
        return (
          <div
            key={agent.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '3px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span style={{ fontWeight: 'bold', color: '#fff', minWidth: 50 }}>
              {agent.sipNu}
            </span>
            <span
              style={{
                color: '#4fc3f7',
                flex: 1,
                textAlign: 'center',
                fontSize: 12,
              }}
            >
              {cfg.label}
            </span>
            <span
              style={{
                color: '#ffeb3b',
                fontWeight: 'bold',
                minWidth: 55,
                textAlign: 'right',
              }}
            >
              {dur}
            </span>
          </div>
        )
      })}
    </div>
  )
}
