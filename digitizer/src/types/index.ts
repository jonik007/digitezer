export interface Point {
  x: number;
  y: number;
}

export interface CalibrationPoint {
  id: string;
  axis: 'x' | 'y';
  index: number;
  canvasX: number;
  canvasY: number;
  value: number;
}

export interface DataSeries {
  id: string;
  name: string;
  color: string;
  points: Point[];
  showLines: boolean;
  showMarkers: boolean;
}

export interface CalibrationState {
  xPoints: CalibrationPoint[];
  yPoints: CalibrationPoint[];
  xScaleType: 'linear' | 'log';
  yScaleType: 'linear' | 'log';
  isCalibrated: boolean;
  showAxes: boolean;
}

export interface ImageTransform {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export type ToolMode = 'pan' | 'calibrate' | 'digitize';
