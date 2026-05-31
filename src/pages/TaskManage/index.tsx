import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Space, message, Card, Modal, Input, Select, Form } from 'antd'
import { PlusOutlined, PlayCircleOutlined, PauseCircleOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { queryTasks, startTask, stopTask, deleteTask } from '../../api/task'
import { unwrapRows, formatUnixTime, formatPercent, getApiErrorMessage } from '../../utils/format'
import { TaskStatusText } from '../../components/StatusText'

export default function TaskManage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  const load = (current = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    const filter = form.getFieldsValue()
    queryTasks({ p: JSON.stringify({ pagination: { current, pageSize }, filter }) })
      .then((res: any) => {
        const rows = unwrapRows(res)
        setTasks(rows)
        setPagination((p) => ({ ...p, current, pageSize, total: res?.data?.total || res?.data?.data?.total || rows.length }))
      })
      .catch((err) => message.error(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const timer = setInterval(() => load(pagination.current, pagination.pageSize), 10000)
    return () => clearInterval(timer)
  }, [])

  const handleAction = async (fn: (id: string) => Promise<any>, id: string, success: string) => {
    try {
      await fn(id)
      message.success(success)
      load()
    } catch (e) {
      message.error(getApiErrorMessage(e))
    }
  }

  const columns = useMemo(() => ([
    { title: '名称', dataIndex: 'name' },
    { title: '创建时间', dataIndex: 'createTime', render: (v: any) => formatUnixTime(v) },
    { title: '创建人', dataIndex: 'creator' },
    { title: '呼叫方式', dataIndex: 'callType' },
    { title: '呼叫名单', dataIndex: 'calleeList' },
    { title: '呼叫对象', dataIndex: 'agentGroup' },
    { title: '状态', dataIndex: 'runningStatus', render: (v: string) => <TaskStatusText status={v} /> },
    { title: '总数', dataIndex: 'calleeAmount' },
    { title: '剩余数量', dataIndex: 'remainingNumber' },
    { title: '进度', dataIndex: 'completionRate', render: (v: any) => formatPercent(v) },
    { title: '当前并发', dataIndex: 'concurrent' },
    { title: '最大并发', dataIndex: 'maxConcurrent' },
    { title: '空闲坐席', dataIndex: 'idleAgent' },
    { title: '坐席总数', dataIndex: 'totalAgent' },
    { title: '备注', dataIndex: 'remark' },
    {
      title: '操作', render: (_: any, record: any) => <Space>
        <Button type="link" onClick={() => navigate(`/task-manage/${record.taskId || record.id}`)}>详情</Button>
        <Button type="link" onClick={() => navigate(`/task-manage/${record.taskId || record.id}/edit`)}>编辑</Button>
        <Button type="link" icon={<PlayCircleOutlined />} onClick={() => handleAction(startTask, record.taskId || record.id, '任务已启动')}>启动</Button>
        <Button type="link" icon={<PauseCircleOutlined />} onClick={() => handleAction(stopTask, record.taskId || record.id, '任务已暂停/停止')}>暂停/停止</Button>
        <Button danger type="link" icon={<DeleteOutlined />} onClick={() => Modal.confirm({ title: '确认删除任务？', onOk: () => handleAction(deleteTask, record.taskId || record.id, '任务已删除') })}>删除</Button>
      </Space>
    },
  ]), [navigate])

  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
      <Space><h2 style={{ margin: 0 }}>任务管理</h2></Space>
      <Space>
        <Button icon={<ReloadOutlined />} onClick={() => load()}>刷新</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/task-manage/create')}>创建任务</Button>
      </Space>
    </div>
    <Card style={{ marginBottom: 16 }}>
      <Form form={form} layout="inline" onFinish={() => load(1)}>
        <Form.Item name="name"><Input placeholder="任务名称" /></Form.Item>
        <Form.Item name="status"><Select allowClear placeholder="状态" style={{ width: 160 }} options={[{ value: 'running', label: '运行中' }, { value: 'paused', label: '已暂停' }, { value: 'stopped', label: '已停止' }, { value: 'finished', label: '已完成' }]} /></Form.Item>
        <Form.Item><Button type="primary" htmlType="submit">查询</Button></Form.Item>
        <Form.Item><Button onClick={() => { form.resetFields(); load(1) }}>重置</Button></Form.Item>
      </Form>
    </Card>
    <Card><Table rowKey={(record) => record.taskId || record.id} columns={columns} dataSource={tasks} loading={loading} pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, onChange: (c, p) => load(c, p || 20) }} /></Card>
  </div>
}
