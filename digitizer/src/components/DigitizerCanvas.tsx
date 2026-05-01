import React, { useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Group } from 'react-konva';
import { useAppStore } from '../store/appStore';
import { dataToCanvasCoords } from '../utils/coordinateTransform';

interface CanvasProps {
  width: number;
  height: number;
}

export const DigitizerCanvas: React.FC<CanvasProps> = ({ width, height }) => {
  const stageRef = useRef<any>(null);
  const imageRef = useRef<any>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

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

  // Helper to convert from stage coords to image-local coords using Konva's transform
  const toImageCoords = (stageX: number, stageY: number) => {
    if (!imageRef.current) {
      return { x: stageX, y: stageY };
    }
    const absTransform = imageRef.current.getAbsoluteTransform();
    const inverseTransform = absTransform.copy();
    inverseTransform.invert();
    const transformed = inverseTransform.point({ x: stageX, y: stageY });
    return { x: transformed.x, y: transformed.y };
  };

  // Helper to convert from image-local coords to stage coords using Konva's transform
  const toStageCoords = (canvasX: number, canvasY: number) => {
    if (!imageRef.current) {
      return { x: canvasX, y: canvasY };
    }
    const absTransform = imageRef.current.getAbsoluteTransform();
    const transformed = absTransform.point({ x: canvasX, y: canvasY });
    return { x: transformed.x, y: transformed.y };
  };

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
      const xPointsSet = calibration.xPoints.filter(p => p.canvasX !== 0 || p.canvasY !== 0).length;
      const yPointsSet = calibration.yPoints.filter(p => p.canvasX !== 0 || p.canvasY !== 0).length;

      if (xPointsSet < 2) {
        const existingValue = calibration.xPoints[xPointsSet]?.value ?? (xPointsSet === 0 ? 0 : 100);
        setCalibrationPoint('x', xPointsSet, canvasX, canvasY, existingValue);
      } else if (yPointsSet < 2) {
        const existingValue = calibration.yPoints[yPointsSet]?.value ?? (yPointsSet === 0 ? 0 : 100);
        setCalibrationPoint('y', yPointsSet, canvasX, canvasY, existingValue);
      }
    } else if (toolMode === 'digitize' && activeSeriesId && calibration.isCalibrated) {
      // canvasToDataCoords will be imported and used here when needed
      import('../utils/coordinateTransform').then(({ canvasToDataCoords }) => {
        const dataPoint = canvasToDataCoords(canvasX, canvasY, calibration);
        if (dataPoint) {
          addPointToSeries(activeSeriesId, dataPoint);
        }
      });
    }
  };

  const handlePointDragEnd = (seriesId: string, pointIndex: number, e: any) => {
    const node = e.target;
    const imgCoords = toImageCoords(node.x(), node.y());
    
    import('../utils/coordinateTransform').then(({ canvasToDataCoords }) => {
      const dataPoint = canvasToDataCoords(imgCoords.x, imgCoords.y, calibration);
      if (dataPoint) {
        updateSeriesPoint(seriesId, pointIndex, dataPoint);
      }
    });
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
        {imageObj && (
          <KonvaImage
            ref={imageRef}
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

        {/* Calibration points - stored in image-local coords, displayed via toStageCoords */}
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

        {/* Data series points - use dataToCanvasCoords then toStageCoords */}
        {series.map((s) => (
          <Group key={s.id}>
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
