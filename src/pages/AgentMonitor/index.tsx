import { useEffect, useState, useRef, useCallback } from 'react'
import { Table, Card, Row, Col, Segmented, Button, Tag, Input } from 'antd'
import {
  TeamOutlined,
  PhoneOutlined,
  PauseCircleOutlined,
  MinusCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import StatCard from '../../components/StatCard'
import { queryAgents, queryAgentStatus } from '../../api/agent'
import { unwrapRows } from '../../utils/format'

/** 坐席数据类型 */
interface Agent {
  key: string
  StaffNo: string
  Name: string
  sipNu: string
  AgentGroup1?: string
  AgentGroup2?: string
  status: AgentStatus
  statusLabel: string
  registered: boolean
}

/** 坐席状态枚举 */
type AgentStatus =
  | 'incall_outbound'
  | 'incall_inbound'
  | 'online'
  | 'idle'
  | 'busy'
  | 'pause'
  | 'rest'
  | 'offline'
  | 'unregistered'

/** 状态配置 */
const STATUS_CFG: Record<AgentStatus, { label: string; color: string; bgColor: string; border: string; img: string }> = {
  incall_outbound: { label: '呼出已接通', color: '#ff4d4f', bgColor: '#fff2f0', border: '#ff4d4f', img: 'incall-lg.png' },
  incall_inbound:  { label: '呼入已接通', color: '#ff4d4f', bgColor: '#fff2f0', border: '#ff4d4f', img: 'incall-lg.png' },
  online:          { label: '在线',       color: '#1677ff', bgColor: '#e6f4ff', border: '#1677ff', img: 'idle-lg.png' },
  idle:            { label: '在线空闲',   color: '#52c41a', bgColor: '#f6ffed', border: '#52c41a', img: 'idle-lg.png' },
  busy:            { label: '忙碌',       color: '#ff4d4f', bgColor: '#fff2f0', border: '#ff4d4f', img: 'busy-lg.png' },
  pause:           { label: '小休',       color: '#faad14', bgColor: '#fffbe6', border: '#faad14', img: 'rest-lg.png' },
  rest:            { label: '休息',       color: '#faad14', bgColor: '#fffbe6', border: '#faad14', img: 'rest-lg.png' },
  offline:         { label: '离线',       color: '#d9d9d9', bgColor: '#fafafa', border: '#d9d9d9', img: 'offline-lg.png' },
  unregistered:    { label: '未注册',     color: '#d9d9d9', bgColor: '#fafafa', border: '#d9d9d9', img: 'offline-lg.png' },
}

const DEFAULT_CFG = STATUS_CFG.offline

function getCfg(s: AgentStatus) { return STATUS_CFG[s] || DEFAULT_CFG }

/** 格式化秒 → MM:SS */
function fmtDur(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function AgentMonitor() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ inCall: 0, online: 0, idle: 0, busy: 0, offline: 0 })
  const [view, setView] = useState<'card' | 'table'>('card')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [, setTick] = useState(0)
  const callStart = useRef<Record<string, number>>({})

  // ====== 获取数据 ======
  const fetchData = useCallback(async (current = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const res: any = await queryAgents({ pagination: { current, pageSize }, filter: {} })
      const rows = unwrapRows(res)
      setPagination({ current, pageSize, total: Number(res?.data?.total || rows.length) })

      // 获取实时状态
      const ids = rows.map((r: any) => r.key).filter(Boolean)
      let statusMap: Record<string, any> = {}
      if (ids.length) {
        try {
          const sr: any = await queryAgentStatus(ids)
          statusMap = sr?.data?.result || {}
        } catch { /* ignore */ }
      }

      // 记录通话开始
      const now = Date.now()
      rows.forEach((r: any) => {
        const st = statusMap[r.key]
        const sipOk = st?.sipStatus === '1'
        const isCall = st?.w === '1' && sipOk && (st?.s === '1' || st?.s === '2')
        if (isCall && !callStart.current[r.key]) callStart.current[r.key] = now
        else if (!isCall && callStart.current[r.key]) delete callStart.current[r.key]
      })

      // 合并状态
      const list: Agent[] = rows.map((r: any) => {
        const st = statusMap[r.key]
        let status: AgentStatus = 'offline'
        let registered = false
        if (st) {
          registered = st.sipStatus === '1'
          if (st.w === '1' && registered) {
            if (st.s === '1') status = 'incall_outbound'
            else if (st.s === '2') status = 'incall_inbound'
            else status = 'online'
          } else if (registered) {
            status = 'idle'
          } else {
            status = 'unregistered'
          }
        }
        return { ...r, status, statusLabel: getCfg(status).label, registered }
      })

      setAgents(list)

      const counts = { inCall: 0, online: 0, idle: 0, busy: 0, offline: 0 }
      list.forEach((a: Agent) => {
        const s = a.status
        if (s === 'incall_outbound' || s === 'incall_inbound') counts.inCall++
        else if (s === 'online') counts.online++
        else if (s === 'idle') counts.idle++
        else if (s === 'busy' || s === 'pause' || s === 'rest') counts.busy++
        else counts.offline++
      })
      setStats(counts)
    } finally {
      setLoading(false)
    }
  }, [pagination.current, pagination.pageSize])

  // ====== 轮询 ======
  useEffect(() => {
    fetchData()
    const timer = setInterval(() => fetchData(pagination.current, pagination.pageSize), 5000)
    return () => clearInterval(timer)
  }, [])

  // ====== 每秒更新通话时长 ======
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const getCallDur = (key: string) => {
    const s = callStart.current[key]
    return s ? fmtDur(Math.floor((Date.now() - s) / 1000)) : null
  }

  // ====== 筛选 ======
  const filtered = agents.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    if (searchText) {
      const q = searchText.toLowerCase()
      if (!a.StaffNo.toLowerCase().includes(q) && !a.sipNu.toLowerCase().includes(q) && !a.Name.toLowerCase().includes(q)) return false
    }
    return true
  })

  // ====== 统计卡片 ======
  const statItems = [
    { key: 'inCall', title: '通话中', icon: <PhoneOutlined />, color: '#ff4d4f' },
    { key: 'idle',   title: '在线空闲', icon: <TeamOutlined />, color: '#52c41a' },
    { key: 'busy',   title: '忙碌/小休', icon: <PauseCircleOutlined />, color: '#faad14' },
    { key: 'offline',title: '离线/未注册', icon: <MinusCircleOutlined />, color: '#d9d9d9' },
  ]

  // ====== 表格列 ======
  const columns = [
    { title: '工号', dataIndex: 'StaffNo', key: 'StaffNo', width: 80 },
    { title: '姓名', dataIndex: 'Name', key: 'Name', width: 80 },
    { title: '分机号', dataIndex: 'sipNu', key: 'sipNu', width: 80 },
    { title: '班组', dataIndex: 'AgentGroup1', key: 'AgentGroup1', width: 100 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: AgentStatus) => {
        const c = getCfg(s)
        return <Tag color={c.color}>{c.label}</Tag>
      },
    },
    {
      title: '通话时长', key: 'duration', width: 90,
      render: (_: any, r: Agent) => {
        if (!r.status.startsWith('incall')) return '-'
        const d = getCallDur(r.key)
        return d ? <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{d}</span> : '-'
      },
    },
  ]

  // ====== 页面 ======
  return (
    <div>
      {/* 透明浮动悬浮窗 */}
      <CallFloat agents={agents} getCallDur={getCallDur} />

      <h2 style={{ marginBottom: 24 }}>坐席监控</h2>

      {/* 统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statItems.map(s => (
          <Col xs={12} sm={6} key={s.key}>
            <StatCard
              title={s.title}
              value={(stats as any)[s.key] ?? 0}
              icon={s.icon}
              color={s.color}
              loading={loading}
            />
          </Col>
        ))}
      </Row>

      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => fetchData()} loading={loading}>刷新</Button>
          </Col>
          <Col>
            <Button disabled>设 置</Button>
            <Button disabled>全 部</Button>
            <Button disabled>置忙</Button>
            <Button disabled>置闲</Button>
            <Button disabled>离线</Button>
            <Button disabled>长签</Button>
            <Button disabled>退出长签</Button>
          </Col>
          <Col flex="auto">
            <Segmented
              value={view}
              onChange={(v) => setView(v as any)}
              options={[
                { label: '🔲 磁贴', value: 'card' },
                { label: '📋 列表', value: 'table' },
              ]}
            />
          </Col>
          <Col>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索工号/分机"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
              style={{ width: 180 }}
            />
          </Col>
        </Row>
        <Row style={{ marginTop: 8 }}>
          <Col>
            <Segmented
              value={filterStatus}
              onChange={(v) => setFilterStatus(v as string)}
              options={[
                { label: `全部(${agents.length})`, value: 'all' },
                { label: `通话中(${stats.inCall})`, value: 'incall' },
                { label: `空闲(${stats.idle})`, value: 'idle' },
                { label: `离线(${stats.offline})`, value: 'offline' },
              ]}
              size="small"
            />
          </Col>
        </Row>
      </Card>

      {/* 主内容 */}
      <Card styles={{ body: { padding: 0 } }}>
        {/* 列表视图 */}
        <div style={{ display: view === 'table' ? 'block' : 'none' }}>
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="key"
            loading={loading}
            size="small"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (c, ps) => fetchData(c, ps || 20),
            }}
          />
        </div>

        {/* 磁贴视图 */}
        {view === 'card' && (
          <div style={{ padding: 16, maxHeight: 580, overflowY: 'auto' }}>
            {loading && agents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>加载中...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无匹配的坐席</div>
            ) : (
              <Row gutter={[10, 10]}>
                {filtered.map(a => {
                  const cfg = getCfg(a.status)
                  const isCall = a.status.startsWith('incall')
                  return (
                    <Col xs={12} sm={8} md={6} lg={6} key={a.key}>
                      <div style={{
                        height: 82,
                        border: `1px solid ${isCall ? cfg.border : '#e8e8e8'}`,
                        borderRadius: 8,
                        background: isCall ? cfg.bgColor : '#fff',
                        padding: 6,
                        display: 'flex',
                        alignItems: 'center',
                        position: 'relative',
                        transition: 'all 0.2s',
                        boxShadow: isCall ? `0 0 0 1px ${cfg.border}40` : 'none',
                      }}>
                        {/* 状态指示灯 */}
                        <span style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 8, height: 8, borderRadius: '50%',
                          background: cfg.color,
                          boxShadow: `0 0 4px ${cfg.color}`,
                        }} />

                        <img src={`/static/agent/${cfg.img}`} alt={a.status}
                          style={{ width: 48, height: 48, marginRight: 8, flexShrink: 0 }} />

                        <div style={{ flex: 1, minWidth: 0, lineHeight: '18px', fontSize: 12 }}>
                          <div style={{ fontWeight: 'bold', fontSize: 13 }}>{a.sipNu}</div>
                          <div style={{ color: '#666', fontSize: 11 }}>{a.Name}</div>
                          <span style={{
                            display: 'inline-block', padding: '0 4px', fontSize: 10,
                            lineHeight: '16px', borderRadius: 3,
                            background: cfg.color + '20', color: cfg.color, fontWeight: 500,
                          }}>{cfg.label}</span>
                          {isCall && getCallDur(a.key) && (
                            <div style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 11, marginTop: 1 }}>
                              ⏱ {getCallDur(a.key)}
                            </div>
                          )}
                        </div>
                      </div>
                    </Col>
                  )
                })}
              </Row>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

