import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Descriptions, Button, message, Spin, Row, Col } from 'antd'
import { queryTasks, startTask, stopTask, getTaskGraphData, getResultGraphData } from '../../api/task'

export default function TaskDetail() {
  const { id } = useParams()
  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
      Promise.all([queryTasks({ p: JSON.stringify({ filter: { id } }) }), getTaskGraphData(id), getResultGraphData(id)])
      .then(([taskRes, graphRes, resultRes]: any[]) => {
        setTask({ ...(taskRes?.data || taskRes?.data?.rows?.[0] || {}), graphRes, resultRes })
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleStart = async () => {
    if (!id) return
    try {
      await startTask(id)
      message.success('任务已启动')
    } catch {
      message.error('启动失败')
    }
  }

  const handleStop = async () => {
    if (!id) return
    try {
      await stopTask(id)
      message.success('任务已停止')
    } catch {
      message.error('停止失败')
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 100 }} />
  if (!task) return <div>任务不存在</div>

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>任务详情</h2>
      <Card>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="任务名称">{task.name}</Descriptions.Item>
          <Descriptions.Item label="状态">{task.status}</Descriptions.Item>
          <Descriptions.Item label="类型">{task.type}</Descriptions.Item>
          <Descriptions.Item label="进度">{task.progress}</Descriptions.Item>
          <Descriptions.Item label="开始时间">{task.startTime}</Descriptions.Item>
          <Descriptions.Item label="结束时间">{task.endTime}</Descriptions.Item>
        </Descriptions>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}><Card size="small" title="统计图数据">{JSON.stringify(task.graphRes?.data || task.graphRes || '-')}</Card></Col>
          <Col span={12}><Card size="small" title="结果图数据">{JSON.stringify(task.resultRes?.data || task.resultRes || '-')}</Card></Col>
        </Row>
        <div style={{ marginTop: 16 }}>
          <Button type="primary" onClick={handleStart} style={{ marginRight: 8 }}>
            启动
          </Button>
          <Button danger onClick={handleStop}>
            停止
          </Button>
        </div>
      </Card>
    </div>
  )
}
