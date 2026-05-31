# Merchant Callcenter Full Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/tmp/wv2` 新前端中完整补齐商户呼叫中心后台，包括坐席监控、客户资料、外呼任务、通话清单和录音清单，并推送到 GitHub。

**Architecture:** 保持现有 React + Vite + Ant Design 架构，新增聚焦的 API 层、通用表格/查询组件和业务页面。所有列表统一使用 `pagination + filter` 请求结构，页面负责状态管理，API 文件只负责封装后端接口。

**Tech Stack:** React 19、TypeScript、Vite、Ant Design 6、axios、qs、dayjs、react-router-dom。

---

## File Structure

### Create

- `src/api/customer.ts`：客户资料 API。
- `src/api/cdr.ts`：通话清单与录音清单 API。
- `src/components/RemoteTable.tsx`：通用远程表格。
- `src/components/SearchDrawer.tsx`：通用查询抽屉。
- `src/components/StatusText.tsx`：状态枚举展示。
- `src/utils/format.ts`：时间、数字、后端响应格式化工具。
- `src/pages/Customers/index.tsx`：客户资料列表。
- `src/pages/Customers/Detail.tsx`：客户详情。
- `src/pages/Customers/Form.tsx`：客户新增/编辑。
- `src/pages/Customers/Import.tsx`：客户导入。
- `src/pages/Cdr/Calls.tsx`：通话清单。
- `src/pages/Cdr/Records.tsx`：录音清单。

### Modify

- `src/App.tsx`：新增客户资料、通话清单、录音清单路由。
- `src/layouts/MainLayout.tsx`：新增商户后台菜单结构。
- `src/api/agent.ts`：补坐席监控基础信息、状态操作入口。
- `src/api/task.ts`：补外呼任务基础信息、启动、暂停、删除、统计接口。
- `src/pages/AgentMonitor/index.tsx`：补磁贴/列表、状态轮询、查询。
- `src/pages/TaskManage/index.tsx`：补完整任务列表、查询、自动刷新、操作。
- `src/pages/TaskManage/Create.tsx`：补任务创建表单。
- `src/pages/TaskManage/Detail.tsx`：补任务详情与统计。

---

## Task 1: GitHub Remote Setup

**Files:**
- Modify Git metadata under `/tmp/wv2/.git`

- [ ] **Step 1: Check repository state**

Run:

```bash
git status --short || true
git remote -v || true
```

Expected: if `.git` does not exist, `git status` reports not a repository.

- [ ] **Step 2: Initialize Git if needed**

Run:

```bash
test -d .git || git init
```

Expected: `.git` exists.

- [ ] **Step 3: Configure GitHub remote**

Run:

```bash
git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:webshell3389/ok-web.git
git remote -v
```

Expected: origin points to `git@github.com:webshell3389/ok-web.git` for fetch and push.

- [ ] **Step 4: Create feature branch**

Run:

```bash
git checkout -B feat/merchant-callcenter-rebuild
```

Expected: current branch is `feat/merchant-callcenter-rebuild`.

---

## Task 2: Shared Types and Utilities

**Files:**
- Create: `src/utils/format.ts`
- Create: `src/components/StatusText.tsx`

- [ ] **Step 1: Create `src/utils/format.ts`**

```ts
import dayjs from 'dayjs';

export function formatUnixTime(value?: string | number | null): string {
  if (value === undefined || value === null || value === '' || value === '0') return '';
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return String(value);
  return dayjs.unix(numeric).format('YYYY-MM-DD HH:mm:ss');
}

export function formatPercent(value?: string | number | null): string {
  if (value === undefined || value === null || value === '') return '0%';
  const text = String(value);
  return text.endsWith('%') ? text : `${text}%`;
}

export function getApiErrorMessage(response: any): string {
  return response?.result?.msg || response?.msg || '请求失败，请稍后重试';
}

export function unwrapRows(response: any): { rows: any[]; total: number } {
  const data = response?.data || {};
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    total: Number(data.total || 0),
  };
}
```

- [ ] **Step 2: Create `src/components/StatusText.tsx`**

```tsx
import { Tag } from 'antd';

const taskStatus: Record<string, { color: string; text: string }> = {
  '0': { color: 'default', text: '未启动' },
  '1': { color: 'processing', text: '运行中' },
  '2': { color: 'warning', text: '已暂停' },
  '3': { color: 'default', text: '已停止' },
};

const callType: Record<string, string> = {
  '0': '播放语音任意键转坐席',
  '2': '直接转坐席',
  '3': '播放语音后挂断',
  '4': '播放语音后转坐席',
  '5': '先接通坐席再呼叫客户',
  '7': '呼叫语音机器人之后挂断',
  '8': '呼叫语音机器人之后转接坐席',
};

export function TaskStatusText({ value }: { value?: string | number }) {
  const item = taskStatus[String(value ?? '')] || { color: 'default', text: String(value ?? '') };
  return <Tag color={item.color}>{item.text}</Tag>;
}

export function CallTypeText({ value }: { value?: string | number }) {
  return <span>{callType[String(value ?? '')] || String(value ?? '')}</span>;
}
```

