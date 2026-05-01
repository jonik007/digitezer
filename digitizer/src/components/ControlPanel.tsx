import React, { useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import * as FileSaver from 'file-saver';

export const ControlPanel: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    imageSrc,
    setImageSrc,
    toolMode,
    setToolMode,
    calibration,
    setScaleType,
    updateCalibrationValue,
    series,
    activeSeriesId,
    addSeries,
    removeSeries,
    setActiveSeries,
    exportToCSV,
    exportToJSON,
    clearAllData,
  } = useAppStore();

  const [newSeriesName, setNewSeriesName] = useState('Series 1');
  const [newSeriesColor, setNewSeriesColor] = useState('#0066cc');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleAddSeries = () => {
    addSeries(newSeriesName, newSeriesColor);
    setNewSeriesName(`Series ${series.length + 2}`);
  };

  const handleExportCSV = () => {
    const csv = exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    FileSaver.saveAs(blob, 'digitized_data.csv');
  };

  const handleExportJSON = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    FileSaver.saveAs(blob, 'digitizer_project.json');
  };

  return (
    <div style={{ padding: '15px', backgroundColor: '#fff', borderBottom: '1px solid #ddd' }}>
      {/* Image Upload */}
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>1. Загрузка изображения</h3>
        {!imageSrc ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '30px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: '#fafafa',
            }}
          >
            <p>Перетащите изображение сюда или кликните для выбора</p>
            <p style={{ fontSize: '12px', color: '#666' }}>Поддерживаются PNG, JPEG</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Изображение загружено</span>
            <button onClick={() => setImageSrc(null)} style={{ padding: '5px 10px' }}>
              Удалить
            </button>
          </div>
        )}
      </div>

      {/* Tool Selection */}
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>2. Режим работы</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setToolMode('pan')}
            style={{
              padding: '8px 16px',
              backgroundColor: toolMode === 'pan' ? '#007bff' : '#e0e0e0',
              color: toolMode === 'pan' ? '#fff' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ✋ Перемещение
          </button>
          <button
            onClick={() => setToolMode('calibrate')}
            style={{
              padding: '8px 16px',
              backgroundColor: toolMode === 'calibrate' ? '#007bff' : '#e0e0e0',
              color: toolMode === 'calibrate' ? '#fff' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            📐 Калибровка осей
          </button>
          <button
            onClick={() => setToolMode('digitize')}
            disabled={!calibration.isCalibrated}
            style={{
              padding: '8px 16px',
              backgroundColor: toolMode === 'digitize' ? '#007bff' : '#e0e0e0',
              color: toolMode === 'digitize' ? '#fff' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: calibration.isCalibrated ? 'pointer' : 'not-allowed',
              opacity: calibration.isCalibrated ? 1 : 0.6,
            }}
          >
            🎯 Оцифровка точек
          </button>
        </div>
      </div>

      {/* Calibration Settings */}
      {toolMode === 'calibrate' && (
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Настройки калибровки</h4>
          
          {/* X-axis calibration */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Ось X (красные точки)</div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>Точка 1:</span>
                <input
                  type="number"
                  value={calibration.xPoints[0]?.value ?? 0}
                  onChange={(e) => updateCalibrationValue('x', 0, parseFloat(e.target.value) || 0)}
                  style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                  disabled={!calibration.xPoints[0] || (calibration.xPoints[0].canvasX === 0 && calibration.xPoints[0].canvasY === 0)}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>Точка 2:</span>
                <input
                  type="number"
                  value={calibration.xPoints[1]?.value ?? 100}
                  onChange={(e) => updateCalibrationValue('x', 1, parseFloat(e.target.value) || 0)}
                  style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                  disabled={!calibration.xPoints[1] || (calibration.xPoints[1].canvasX === 0 && calibration.xPoints[1].canvasY === 0)}
                />
              </label>
              <label>
                <span>Тип шкалы: </span>
                <select
                  value={calibration.xScaleType}
                  onChange={(e) => setScaleType('x', e.target.value as 'linear' | 'log')}
                  style={{ marginLeft: '5px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="linear">Линейная</option>
                  <option value="log">Логарифмическая</option>
                </select>
              </label>
            </div>
          </div>
          
          {/* Y-axis calibration */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Ось Y (синие точки)</div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>Точка 1:</span>
                <input
                  type="number"
                  value={calibration.yPoints[0]?.value ?? 0}
                  onChange={(e) => updateCalibrationValue('y', 0, parseFloat(e.target.value) || 0)}
                  style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                  disabled={!calibration.yPoints[0] || (calibration.yPoints[0].canvasX === 0 && calibration.yPoints[0].canvasY === 0)}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>Точка 2:</span>
                <input
                  type="number"
                  value={calibration.yPoints[1]?.value ?? 100}
                  onChange={(e) => updateCalibrationValue('y', 1, parseFloat(e.target.value) || 0)}
                  style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                  disabled={!calibration.yPoints[1] || (calibration.yPoints[1].canvasX === 0 && calibration.yPoints[1].canvasY === 0)}
                />
              </label>
              <label>
                <span>Тип шкалы: </span>
                <select
                  value={calibration.yScaleType}
                  onChange={(e) => setScaleType('y', e.target.value as 'linear' | 'log')}
                  style={{ marginLeft: '5px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="linear">Линейная</option>
                  <option value="log">Логарифмическая</option>
                </select>
              </label>
            </div>
          </div>
          
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Кликните на холсте чтобы установить точки калибровки: сначала 2 точки для оси X (красные), затем 2 для оси Y (синие). 
            После установки точек можно изменить их числовые значения в полях выше.
          </p>
          {calibration.isCalibrated && (
            <p style={{ fontSize: '12px', color: '#28a745', marginTop: '5px', fontWeight: 'bold' }}>
              ✓ Калибровка завершена
            </p>
          )}
        </div>
      )}

      {/* Series Management */}
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>3. Управление сериями данных</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={newSeriesName}
            onChange={(e) => setNewSeriesName(e.target.value)}
            placeholder="Название серии"
            style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="color"
            value={newSeriesColor}
            onChange={(e) => setNewSeriesColor(e.target.value)}
            style={{ width: '40px', height: '30px', border: 'none', cursor: 'pointer' }}
          />
          <button onClick={handleAddSeries} style={{ padding: '5px 15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            + Добавить серию
          </button>
        </div>
        
        {series.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {series.map((s) => (
              <div
                key={s.id}
                onClick={() => setActiveSeries(s.id)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: activeSeriesId === s.id ? '#007bff' : '#e0e0e0',
                  color: activeSeriesId === s.id ? '#fff' : '#000',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: s.color }} />
                <span>{s.name}</span>
                <span style={{ fontSize: '12px' }}>({s.points.length})</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSeries(s.id);
                  }}
                  style={{
                    marginLeft: '5px',
                    background: 'none',
                    border: 'none',
                    color: activeSeriesId === s.id ? '#fff' : '#666',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export */}
      <div>
        <h3 style={{ margin: '0 0 10px 0' }}>4. Экспорт данных</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            disabled={series.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: series.length === 0 ? '#ccc' : '#17a2b8',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: series.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            📄 Экспорт CSV
          </button>
          <button
            onClick={handleExportJSON}
            disabled={series.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: series.length === 0 ? '#ccc' : '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: series.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            💾 Экспорт JSON
          </button>
          <button
            onClick={clearAllData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🗑️ Очистить всё
          </button>
        </div>
      </div>
    </div>
  );
};
