import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const PatternUploader = ({ onUpload }) => {

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const metadata = {
        name: file.name.replace(/\.svg$/i, '').replace(/[_-]/g, ' '),
        type: 'custom',
        tags: [],
        notes: ''
      };
      onUpload(file, metadata);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/svg+xml': ['.svg']
    },
    maxFiles: 1
  });

  return (
    <div className="pattern-uploader">
      <h3>Upload Custom Template</h3>
      <div className="upload-area">
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="dropzone-content">
            <div className="upload-icon">📐</div>
            <p>Drag & drop SVG pattern here</p>
            <p className="small">or click to select file</p>
            <p className="formats">SVG files only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternUploader;