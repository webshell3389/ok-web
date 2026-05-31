import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Form, Input, Select, Space, message } from 'antd'
import { getCustomer, saveCustomer } from '../../api/customer'

export default function CustomerForm({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  useEffect(() => { if (mode === 'edit' && id) getCustomer(id).then((res:any)=>form.setFieldsValue(res?.data || res?.data?.data || {})) }, [id, mode])
  return <Card title={mode === 'create' ? '新增客户' : '编辑客户'}><Form form={form} layout="vertical" onFinish={async (v)=>{ await saveCustomer({ ...v, id }); message.success('已保存'); navigate('/customers') }}><Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="gender" label="性别"><Select options={[{ value: 'male', label: '男' }, { value: 'female', label: '女' }]} /></Form.Item><Form.Item name="type" label="客户类型"><Input /></Form.Item><Form.Item name="phone" label="联系号码"><Input /></Form.Item><Form.Item name="otherPhone" label="其它号码"><Input /></Form.Item><Form.Item name="remark" label="备注"><Input.TextArea rows={4} /></Form.Item><Space><Button type="primary" htmlType="submit">保存</Button><Button onClick={()=>navigate('/customers')}>取消</Button></Space></Form></Card>
}
