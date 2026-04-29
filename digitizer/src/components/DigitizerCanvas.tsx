import React, { useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Group } from 'react-konva';
import { useAppStore } from '../store/appStore';
import { canvasToDataCoords } from '../utils/coordinateTransform';

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

    const canvasX = pointerPos.x;
    const canvasY = pointerPos.y;

    if (toolMode === 'calibrate') {
      // Determine which axis and index to set based on current state
      const xPointsSet = calibration.xPoints.filter(p => p.canvasX !== 0 || p.canvasY !== 0).length;
      const yPointsSet = calibration.yPoints.filter(p => p.canvasX !== 0 || p.canvasY !== 0).length;

      if (xPointsSet < 2) {
        setCalibrationPoint('x', xPointsSet, canvasX, canvasY, xPointsSet === 0 ? 0 : 100);
      } else if (yPointsSet < 2) {
        setCalibrationPoint('y', yPointsSet, canvasX, canvasY, yPointsSet === 0 ? 0 : 100);
      }
    } else if (toolMode === 'digitize' && activeSeriesId && calibration.isCalibrated) {
      const dataPoint = canvasToDataCoords(canvasX, canvasY, calibration);
      if (dataPoint) {
        addPointToSeries(activeSeriesId, dataPoint);
      }
    }
  };

  const handlePointDragEnd = (seriesId: string, pointIndex: number, e: any) => {
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    // Recalculate data coordinates based on new position
    const dataPoint = canvasToDataCoords(newX, newY, calibration);
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

        {/* Calibration points */}
        {calibration.xPoints.map((point, index) => (
          <Group key={point.id}>
            <Circle
              x={point.canvasX}
              y={point.canvasY}
              radius={8}
              fill="rgba(255, 0, 0, 0.5)"
              stroke="red"
              strokeWidth={2}
              draggable={toolMode === 'calibrate'}
              onDragEnd={(e) => {
                setCalibrationPoint('x', index, e.target.x(), e.target.y(), point.value);
              }}
            />
            <Circle
              x={point.canvasX}
              y={point.canvasY}
              radius={3}
              fill="red"
            />
          </Group>
        ))}

        {calibration.yPoints.map((point, index) => (
          <Group key={point.id}>
            <Circle
              x={point.canvasX}
              y={point.canvasY}
              radius={8}
              fill="rgba(0, 0, 255, 0.5)"
              stroke="blue"
              strokeWidth={2}
              draggable={toolMode === 'calibrate'}
              onDragEnd={(e) => {
                setCalibrationPoint('y', index, e.target.x(), e.target.y(), point.value);
              }}
            />
            <Circle
              x={point.canvasX}
              y={point.canvasY}
              radius={3}
              fill="blue"
            />
          </Group>
        ))}

        {/* Data series points */}
        {series.map((s) => (
          <Group key={s.id}>
            {/* Lines connecting points */}
            {s.showLines && s.points.length > 1 && (
              <Line
                points={s.points.flatMap((p, i) => {
                  const canvasP = canvasToDataCoords(p.x, p.y, calibration);
                  return canvasP ? [canvasP.x, canvasP.y] : [];
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
                const canvasP = canvasToDataCoords(point.x, point.y, calibration);
                if (!canvasP) return null;
                return (
                  <Circle
                    key={pointIndex}
                    x={canvasP.x}
                    y={canvasP.y}
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
