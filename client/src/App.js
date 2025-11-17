import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import ForgotPassword from './components/Auth/ForgotPassword';
import ChatBox from './components/Chat/ChatBox';
import ToastContainer from './components/Notifications/ToastContainer';

/**
 * ProtectedRoute - Kiểm tra nếu user đã đăng nhập
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

/**
 * App - Root component
 * Quản lý routing tới /login, /register, /forgot-password, /chat
 */
function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatBox />
            </ProtectedRoute>
          }
        />
        {/* Redirect mặc định tới /login */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
