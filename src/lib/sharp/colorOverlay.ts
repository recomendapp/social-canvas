export function createColorOverlaySVG(width: number, height: number, opacity: number = 0.5, color = 'black'): Buffer {
  const svg = `
    <svg width="${width}" height="${height}">
      <rect x="0" y="0" width="100%" height="100%" fill="${color}" fill-opacity="${opacity}" />
    </svg>
  `;
  return Buffer.from(svg);
}