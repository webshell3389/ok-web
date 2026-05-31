export function formatUnixTime(value?: number | string | null) {
  if (value === undefined || value === null || value === '') return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  const d = new Date(n < 1e12 ? n * 1000 : n)
  if (Number.isNaN(d.getTime())) return String(value)
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function formatPercent(value?: number | string | null) {
  if (value === undefined || value === null || value === '') return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return `${n.toFixed(n % 1 === 0 ? 0 : 2)}%`
}

export function getApiErrorMessage(err: any) {
  return err?.response?.data?.result?.msg || err?.response?.data?.msg || err?.message || '请求失败'
}

export function unwrapRows(res: any) {
  return res?.data?.rows || res?.data?.list || res?.data?.data?.rows || res?.data?.data?.list || []
}
