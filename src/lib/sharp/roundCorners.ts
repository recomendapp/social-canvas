type Radius =
  | number
  | {
      tl?: number;
      tr?: number;
      br?: number;
      bl?: number;
    };

export function createRoundedCornerSVG(width: number, height: number, radius: Radius, color = 'white'): Buffer {
  let tl = 0, tr = 0, br = 0, bl = 0;

  if (typeof radius === 'number') {
    tl = tr = br = bl = radius;
  } else {
    tl = radius.tl || 0;
    tr = radius.tr || 0;
    br = radius.br || 0;
    bl = radius.bl || 0;
  }

  return Buffer.from(`
    <svg width="${width}" height="${height}">
      <path
        d="M ${tl},0
           H ${width - tr}
           A ${tr},${tr} 0 0 1 ${width},${tr}
           V ${height - br}
           A ${br},${br} 0 0 1 ${width - br},${height}
           H ${bl}
           A ${bl},${bl} 0 0 1 0,${height - bl}
           V ${tl}
           A ${tl},${tl} 0 0 1 ${tl},0
           Z"
        fill="${color}"
      />
    </svg>
  `);
}