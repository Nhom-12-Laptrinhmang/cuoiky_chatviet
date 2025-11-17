import axios from 'axios';

/**
 * Upload Service - Handle file uploads
 */

// Get backend URL - works with proxy or direct connection
const getBackendURL = () => {
  // If running on ngrok or same server, use relative path (proxy handles it)
  // If REACT_APP_BACKEND_URL is set, use it
  return process.env.REACT_APP_BACKEND_URL || '';
};

/**
 * Upload file to backend (backend handles S3 or local storage)
 * @param {File} file - File to upload
 * @param {string} token - JWT token for authentication
 * @returns {Promise} - Upload response with file_url, file_name, file_size, file_type
 */
export const uploadFile = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);

  const backendURL = getBackendURL();
  const url = backendURL ? `${backendURL}/uploads/file` : '/uploads/file';

  const response = await axios.post(url, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type - let browser set it with boundary for multipart
    },
    timeout: 60000, // 60 seconds for large files
  });

  return response.data;
};

/**
 * Get presigned URL for direct S3 upload (alternative method)
 * @param {string} filename - Original filename
 * @param {string} contentType - MIME type
 * @param {number} fileSize - File size in bytes
 * @param {string} token - JWT token
 * @returns {Promise} - Presigned URL response
 */
export const getPresignedURL = async (filename, contentType, fileSize, token) => {
  const backendURL = getBackendURL();
  const url = backendURL ? `${backendURL}/uploads/presigned-url` : '/uploads/presigned-url';

  const response = await axios.post(
    url,
    {
      filename,
      content_type: contentType,
      file_size: fileSize,
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};

export default { uploadFile, getPresignedURL };
