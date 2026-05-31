import { useEffect, useState } from 'react'
import { Card, Table, DatePicker, Button, Space, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { queryConsumeReport, exportConsumeReport } from '../../api/report'

export default function ConsumeReport() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(dayjs())

  const fetchData = (d: dayjs.Dayjs) => {
    setLoading(true)
    queryConsumeReport({ date: d.format('YYYY-MM-DD') })
      .then((res: any) => {
        setData(res?.data?.list || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData(date)
  }, [date])

  const handleExport = async () => {
    try {
      await exportConsumeReport({ date: date.format('YYYY-MM-DD') })
      message.success('导出成功')
    } catch {
      message.error('导出失败')
    }
  }

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '项目', dataIndex: 'item', key: 'item' },
    { title: '金额(元)', dataIndex: 'amount', key: 'amount' },
    { title: '说明', dataIndex: 'description', key: 'description' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>消费报表</h2>
        <Space>
          <DatePicker value={date} onChange={(d) => d && setDate(d)} />
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      </div>
      <Card>
        <Table dataSource={data} columns={columns} rowKey="date" loading={loading} />
      </Card>
    </div>
  )
}