- [ ] **Step 3: Verify TypeScript build reaches utility files**

Run:

```bash
npm run build
```

Expected: build either passes or fails only because later tasks are not implemented yet. If these files cause TypeScript errors, fix them before continuing.

---

## Task 3: API Layer

**Files:**
- Modify: `src/api/agent.ts`
- Modify: `src/api/task.ts`
- Create: `src/api/customer.ts`
- Create: `src/api/cdr.ts`

- [ ] **Step 1: Replace `src/api/agent.ts` with complete agent API**

```ts
import request from './request';

export function getAgentMonitorMeta() {
  return request.post('index.php?m=service&c=agentMonitor');
}

export function queryAgents(params?: any) {
  return request.post('index.php?m=service&c=agentMonitor&f=queryAgents', {
    p: JSON.stringify(params || { pagination: { current: 1, pageSize: 20 }, filter: {} }),
  });
}

export function queryAgentStatus(ids: Array<string | number>) {
  return request.post('index.php?m=service&c=agentMonitor&f=queryAgentStatus', {
    ids: JSON.stringify(ids.map(String)),
  });
}

export function agentCallCtrl(params: { action: string; agentID?: string | number; ids?: Array<string | number> }) {
  return request.post('index.php?m=common&c=agentActions&f=agentCallCtrl', params);
}
```

- [ ] **Step 2: Replace `src/api/task.ts` with complete task API**

```ts
import request from './request';

export function getCallTaskMeta() {
  return request.post('index.php?m=service&c=callTask');
}

export function queryTasks(params?: any) {
  return request.post('index.php?m=service&c=callTask&f=query', {
    p: JSON.stringify(params || { pagination: { current: 1, pageSize: 10 }, filter: {} }),
  });
}

export function createTask(params: any) {
  return request.post('index.php?m=service&c=callTask&f=edit', params);
}

export function startTask(id: string | number) {
  return request.post('index.php?m=service&c=callTask&f=startTask', { id });
}

export function stopTask(id: string | number) {
  return request.post('index.php?m=service&c=callTask&f=stopTask', { id });
}

export function deleteTask(id: string | number) {
  return request.post('index.php?m=service&c=callTask&f=delete', { id });
}

export function getTaskGraphData(id: string | number) {
  return request.post('index.php?m=service&c=callTask&f=getResultGraphData', { id });
}

export function getSupportMode() {
  return request.post('index.php?m=service&c=callTask&f=getSupportMode');
}

export function getAgentGroupList() {
  return request.post('index.php?m=service&c=callTask&f=getAgentGroupList');
}
```

- [ ] **Step 3: Create `src/api/customer.ts`**

```ts
import request from './request';

export function getCustomerMeta() {
  return request.post('index.php?m=crm&c=clientInfo');
}

export function queryCustomers(params?: any) {
  return request.post('index.php?m=crm&c=clientInfo&f=query', {
    p: JSON.stringify(params || { pagination: { current: 1, pageSize: 10 }, filter: {} }),
  });
}

export function getCustomer(id: string | number) {
  return request.post('index.php?m=crm&c=clientInfo&f=getClient', { id });
}

export function saveCustomer(params: any) {
  return request.post('index.php?m=crm&c=clientInfo&f=edit', params);
}

export function deleteCustomer(id: string | number) {
  return request.post('index.php?m=crm&c=clientInfo&f=delete', { id });
}

export function deleteCustomers(ids: Array<string | number>) {
  return request.post('index.php?m=crm&c=clientInfo&f=deleteList', { ids: JSON.stringify(ids) });
}

export function queryBatchList() {
  return request.post('index.php?m=crm&c=clientInfo&f=queryBatchList');
}

export function queryCustomerType() {
  return request.post('index.php?m=crm&c=clientInfo&f=queryCustomerType');
}

export function exportCustomers(params?: any) {
  return request.post('index.php?m=crm&c=clientInfo&f=export', {
    p: JSON.stringify(params || { pagination: { current: 1, pageSize: 10 }, filter: {} }),
  });
}
```

- [ ] **Step 4: Create `src/api/cdr.ts`**

