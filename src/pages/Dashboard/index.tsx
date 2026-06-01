import { useEffect, useState } from 'react'
import { Row, Col } from 'antd'
import { TeamOutlined, PhoneOutlined, DollarOutlined, NodeIndexOutlined } from '@ant-design/icons'
import StatCard from '../../components/StatCard'
import {
  getCallConcurrent,
  getCallVolumeToday,
  getConsumeToday,
  getOnlineAgentAmount,
} from '../../api/dashboard'

export default function Dashboard() {
  const [data, setData] = useState({ concurrent: 0, calls: 0, consume: '0.00', agents: 0 })
  const [loading, setLoading] = useState(true)

  const safeGet = (fn: () => Promise<any>, fallback: any) => fn().catch(() => fallback)
  const getCount = (res: any, fallback: string | number) => {
    if (res?.result?.error !== 0) return fallback
    return res?.data?.cnt ?? res?.data ?? fallback
  }

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      safeGet(getCallConcurrent, { result: { error: 1 } }),
      safeGet(getCallVolumeToday, { result: { error: 1 } }),
      safeGet(getConsumeToday, { result: { error: 1 } }),
      safeGet(getOnlineAgentAmount, { result: { error: 1 } }),
    ])
      .then(([concurrent, calls, consume, agents]) => {
        setData({
          concurrent: getCount(concurrent, 0),
          calls: getCount(calls, 0),
          consume: getCount(consume, '0.00'),
          agents: getCount(agents, 0),
        })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 30000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>仪表盘</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="呼叫并发" value={data.concurrent} icon={<NodeIndexOutlined />} loading={loading} color="#1677ff" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="今日呼叫量" value={data.calls} icon={<PhoneOutlined />} loading={loading} color="#52c41a" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="今日消费(元)" value={data.consume} icon={<DollarOutlined />} loading={loading} color="#faad14" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="在线坐席" value={data.agents} icon={<TeamOutlined />} loading={loading} color="#ff4d4f" />
        </Col>
      </Row>
    </div>
  )
}
