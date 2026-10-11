export const mapterhorn_elevation_url = (zoom: number, x: number, y: number): string =>
    `https://tiles.mapterhorn.com/${Math.max(0, zoom - 1)}/${x}/${y}.webp`;
