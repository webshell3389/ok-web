import { useEffect, useState } from 'react'
import { Card, Table, DatePicker } from 'antd'
import dayjs from 'dayjs'
import { queryTrafficReport } from '../../api/report'

export default function TrafficReport() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(dayjs())

  const fetchData = (d: dayjs.Dayjs) => {
    setLoading(true)
    queryTrafficReport({ date: d.format('YYYY-MM-DD') })
      .then((res: any) => {
        setData(res?.data?.list || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData(date)
  }, [date])

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '总呼入', dataIndex: 'inboundCount', key: 'inboundCount' },
    { title: '总呼出', dataIndex: 'outboundCount', key: 'outboundCount' },
    { title: '接通数', dataIndex: 'connectedCount', key: 'connectedCount' },
    { title: '总时长(秒)', dataIndex: 'totalDuration', key: 'totalDuration' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>话务报表</h2>
        <DatePicker value={date} onChange={(d) => d && setDate(d)} />
      </div>
      <Card>
        <Table dataSource={data} columns={columns} rowKey="date" loading={loading} />
      </Card>
    </div>
  )
}
