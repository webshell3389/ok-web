import { useState } from 'react'
import { Card, Upload, Button, message, Result, Spin } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import request from '../../api/request'

const { Dragger } = Upload

export default function CustomerImport() {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'importing' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)

  const handleUpload = async (file: File) => {
    setStatus('uploading')
    try {
      // 第1步：上传文件
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes: any = await request.post(
        'index.php?m=crm&c=clientInfo&f=uploadFile',
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      if (uploadRes?.result?.error !== 0) {
        throw new Error(uploadRes?.result?.msg || '上传失败')
      }

      const fileName = uploadRes?.data?.file
      if (!fileName) throw new Error('未获取到文件名')

      // 第2步：自动导入
      setStatus('importing')
      const importRes: any = await request.post(
        'index.php?m=crm&c=clientInfo&f=import',
        {
          allocationStatus: -1,
          add2CalleeList: 1,
          file: JSON.stringify([{
            name: file.name,
            size: file.size,
            type: file.type,
            response: uploadRes,
            status: 'done',
            percent: 100,
          }]),
          batch: Math.floor(Date.now() / 1000),
        }
      )

      if (importRes?.result?.error !== 0) {
        throw new Error(importRes?.result?.msg || '导入失败')
      }

      setResult(importRes?.data || { msg: '导入成功' })
      setStatus('done')
      message.success('客户资料导入成功')
    } catch (e: any) {
      setStatus('error')
      setResult({ error: e.message || '导入失败' })
      message.error(e.message || '导入失败')
    }
    return false // 阻止antd Upload自动上传
  }

  if (status === 'done') {
    return (
      <Card title="客户导入">
        <Result
          status="success"
          title="导入成功"
          subTitle={result?.msg || '客户资料已成功导入'}
          extra={[
            <Button type="primary" key="back" onClick={() => { setStatus('idle'); setResult(null) }}>
              继续导入
            </Button>,
          ]}
        />
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card title="客户导入">
        <Result
          status="error"
          title="导入失败"
          subTitle={result?.error || '未知错误'}
          extra={[
            <Button type="primary" key="retry" onClick={() => { setStatus('idle'); setResult(null) }}>
              重试
            </Button>,
          ]}
        />
      </Card>
    )
  }

  return (
    <Card title="客户导入">
      {status === 'idle' && (
        <Dragger
          accept=".xlsx,.xls"
          showUploadList={false}
          beforeUpload={(file) => {
            handleUpload(file)
            return false
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽 Excel 文件到此处上传</p>
          <p className="ant-upload-hint">支持 .xlsx / .xls 格式，上传后自动导入</p>
        </Dragger>
      )}

      {(status === 'uploading' || status === 'importing') && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, fontSize: 16 }}>
            {status === 'uploading' ? '正在上传文件...' : '正在导入客户资料...'}
          </p>
        </div>
      )}
    </Card>
  )
}
