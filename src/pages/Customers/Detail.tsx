import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Descriptions } from 'antd'
import { getCustomer } from '../../api/customer'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<any>({})
  useEffect(() => { if (id) getCustomer(id).then((res:any)=>setCustomer(res?.data || res?.data?.data || {})) }, [id])
  return <Card title="客户详情" extra={<Button onClick={()=>navigate(-1)}>返回</Button>}><Descriptions bordered column={2}><Descriptions.Item label="名称">{customer.name || '-'}</Descriptions.Item><Descriptions.Item label="性别">{customer.gender || '-'}</Descriptions.Item><Descriptions.Item label="客户类型">{customer.type || '-'}</Descriptions.Item><Descriptions.Item label="联系号码">{customer.phone || '-'}</Descriptions.Item><Descriptions.Item label="其它号码">{customer.otherPhone || '-'}</Descriptions.Item><Descriptions.Item label="备注">{customer.remark || '-'}</Descriptions.Item></Descriptions></Card>
}
