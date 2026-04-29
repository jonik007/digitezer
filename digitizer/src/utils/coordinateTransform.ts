import { CalibrationState, Point } from '../types';

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

  // Calculate pixel distances
  const xPixelDist = Math.sqrt(Math.pow(x2.canvasX - x1.canvasX, 2) + Math.pow(x2.canvasY - x1.canvasY, 2));
  const yPixelDist = Math.sqrt(Math.pow(y2.canvasX - y1.canvasX, 2) + Math.pow(y2.canvasY - y1.canvasY, 2));

  if (xPixelDist === 0 || yPixelDist === 0) {
    return null;
  }

  // Calculate unit vectors for axes
  const xUnitX = (x2.canvasX - x1.canvasX) / xPixelDist;
  const xUnitY = (x2.canvasY - x1.canvasY) / xPixelDist;
  const yUnitX = (y2.canvasX - y1.canvasX) / yPixelDist;
  const yUnitY = (y2.canvasY - y1.canvasY) / yPixelDist;

  // Vector from X1 to point
  const vecX = canvasX - x1.canvasX;
  const vecY = canvasY - x1.canvasY;

  // Project onto X axis
  const xProj = vecX * xUnitX + vecY * xUnitY;
  
  // Project onto Y axis (from Y1)
  const vecYFromY1X = canvasX - y1.canvasX;
  const vecYFromY1Y = canvasY - y1.canvasY;
  const yProj = vecYFromY1X * yUnitX + vecYFromY1Y * yUnitY;

  // Convert to data coordinates
  let dataX: number;
  let dataY: number;

  if (calibration.xScaleType === 'log') {
    const xMin = Math.min(x1.value, x2.value);
    const xMax = Math.max(x1.value, x2.value);
    if (xMin <= 0 || xMax <= 0) {
      // Cannot do log scale with non-positive values
      dataX = x1.value + (xProj / xPixelDist) * (x2.value - x1.value);
    } else {
      const logMin = Math.log10(xMin);
      const logMax = Math.log10(xMax);
      const ratio = xProj / xPixelDist;
      dataX = Math.pow(10, logMin + ratio * (logMax - logMin));
    }
  } else {
    dataX = x1.value + (xProj / xPixelDist) * (x2.value - x1.value);
  }

  if (calibration.yScaleType === 'log') {
    const yMin = Math.min(y1.value, y2.value);
    const yMax = Math.max(y1.value, y2.value);
    if (yMin <= 0 || yMax <= 0) {
      dataY = y1.value + (yProj / yPixelDist) * (y2.value - y1.value);
    } else {
      const logMin = Math.log10(yMin);
      const logMax = Math.log10(yMax);
      const ratio = yProj / yPixelDist;
      dataY = Math.pow(10, logMin + ratio * (logMax - logMin));
    }
  } else {
    dataY = y1.value + (yProj / yPixelDist) * (y2.value - y1.value);
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

  const xPixelDist = Math.sqrt(Math.pow(x2.canvasX - x1.canvasX, 2) + Math.pow(x2.canvasY - x1.canvasY, 2));
  const yPixelDist = Math.sqrt(Math.pow(y2.canvasX - y1.canvasX, 2) + Math.pow(y2.canvasY - y1.canvasY, 2));

  if (xPixelDist === 0 || yPixelDist === 0) {
    return null;
  }

  const xUnitX = (x2.canvasX - x1.canvasX) / xPixelDist;
  const xUnitY = (x2.canvasY - x1.canvasY) / xPixelDist;
  const yUnitX = (y2.canvasX - y1.canvasX) / yPixelDist;
  const yUnitY = (y2.canvasY - y1.canvasY) / yPixelDist;

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

  const canvasX = x1.canvasX + xRatio * xPixelDist * xUnitX;
  const canvasY = x1.canvasY + xRatio * xPixelDist * xUnitY;

  // For Y, we need to use the Y axis direction
  const canvasXFromY = y1.canvasX + yRatio * yPixelDist * yUnitX;
  const canvasYFromY = y1.canvasY + yRatio * yPixelDist * yUnitY;

  // Average the two calculations for better accuracy
  return {
    x: (canvasX + canvasXFromY) / 2,
    y: (canvasY + canvasYFromY) / 2,
  };
}
