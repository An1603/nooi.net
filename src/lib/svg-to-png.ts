/**
 * Capture an SVG element as a PNG image and trigger download.
 * Uses native browser APIs — no libraries needed.
 */
export function downloadSvgAsPng(
  svgElement: SVGSVGElement,
  fileName: string,
  width: number = 500,
  height: number = 500,
  bgColor: string = "#1a0a2e"
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Serialize SVG
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // Draw to canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;

        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        // Center and scale the SVG
        const padding = 20;
        const maxDim = Math.min(width, height) - padding * 2;
        const scale = maxDim / Math.max(svgElement.clientWidth, svgElement.clientHeight);
        const ox = (width - svgElement.clientWidth * scale) / 2;
        const oy = (height - svgElement.clientHeight * scale) / 2;
        ctx.drawImage(img, ox, oy, svgElement.clientWidth * scale, svgElement.clientHeight * scale);

        // Download
        canvas.toBlob((blob) => {
          if (blob) {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(a.href);
          }
          resolve();
        }, "image/png");

        URL.revokeObjectURL(url);
      };
      img.onerror = reject;
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}
