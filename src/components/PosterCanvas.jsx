import React, { useEffect, useRef, useState } from 'react';
import { CONFIG } from '../config';

const PosterCanvas = ({
  name,
  photoUrl,
  onLoadingChange,
  crop,
  zoom,
  rotation
}) => {
  const canvasRef = useRef(null);

  const [templateImg, setTemplateImg] = useState(null);
  const [userImg, setUserImg] = useState(null);

  const canvasWidth = CONFIG.canvas.width;
  const canvasHeight = CONFIG.canvas.height;

  // ---------------------------
  // Load Template
  // ---------------------------
  useEffect(() => {
    onLoadingChange(true);

    const img = new Image();
    img.src = CONFIG.canvas.templateUrl;
    img.crossOrigin = "anonymous";

    img.onload = () => {
      setTemplateImg(img);
      onLoadingChange(false);
    };

    img.onerror = () => {
      console.error("Failed to load template image");
      onLoadingChange(false);
    };
  }, []);

  // ---------------------------
  // Load User Image
  // ---------------------------
  useEffect(() => {
    if (!photoUrl) {
      setUserImg(null);
      return;
    }

    onLoadingChange(true);

    const img = new Image();
    img.src = photoUrl;

    img.onload = () => {
      setUserImg(img);
      onLoadingChange(false);
    };

    img.onerror = () => {
      console.error("Failed to load user image");
      setUserImg(null);
      onLoadingChange(false);
    };
  }, [photoUrl]);

  // ---------------------------
  // Draw Canvas
  // ---------------------------
  useEffect(() => {
    if (!templateImg) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw template
    ctx.drawImage(
      templateImg,
      0,
      0,
      canvasWidth,
      canvasHeight
    );

    // ==================================================
    // PHOTO SECTION
    // ==================================================

    const photoConfig = CONFIG.canvas.photo;

    if (userImg) {
      const actualPhotoRadius =
        photoConfig.radius - 40;

      ctx.save();

      // Circular clipping area
      ctx.beginPath();
      ctx.arc(
        photoConfig.centerX,
        photoConfig.centerY,
        actualPhotoRadius,
        0,
        Math.PI * 2
      );
      ctx.closePath();
      ctx.clip();

      const imageRatio =
        userImg.width / userImg.height;

      const targetSize =
        actualPhotoRadius * 2;

      let drawWidth;
      let drawHeight;

      if (imageRatio > 1) {
        drawHeight = targetSize;
        drawWidth =
          drawHeight * imageRatio;
      } else {
        drawWidth = targetSize;
        drawHeight =
          drawWidth / imageRatio;
      }

      ctx.translate(
        photoConfig.centerX,
        photoConfig.centerY
      );

      ctx.rotate(
        ((rotation || 0) * Math.PI) / 180
      );

      ctx.scale(
        zoom || 1,
        zoom || 1
      );

      ctx.translate(
        crop?.x || 0,
        crop?.y || 0
      );

      ctx.drawImage(
        userImg,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );

      ctx.restore();
    }

    // ==================================================
    // NAME SECTION
    // ==================================================

    if (name) {
      const nameConfig = CONFIG.canvas.name;

      let text =
        nameConfig.textTransform === "uppercase"
          ? name.toUpperCase()
          : name;

      const maxWidth =
        nameConfig.maxWidth;

      let fontSize =
        nameConfig.fontSize;

      const minFontSize =
        nameConfig.minFontSize || 40;

      ctx.fillStyle =
        nameConfig.color;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Automatically reduce font size
      while (fontSize > minFontSize) {
        ctx.font =
          `${nameConfig.fontWeight} ${fontSize}px ${nameConfig.fontFamily}`;

        const width =
          ctx.measureText(text).width;

        if (width <= maxWidth * 0.92) {
          break;
        }

        fontSize -= 2;
      }

      ctx.font =
        `${nameConfig.fontWeight} ${fontSize}px ${nameConfig.fontFamily}`;

      // If still too long split into two lines
      const width =
        ctx.measureText(text).width;

      if (
        width > maxWidth &&
        text.includes(" ")
      ) {
        const words =
          text.split(" ");

        const midpoint =
          Math.ceil(words.length / 2);

        const line1 =
          words.slice(0, midpoint).join(" ");

        const line2 =
          words.slice(midpoint).join(" ");

        const lineHeight =
          fontSize * 1.05;

        ctx.fillText(
          line1,
          nameConfig.centerX,
          nameConfig.centerY -
          lineHeight / 2,
          maxWidth
        );

        ctx.fillText(
          line2,
          nameConfig.centerX,
          nameConfig.centerY +
          lineHeight / 2,
          maxWidth
        );
      } else {
        ctx.fillText(
          text,
          nameConfig.centerX,
          nameConfig.centerY + 5,
          maxWidth
        );
      }
    }

  }, [
    templateImg,
    userImg,
    name,
    crop,
    zoom,
    rotation
  ]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        id="poster-canvas"
        width={canvasWidth}
        height={canvasHeight}
        className="canvas-element"
      />
    </div>
  );
};

export default PosterCanvas;