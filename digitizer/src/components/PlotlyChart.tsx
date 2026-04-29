import React from 'react';
import Plot from 'react-plotly.js';
import { useAppStore } from '../store/appStore';

export const PlotlyChart: React.FC = () => {
  const { series } = useAppStore();

  const data = series.map((s) => ({
    x: s.points.map((p) => p.x),
    y: s.points.map((p) => p.y),
    mode: `${s.showLines ? 'lines' : ''}${s.showMarkers ? '+markers' : ''}`,
    type: 'scatter',
    name: s.name,
    line: { color: s.color, width: 2 },
    marker: { color: s.color, size: 8 },
  })) as any;

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Plot
        data={data}
        layout={{
          autosize: true,
          width: undefined,
          height: 400,
          margin: { t: 30, r: 30, l: 50, b: 50 },
          xaxis: { title: 'X', automargin: true },
          yaxis: { title: 'Y', automargin: true },
          showlegend: true,
        }}
        config={{ responsive: true }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
