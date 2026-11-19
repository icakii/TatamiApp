import { Route, Routes } from 'react-router-dom'
import { AdminRoute } from './components/AdminRoute'
import { ClubScope } from './components/ClubScope'
import { MemberGate, ProtectedRoute } from './components/ProtectedRoute'
import { AdminLayout } from './layouts/AdminLayout'
import { AppLayout } from './layouts/AppLayout'
import { CheckIn } from './pages/CheckIn'
import { ClubPicker } from './pages/ClubPicker'
import { ForgotPassword } from './pages/ForgotPassword'
import { Login } from './pages/Login'
import { Privacy } from './pages/Privacy'
import { ResetPassword } from './pages/ResetPassword'
import { Store } from './pages/Store'
import { Terms } from './pages/Terms'
import { Attendance } from './pages/admin/Attendance'
import { HallQr } from './pages/admin/HallQr'
import { Members } from './pages/admin/Members'
import { Messages } from './pages/admin/Messages'
import { Register } from './pages/Register'
import { AdminCompetitions } from './pages/admin/AdminCompetitions'
import { Payments as AdminPayments } from './pages/admin/Payments'
import { Reservations } from './pages/admin/Reservations'
import { Competitions } from './pages/app/Competitions'
import { Home } from './pages/app/Home'
import { Payments } from './pages/app/Payments'
import { Profile } from './pages/app/Profile'
import { Schedule } from './pages/app/Schedule'

// app.tatamistudio.net: one app for every club. "/" picks your club, then
// everything lives under /<slug>. Fixed paths (login, legal) rank above the
// :slug route, so those words can't be club slugs (the Hub enforces it).
function App() {
  const member = (el: React.ReactNode) => (
    <ProtectedRoute>
      <MemberGate>{el}</MemberGate>
    </ProtectedRoute>
  )

  return (
    <Routes>
      <Route path="/" element={<ClubPicker />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />

      <Route path="/:slug" element={<ClubScope />}>
        <Route path="login" element={<Login />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="checkin/:token" element={member(<CheckIn />)} />
        <Route path="add-child" element={member(<Register mode="add" />)} />
        <Route element={member(<AppLayout />)}>
          <Route index element={<Home />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="competitions" element={<Competitions />} />
          <Route path="payments" element={<Payments />} />
          <Route path="profile" element={<Profile />} />
          <Route path="store" element={<Store />} />
        </Route>
        <Route
          path="admin"
          element={member(
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>,
          )}
        >
          <Route index element={<Members />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="messages" element={<Messages />} />
          <Route path="competitions" element={<AdminCompetitions />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="qr" element={<HallQr />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
