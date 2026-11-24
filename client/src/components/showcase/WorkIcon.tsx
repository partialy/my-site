"use client";

import { useState } from "react";
import {
  Aperture,
  AudioLines,
  Box,
  Feather,
  Layers,
  Orbit,
} from "lucide-react";
import type { WorkIconKey } from "@/services/types";

interface WorkIconProps {
  iconKey: WorkIconKey;
  iconImage?: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  strokeWidth?: number;
}

export function WorkIcon({
  iconKey,
  iconImage,
  alt = "AppIcon",
  className = "h-5 w-5",
  imgClassName = "h-full w-full rounded-[inherit] object-cover",
  strokeWidth = 1.75,
}: WorkIconProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cleanImage = iconImage?.trim() || "";

  if (cleanImage && failedSrc !== cleanImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={cleanImage}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(cleanImage)}
        className={imgClassName}
      />
    );
  }

  switch (iconKey) {
    case "orbit":
      return (
        <Orbit
          className={className}
          strokeWidth={strokeWidth}
          aria-hidden="true"
        />
      );
    case "feather":
      return (
        <Feather
          className={className}
          strokeWidth={strokeWidth}
          aria-hidden="true"
        />
      );
    case "audio":
      return (
        <AudioLines
          className={className}
          strokeWidth={strokeWidth}
          aria-hidden="true"
        />
      );
    case "layers":
      return (
        <Layers
          className={className}
          strokeWidth={strokeWidth}
          aria-hidden="true"
        />
      );
    case "box":
      return (
        <Box
          className={className}
          strokeWidth={strokeWidth}
          aria-hidden="true"
        />
      );
    case "aperture":
      return (
        <Aperture
          className={className}
          strokeWidth={strokeWidth}
          aria-hidden="true"
        />
      );
    default:
      return (
        <Orbit
          className={className}
          strokeWidth={strokeWidth}
          aria-hidden="true"
        />
      );
  }
}
