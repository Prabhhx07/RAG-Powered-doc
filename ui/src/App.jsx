import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"         element={<AuthPage />} />
        <Route path="/dashboard"     element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/chat/:documentId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="*"              element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
