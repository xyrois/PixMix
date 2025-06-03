import React, { useState, useRef, useEffect } from "react";

const ImageEffects = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [pixelSize, setPixelSize] = useState(10);
  const [effect, setEffect] = useState("pixelate");
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [blur, setBlur] = useState(0);
  const [noise, setNoise] = useState(0);
  const [threshold, setThreshold] = useState(128);
  const [hue, setHue] = useState(0);
  const [edgeThreshold, setEdgeThreshold] = useState(50);
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

  const applyGaussianBlur = (imageData, radius) => {
    if (radius === 0) return imageData;
    
    const { data, width, height } = imageData;
    const newData = new Uint8ClampedArray(data);
    
    const kernel = [];
    const sigma = radius / 3;
    const norm = 1 / (Math.sqrt(2 * Math.PI) * sigma);
    let sum = 0;
    
    for (let i = -radius; i <= radius; i++) {
      const weight = norm * Math.exp(-0.5 * (i / sigma) ** 2);
      kernel.push(weight);
      sum += weight;
    }
    
    // Normalize kernel
    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= sum;
    }
    
    // Apply horizontal blur
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        
        for (let i = -radius; i <= radius; i++) {
          const px = Math.max(0, Math.min(width - 1, x + i));
          const idx = (y * width + px) * 4;
          const weight = kernel[i + radius];
          
          r += data[idx] * weight;
          g += data[idx + 1] * weight;
          b += data[idx + 2] * weight;
          a += data[idx + 3] * weight;
        }
        
        const idx = (y * width + x) * 4;
        newData[idx] = r;
        newData[idx + 1] = g;
        newData[idx + 2] = b;
        newData[idx + 3] = a;
      }
    }
    
    // Apply vertical blur
    const finalData = new Uint8ClampedArray(newData);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        
        for (let i = -radius; i <= radius; i++) {
          const py = Math.max(0, Math.min(height - 1, y + i));
          const idx = (py * width + x) * 4;
          const weight = kernel[i + radius];
          
          r += newData[idx] * weight;
          g += newData[idx + 1] * weight;
          b += newData[idx + 2] * weight;
          a += newData[idx + 3] * weight;
        }
        
        const idx = (y * width + x) * 4;
        finalData[idx] = r;
        finalData[idx + 1] = g;
        finalData[idx + 2] = b;
        finalData[idx + 3] = a;
      }
    }
    
    return new ImageData(finalData, width, height);
  };

  const applyEdgeDetection = (imageData) => {
    const { data, width, height } = imageData;
    const newData = new Uint8ClampedArray(data.length);
    
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const px = x + kx - 1;
            const py = y + ky - 1;
            const idx = (py * width + px) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            
            gx += gray * sobelX[ky][kx];
            gy += gray * sobelY[ky][kx];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const edge = magnitude > edgeThreshold ? 255 : 0;
        
        const idx = (y * width + x) * 4;
        newData[idx] = newData[idx + 1] = newData[idx + 2] = edge;
        newData[idx + 3] = 255;
      }
    }
    
    return new ImageData(newData, width, height);
  };

  const applyEmboss = (imageData) => {
    const { data, width, height } = imageData;
    const newData = new Uint8ClampedArray(data.length);
    
    const kernel = [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0;
        
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const px = x + kx - 1;
            const py = y + ky - 1;
            const idx = (py * width + px) * 4;
            const weight = kernel[ky][kx];
            
            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
          }
        }
        
        const idx = (y * width + x) * 4;
        newData[idx] = Math.max(0, Math.min(255, r + 128));
        newData[idx + 1] = Math.max(0, Math.min(255, g + 128));
        newData[idx + 2] = Math.max(0, Math.min(255, b + 128));
        newData[idx + 3] = 255;
      }
    }
    
    return new ImageData(newData, width, height);
  };

  const hslToRgb = (h, s, l) => {
    h /= 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    
    let r, g, b;
    if (h < 1/6) [r, g, b] = [c, x, 0];
    else if (h < 2/6) [r, g, b] = [x, c, 0];
    else if (h < 3/6) [r, g, b] = [0, c, x];
    else if (h < 4/6) [r, g, b] = [0, x, c];
    else if (h < 5/6) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    
    if (max === min) return [0, 0, l];
    
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    let h;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
    
    return [h * 360, s, l];
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
      const tempCanvas = document.createElement("canvas");
      const tCtx = tempCanvas.getContext("2d");

      tempCanvas.width = Math.ceil(width / pixelSize);
      tempCanvas.height = Math.ceil(height / pixelSize);

      tCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      let imageData = ctx.getImageData(0, 0, width, height);
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
          data[i] = r * 0.393 + g * 0.769 + b * 0.189;
          data[i + 1] = r * 0.349 + g * 0.686 + b * 0.168;
          data[i + 2] = r * 0.272 + g * 0.534 + b * 0.131;
        }
      } else if (effect === "brightness") {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, Math.min(255, data[i] + brightness));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness));
        }
      } else if (effect === "contrast") {
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
          data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
          data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
        }
      } else if (effect === "saturation") {
        for (let i = 0; i < data.length; i += 4) {
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const [r, g, b] = hslToRgb(h, Math.max(0, Math.min(1, s * saturation)), l);
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }
      } else if (effect === "hue") {
        for (let i = 0; i < data.length; i += 4) {
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const newHue = (h + hue) % 360;
          const [r, g, b] = hslToRgb(newHue, s, l);
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }
      } else if (effect === "threshold") {
        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const value = gray > threshold ? 255 : 0;
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
        }
      } else if (effect === "noise") {
        for (let i = 0; i < data.length; i += 4) {
          const noiseValue = (Math.random() - 0.5) * noise;
          data[i] = Math.max(0, Math.min(255, data[i] + noiseValue));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noiseValue));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noiseValue));
        }
      } else if (effect === "vintage") {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          data[i] = r * 0.9 + g * 0.5 + b * 0.1;
          data[i + 1] = r * 0.3 + g * 0.8 + b * 0.1;
          data[i + 2] = r * 0.2 + g * 0.3 + b * 0.5;
        }
      } else if (effect === "warm") {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.1);
          data[i + 1] = Math.min(255, data[i + 1] * 1.05);
          data[i + 2] = Math.min(255, data[i + 2] * 0.9);
        }
      } else if (effect === "cool") {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 0.9);
          data[i + 1] = Math.min(255, data[i + 1] * 1.05);
          data[i + 2] = Math.min(255, data[i + 2] * 1.1);
        }
      } else if (effect === "solarize") {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = data[i] > 128 ? 255 - data[i] : data[i];
          data[i + 1] = data[i + 1] > 128 ? 255 - data[i + 1] : data[i + 1];
          data[i + 2] = data[i + 2] > 128 ? 255 - data[i + 2] : data[i + 2];
        }
      } else if (effect === "posterize") {
        const levels = 4;
        const step = 255 / (levels - 1);
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.round(data[i] / step) * step;
          data[i + 1] = Math.round(data[i + 1] / step) * step;
          data[i + 2] = Math.round(data[i + 2] / step) * step;
        }
      }

      if (effect === "blur") {
        imageData = applyGaussianBlur(imageData, blur);
      } else if (effect === "edge") {
        imageData = applyEdgeDetection(imageData);
      } else if (effect === "emboss") {
        imageData = applyEmboss(imageData);
      }

      ctx.putImageData(imageData, 0, 0);
    }
  }, [originalImage, pixelSize, effect, brightness, contrast, saturation, blur, noise, threshold, hue, edgeThreshold]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `${effect}_image.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const getControlsForEffect = () => {
    switch (effect) {
      case "pixelate":
        return (
          <div className="controls">
            <label>
              Pixel Size: {pixelSize}
              <input type="range" min="1" max="50" value={pixelSize} onChange={(e) => setPixelSize(parseInt(e.target.value))} />
            </label>
          </div>
        );
      case "brightness":
        return (
          <div className="controls">
            <label>
              Brightness: {brightness}
              <input type="range" min="-100" max="100" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} />
            </label>
          </div>
        );
      case "contrast":
        return (
          <div className="controls">
            <label>
              Contrast: {contrast.toFixed(1)}
              <input type="range" min="0" max="3" step="0.1" value={contrast} onChange={(e) => setContrast(parseFloat(e.target.value))} />
            </label>
          </div>
        );
      case "saturation":
        return (
          <div className="controls">
            <label>
              Saturation: {saturation.toFixed(1)}
              <input type="range" min="0" max="3" step="0.1" value={saturation} onChange={(e) => setSaturation(parseFloat(e.target.value))} />
            </label>
          </div>
        );
      case "hue":
        return (
          <div className="controls">
            <label>
              Hue Shift: {hue}°
              <input type="range" min="0" max="360" value={hue} onChange={(e) => setHue(parseInt(e.target.value))} />
            </label>
          </div>
        );
      case "blur":
        return (
          <div className="controls">
            <label>
              Blur Radius: {blur}
              <input type="range" min="0" max="20" value={blur} onChange={(e) => setBlur(parseInt(e.target.value))} />
            </label>
          </div>
        );
      case "noise":
        return (
          <div className="controls">
            <label>
              Noise Amount: {noise}
              <input type="range" min="0" max="100" value={noise} onChange={(e) => setNoise(parseInt(e.target.value))} />
            </label>
          </div>
        );
      case "threshold":
        return (
          <div className="controls">
            <label>
              Threshold: {threshold}
              <input type="range" min="0" max="255" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} />
            </label>
          </div>
        );
      case "edge":
        return (
          <div className="controls">
            <label>
              Edge Sensitivity: {edgeThreshold}
              <input type="range" min="10" max="200" value={edgeThreshold} onChange={(e) => setEdgeThreshold(parseInt(e.target.value))} />
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="header-container">
      <h1 className="main-title">✨Apply Image Effects✨</h1>
      
      <label style={{ 
        display: "inline-block", 
        padding: "12px 24px", 
        backgroundColor: "#007bff", 
        color: "white", 
        borderRadius: "8px", 
        cursor: "pointer",
        marginBottom: "2rem"
      }}>
        📸 Choose Image
        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
      </label>

      {originalImage && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <label>
              <strong>Effect: </strong>
              <select 
                value={effect} 
                onChange={(e) => setEffect(e.target.value)}
                style={{ 
                  padding: "8px", 
                  fontSize: "16px", 
                  borderRadius: "4px", 
                  border: "1px solid #ccc",
                  marginLeft: "8px"
                }}
              >
                <option value="pixelate">Pixelate</option>
                <option value="grayscale">Grayscale</option>
                <option value="sepia">Sepia</option>
                <option value="invert">Invert Colors</option>
                <option value="brightness">Brightness</option>
                <option value="contrast">Contrast</option>
                <option value="saturation">Saturation</option>
                <option value="hue">Hue Shift</option>
                <option value="blur">Blur (WIP)</option>
                <option value="noise">Noise</option>
                <option value="threshold">Threshold</option>
                <option value="edge">Edge Detection</option>
                <option value="emboss">Emboss</option>
                <option value="vintage">Vintage</option>
                <option value="warm">Warm Tone</option>
                <option value="cool">Cool Tone</option>
                <option value="solarize">Solarize</option>
                <option value="posterize">Posterize</option>
              </select>
            </label>
          </div>

          {getControlsForEffect()}

          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <canvas 
              ref={canvasRef} 
              style={{ 
                maxWidth: "100%", 
                height: "auto", 
                border: "2px solid #ddd", 
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
              }}
            />
          </div>

          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <button 
              onClick={handleDownload}
              style={{
                padding: "12px 24px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              ⬇️ Download {effect.charAt(0).toUpperCase() + effect.slice(1)} Image
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .controls {
          margin: 1rem 0;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .controls label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
          color: #495057;
        }
        .controls input[type="range"] {
          width: 100%;
          margin-top: 8px;
        }
        button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default ImageEffects;