import { FabricRect, PageAnnotation, ProcessingRules } from "@/app/types";
import { Json } from "@/types/supabase-types/database.types";

const defaultRectValues: Partial<FabricRect> = {
  fillRule: "nonzero",
  flipX: false,
  flipY: false,
  globalCompositeOperation: "source-over",
  hasBorders: true,
  hasControls: true,
  hoverCursor: null,
  includeDefaultValues: true,
  inverted: false,
  lockMovementX: false,
  lockMovementY: false,
  lockRotation: false,
  lockScalingFlip: false,
  lockScalingX: false,
  lockScalingY: false,
};

export function serializeFabricRect(rect: FabricRect): Partial<FabricRect> {
  return Object.keys(defaultRectValues).reduce((acc, key) => {
    if (rect[key as keyof FabricRect] !== defaultRectValues[key as keyof FabricRect]) {
      acc[key as keyof FabricRect] = rect[key as keyof FabricRect];
    }
    return acc;
  }, {
    id: rect.id,
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  } as Partial<FabricRect>);
}

export function deserializeFabricRect(rect: Partial<FabricRect>): FabricRect {
  return {
    ...defaultRectValues,
    ...rect,
  } as FabricRect;
}

export function serializeProcessingRules(rules: ProcessingRules): string {
  const serializedRules = {
    ...rules,
    annotations: rules.annotations.map(annotation => ({
      ...annotation,
      rectangles: annotation.rectangles.map(serializeFabricRect),
    })),
  };
  return JSON.stringify(serializedRules);
}

export function deserializeProcessingRules(rulesString: Json): ProcessingRules {
  const parsedRules = JSON.parse(rulesString as string) as ProcessingRules;
  return {
    annotations: parsedRules.annotations.map((annotation: PageAnnotation) => ({
      ...annotation,
      rectangles: annotation.rectangles.map(deserializeFabricRect),
    })),
    pageSelection: parsedRules.pageSelection
  };
}
