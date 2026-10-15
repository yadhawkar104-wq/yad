import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { I18nProvider } from './lib/i18n.jsx'
import { AuthProvider, useAuth } from './lib/auth.jsx'
import { Loading } from './components/ui.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import SelectRole from './pages/SelectRole.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import Layout from './app/Layout.jsx'
import Dashboard from './app/Dashboard.jsx'
import Students from './app/Students.jsx'
import Teachers from './app/Teachers.jsx'
import Classes from './app/Classes.jsx'
import Attendance from './app/Attendance.jsx'
import Assignments from './app/Assignments.jsx'
import Grades from './app/Grades.jsx'
import Timetable from './app/Timetable.jsx'
import Announcements from './app/Announcements.jsx'
import Events from './app/Events.jsx'
import Fees from './app/Fees.jsx'
import Library from './app/Library.jsx'
import Messages from './app/Messages.jsx'
import Profile from './app/Profile.jsx'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen"><Loading /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/select-role" element={<SelectRole />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/app" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="classes" element={<Classes />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="grades" element={<Grades />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="events" element={<Events />} />
        <Route path="fees" element={<Fees />} />
        <Route path="library" element={<Library />} />
        <Route path="messages" element={<Messages />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  )
}
