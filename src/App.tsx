import { Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'
import AgentLayout from './layouts/AgentLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AgentMonitor from './pages/AgentMonitor'
import TaskManage from './pages/TaskManage'
import TaskCreate from './pages/TaskManage/Create'
import TaskDetail from './pages/TaskManage/Detail'
import Customers from './pages/Customers'
import CustomerDetail from './pages/Customers/Detail'
import CustomerForm from './pages/Customers/Form'
import CustomerImport from './pages/Customers/Import'
import CdrCalls from './pages/Cdr/Calls'
import CdrRecords from './pages/Cdr/Records'
import ReportTraffic from './pages/Report/Traffic'
import ReportAgent from './pages/Report/Agent'
import ReportConsume from './pages/Report/Consume'
import CallPopup from './pages/CallPopup'

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
      </Route>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="agent-monitor" element={<AgentMonitor />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/import" element={<CustomerImport />} />
        <Route path="customers/create" element={<CustomerForm mode="create" />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="customers/:id/edit" element={<CustomerForm mode="edit" />} />
        <Route path="task-manage" element={<TaskManage />} />
        <Route path="task-manage/create" element={<TaskCreate />} />
        <Route path="task-manage/:id" element={<TaskDetail />} />
        <Route path="task-manage/:id/edit" element={<TaskCreate />} />
        <Route path="cdr/calls" element={<CdrCalls />} />
        <Route path="cdr/records" element={<CdrRecords />} />
        <Route path="report/traffic" element={<ReportTraffic />} />
        <Route path="report/agent" element={<ReportAgent />} />
        <Route path="report/consume" element={<ReportConsume />} />
      </Route>
      <Route element={<AgentLayout />}>
        <Route path="call-popup" element={<CallPopup />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
