import React from 'react';

/**
 * FileUploader - Component upload file (future feature)
 */
const FileUploader = () => {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name);
      // TODO: Implement file upload logic
    }
  };

  return (
    <div className="file-uploader">
      <label htmlFor="file-input" className="btn-upload">
        📎 Chia sẻ tệp
      </label>
      <input
        type="file"
        id="file-input"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default FileUploader;
