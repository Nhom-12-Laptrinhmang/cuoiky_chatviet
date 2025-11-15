import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

/**
 * LogoutButton - Nút đăng xuất
 * Xóa token, điều hướng về trang login
 */
const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  return (
    <button onClick={handleLogout} className="btn-logout">
      Đăng Xuất
    </button>
  );
};

export default LogoutButton;
