# 商户呼叫中心后台完整补全设计

## 背景

当前新前端源码位于 `/tmp/wv2`，技术栈为 React、Vite、TypeScript、Ant Design。线上原始前端是压缩后的 JavaScript，无法直接按源码复用，因此本次以浏览器交互采集到的页面结构、接口和状态流转为依据，在新前端中补齐商户后台能力。

本次目标不是总后台，而是商户后台。客户资料、外呼任务、坐席监控、通话清单、录音清单等操作均按正常商户业务闭环处理，不额外禁用。删除、启动、暂停等操作保留确认提示，用于防误点，不作为功能限制。

## 范围

本次补齐以下模块：

- 仪表盘：保留并完善现有统计卡片。
- 坐席监控：坐席列表、磁贴视图、状态轮询、坐席操作。
- 客户资料：列表、查询、分页、详情、新增、编辑、删除、导入、导出、分配、回收、生成呼叫名单。
- 外呼任务：列表、查询、分页、详情、新增、编辑、启动、暂停、停止、删除、追加、重呼、统计。
- 通话清单：列表、查询、分页、包含内部呼叫、导出。
- 录音清单：列表、查询、分页、下载、试听。

暂不处理坐席弹屏页面的业务完善；弹屏后续单独处理。

## 路由与菜单

新增或完善路由：

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/dashboard` | 仪表盘 | 首页统计 |
| `/agent-monitor` | 坐席监控 | 实时坐席状态 |
| `/customers` | 客户资料列表 | CRM 客户管理 |
| `/customers/import` | 客户资料导入 | 上传客户资料 |
| `/customers/:id` | 客户详情 | 查看客户资料与记录 |
| `/task-manage` | 外呼任务列表 | 任务管理 |
| `/task-manage/create` | 新增外呼任务 | 新建任务 |
| `/task-manage/:id` | 外呼任务详情 | 任务信息与统计 |
| `/cdr/calls` | 通话清单 | CDR 查询 |
| `/cdr/records` | 录音清单 | 录音查询 |

菜单结构：

```text
首页
监控
  坐席监控
CRM
  客户资料
业务
  外呼任务
查询
  通话清单
  录音清单
```

## API 设计

继续使用现有 `src/api/request.ts` 的 `/service/` 前缀和 `application/x-www-form-urlencoded` 请求方式。列表接口统一传入：

```ts
{
  pagination: {
    current: number;
    pageSize: number;
  };
  filter: Record<string, unknown>;
}
```

### 坐席监控

```text
POST index.php?m=service&c=agentMonitor
POST index.php?m=service&c=agentMonitor&f=queryAgents
POST index.php?m=service&c=agentMonitor&f=queryAgentStatus
```

页面使用字段：`StaffNo`、`Name`、`sipNu`、`AgentGroup1`、`AgentGroup2`、`key`、实时状态数据。

### 客户资料

```text
POST index.php?m=crm&c=clientInfo
POST index.php?m=crm&c=clientInfo&f=query
POST index.php?m=crm&c=clientInfo&f=getClient
POST index.php?m=crm&c=clientInfo&f=queryBatchList
POST index.php?m=crm&c=clientInfo&f=queryCustomerType
POST index.php?m=crm&c=clientInfo&f=delete
POST index.php?m=crm&c=clientInfo&f=deleteList
POST index.php?m=crm&c=clientInfo&f=export
```

页面使用字段：`id`、`#id`、`name`、`gender`、`type`、`number1`、`number2`、`ctime`、`lastTalkTime`、`batchID`、`groupID`、`remark`。

### 外呼任务

```text
POST index.php?m=service&c=callTask
POST index.php?m=service&c=callTask&f=query
POST index.php?m=service&c=callTask&f=getSupportMode
POST index.php?m=service&c=callTask&f=getAgentGroupList
POST index.php?m=service&c=callTask&f=getResultGraphData
POST index.php?m=service&c=callTask&f=startTask
POST index.php?m=service&c=callTask&f=stopTask
POST index.php?m=service&c=callTask&f=delete
```

页面使用字段：`taskId`、`name`、`createTime`、`creator`、`callType`、`calleeList`、`agentGroup`、`runningStatus`、`calleeAmount`、`remainingNumber`、`completionRate`、`concurrent`、`maxConcurrent`。

### 通话清单

```text
POST index.php?m=cdr&c=cdr
POST index.php?m=cdr&c=cdr&f=query
POST index.php?m=cdr&c=cdr&f=queryAgent
POST index.php?m=cdr&c=cdr&f=queryTask
```

页面使用字段：`employeeID`、`task`、`serviceType`、`answerTime`、`endTime`、`caller`、`callee`、`timeLength`、`fee`、`releaseCause`。

### 录音清单

```text
POST index.php?m=cdr&c=record
POST index.php?m=cdr&c=record&f=query
POST index.php?m=cdr&c=record&f=queryAgent
POST index.php?m=cdr&c=record&f=queryTask
```

