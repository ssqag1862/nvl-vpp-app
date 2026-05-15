import React from 'react';
import './DropZone.css';

function DropZone({ onFileSelect, fileName }) {
  const [dragOver, setDragOver] = React.useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div
      className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="drop-zone-icon">📥</div>
      <p>Kéo thả file <strong>Master Data Excel</strong> vào đây để cập nhật</p>
      <p style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text3)' }}>
        Hoặc nhấn nút "Tải file Excel" ở góc trên
      </p>
      {fileName && <div className="file-name">📄 {fileName}</div>}
    </div>
  );
}

export default DropZone;