```ts
import request from './request';

export function getCallLogMeta() {
  return request.post('index.php?m=cdr&c=cdr');
}

export function queryCallLogs(params?: any) {
  return request.post('index.php?m=cdr&c=cdr&f=query', {
    p: JSON.stringify(params || { pagination: { current: 1, pageSize: 10 }, filter: {} }),
  });
}

export function queryCallLogAgents() {
  return request.post('index.php?m=cdr&c=cdr&f=queryAgent');
}

export function queryCallLogTasks() {
  return request.post('index.php?m=cdr&c=cdr&f=queryTask');
}

export function getRecordMeta() {
  return request.post('index.php?m=cdr&c=record');
}

export function queryRecords(params?: any) {
  return request.post('index.php?m=cdr&c=record&f=query', {
    p: JSON.stringify(params || { pagination: { current: 1, pageSize: 10 }, filter: {} }),
  });
}

export function queryRecordAgents() {
  return request.post('index.php?m=cdr&c=record&f=queryAgent');
}

export function queryRecordTasks() {
  return request.post('index.php?m=cdr&c=record&f=queryTask');
}
```

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: API files compile without import/export errors.

---

## Task 4: Routing and Menu

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/layouts/MainLayout.tsx`

- [ ] **Step 1: Add page imports and routes in `src/App.tsx`**

Add imports:

```tsx
import Customers from './pages/Customers';
import CustomerDetail from './pages/Customers/Detail';
import CustomerForm from './pages/Customers/Form';
import CustomerImport from './pages/Customers/Import';
import CallLogs from './pages/Cdr/Calls';
import Records from './pages/Cdr/Records';
```

Add routes inside `MainLayout` route group:

```tsx
<Route path="customers" element={<Customers />} />
<Route path="customers/import" element={<CustomerImport />} />
<Route path="customers/create" element={<CustomerForm />} />
<Route path="customers/:id" element={<CustomerDetail />} />
<Route path="customers/:id/edit" element={<CustomerForm />} />
<Route path="cdr/calls" element={<CallLogs />} />
<Route path="cdr/records" element={<Records />} />
```

- [ ] **Step 2: Update `src/layouts/MainLayout.tsx` menu items**

Ensure menu contains these keys and labels:

```tsx
const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '首页' },
  { key: '/agent-monitor', icon: <TeamOutlined />, label: '坐席监控' },
  { key: '/customers', icon: <ContactsOutlined />, label: '客户资料' },
  { key: '/task-manage', icon: <PhoneOutlined />, label: '外呼任务' },
  { key: '/cdr/calls', icon: <UnorderedListOutlined />, label: '通话清单' },
  { key: '/cdr/records', icon: <SoundOutlined />, label: '录音清单' },
];
```

If an icon import does not exist in current file, import it from `@ant-design/icons`.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: route and menu imports compile.

---

## Task 5: Customers Module

**Files:**
- Create: `src/pages/Customers/index.tsx`
- Create: `src/pages/Customers/Detail.tsx`
- Create: `src/pages/Customers/Form.tsx`
- Create: `src/pages/Customers/Import.tsx`

- [ ] **Step 1: Implement customer list page**

Create `src/pages/Customers/index.tsx` with Ant Design `Table`, `Form`, `Drawer`, and actions for refresh, add, import, export, delete, detail, edit.

Core columns:

```tsx
const columns = [
  { title: '#id', dataIndex: '#id', width: 100 },
  { title: '名称', dataIndex: 'name', width: 120 },
  { title: '性别', dataIndex: 'gender', width: 80 },
  { title: '客户类型', dataIndex: 'type', width: 120 },
  { title: '联系号码', dataIndex: 'number1', width: 140 },
  { title: '其它号码', dataIndex: 'number2', width: 140 },
  { title: '创建时间', dataIndex: 'ctime', render: formatUnixTime, width: 180 },
  { title: '最后通话时间', dataIndex: 'lastTalkTime', render: formatUnixTime, width: 180 },
  { title: '批次', dataIndex: 'batchID', width: 100 },
  { title: '分配至', dataIndex: 'groupID', width: 120 },
  { title: '备注', dataIndex: 'remark', width: 180 },
];
```

List loader must call `queryCustomers({ pagination, filter })`.

- [ ] **Step 2: Implement customer detail page**

Create `src/pages/Customers/Detail.tsx` using `useParams()` and `getCustomer(id)`. Show a `Descriptions` component with customer fields and a back button.

- [ ] **Step 3: Implement customer form page**

Create `src/pages/Customers/Form.tsx` with fields:

```text
名称、性别、客户类型、联系号码、其它号码、备注
```

On submit call `saveCustomer(values)` and navigate back to `/customers` on success.

- [ ] **Step 4: Implement import page**

Create `src/pages/Customers/Import.tsx` with `Upload.Dragger`, instructions, and a disabled-safe submit if upload endpoint is not confirmed. The page must not crash and must provide a clear message: `导入接口参数待确认，请先使用原系统导入或补充接口参数。`

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: customer pages compile.

---

## Task 6: Task Manage Module

**Files:**
- Modify: `src/pages/TaskManage/index.tsx`
- Modify: `src/pages/TaskManage/Create.tsx`
- Modify: `src/pages/TaskManage/Detail.tsx`

- [ ] **Step 1: Replace task list page**

`src/pages/TaskManage/index.tsx` must render columns:

```text
名称、创建时间、创建人、呼叫方式、呼叫名单、呼叫对象、状态、总数、剩余数量、进度、当前并发、最大并发、空闲坐席、坐席总数、备注、操作
```

Actions:

```text
详情、启动、暂停、编辑、删除
```

Load list by `queryTasks({ pagination, filter })`. Refresh every 10 seconds with `setInterval` and clean it in `useEffect` cleanup.

- [ ] **Step 2: Implement start/stop/delete actions**

Use:

```tsx
await startTask(record.taskId);
await stopTask(record.taskId);
await deleteTask(record.taskId);
```

After success, show `message.success()` and reload list.

- [ ] **Step 3: Expand create page**

`src/pages/TaskManage/Create.tsx` fields:

```text
任务名称、呼叫方式、呼叫名单、班组、最大并发、呼叫倍率、备注
```

Submit calls `createTask(values)`.

- [ ] **Step 4: Expand detail page**

`src/pages/TaskManage/Detail.tsx` loads `queryTasks({ pagination: { current: 1, pageSize: 1 }, filter: { id } })` and `getTaskGraphData(id)`. Show task description and result graph data as a table/list.

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: task pages compile.

---

## Task 7: Agent Monitor Module

**Files:**
- Modify: `src/pages/AgentMonitor/index.tsx`

- [ ] **Step 1: Implement agent list loading**

Use `queryAgents({ pagination, filter })` and render:

```text
工号、姓名、分机号、班组 1、班组 2、状态
```

- [ ] **Step 2: Implement status polling**

After loading agents, collect `row.key` and call `queryAgentStatus(ids)` every 5 seconds. Cleanup interval on unmount.

- [ ] **Step 3: Implement view toggle**

Add `Radio.Group`:

```text
磁贴、列表
```

磁贴 shows card layout; 列表 shows table layout.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: agent monitor compiles.

---

## Task 8: CDR Pages

**Files:**
- Create: `src/pages/Cdr/Calls.tsx`
- Create: `src/pages/Cdr/Records.tsx`

- [ ] **Step 1: Implement call logs page**

`Calls.tsx` renders query form and table columns:

```text
坐席、任务、业务类型、开始时间、结束时间、主叫号码、被叫号码、时长(s)、费用(元)、挂断原因、操作
```

Use `queryCallLogs({ pagination, filter })`, `queryCallLogAgents()`, and `queryCallLogTasks()`.

- [ ] **Step 2: Implement records page**

`Records.tsx` renders query form and table columns:

```text
坐席、任务、开始时间、结束时间、主叫号码、被叫号码、时长(s)、费用(元)、操作
```

Use `queryRecords({ pagination, filter })`, `queryRecordAgents()`, and `queryRecordTasks()`.

- [ ] **Step 3: Add download/listen placeholders with real UI**

For each record row, show buttons:

```tsx
<Button type="link">试听</Button>
<Button type="link">下载</Button>
```

If the row has a URL field such as `url`, `file`, or `recordFile`, open it in a new tab. Otherwise show `message.info('当前记录未返回录音文件地址')`.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: CDR pages compile.

---

## Task 9: Final Verification and Push

**Files:**
- All modified files

- [ ] **Step 1: Run full build**

Run:

```bash
npm run build
```

Expected: `tsc -b && vite build` succeeds.

- [ ] **Step 2: Inspect Git diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: only intended source and docs files are modified. `node_modules` and `dist` must not be committed unless explicitly required.

- [ ] **Step 3: Commit**

Run:

```bash
git add src docs package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html public
git commit -m "feat(merchant): 补齐商户呼叫中心后台"
```

Expected: commit succeeds.

- [ ] **Step 4: Push**

Run:

```bash
git push -u origin feat/merchant-callcenter-rebuild
```

Expected: branch pushed to `git@github.com:webshell3389/ok-web.git`.

---

## Self-Review

- Spec coverage: covers routing, API, customers, tasks, agent monitor, CDR calls, CDR records, auto-refresh, verification, GitHub push.
- Placeholder scan: unresolved backend parameters are explicitly handled by user-facing messages rather than hidden placeholders.
- Type consistency: list APIs use `{ pagination, filter }`; row fields match browser-captured backend fields.
