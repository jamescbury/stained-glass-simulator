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
    <div
      {...getRootProps()}
      className={`pattern-uploader dropzone ${isDragActive ? 'active' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="dropzone-content">
        <p className="upload-text">Drop SVG here or click to upload</p>
      </div>
    </div>
  );
};

export default PatternUploader;