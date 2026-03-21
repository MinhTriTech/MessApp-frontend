import { useEffect, useRef } from "react";
import rough from "roughjs";

export default function SketchCard() {
  const canvasRef = useRef();

  useEffect(() => {
    const rc = rough.canvas(canvasRef.current);

    rc.rectangle(10, 10, 280, 180, {
      stroke: "#6c5ce7",     // tím
      strokeWidth: 2,
      fill: "#a29bfe",       // nền tím nhạt
      fillStyle: "hachure",
      roughness: 3,
    });
  }, []);

  return (
    <div style={{ position: "relative", width: 300, height: 200 }}>
      <canvas
        ref={canvasRef}
        width={300}
        height={200}
        style={{ position: "absolute" }}
      />
      <div style={{ padding: 20, position: "relative", color: "#2d3436" }}>
        <h3>Sketch Card</h3>
        <p>Custom màu thoải mái luôn 🎨</p>
      </div>
    </div>
  );
}