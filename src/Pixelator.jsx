import React, { useState, useRef, useEffect } from "react";

const Pixelator = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [pixelSize, setPixelSize] = useState(10);
  const [effect, setEffect] = useState("pixelate");
  const canvasRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => setOriginalImage(img);
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;

    const img = originalImage;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const width = img.width;
    const height = img.height;
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;

    if (effect === "pixelate") {
      // Pixelation using temp canvas
      const tempCanvas = document.createElement("canvas");
      const tCtx = tempCanvas.getContext("2d");

      tempCanvas.width = Math.ceil(width / pixelSize);
      tempCanvas.height = Math.ceil(height / pixelSize);

      tCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(
        tempCanvas,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height,
        0,
        0,
        width,
        height
      );
    } else {
      // Draw full-res image first
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      if (effect === "invert") {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
      } else if (effect === "grayscale") {
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg;
          data[i + 1] = avg;
          data[i + 2] = avg;
        }
      } else if (effect === "sepia") {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          data[i]     = r * 0.393 + g * 0.769 + b * 0.189;
          data[i + 1] = r * 0.349 + g * 0.686 + b * 0.168;
          data[i + 2] = r * 0.272 + g * 0.534 + b * 0.131;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }
  }, [originalImage, pixelSize, effect]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `${effect}_image.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="page">
      <h2>Apply Image Effects</h2>

      <label className="primary file-button">
        Choose Image
        <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
      </label>

      {originalImage && (
        <>
          <div style={{ marginTop: "1rem" }}>
            <label>
              Effect:&nbsp;
              <select value={effect} onChange={(e) => setEffect(e.target.value)}>
                <option value="pixelate">Pixelate</option>
                <option value="invert">Invert Colors</option>
                <option value="grayscale">Grayscale</option>
                <option value="sepia">Sepia</option>
              </select>
            </label>
          </div>

          {effect === "pixelate" && (
            <label style={{ display: "block", marginTop: "1rem" }}>
              Pixel Size: {pixelSize}
              <input
                type="range"
                min="2"
                max="50"
                value={pixelSize}
                onChange={(e) => setPixelSize(parseInt(e.target.value))}
              />
            </label>
          )}

          <canvas ref={canvasRef} style={{ marginTop: "1rem" }}></canvas>
          <br />
          <button className="primary" onClick={handleDownload}>
            Download {effect.charAt(0).toUpperCase() + effect.slice(1)} Image
          </button>
        </>
      )}
    </div>
  );
};

export default Pixelator;