页面使用字段：`employeeID`、`task`、`startTime`、`endTime`、`caller`、`callee`、`timeLength`、`fee`。

## 组件与代码结构

新增通用组件：

- `RemoteTable`：封装分页、加载状态、查询触发和动态列。
- `SearchPanel`：统一查询面板，支持文本、下拉、日期快捷项。
- `ConfirmAction`：统一确认操作。
- `StatusText`：统一枚举状态显示。

新增页面目录：

```text
src/pages/Customers/
src/pages/Cdr/
```

新增 API 文件：

```text
src/api/customer.ts
src/api/cdr.ts
```

扩展现有文件：

```text
src/api/agent.ts
src/api/task.ts
src/pages/AgentMonitor/index.tsx
src/pages/TaskManage/index.tsx
src/pages/TaskManage/Create.tsx
src/pages/TaskManage/Detail.tsx
src/layouts/MainLayout.tsx
src/App.tsx
```

## 交互设计

### 坐席监控

- 页面进入时加载权限和坐席列表。
- 默认磁贴视图，支持切换列表视图。
- 每 5 秒请求一次 `queryAgentStatus`，刷新实时状态。
- 支持刷新、查询、分页。
- 坐席操作包括置忙、置闲、离线、长签、退出长签。若缺少明确接口，先保留按钮和提示，并在代码中集中封装待接接口。

### 客户资料

- 页面进入时加载 `clientInfo` 获取动态列和权限。
- 列表通过 `query` 获取，支持分页和排序。
- 查询条件包括客户 ID、客户名称、联系号码、导入批次、创建时间、更新时间、联系时间、通话时间、类型、分配状态、联系情况。
- 支持新增、编辑、详情、删除、批量删除、导入、导出、分配、回收、生成呼叫名单。
- 若某个操作接口参数未完全确认，页面保留入口，提交前给出明确提示，不静默失败。

### 外呼任务

- 页面进入时加载 `callTask` 获取动态列和权限。
- 列表通过 `query` 获取，支持分页、排序和查询。
- 查询条件包括任务 ID、任务名称、创建时间、呼叫方式、运行状态、呼叫名单、呼叫对象。
- 每 10 秒自动刷新任务列表。
- 行操作包括详情、启动、暂停、追加、重呼、编辑、删除。
- 详情页展示任务信息、呼叫名单总数、已呼叫数量和结果统计。

### 通话清单

- 页面进入时加载 `cdr` 获取动态列和权限。
- 列表通过 `cdr&f=query` 获取。
- 查询条件包括坐席、任务、时间范围、主叫号码、被叫号码、接通状态、是否包含内部呼叫。
- 支持指定导出和搜索结果导出。

### 录音清单

- 页面进入时加载 `record` 获取动态列和权限。
- 列表通过 `record&f=query` 获取。
- 查询条件包括坐席、任务、时间范围、主叫号码、被叫号码、时长、质检状态。
- 支持录音下载和试听入口。

## 状态流转

### 外呼任务状态

```text
未启动 -> 启动 -> 运行中
运行中 -> 暂停 -> 已暂停
已暂停 -> 启动 -> 运行中
运行中/已暂停/已停止 -> 删除 -> 列表移除
任务 -> 追加 -> 名单数量增加
任务 -> 重呼 -> 生成重呼任务或重呼名单
```

### 客户资料状态

```text
新增 -> 客户入库
导入 -> 批量客户入库
客户 -> 分配 -> 已分配
客户 -> 回收 -> 公海客户
客户 -> 生成呼叫名单 -> 可用于外呼任务
客户 -> 删除 -> 列表移除或进入回收逻辑
```

### 坐席状态

```text
离线
空闲
工作中
置忙
离开
长签
```

## 自动刷新

- 坐席监控：每 5 秒刷新实时状态，离开页面后停止轮询。
- 外呼任务：每 10 秒刷新列表状态，离开页面后停止轮询。
- 仪表盘：保留现有统计接口刷新策略。
- 客户资料、通话清单、录音清单：不默认轮询，用户手动刷新。

## 错误处理

- API 返回 `result.error !== 0` 时显示错误消息。
- 网络异常显示「请求失败，请稍后重试」。
- 列表为空显示空状态。
- 操作成功后刷新当前列表。
- 操作失败不改变本地状态。

## 验证标准

- `npm run build` 通过。
- 登录后菜单完整。
- 目标页面均可打开。
- 各列表能请求真实接口并渲染数据。
- 查询、分页和刷新可用。
- 坐席监控与外呼任务自动刷新生效。
- 删除、启动、暂停、导入、导出、下载等业务入口不被额外禁用。

## 风险与处理

- 原始前端为压缩包，部分复杂提交参数无法一次性确认。处理方式：优先实现已确认接口；未确认参数集中封装，并在页面上给出明确反馈。
- 后端动态列依赖 `priv.items`。处理方式：先支持常用字段，保留动态列合并逻辑。
- 商户后台是真实业务环境。处理方式：正常实现业务操作，但保留确认提示，防止误点。
