import type { CSSProperties } from 'react';
import type { LoginAppearance } from '../api/siteSettings';

export function loginBackgroundStyle(appearance: LoginAppearance): CSSProperties {
  if (appearance.backgroundMode === 'image' && appearance.backgroundUrl) {
    return { backgroundColor: appearance.solidColor,
      backgroundImage: `url("${appearance.backgroundUrl}")`, backgroundPosition: 'center',
      backgroundSize: 'cover', backgroundRepeat: 'no-repeat' };
  }
  if (appearance.backgroundMode === 'gradient') {
    return { background: `linear-gradient(${appearance.gradientDirection}deg, ${appearance.gradientStartColor}, ${appearance.gradientEndColor})` };
  }
  return { background: appearance.solidColor };
}

export function loginCardStyle(appearance: LoginAppearance): CSSProperties {
  return { backgroundColor: `rgba(255, 255, 255, ${appearance.cardOpacity / 100})` };
}
