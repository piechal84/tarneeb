import type { BuildingKind } from '../game/buildings';

const FILES: Record<BuildingKind, string> = {
  heart: 'heart.png',
  yard: 'yard.png',
  incubator: 'incubator.png',
  powerplant: 'powerplant.png',
};

function loadImage(fileName: string): HTMLImageElement {
  const img = new Image();
  // BASE_URL makes this resolve correctly both in dev and once deployed under /kelka-rts/.
  img.src = `${import.meta.env.BASE_URL}buildings/${fileName}`;
  return img;
}

export const BUILDING_IMAGES: Record<BuildingKind, HTMLImageElement> = {
  heart: loadImage(FILES.heart),
  yard: loadImage(FILES.yard),
  incubator: loadImage(FILES.incubator),
  powerplant: loadImage(FILES.powerplant),
};

export function isImageReady(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}
