import { useEffect, useState } from 'react'
import { Card, Table, DatePicker } from 'antd'
import dayjs from 'dayjs'
import { queryAgentReport } from '../../api/report'

export default function AgentReport() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(dayjs())

  const fetchData = (d: dayjs.Dayjs) => {
    setLoading(true)
    queryAgentReport({ date: d.format('YYYY-MM-DD') })
      .then((res: any) => {
        setData(res?.data?.list || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData(date)
  }, [date])

  const columns = [
    { title: '坐席', dataIndex: 'agentName', key: 'agentName' },
    { title: '技能组', dataIndex: 'groupName', key: 'groupName' },
    { title: '呼入数', dataIndex: 'inboundCount', key: 'inboundCount' },
    { title: '呼出数', dataIndex: 'outboundCount', key: 'outboundCount' },
    { title: '总通话时长', dataIndex: 'totalDuration', key: 'totalDuration' },
    { title: '平均时长', dataIndex: 'avgDuration', key: 'avgDuration' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>坐席报表</h2>
        <DatePicker value={date} onChange={(d) => d && setDate(d)} />
      </div>
      <Card>
        <Table dataSource={data} columns={columns} rowKey="agentName" loading={loading} />
      </Card>
    </div>
  )
}
