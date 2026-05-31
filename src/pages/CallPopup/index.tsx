import { useState, useEffect, useRef, useCallback } from 'react'
import { Input, Tag, Spin, message, Badge, Button } from 'antd'
import { SoundOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { getClientInfo, queryLocation } from '../../api/crm'
import request from '../../api/request'

// ── 类型 ──
interface AgentInfo {
  id: string; StaffNo: string; Name: string; status: string; sip: string
  channel: string; channelParam: string; Extension?: string
}
interface ClientData {
  name?: string; number1?: string; number2?: string; sex?: number
  batchName?: string; typeName?: string; remark?: string
}
interface LocationInfo {
  area?: string; city?: string; spName?: string
}
interface MemberStatus {
  key: string; StaffNo: string; Name: string
  w?: string; s?: string; l?: string; sipStatus?: string
}
interface CallRecord {
  number: string; time: string
}

// ── 常量 ──
const MAX_CALLS = 10
const WS_MAP: Record<string, string> = { '0': '离线', '1': '在线', '2': '忙碌', '3': '离开' }
const SS_MAP: Record<string, string> = { '0': '空闲', '1': '呼出', '2': '呼入', '3': '振铃', '4': '回铃', '5': '处理中' }

export default function CallPopup() {
  // 座席
  const [agent, setAgent] = useState<AgentInfo | null>(null)
  const [myStatus, setMyStatus] = useState<{ w: string; s: string; l: string; sipStatus: string | null } | null>(null)
  const [sseConnected, setSseConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)
  const statusRef = useRef(myStatus)
  statusRef.current = myStatus

  // 号码/查询
  const [phone, setPhone] = useState('')
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [location, setLocation] = useState<LocationInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // 来电记录
  const [incomingCalls, setIncomingCalls] = useState<CallRecord[]>([])

  // ── 加载座席信息 ──
  useEffect(() => {
    request.post('index.php?m=common&c=agentActions').then((res: any) => {
      if (res?.result?.error === 0 && res?.agent) {
        setAgent(res.agent)
        const me = (res.members || []).find((m: MemberStatus) => m.StaffNo === res.agent.StaffNo)
        if (me) setMyStatus({ w: me.w || '0', s: me.s || '0', l: me.l || '0', sipStatus: me.sipStatus ?? null })
      }
    }).catch(() => {})
  }, [])

  // ── SSE ──
  useEffect(() => {
    if (!agent) return
    if (esRef.current) { esRef.current.close(); esRef.current = null }

    const { channel, channelParam } = agent
    const url = `/ev/${channel}?U=${channelParam}&_=${Date.now()}&tag=&time=&eventid=`
    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => setSseConnected(true)
    es.onerror = () => setSseConnected(false)

    es.onmessage = (e) => {
      try {
        const wrapper = JSON.parse(e.data)
        const text = JSON.parse(wrapper.text)
        handlePushMessage(text)
      } catch { /* ignore */ }
    }

    return () => { es.close(); esRef.current = null; setSseConnected(false) }
  }, [agent])

  // ── 处理SSE消息 ──
  const handlePushMessage = useCallback((msg: any) => {
    const type = parseInt(msg.type, 10)
    const body = msg.body
    const st = statusRef.current

    switch (type) {
      case 0: // CALL
        if (body?.number) {
          const num = body.number.replace(/[^0-9]/g, '')
          if (num) {
            setIncomingCalls(prev => [{ number: num, time: new Date().toLocaleTimeString() }, ...prev].slice(0, MAX_CALLS))
            doPopupSearch(num)
          }
        }
        break
      case 1: case 2: // STATUS
        if (body) {
          setMyStatus({
            w: body.work_status ?? body.w ?? st?.w ?? '0',
            s: body.server_status ?? body.s ?? st?.s ?? '0',
            l: body.signin_status ?? body.is_signin ?? body.l ?? st?.l ?? '0',
            sipStatus: body.sip_status ?? body.sipStatus ?? st?.sipStatus ?? null,
          })
        }
        break
      case 3: break // RECORD
    }
  }, [])

  // ── 查询（客户信息 + 归属地）──
  const doPopupSearch = async (num: string) => {
    setPhone(num)
    setLoading(true)
    setSearched(true)
    setLocation(null)

    try {
      const [clientRes, locRes]: any = await Promise.all([
        getClientInfo({ number: num, isPopup: '1' }),
        queryLocation(num),
      ])

      // 归属地
      let loc: LocationInfo | null = null
      if (locRes?.data) {
        const d = Array.isArray(locRes.data) ? locRes.data[0] : locRes.data
        if (d?.area || d?.city) loc = { area: d.area, city: d.city, spName: d.spName }
      }
      setLocation(loc)

      // 客户信息
      if (clientRes?.result?.error === 0) {
        if (clientRes?.data?.name || clientRes?.data?.number1) {
          setClientData(clientRes.data)
        } else {
          setClientData({ number1: num, name: '未知客户' })
        }
      } else if (clientRes?.result?.error === 3) {
        message.error('会话已过期，请重新登录')
        setClientData(null)
      } else {
        setClientData({ number1: num, name: '未知客户' })
      }
    } catch {
      setClientData({ number1: num, name: '查询失败' })
    }
    setLoading(false)
  }

  const handleSearch = () => {
    const n = phone.trim()
    if (!n) { message.warning('请输入电话号码'); return }
    doPopupSearch(n)
  }

  // ── 状态值 ──
  const ws = myStatus ? WS_MAP[myStatus.w] || '--' : null
  const ss = myStatus ? SS_MAP[myStatus.s] || '--' : null
  const sipOk = myStatus?.sipStatus === '1'

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* ═══ 状态栏 ═══ */}
      {agent && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
          padding: '8px 10px', marginBottom: 10,
          background: '#fafafa', borderRadius: 6, fontSize: 13,
        }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{agent.StaffNo}</span>
          {agent.sip && agent.sip !== agent.StaffNo && <span style={{ color: '#999' }}>分机 {agent.sip}</span>}
          <Tag>{ws}</Tag>
          <Tag>{ss}</Tag>
          <Tag color={myStatus?.l === '1' ? 'green' : 'default'}>{myStatus?.l === '1' ? '已签入' : '未签入'}</Tag>
          <Tag color={sipOk ? 'green' : 'default'}>SIP {sipOk ? '已注册' : '未注册'}</Tag>
          <Badge status={sseConnected ? 'success' : 'error'} text={sseConnected ? '推送已连接' : '推送断开'} />
        </div>
      )}

      {/* ═══ 搜索框 ═══ */}
      <Input.Search
        size="large"
        placeholder="输入电话号码查询"
        enterButton="查询"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        onSearch={handleSearch}
        loading={loading}
        style={{ marginBottom: 10 }}
      />

      {/* ═══ 加载中 ═══ */}
      <Spin spinning={loading}>
        {/* 客户信息卡 */}
        {searched && !loading && clientData && (
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8', overflow: 'hidden' }}>

            {/* 号码 — 大号突出 */}
            <div style={{
              background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
              color: '#fff', padding: '16px 16px 12px',
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>
                {clientData.number1 || '--'}
              </div>
              {/* 归属地 */}
              {location && (location.area || location.city) && (
                <div style={{ fontSize: 14, marginTop: 4, opacity: 0.85 }}>
                  <EnvironmentOutlined style={{ marginRight: 4 }} />
                  {[location.area, location.city, location.spName].filter(Boolean).join(' - ')}
                </div>
              )}
              {/* 客户名 */}
              {clientData.name && (
                <div style={{
                  display: 'inline-block', marginTop: 8,
                  background: 'rgba(255,255,255,0.2)', borderRadius: 4,
                  padding: '2px 10px', fontSize: 15,
                }}>
                  {clientData.name}
                </div>
              )}
              {/* 备注（和号码同款大号白字） */}
              {clientData.remark && (
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1, marginTop: 8, wordBreak: 'break-all' }}>
                  {clientData.remark}
                </div>
              )}
            </div>

            {/* 详情 — 手机端友好的大间距表格 */}
            <div style={{ padding: '12px 16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, lineHeight: 1.8 }}>
                <tbody>
                  {clientData.name && (
                    <RowItem label="客户姓名" value={clientData.name} />
                  )}
                  <RowItem label="性　别" value={
                    clientData.sex === 1 ? '男' : clientData.sex === 2 ? '女' : '--'
                  } />
                  <RowItem label="号码1" value={clientData.number1 || '--'} />
                  {clientData.number2 && <RowItem label="号码2" value={clientData.number2} />}
                  <RowItem label="客户类型" value={clientData.typeName || '未分类'} />
                  <RowItem label="所属批次" value={clientData.batchName || '--'} />
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!searched && incomingCalls.length === 0 && (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '60px 0', fontSize: 14 }}>
            等待来电自动弹屏，或输入号码查询
          </div>
        )}
        {searched && !loading && !clientData && (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '40px 0', fontSize: 14 }}>
            未找到客户信息
          </div>
        )}
      </Spin>

      {/* ═══ 来电记录（最多10条，显示在最下面）═══ */}
      {incomingCalls.length > 0 && (
        <div style={{ marginTop: 10, background: '#fff', borderRadius: 6, border: '1px solid #f0f0f0' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 12px', borderBottom: '1px solid #f0f0f0',
            fontSize: 13, fontWeight: 500, color: '#666',
          }}>
            <span>📞 来电记录</span>
            <Button size="small" type="text" onClick={() => setIncomingCalls([])} style={{ fontSize: 12, color: '#999' }}>清空</Button>
          </div>
          {incomingCalls.map((call, i) => (
            <div key={i} onClick={() => doPopupSearch(call.number)}
              style={{
                display: 'flex', alignItems: 'center', padding: '8px 12px',
                borderBottom: i < incomingCalls.length - 1 ? '1px solid #f5f5f5' : 'none',
                cursor: 'pointer', background: i === 0 ? '#fff8f8' : 'transparent',
              }}
            >
              <SoundOutlined style={{ color: '#ff4d4f', marginRight: 8, fontSize: 16 }} />
              <span style={{ fontSize: 15, fontWeight: i === 0 ? 600 : 400, flex: 1 }}>{call.number}</span>
              <span style={{ color: '#bbb', fontSize: 12 }}>{call.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 表格行组件（移动端友好） ──
function RowItem({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{
        whiteSpace: 'nowrap', color: '#999', padding: '6px 12px 6px 0',
        verticalAlign: 'top', width: '5.5em',
      }}>{label}</td>
      <td style={{ padding: '6px 0', color: '#333', wordBreak: 'break-all' }}>{value}</td>
    </tr>
  )
}
