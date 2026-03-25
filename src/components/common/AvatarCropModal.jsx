import { useEffect, useMemo, useRef, useState } from "react";
import Button from "./Button";

const FRAME_SIZE_FALLBACK = 360;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const INNER_CIRCLE_RATIO = 0.6;
const OUTPUT_MAX_SIZE = 2048;
const OUTPUT_MIN_SIZE = 256;

export default function AvatarCropModal({ sourceUrl, roughPath, onCancel, onConfirm }) {
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [frameSize, setFrameSize] = useState({ width: FRAME_SIZE_FALLBACK, height: FRAME_SIZE_FALLBACK });

  const frameRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  useEffect(() => {
    const updateFrameSize = () => {
      if (!frameRef.current) {
        return;
      }

      const bounds = frameRef.current.getBoundingClientRect();

      if (!bounds.width || !bounds.height) {
        return;
      }

      setFrameSize({
        width: bounds.width,
        height: bounds.height,
      });
    };

    updateFrameSize();

    window.addEventListener("resize", updateFrameSize);

    return () => {
      window.removeEventListener("resize", updateFrameSize);
    };
  }, []);

  useEffect(() => {
    const handleMove = (event) => {
      if (!dragRef.current.active) {
        return;
      }

      const deltaX = event.clientX - dragRef.current.startX;
      const deltaY = event.clientY - dragRef.current.startY;

      setOffsetX(dragRef.current.originX + deltaX);
      setOffsetY(dragRef.current.originY + deltaY);
    };

    const handleUp = () => {
      dragRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  const baseSize = useMemo(() => {
    const { width, height } = naturalSize;
    const frameSquare = Math.min(frameSize.width, frameSize.height) || FRAME_SIZE_FALLBACK;

    if (!width || !height) {
      return { width: frameSquare, height: frameSquare };
    }

    if (width >= height) {
      return {
        width: frameSquare,
        height: (frameSquare * height) / width,
      };
    }

    return {
      width: (frameSquare * width) / height,
      height: frameSquare,
    };
  }, [naturalSize, frameSize]);

  const handleMouseDown = (event) => {
    if (!sourceUrl) {
      return;
    }

    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: offsetX,
      originY: offsetY,
    };
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;

    setScale((previous) => {
      const nextScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, previous + delta));
      return Number(nextScale.toFixed(2));
    });
  };

  const handleReset = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleConfirm = () => {
    const imageElement = imageRef.current;

    if (!imageElement || !naturalSize.width || !naturalSize.height) {
      return;
    }

    const frameWidth = frameSize.width || FRAME_SIZE_FALLBACK;
    const frameHeight = frameSize.height || FRAME_SIZE_FALLBACK;
    const displayWidth = baseSize.width * scale;
    const displayHeight = baseSize.height * scale;

    const imageLeft = frameWidth / 2 + offsetX - displayWidth / 2;
    const imageTop = frameHeight / 2 + offsetY - displayHeight / 2;

    const cropDiameter = Math.min(frameWidth, frameHeight) * INNER_CIRCLE_RATIO;
    const cropLeft = frameWidth / 2 - cropDiameter / 2;
    const cropTop = frameHeight / 2 - cropDiameter / 2;

    const sourceX = ((cropLeft - imageLeft) / displayWidth) * naturalSize.width;
    const sourceY = ((cropTop - imageTop) / displayHeight) * naturalSize.height;
    const sourceWidth = (cropDiameter / displayWidth) * naturalSize.width;
    const sourceHeight = (cropDiameter / displayHeight) * naturalSize.height;

    if (sourceWidth <= 0 || sourceHeight <= 0) {
      return;
    }

    const outputSize = Math.min(
      OUTPUT_MAX_SIZE,
      Math.max(OUTPUT_MIN_SIZE, Math.round(Math.max(sourceWidth, sourceHeight))),
    );

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;

    const outputContext = outputCanvas.getContext("2d");

    if (!outputContext) {
      return;
    }

    outputContext.imageSmoothingEnabled = true;
    outputContext.imageSmoothingQuality = "high";

    outputContext.save();
    outputContext.beginPath();
    outputContext.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    outputContext.closePath();
    outputContext.clip();

    const safeSourceX = Math.max(0, sourceX);
    const safeSourceY = Math.max(0, sourceY);
    const safeSourceEndX = Math.min(naturalSize.width, sourceX + sourceWidth);
    const safeSourceEndY = Math.min(naturalSize.height, sourceY + sourceHeight);
    const safeSourceWidth = Math.max(0, safeSourceEndX - safeSourceX);
    const safeSourceHeight = Math.max(0, safeSourceEndY - safeSourceY);

    if (safeSourceWidth > 0 && safeSourceHeight > 0) {
      const destinationScaleX = outputSize / sourceWidth;
      const destinationScaleY = outputSize / sourceHeight;
      const destinationX = (safeSourceX - sourceX) * destinationScaleX;
      const destinationY = (safeSourceY - sourceY) * destinationScaleY;
      const destinationWidth = safeSourceWidth * destinationScaleX;
      const destinationHeight = safeSourceHeight * destinationScaleY;

      outputContext.drawImage(
        imageElement,
        safeSourceX,
        safeSourceY,
        safeSourceWidth,
        safeSourceHeight,
        destinationX,
        destinationY,
        destinationWidth,
        destinationHeight,
      );
    }

    outputContext.restore();

    const croppedUrl = outputCanvas.toDataURL("image/png");
    onConfirm(croppedUrl);
  };

  if (!sourceUrl) {
    return null;
  }

  return (
    <div className="avatar-crop-overlay" onClick={onCancel}>
      <div className="avatar-crop-modal" onClick={(event) => event.stopPropagation()}>
        <div className="avatar-crop-title">Cắt ảnh đại diện</div>

        <div ref={frameRef} className="avatar-crop-frame" onMouseDown={handleMouseDown} onWheel={handleWheel}>
          <img
            ref={imageRef}
            src={sourceUrl}
            alt="Ảnh gốc"
            className="avatar-crop-image"
            style={{
              width: `${baseSize.width}px`,
              height: `${baseSize.height}px`,
              transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
            }}
            onLoad={(event) => {
              setNaturalSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              });
            }}
          />

          <svg className="avatar-crop-rough-guide" viewBox="0 0 48 48" aria-hidden="true">
            <path d={roughPath} />
          </svg>

          <div className="avatar-crop-perfect-guide" />
        </div>

        <div className="avatar-crop-hint">Kéo để canh ảnh • Cuộn hoặc thanh để zoom • Ảnh sẽ lấy theo vòng tròn hoàn hảo nhỏ nhất</div>

        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step="0.01"
          value={scale}
          onChange={(event) => setScale(Number(event.target.value))}
          className="avatar-crop-zoom"
          aria-label="Zoom ảnh"
        />

        <div className="avatar-crop-actions">
          <Button type="button" onClick={handleReset}>
            Reset
          </Button>
          <div className="avatar-crop-actions-right">
            <Button type="button" onClick={onCancel}>
              Hủy
            </Button>
            <Button type="button" onClick={handleConfirm}>
              Dùng ảnh này
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
