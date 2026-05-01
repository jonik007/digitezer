import { create } from 'zustand';
import { CalibrationState, DataSeries, ImageTransform, ToolMode, Point } from '../types';

interface AppState {
  // Image
  imageSrc: string | null;
  imageTransform: ImageTransform;
  
  // Calibration
  calibration: CalibrationState;
  
  // Data series
  series: DataSeries[];
  activeSeriesId: string | null;
  
  // Tool mode
  toolMode: ToolMode;
  
  // Actions
  setImageSrc: (src: string | null) => void;
  setImageTransform: (transform: Partial<ImageTransform>) => void;
  setCalibrationPoint: (axis: 'x' | 'y', index: number, canvasX: number, canvasY: number, value: number) => void;
  updateCalibrationValue: (axis: 'x' | 'y', index: number, value: number) => void;
  setScaleType: (axis: 'x' | 'y', scaleType: 'linear' | 'log') => void;
  addSeries: (name: string, color: string) => string;
  removeSeries: (id: string) => void;
  setActiveSeries: (id: string | null) => void;
  addPointToSeries: (seriesId: string, point: Point) => void;
  removePointFromSeries: (seriesId: string, pointIndex: number) => void;
  updateSeriesPoint: (seriesId: string, pointIndex: number, point: Point) => void;
  setToolMode: (mode: ToolMode) => void;
  clearAllData: () => void;
  exportToCSV: () => string;
  exportToJSON: () => string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultTransform: ImageTransform = {
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
};

const defaultCalibration: CalibrationState = {
  xPoints: [
    { id: 'x1', axis: 'x', index: 0, canvasX: 0, canvasY: 0, value: 0 },
    { id: 'x2', axis: 'x', index: 1, canvasX: 0, canvasY: 0, value: 100 },
  ],
  yPoints: [
    { id: 'y1', axis: 'y', index: 0, canvasX: 0, canvasY: 0, value: 0 },
    { id: 'y2', axis: 'y', index: 1, canvasX: 0, canvasY: 0, value: 100 },
  ],
  xScaleType: 'linear',
  yScaleType: 'linear',
  isCalibrated: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  imageSrc: null,
  imageTransform: defaultTransform,
  calibration: defaultCalibration,
  series: [],
  activeSeriesId: null,
  toolMode: 'pan',

  setImageSrc: (src) => set({ imageSrc: src }),
  
  setImageTransform: (transform) => 
    set((state) => ({ 
      imageTransform: { ...state.imageTransform, ...transform } 
    })),
  
  setCalibrationPoint: (axis, index, canvasX, canvasY, value) =>
    set((state) => {
      const points = axis === 'x' ? [...state.calibration.xPoints] : [...state.calibration.yPoints];
      const pointIndex = points.findIndex(p => p.index === index);
      if (pointIndex !== -1) {
        points[pointIndex] = { ...points[pointIndex], canvasX, canvasY, value };
      } else {
        points.push({ id: generateId(), axis, index, canvasX, canvasY, value });
      }
      
      const xPoints = axis === 'x' ? points : state.calibration.xPoints;
      const yPoints = axis === 'y' ? points : state.calibration.yPoints;
      
      // Only mark as calibrated if both axes have 2 points with non-zero coordinates
      const isCalibrated = xPoints.length >= 2 && yPoints.length >= 2 && 
        xPoints.every(p => p.canvasX !== 0 || p.canvasY !== 0) &&
        yPoints.every(p => p.canvasX !== 0 || p.canvasY !== 0);
      
      return {
        calibration: {
          ...state.calibration,
          xPoints: xPoints.sort((a, b) => a.index - b.index),
          yPoints: yPoints.sort((a, b) => a.index - b.index),
          isCalibrated,
        }
      };
    }),
  
  // New action to update calibration point value
  updateCalibrationValue: (axis, index, value) =>
    set((state) => {
      const points = axis === 'x' ? [...state.calibration.xPoints] : [...state.calibration.yPoints];
      const pointIndex = points.findIndex(p => p.index === index);
      if (pointIndex !== -1) {
        points[pointIndex] = { ...points[pointIndex], value };
      }
      
      const xPoints = axis === 'x' ? points : state.calibration.xPoints;
      const yPoints = axis === 'y' ? points : state.calibration.yPoints;
      
      return {
        calibration: {
          ...state.calibration,
          xPoints: xPoints.sort((a, b) => a.index - b.index),
          yPoints: yPoints.sort((a, b) => a.index - b.index),
        }
      };
    }),
  
  setScaleType: (axis, scaleType) =>
    set((state) => ({
      calibration: {
        ...state.calibration,
        [axis === 'x' ? 'xScaleType' : 'yScaleType']: scaleType,
      }
    })),
  
  addSeries: (name, color) => {
    const id = generateId();
    const newSeries: DataSeries = {
      id,
      name,
      color,
      points: [],
      showLines: true,
      showMarkers: true,
    };
    set((state) => ({
      series: [...state.series, newSeries],
      activeSeriesId: id,
    }));
    return id;
  },
  
  removeSeries: (id) =>
    set((state) => ({
      series: state.series.filter(s => s.id !== id),
      activeSeriesId: state.activeSeriesId === id ? null : state.activeSeriesId,
    })),
  
  setActiveSeries: (id) => set({ activeSeriesId: id }),
  
  addPointToSeries: (seriesId, point) =>
    set((state) => ({
      series: state.series.map(s =>
        s.id === seriesId ? { ...s, points: [...s.points, point] } : s
      ),
    })),
  
  removePointFromSeries: (seriesId, pointIndex) =>
    set((state) => ({
      series: state.series.map(s =>
        s.id === seriesId 
          ? { ...s, points: s.points.filter((_, i) => i !== pointIndex) } 
          : s
      ),
    })),
  
  updateSeriesPoint: (seriesId, pointIndex, point) =>
    set((state) => ({
      series: state.series.map(s =>
        s.id === seriesId
          ? { ...s, points: s.points.map((p, i) => i === pointIndex ? point : p) }
          : s
      ),
    })),
  
  setToolMode: (mode) => set({ toolMode: mode }),
  
  clearAllData: () => set({
    imageSrc: null,
    imageTransform: defaultTransform,
    calibration: defaultCalibration,
    series: [],
    activeSeriesId: null,
    toolMode: 'pan',
  }),
  
  exportToCSV: () => {
    const state = get();
    let csv = '';
    state.series.forEach(series => {
      csv += `# Series: ${series.name}\n`;
      csv += 'X,Y\n';
      series.points.forEach(point => {
        csv += `${point.x},${point.y}\n`;
      });
      csv += '\n';
    });
    return csv;
  },
  
  exportToJSON: () => {
    const state = get();
    return JSON.stringify({
      calibration: state.calibration,
      series: state.series,
    }, null, 2);
  },
}));
