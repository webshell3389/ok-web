import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Select, Button, Space, InputNumber, message } from 'antd'
import { createTask, getAgentGroupList, getSupportMode } from '../../api/task'

export default function TaskCreate() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const supportModes = [{ value: 'preview', label: '预览式外呼' }, { value: 'predictive', label: '预测式外呼' }, { value: 'ai', label: 'AI外呼' }]

  const onFinish = async (values: any) => {
    try {
      await createTask(values)
      message.success('任务创建成功')
      navigate('/task-manage')
    } catch {
      message.error('创建失败')
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>创建任务</h2>
      <Card style={{ maxWidth: 800 }}>
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item name="name" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item name="callMode" label="呼叫方式" rules={[{ required: true, message: '请选择呼叫方式' }]}>
            <Select placeholder="请选择呼叫方式" options={supportModes} />
          </Form.Item>
          <Form.Item name="callList" label="呼叫名单"><Input placeholder="请输入呼叫名单" /></Form.Item>
          <Form.Item name="agentGroup" label="班组"><Input placeholder="请输入班组" /></Form.Item>
          <Form.Item name="maxConcurrency" label="最大并发"><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
          <Form.Item name="callRatio" label="呼叫倍率"><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="type" hidden><Input /></Form.Item>
          <Form.Item style={{ display: 'none' }}>
            <Button onClick={() => { getSupportMode(); getAgentGroupList() }}>加载配置</Button>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => navigate('/task-manage')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
