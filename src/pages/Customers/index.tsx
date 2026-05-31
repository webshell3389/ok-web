import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, Select, Space, Table, Modal, message } from 'antd'
import { PlusOutlined, UploadOutlined, DownloadOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { deleteCustomer, deleteCustomers, exportCustomers, queryCustomers } from '../../api/customer'
import { unwrapRows, formatUnixTime, getApiErrorMessage } from '../../utils/format'

export default function Customers() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const load = (current = 1, pageSize = 20) => {
    setLoading(true)
    queryCustomers({ p: JSON.stringify({ pagination: { current, pageSize }, filter: form.getFieldsValue() }) })
      .then((res: any) => {
        const data = unwrapRows(res)
        setRows(data)
        setPagination({ current, pageSize, total: res?.data?.total || data.length })
      }).catch((e) => message.error(getApiErrorMessage(e))).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])
  const delOne = (id: string) => Modal.confirm({ title: '确认删除？', onOk: async () => { await deleteCustomer(id); message.success('已删除'); load(pagination.current, pagination.pageSize) } })
  const delBatch = () => Modal.confirm({ title: '确认批量删除？', onOk: async () => { await deleteCustomers(selectedRowKeys.map(String)); message.success('已删除'); setSelectedRowKeys([]); load() } })
  return <div>
    <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
      <h2 style={{ margin: 0 }}>客户资料</h2>
      <Space>
        <Button icon={<ReloadOutlined />} onClick={() => load(pagination.current, pagination.pageSize)}>刷新</Button>
        <Button icon={<PlusOutlined />} type="primary" onClick={() => navigate('/customers/create')}>新增</Button>
        <Button icon={<UploadOutlined />} onClick={() => navigate('/customers/import')}>导入</Button>
        <Button icon={<DownloadOutlined />} onClick={() => exportCustomers({ p: JSON.stringify({ filter: form.getFieldsValue() }) }).then(() => message.success('已发起导出'))}>导出</Button>
        <Button danger icon={<DeleteOutlined />} onClick={delBatch} disabled={!selectedRowKeys.length}>批量删除</Button>
      </Space>
    </Space>
    <Card style={{ marginBottom: 16 }}><Form form={form} layout="inline" onFinish={() => load(1)}><Form.Item name="keyword"><Input placeholder="名称/号码" /></Form.Item><Form.Item name="gender"><Select allowClear style={{ width: 120 }} options={[{ value: 'male', label: '男' }, { value: 'female', label: '女' }]} placeholder="性别" /></Form.Item><Form.Item><Button type="primary" htmlType="submit">查询</Button></Form.Item></Form></Card>
    <Card><Table rowKey="id" loading={loading} dataSource={rows} pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, onChange: (c,p)=>load(c,p||20) }} rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }} columns={[{title:'#id',dataIndex:'#id'},{title:'名称',dataIndex:'name'},{title:'性别',dataIndex:'gender'},{title:'客户类型',dataIndex:'type'},{title:'联系号码',dataIndex:'number1'},{title:'其它号码',dataIndex:'number2'},{title:'创建时间',dataIndex:'ctime',render:formatUnixTime},{title:'最后通话时间',dataIndex:'lastTalkTime',render:formatUnixTime},{title:'批次',dataIndex:'batchID'},{title:'分配至',dataIndex:'groupID'},{title:'备注',dataIndex:'remark'},{title:'操作',render:(_:any,r:any)=><Space><Button type="link" onClick={()=>navigate(`/customers/${r.id}`)}>详情</Button><Button type="link" onClick={()=>navigate(`/customers/${r.id}/edit`)}>编辑</Button><Button danger type="link" onClick={()=>delOne(r.id)}>删除</Button></Space>}]}/></Card>
  </div>
}
