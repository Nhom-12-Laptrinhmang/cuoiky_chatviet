import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

/**
 * ForgotPassword - Component quên mật khẩu
 * Gửi OTP, nhập OTP + mật khẩu mới, reset password
 */
const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: nhập username, 2: nhập OTP + mật khẩu mới
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(username);
      if (response.data.success) {
        setSuccess('✅ OTP đã gửi! Kiểm tra terminal server để lấy mã OTP.');
        setStep(2);
      } else {
        setError(response.data.error || 'Không thể gửi OTP');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu không khớp!');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword(username, otp, newPassword);
      if (response.data.success) {
        setSuccess('✅ Đặt lại mật khẩu thành công! Hãy đăng nhập với mật khẩu mới.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(response.data.error || 'Đặt lại mật khẩu thất bại');
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
        <h1>🔑 Khôi Phục Mật Khẩu</h1>

        {step === 1 ? (
          <form onSubmit={handleSendOTP}>
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

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Đang gửi OTP...' : 'Gửi OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="otp">Mã OTP:</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Nhập mã OTP (6 chữ số)"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">Mật khẩu mới:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Đang đặt lại...' : 'Đặt Lại Mật Khẩu'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary"
            >
              Quay Lại
            </button>
          </form>
        )}

        <p className="auth-links">
          <a href="/login">← Quay lại đăng nhập</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
