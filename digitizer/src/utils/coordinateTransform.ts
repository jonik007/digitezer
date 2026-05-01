import { CalibrationState, Point } from '../types';

// Helper to calculate projection ratio along an axis
function calculateRatio(
  pointX: number,
  pointY: number,
  axisStart: { canvasX: number; canvasY: number },
  axisEnd: { canvasX: number; canvasY: number }
): number {
  // Vector from axis start to end
  const axisVecX = axisEnd.canvasX - axisStart.canvasX;
  const axisVecY = axisEnd.canvasY - axisStart.canvasY;
  
  // Vector from axis start to point
  const pointVecX = pointX - axisStart.canvasX;
  const pointVecY = pointY - axisStart.canvasY;
  
  // Project point vector onto axis vector using dot product
  const axisLengthSq = axisVecX * axisVecX + axisVecY * axisVecY;
  
  if (axisLengthSq === 0) return 0;
  
  const projection = (pointVecX * axisVecX + pointVecY * axisVecY) / axisLengthSq;
  
  return projection;
}

export function canvasToDataCoords(
  canvasX: number,
  canvasY: number,
  calibration: CalibrationState
): Point | null {
  if (!calibration.isCalibrated || calibration.xPoints.length < 2 || calibration.yPoints.length < 2) {
    return null;
  }
  
  const x1 = calibration.xPoints[0];
  const x2 = calibration.xPoints[1];
  const y1 = calibration.yPoints[0];
  const y2 = calibration.yPoints[1];
  
  // Calculate projection ratios along each axis
  const xRatio = calculateRatio(canvasX, canvasY, x1, x2);
  const yRatio = calculateRatio(canvasX, canvasY, y1, y2);
  
  // Convert to data coordinates based on scale type
  let dataX: number;
  let dataY: number;

  if (calibration.xScaleType === 'log') {
    const xMin = Math.min(x1.value, x2.value);
    const xMax = Math.max(x1.value, x2.value);
    if (xMin <= 0 || xMax <= 0 || xRatio < 0 || xRatio > 1) {
      dataX = x1.value + xRatio * (x2.value - x1.value);
    } else {
      const logMin = Math.log10(xMin);
      const logMax = Math.log10(xMax);
      dataX = Math.pow(10, logMin + xRatio * (logMax - logMin));
    }
  } else {
    dataX = x1.value + xRatio * (x2.value - x1.value);
  }

  if (calibration.yScaleType === 'log') {
    const yMin = Math.min(y1.value, y2.value);
    const yMax = Math.max(y1.value, y2.value);
    if (yMin <= 0 || yMax <= 0 || yRatio < 0 || yRatio > 1) {
      dataY = y1.value + yRatio * (y2.value - y1.value);
    } else {
      const logMin = Math.log10(yMin);
      const logMax = Math.log10(yMax);
      dataY = Math.pow(10, logMin + yRatio * (logMax - logMin));
    }
  } else {
    dataY = y1.value + yRatio * (y2.value - y1.value);
  }

  return { x: dataX, y: dataY };
}

export function dataToCanvasCoords(
  dataX: number,
  dataY: number,
  calibration: CalibrationState
): Point | null {
  if (!calibration.isCalibrated || calibration.xPoints.length < 2 || calibration.yPoints.length < 2) {
    return null;
  }

  const x1 = calibration.xPoints[0];
  const x2 = calibration.xPoints[1];
  const y1 = calibration.yPoints[0];
  const y2 = calibration.yPoints[1];

  // Calculate ratios from data values
  let xRatio: number;
  let yRatio: number;

  if (calibration.xScaleType === 'log') {
    const xMin = Math.min(x1.value, x2.value);
    const xMax = Math.max(x1.value, x2.value);
    if (xMin <= 0 || xMax <= 0 || dataX <= 0) {
      xRatio = (dataX - x1.value) / (x2.value - x1.value);
    } else {
      const logMin = Math.log10(xMin);
      const logMax = Math.log10(xMax);
      const logData = Math.log10(dataX);
      xRatio = (logData - logMin) / (logMax - logMin);
    }
  } else {
    xRatio = (dataX - x1.value) / (x2.value - x1.value);
  }

  if (calibration.yScaleType === 'log') {
    const yMin = Math.min(y1.value, y2.value);
    const yMax = Math.max(y1.value, y2.value);
    if (yMin <= 0 || yMax <= 0 || dataY <= 0) {
      yRatio = (dataY - y1.value) / (y2.value - y1.value);
    } else {
      const logMin = Math.log10(yMin);
      const logMax = Math.log10(yMax);
      const logData = Math.log10(dataY);
      yRatio = (logData - logMin) / (logMax - logMin);
    }
  } else {
    yRatio = (dataY - y1.value) / (y2.value - y1.value);
  }

  // Calculate canvas position using X axis for X coordinate and Y axis for Y coordinate
  // This gives us the intersection point in the skewed coordinate system
  const canvasX = x1.canvasX + xRatio * (x2.canvasX - x1.canvasX);
  const canvasY = y1.canvasY + yRatio * (y2.canvasY - y1.canvasY);

  return { x: canvasX, y: canvasY };
}
