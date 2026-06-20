import React, { useState, useRef } from 'react';
import Icon from '../Icon';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageBlob: Blob) => void;
  onClose: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onSave, onClose }) => {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const applyFilters = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(img, 0, 0);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (blob) onSave(blob);
    }, 'image/png');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="image-editor-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редактировать изображение</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="image-editor-content">
          <img ref={imgRef} src={imageUrl} alt="Edit" style={{ display: 'none' }} onLoad={applyFilters} />
          <canvas ref={canvasRef} className="editor-canvas" />
          
          <div className="editor-controls">
            <div className="control-group">
              <label>Яркость</label>
              <input type="range" min={0} max={200} value={brightness} onChange={e => setBrightness(Number(e.target.value))} />
            </div>
            <div className="control-group">
              <label>Контраст</label>
              <input type="range" min={0} max={200} value={contrast} onChange={e => setContrast(Number(e.target.value))} />
            </div>
            <div className="control-group">
              <label>Насыщенность</label>
              <input type="range" min={0} max={200} value={saturation} onChange={e => setSaturation(Number(e.target.value))} />
            </div>
            <button onClick={handleRotate}><Icon name="refresh" size={20} /> Повернуть</button>
            <button onClick={handleSave} className="btn-primary">Сохранить</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;