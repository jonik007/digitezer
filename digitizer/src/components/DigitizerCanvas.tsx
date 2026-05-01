import React, { useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Group } from 'react-konva';
import { useAppStore } from '../store/appStore';
import { canvasToDataCoords, dataToCanvasCoords } from '../utils/coordinateTransform';

interface CanvasProps {
  width: number;
  height: number;
}

export const DigitizerCanvas: React.FC<CanvasProps> = ({ width, height }) => {
  const stageRef = useRef<any>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    imageSrc,
    imageTransform,
    setImageTransform,
    calibration,
    setCalibrationPoint,
    series,
    activeSeriesId,
    addPointToSeries,
    updateSeriesPoint,
    removePointFromSeries,
    toolMode,
  } = useAppStore();

  // Load image when src changes
  React.useEffect(() => {
    if (!imageSrc) {
      setImageObj(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImageObj(img);
    img.src = imageSrc;
  }, [imageSrc]);

  const handleStageClick = (e: any) => {
    if (toolMode === 'pan') return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Convert stage coordinates to image-local coordinates
    const imgCoords = toImageCoords(pointerPos.x, pointerPos.y);
    const canvasX = imgCoords.x;
    const canvasY = imgCoords.y;

    if (toolMode === 'calibrate') {
      // Determine which axis and index to set based on current state
      const xPointsSet = calibration.xPoints.filter(p => p.canvasX !== 0 || p.canvasY !== 0).length;
      const yPointsSet = calibration.yPoints.filter(p => p.canvasX !== 0 || p.canvasY !== 0).length;

      if (xPointsSet < 2) {
        // Use the existing value from the input field if already set
        const existingValue = calibration.xPoints[xPointsSet]?.value ?? (xPointsSet === 0 ? 0 : 100);
        setCalibrationPoint('x', xPointsSet, canvasX, canvasY, existingValue);
      } else if (yPointsSet < 2) {
        // Use the existing value from the input field if already set
        const existingValue = calibration.yPoints[yPointsSet]?.value ?? (yPointsSet === 0 ? 0 : 100);
        setCalibrationPoint('y', yPointsSet, canvasX, canvasY, existingValue);
      }
    } else if (toolMode === 'digitize' && activeSeriesId && calibration.isCalibrated) {
      const dataPoint = canvasToDataCoords(canvasX, canvasY, calibration);
      if (dataPoint) {
        addPointToSeries(activeSeriesId, dataPoint);
      }
    }
  };

  // Helper to convert from image-local coords to stage coords (for rendering calibration points)
  const toStageCoords = (canvasX: number, canvasY: number) => {
    const imgX = imageTransform.x;
    const imgY = imageTransform.y;
    const imgScale = imageTransform.scale;
    const imgRotation = imageTransform.rotation;

    let stageX = canvasX;
    let stageY = canvasY;

    // Apply scale
    if (imgScale !== 1 && imgScale !== 0) {
      stageX = imgX + (stageX - imgX) * imgScale;
      stageY = imgY + (stageY - imgY) * imgScale;
    }

    // Apply rotation
    if (imgRotation !== 0) {
      const rad = (imgRotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = stageX - imgX;
      const dy = stageY - imgY;
      stageX = imgX + dx * cos - dy * sin;
      stageY = imgY + dx * sin + dy * cos;
    }

    return { x: stageX, y: stageY };
  };

  // Helper to convert from stage coords to image-local coords
  const toImageCoords = (stageX: number, stageY: number) => {
    const imgX = imageTransform.x;
    const imgY = imageTransform.y;
    const imgScale = imageTransform.scale;
    const imgRotation = imageTransform.rotation;

    let canvasX = stageX;
    let canvasY = stageY;

    // Apply inverse rotation
    if (imgRotation !== 0) {
      const rad = (imgRotation * Math.PI) / 180;
      const cos = Math.cos(-rad);
      const sin = Math.sin(-rad);
      const dx = canvasX - imgX;
      const dy = canvasY - imgY;
      canvasX = imgX + dx * cos - dy * sin;
      canvasY = imgY + dx * sin + dy * cos;
    }

    // Apply inverse scale
    if (imgScale !== 1 && imgScale !== 0) {
      canvasX = imgX + (canvasX - imgX) / imgScale;
      canvasY = imgY + (canvasY - imgY) / imgScale;
    }

    return { x: canvasX, y: canvasY };
  };

  const handlePointDragEnd = (seriesId: string, pointIndex: number, e: any) => {
    const node = e.target;
    // The node's position is in stage coordinates - convert to image-local coords
    const imgCoords = toImageCoords(node.x(), node.y());

    // Recalculate data coordinates based on new position
    const dataPoint = canvasToDataCoords(imgCoords.x, imgCoords.y, calibration);
    if (dataPoint) {
      updateSeriesPoint(seriesId, pointIndex, dataPoint);
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onClick={handleStageClick}
      style={{ backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}
    >
      <Layer>
        {/* Background image */}
        {imageObj && (
          <KonvaImage
            image={imageObj}
            x={imageTransform.x}
            y={imageTransform.y}
            rotation={imageTransform.rotation}
            scaleX={imageTransform.scale}
            scaleY={imageTransform.scale}
            draggable={toolMode === 'pan'}
            onDragEnd={(e) => {
              setImageTransform({ x: e.target.x(), y: e.target.y() });
            }}
            onTransformEnd={(e) => {
              const node = e.target;
              setImageTransform({
                x: node.x(),
                y: node.y(),
                rotation: node.rotation(),
                scale: node.scaleX(),
              });
            }}
          />
        )}

        {/* Calibration points - rendered in image-local coordinates */}
        {calibration.xPoints.map((point, index) => {
          const stagePos = toStageCoords(point.canvasX, point.canvasY);
          return (
            <Group key={point.id}>
              <Circle
                x={stagePos.x}
                y={stagePos.y}
                radius={8}
                fill="rgba(255, 0, 0, 0.5)"
                stroke="red"
                strokeWidth={2}
                draggable={toolMode === 'calibrate'}
                onDragEnd={(e) => {
                  const imgCoords = toImageCoords(e.target.x(), e.target.y());
                  setCalibrationPoint('x', index, imgCoords.x, imgCoords.y, point.value);
                }}
              />
              <Circle
                x={stagePos.x}
                y={stagePos.y}
                radius={3}
                fill="red"
              />
            </Group>
          );
        })}

        {calibration.yPoints.map((point, index) => {
          const stagePos = toStageCoords(point.canvasX, point.canvasY);
          return (
            <Group key={point.id}>
              <Circle
                x={stagePos.x}
                y={stagePos.y}
                radius={8}
                fill="rgba(0, 0, 255, 0.5)"
                stroke="blue"
                strokeWidth={2}
                draggable={toolMode === 'calibrate'}
                onDragEnd={(e) => {
                  const imgCoords = toImageCoords(e.target.x(), e.target.y());
                  setCalibrationPoint('y', index, imgCoords.x, imgCoords.y, point.value);
                }}
              />
              <Circle
                x={stagePos.x}
                y={stagePos.y}
                radius={3}
                fill="blue"
              />
            </Group>
          );
        })}

        {/* Data series points - rendered in image-local coordinates */}
        {series.map((s) => (
          <Group key={s.id}>
            {/* Lines connecting points */}
            {s.showLines && s.points.length > 1 && (
              <Line
                points={s.points.flatMap((p) => {
                  const imgCoords = dataToCanvasCoords(p.x, p.y, calibration);
                  if (!imgCoords) return [];
                  const stagePos = toStageCoords(imgCoords.x, imgCoords.y);
                  return [stagePos.x, stagePos.y];
                })}
                stroke={s.color}
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
              />
            )}
            {/* Individual points */}
            {s.showMarkers &&
              s.points.map((point, pointIndex) => {
                const imgCoords = dataToCanvasCoords(point.x, point.y, calibration);
                if (!imgCoords) return null;
                const stagePos = toStageCoords(imgCoords.x, imgCoords.y);
                return (
                  <Circle
                    key={pointIndex}
                    x={stagePos.x}
                    y={stagePos.y}
                    radius={5}
                    fill={s.color}
                    stroke="#fff"
                    strokeWidth={1}
                    draggable={toolMode === 'digitize'}
                    onDragEnd={(e) => handlePointDragEnd(s.id, pointIndex, e)}
                    onContextMenu={(e) => {
                      e.evt.preventDefault();
                      removePointFromSeries(s.id, pointIndex);
                    }}
                  />
                );
              })}
          </Group>
        ))}
      </Layer>
    </Stage>
  );
};
