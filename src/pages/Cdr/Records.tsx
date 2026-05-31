import { useEffect, useState } from 'react'
import { Button, Card, Form, Input, Space, Table, message } from 'antd'
import { queryRecords } from '../../api/cdr'
import { unwrapRows, formatUnixTime, getApiErrorMessage } from '../../utils/format'

export default function CdrRecords() {
  const [form] = Form.useForm(); const [rows, setRows] = useState<any[]>([]); const [loading, setLoading] = useState(false); const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const load = (current=1,pageSize=20)=>{ setLoading(true); queryRecords({ p: JSON.stringify({ pagination:{current,pageSize}, filter: form.getFieldsValue() }) }).then((res:any)=>{const data=unwrapRows(res); setRows(data); setPagination({current,pageSize,total:res?.data?.total||data.length})}).catch(e=>message.error(getApiErrorMessage(e))).finally(()=>setLoading(false)) }
  useEffect(()=>{load()},[])
  return <div><h2 style={{ marginTop:0 }}>录音清单</h2><Card style={{ marginBottom:16 }}><Form form={form} layout="inline" onFinish={()=>load(1)}><Form.Item name="keyword"><Input placeholder="号码/坐席" /></Form.Item><Form.Item><Button type="primary" htmlType="submit">查询</Button></Form.Item></Form></Card><Card><Table rowKey={(record)=>record.id || `${record.startTime}-${record.caller}-${record.callee}`} loading={loading} dataSource={rows} pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, onChange: (c,p)=>load(c,p||20) }} columns={[{title:'坐席',dataIndex:'employeeID'},{title:'任务',dataIndex:'task'},{title:'开始时间',dataIndex:'startTime',render:formatUnixTime},{title:'结束时间',dataIndex:'endTime',render:formatUnixTime},{title:'主叫号码',dataIndex:'caller'},{title:'被叫号码',dataIndex:'callee'},{title:'时长(s)',dataIndex:'timeLength'},{title:'费用(元)',dataIndex:'fee'},{title:'操作',render:(_:any,record:any)=> <Space><Button type="link" onClick={()=>record.url ? window.open(record.url) : message.info('当前记录未返回录音文件地址')}>下载</Button><Button type="link" onClick={()=>record.url ? window.open(record.url) : message.info('当前记录未返回录音文件地址')}>试听</Button></Space>}]}/></Card></div>
}
