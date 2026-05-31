import { Card, Spin } from 'antd'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  loading?: boolean
  color?: string
}

export default function StatCard({ title, value, icon, loading, color = '#1677ff' }: StatCardProps) {
  return (
    <Card bordered={false} style={{ borderRadius: 12 }}>
      <Spin spinning={loading}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              color,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#666' }}>{title}</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>{value}</div>
          </div>
        </div>
      </Spin>
    </Card>
  )
}
