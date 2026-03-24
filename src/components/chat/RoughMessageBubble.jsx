import { useLayoutEffect, useRef } from "react";

export default function RoughMessageBubble({ message, isMe, isSeen, sender, roughLib, onPreviewImage }) {
  const bubbleRef = useRef(null);
  const canvasRef = useRef(null);

  const fileUrl = message.file_url;
  const fileType = message.file_type;
  const fileName = message.file_name;
  const hasFile = Boolean(fileUrl) || message.type === "file";
  const isImageFile = Boolean(fileType?.startsWith("image/") && fileUrl);

  const renderMessageContent = () => {
    if (isImageFile) {
      return (
        <button
          type="button"
          className="image-message-button"
          onClick={() => onPreviewImage?.({ url: fileUrl, name: fileName || "Hình ảnh" })}
        >
          <img src={fileUrl} alt={fileName || "Uploaded image"} className="message-image" loading="lazy" />
        </button>
      );
    }

    if (hasFile && fileUrl) {
      return (
        <a href={fileUrl} target="_blank" rel="noreferrer" className="file-message-link">
          {fileName || "Xem tệp đính kèm"}
        </a>
      );
    }

    return <div className="message-content">{message.content}</div>;
  };

  useLayoutEffect(() => {
    if (!roughLib) {
      return;
    }

    const drawBubble = () => {
      const bubbleElement = bubbleRef.current;
      const canvasElement = canvasRef.current;

      if (!bubbleElement || !canvasElement) {
        return;
      }

      const rect = bubbleElement.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const dpr = window.devicePixelRatio || 1;

      canvasElement.width = width * dpr;
      canvasElement.height = height * dpr;
      canvasElement.style.width = `${width}px`;
      canvasElement.style.height = `${height}px`;

      const context = canvasElement.getContext("2d");
      if (!context) {
        return;
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const roughCanvas = roughLib.canvas(canvasElement);
      const fillColor = isMe ? "#dcebff" : "#f3e3ff";
      const stripeColor = isMe ? "#4f7faa" : "#8f6db3";

      roughCanvas.rectangle(1, 1, width - 2, height - 2, {
        seed: Number(message.id) || undefined,
        stroke: "#111",
        strokeWidth: 1.6,
        roughness: 1.3,
        bowing: 1.2,
        fill: fillColor,
        fillStyle: "hachure",
        hachureAngle: isMe ? -35 : 35,
        hachureGap: 5,
        fillWeight: 1.5,
        strokeLineDash: [1, 0],
        fillLineDash: [3, 2],
        fillLineDashOffset: 2,
        fillShapeRoughnessGain: 1,
        fillStroke: stripeColor,
      });
    };

    drawBubble();

    let resizeObserver;
    if (window.ResizeObserver && bubbleRef.current) {
      resizeObserver = new ResizeObserver(() => {
        drawBubble();
      });
      resizeObserver.observe(bubbleRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isMe, message.content, message.id, roughLib]);

  if (!roughLib) {
    return (
      <div className={`message-row ${isMe ? "me" : ""} message-row-fallback`} ref={bubbleRef}>
        <div className="message-bubble-content">
          <div className="message-meta">
            {isSeen ? "✓✓ Seen • " : ""}
            <b>{sender.name}</b>
          </div>
          {renderMessageContent()}
        </div>
      </div>
    );
  }

  return (
    <div className={`message-row ${isMe ? "me" : ""}`} ref={bubbleRef}>
      <canvas className="message-bubble-canvas" ref={canvasRef} />
      <div className="message-bubble-content">
        <div className="message-meta">
          {isSeen ? "✓✓ Seen • " : ""}
          <b>{sender.name}</b>
        </div>
        {renderMessageContent()}
      </div>
    </div>
  );
}
