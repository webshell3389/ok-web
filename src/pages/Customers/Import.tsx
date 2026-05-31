import { Card, Alert } from 'antd'

export default function CustomerImport() {
  return <Card title="客户导入"><Alert type="info" showIcon message="当前仅提供导入页面占位。由于上传接口参数未完全确认，请先根据后端约定补充上传字段后再接入文件上传。页面不会崩溃。" /></Card>
}
