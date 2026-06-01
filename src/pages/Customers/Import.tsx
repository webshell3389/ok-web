import { useState, useEffect } from 'react'
import { Card, Upload, Button, message, Result, Spin, Input, Form, Select } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import request from '../../api/request'
import { createTask, getAgentGroupList, getSupportMode } from '../../api/task'

const { Dragger } = Upload

export default function CustomerImport() {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'importing' | 'creating' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)
  const [form] = Form.useForm()
  const [groups, setGroups] = useState<any[]>([])
  const [modes, setModes] = useState<any[]>([])
  const [importData, setImportData] = useState<any>(null)

  useEffect(() => {
    getAgentGroupList().then((res: any) => setGroups(res?.data || [])).catch(() => {})
    getSupportMode().then((res: any) => setModes(res?.data || [])).catch(() => {})
  }, [])

  const handleUpload = async (file: File) => {
    const name = file.name.replace(/\.(xlsx|xls)$/i, '')
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

      const remoteFile = uploadRes?.data?.file
      if (!remoteFile) throw new Error('未获取到文件名')

      // 第2步：导入客户资料
      setStatus('importing')
      const batch = Math.floor(Date.now() / 1000)
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
          batch,
        }
      )

      if (importRes?.result?.error !== 0) {
        throw new Error(importRes?.result?.msg || '导入失败')
      }

      setImportData({ batch, fileName: name, importRes })
      // 显示创建任务表单
      setStatus('idle')
      form.setFieldsValue({ name })
      message.success('客户资料导入成功，请确认外呼任务设置')
    } catch (e: any) {
      setStatus('error')
      setResult({ error: e.message || '导入失败' })
      message.error(e.message || '导入失败')
    }
    return false
  }

  const handleCreateTask = async () => {
    if (!importData) return
    try {
      const values = await form.validateFields()
      setStatus('creating')

      await createTask({
        name: values.name,
        calleeList: importData.batch,
        agentGroup: values.agentGroup || 0,
        callType: values.callType || 0,
        multiplier: values.multiplier || 1,
        maxConcurrence: values.maxConcurrence || 0,
        concurrenceMode: values.concurrenceMode || 0,
      })

      setResult({ msg: `客户资料导入成功，外呼任务「${values.name}」已创建` })
      setStatus('done')
      message.success('外呼任务创建成功')
    } catch (e: any) {
      setStatus('error')
      setResult({ error: e.message || '创建任务失败' })
      message.error(e.message || '创建任务失败')
    }
  }

  if (status === 'done') {
    return (
      <Card title="客户导入">
        <Result
          status="success"
          title="导入完成"
          subTitle={result?.msg || '操作成功'}
          extra={[
            <Button type="primary" key="back" onClick={() => { setStatus('idle'); setResult(null); setImportData(null) }}>
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
          title="操作失败"
          subTitle={result?.error || '未知错误'}
          extra={[
            <Button type="primary" key="retry" onClick={() => { setStatus('idle'); setResult(null); setImportData(null) }}>
              重试
            </Button>,
          ]}
        />
      </Card>
    )
  }

  // 导入成功后显示创建任务表单
  if (importData) {
    return (
      <Card title="客户导入 - 创建外呼任务">
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
          ✅ 客户资料已导入成功，批次：{importData.fileName}
        </div>
        <Form form={form} layout="vertical" style={{ maxWidth: 500 }}>
          <Form.Item name="name" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item name="agentGroup" label="坐席班组">
            <Select placeholder="选择坐席班组" allowClear options={groups.map((g: any) => ({ value: g.id, label: g.name }))} />
          </Form.Item>
          <Form.Item name="callType" label="呼叫方式">
            <Select placeholder="选择呼叫方式" allowClear options={modes.map((m: any) => ({ value: m.id, label: m.name }))} />
          </Form.Item>
          <Form.Item name="multiplier" label="倍率">
            <Input type="number" placeholder="默认1" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleCreateTask} loading={status === 'creating'}>
              确认创建任务
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => { setImportData(null); setStatus('idle') }}>
              跳过，稍后创建
            </Button>
          </Form.Item>
        </Form>
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
          <p className="ant-upload-hint">上传后自动导入客户资料，并引导创建外呼任务</p>
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
