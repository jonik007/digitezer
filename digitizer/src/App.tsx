import React, { useState } from 'react';
import { DigitizerCanvas } from './components/DigitizerCanvas';
import { ControlPanel } from './components/ControlPanel';
import { PlotlyChart } from './components/PlotlyChart';

function App() {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      <header style={{ backgroundColor: '#333', color: '#fff', padding: '15px 20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>📊 Модуль оцифровки графиков</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
          Извлечение числовых данных из растровых изображений графиков
        </p>
      </header>

      <ControlPanel />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
        {/* Canvas Area */}
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'auto' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Рабочая область</h2>
          </div>
          <div style={{ padding: '15px' }}>
            <DigitizerCanvas width={canvasSize.width} height={canvasSize.height} />
          </div>
        </div>

        {/* Plotly Preview */}
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Предварительный просмотр (Plotly)</h2>
          </div>
          <div style={{ padding: '15px' }}>
            <PlotlyChart />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
