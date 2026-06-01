import { useState } from 'react'
import { Card, Upload, message, Result, Spin } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import request from '../../api/request'
import { createTask } from '../../api/task'

const { Dragger } = Upload

export default function CustomerImport() {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'importing' | 'creating' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)

  const handleUpload = async (file: File) => {
    const taskName = file.name.replace(/\.(xlsx|xls)$/i, '')
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

      // 第3步：自动创建外呼任务
      setStatus('creating')
      const taskRes: any = await createTask({
        name: taskName,
        calleeList: batch,
        multiplier: 1,
        callType: 0,
        maxConcurrence: 0,
        concurrenceMode: 0,
      })

      if (taskRes?.result?.error !== 0) {
        // 导入成功但任务创建失败，提示用户手动创建
        setResult({
          msg: `客户资料已导入成功（批次：${taskName}），但任务创建失败，请手动创建外呼任务`,
          warn: true,
        })
        setStatus('done')
        message.warning('客户已导入，任务创建失败，请手动创建')
        return
      }

      setResult({ msg: `客户资料导入成功，外呼任务「${taskName}」已自动创建` })
      setStatus('done')
      message.success('导入完成，外呼任务已创建')
    } catch (e: any) {
      setStatus('error')
      setResult({ error: e.message || '导入失败' })
      message.error(e.message || '导入失败')
    }
    return false
  }

  if (status === 'done') {
    return (
      <Card title="客户导入">
        <Result
          status={result?.warn ? 'warning' : 'success'}
          title={result?.warn ? '导入完成' : '导入成功'}
          subTitle={result?.msg || '操作成功'}
          extra={[
            <a key="task" href="/tasks" style={{ marginRight: 16 }}>查看外呼任务</a>,
            <a key="again" onClick={() => { setStatus('idle'); setResult(null) }} style={{ cursor: 'pointer' }}>继续导入</a>,
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
            <a key="retry" onClick={() => { setStatus('idle'); setResult(null) }} style={{ cursor: 'pointer' }}>重试</a>,
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
          <p className="ant-upload-text">点击或拖拽 Excel 文件到此处</p>
          <p className="ant-upload-hint">上传后自动导入客户资料并创建外呼任务</p>
        </Dragger>
      )}

      {status !== 'idle' && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
            {status === 'uploading' && '正在上传文件...'}
            {status === 'importing' && '正在导入客户资料...'}
            {status === 'creating' && '正在创建外呼任务...'}
          </p>
        </div>
      )}
    </Card>
  )
}
