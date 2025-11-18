import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import ForgotPassword from './components/Auth/ForgotPassword';
import ChatBox from './components/Chat/ChatBox';
import ToastContainer from './components/Notifications/ToastContainer';
import { LanguageProvider } from './i18n/LanguageContext';
import { initializeFontSize } from './utils/fontSizeUtils';

/**
 * ProtectedRoute - Kiểm tra nếu user đã đăng nhập
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// Root layout to host shared UI like ToastContainer
const RootLayout = () => {
  // Initialize font size khi app khởi động
  useEffect(() => {
    initializeFontSize();
  }, []);

  return (
    <LanguageProvider>
      <ToastContainer />
      <Outlet />
    </LanguageProvider>
  );
};

/**
 * App - Root component
 * Quản lý routing tới /login, /register, /forgot-password, /chat
 */
function App() {
  const routes = [
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { path: 'login', element: <LoginForm /> },
        { path: 'register', element: <RegisterForm /> },
        { path: 'forgot-password', element: <ForgotPassword /> },
        { path: 'chat', element: <ProtectedRoute><ChatBox /></ProtectedRoute> },
        { path: '/', element: <Navigate to="/login" /> },
      ],
    },
  ];

  const router = createBrowserRouter(routes, {
    // Opt into v7 future flags to silence the console deprecation warnings
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  });

  return <RouterProvider router={router} />;
}

export default App;
