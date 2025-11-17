import React, { useState } from 'react';
import axios from 'axios';
import { showToast, showSystemNotification } from '../../services/notifications';

/**
 * FileUploader - Component upload file with S3 presigned URL
 * Flow: Select file → Get presigned URL → Upload to S3 → Return file URL
 */
const FileUploader = ({ onFileUploaded, disabled }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (disabled) {
      const msg = 'Vui lòng chọn người nhận trước khi gửi file';
      showToast('Upload file', msg);
      showSystemNotification('Upload file', msg);
      return;
    }

    // Validate file size (max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const msg = `File quá lớn! Kích thước tối đa là 50MB`;
      showToast('Upload file', msg);
      showSystemNotification('Upload file', msg);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL from backend
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.post(
        '/uploads/presigned-url',
        {
          filename: file.name,
          content_type: file.type || 'application/octet-stream',
          file_size: file.size,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { upload_url, fields, file_url, key } = response.data;

      // Step 2: Upload file to S3 using presigned POST
      const formData = new FormData();
      
      // Add all fields from presigned post first
      Object.keys(fields).forEach((fieldKey) => {
        formData.append(fieldKey, fields[fieldKey]);
      });
      
      // Add the file last
      formData.append('file', file);

      await axios.post(upload_url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      // Step 3: Notify parent component with file URL
      if (onFileUploaded) {
        onFileUploaded({
          url: file_url,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          key: key,
        });
      }

      setUploadProgress(100);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);

      // Reset input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      const msg = 'Lỗi khi upload file. Vui lòng thử lại!';
      showToast('Upload file thất bại', msg);
      showSystemNotification('Upload file thất bại', msg);
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  return (
    <div className="file-uploader">
      <label 
        htmlFor="file-input" 
        className={`btn-upload ${disabled || uploading ? 'disabled' : ''}`}
        style={{ opacity: disabled || uploading ? 0.5 : 1, cursor: disabled || uploading ? 'not-allowed' : 'pointer' }}
      >
        {uploading ? `📤 ${uploadProgress}%` : '📎 Chia sẻ tệp'}
      </label>
      <input
        type="file"
        id="file-input"
        onChange={handleFileUpload}
        disabled={disabled || uploading}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default FileUploader;
