import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

/**
 * LoginForm - Component đăng nhập
 * Gọi API /login, lưu JWT token, điều hướng tới /chat
 */
const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      if (response.data.success) {
        // Lưu token vào localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', username);
        // Điều hướng tới trang chat
        navigate('/chat');
      } else {
        setError(response.data.error || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>🔐 Đăng Nhập </h1>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>

        <p className="auth-links">
          Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
        </p>
        <p className="auth-links">
          Quên mật khẩu? <a href="/forgot-password">Khôi phục tại đây</a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