/** 透明浮动悬浮窗 */
function CallFloat({ agents, getCallDur }: {
  agents: Agent[]
  getCallDur: (key: string) => string | null
}) {
  const calls = agents.filter(a => a.status.startsWith('incall'))
  return (
    <div
      style={{
        position: 'fixed', top: 80, right: 20, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', color: '#fff',
        borderRadius: 10, padding: '10px 14px', fontSize: 13,
        fontFamily: "'SF Mono', Monaco, Consolas, monospace",
        minWidth: 220, pointerEvents: 'none',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        display: calls.length === 0 ? 'none' : 'block',
      }}
    >
      <div style={{
        fontSize: 11, color: 'rgba(255,255,255,0.5)',
        marginBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: 5, letterSpacing: 0.5,
      }}>
        📞 通话实时监控
      </div>
      {calls.map(a => {
        const cfg = getCfg(a.status)
        const d = getCallDur(a.key) || '00:00'
        return (
          <div key={a.key} style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: '3px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontWeight: 'bold', color: '#fff', minWidth: 50 }}>{a.sipNu}</span>
            <span style={{ color: '#4fc3f7', flex: 1, textAlign: 'center', fontSize: 12 }}>{cfg.label}</span>
            <span style={{ color: '#ffeb3b', fontWeight: 'bold', minWidth: 55, textAlign: 'right' }}>{d}</span>
          </div>
        )
      })}
    </div>
  )
}
