import { useEffect, useState } from 'react'
import { Button, Card, Form, Input, Select, Space, Table, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { queryCallLogs } from '../../api/cdr'
import { unwrapRows, formatUnixTime, getApiErrorMessage } from '../../utils/format'
import { CallTypeText } from '../../components/StatusText'

export default function CdrCalls() {
  const [form] = Form.useForm(); const [rows, setRows] = useState<any[]>([]); const [loading, setLoading] = useState(false); const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const load = (current=1,pageSize=20)=>{ setLoading(true); queryCallLogs({ p: JSON.stringify({ pagination:{current,pageSize}, filter: form.getFieldsValue() }) }).then((res:any)=>{const data=unwrapRows(res); setRows(data); setPagination({current,pageSize,total:res?.data?.total||data.length})}).catch(e=>message.error(getApiErrorMessage(e))).finally(()=>setLoading(false)) }
  useEffect(()=>{load()},[])
  return <div><Space style={{ marginBottom:16, width:'100%', justifyContent:'space-between' }}><h2 style={{ margin:0 }}>通话清单</h2><Button icon={<DownloadOutlined />}>导出</Button></Space><Card style={{ marginBottom:16 }}><Form form={form} layout="inline" onFinish={()=>load(1)}><Form.Item name="keyword"><Input placeholder="号码/坐席" /></Form.Item><Form.Item name="type"><Select allowClear style={{ width: 120 }} options={[{value:'inbound',label:'呼入'},{value:'outbound',label:'呼出'},{value:'internal',label:'内呼'}]} /></Form.Item><Form.Item><Button type="primary" htmlType="submit">查询</Button></Form.Item></Form></Card><Card><Table rowKey={(record)=>record.id || `${record.answerTime}-${record.caller}-${record.callee}`} loading={loading} dataSource={rows} pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, onChange: (c,p)=>load(c,p||20) }} columns={[{title:'坐席',dataIndex:'employeeID'},{title:'任务',dataIndex:'task'},{title:'业务类型',dataIndex:'serviceType',render:(v:string)=><CallTypeText type={v} />},{title:'开始时间',dataIndex:'answerTime',render:formatUnixTime},{title:'结束时间',dataIndex:'endTime',render:formatUnixTime},{title:'主叫号码',dataIndex:'caller'},{title:'被叫号码',dataIndex:'callee'},{title:'时长(s)',dataIndex:'timeLength'},{title:'费用(元)',dataIndex:'fee'},{title:'挂断原因',dataIndex:'releaseCause'},{title:'操作',render:()=>'-'}]}/></Card></div>
}
