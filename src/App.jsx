import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import VerifySuccessPage from './pages/VerifySuccessPage';
import Login from './components/Login'
import Register from './components/Register'
import { useAuth } from './context/AuthContext';
import OnboardingGate from './components/OnboardingGate';

function ChatRoute() {
  return (
    <div className="app-shell">
      <OnboardingGate />
      <ChatPage />
    </div>
  );
}

function ProfileRoute() {
  return (
    <div className="app-shell">
      <OnboardingGate />
      <ProfilePage />
    </div>
  );
}

function LoginRoute() {
  return (
    <div className="auth-shell">
      <Login />
    </div>
  );
}

function RegisterRoute() {
  return (
    <div className="auth-shell">
      <Register />
    </div>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {user ? (
        <>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatRoute />} />
          <Route path="/profile" element={<ProfileRoute />} />
          <Route path="/profile/:id" element={<ProfileRoute />} />
          <Route path="/verify-success" element={<VerifySuccessPage />} />
          <Route path="/login" element={<Navigate to="/chat" replace />} />
          <Route path="/register" element={<Navigate to="/chat" replace />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />
          <Route path="/verify-success" element={<VerifySuccessPage />} />
          <Route path="/chat" element={<Navigate to="/login" replace />} />
          <Route path="/profile" element={<Navigate to="/login" replace />} />
          <Route path="/profile/:id" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  )
}

export default App
