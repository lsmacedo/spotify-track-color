const hexToRgb = (hex: string) => {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return [r, g, b];
};

export const closestColor = (targetColor: string, colorsArray: string[]) => {
  let minDistance = Number.MAX_VALUE;
  let closestColor: string = colorsArray[0];

  colorsArray.forEach((color) => {
    const [r1, g1, b1] = hexToRgb(targetColor);
    const [r2, g2, b2] = hexToRgb(color);
    const distance = Math.sqrt(
        Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  });

  return closestColor;
};
