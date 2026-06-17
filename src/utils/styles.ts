export interface SubtitleStyle {
  primaryColor: string;
  outlineColor: string;
  fontSize: number;
  alignment: number;
  fontName: string;
  animation: 'none' | 'fade';
  backgroundStyle: 'none' | 'semi-transparent-box';
  shadow: number;
}

export const PRESET_STYLES: Record<string, { name: string; style: SubtitleStyle }> = {
  default: {
    name: 'Défaut',
    style: {
      primaryColor: '#FFFFFF',
      outlineColor: '#000000',
      fontSize: 32,
      alignment: 2,
      fontName: 'Arial',
      animation: 'none',
      backgroundStyle: 'none',
      shadow: 2
    }
  },
  youtube: {
    name: 'YouTube Classic',
    style: {
      primaryColor: '#FFFFFF',
      outlineColor: '#000000',
      fontSize: 28,
      alignment: 2,
      fontName: 'Roboto',
      animation: 'none',
      backgroundStyle: 'semi-transparent-box',
      shadow: 0
    }
  },
  netflix: {
    name: 'Netflix Style',
    style: {
      primaryColor: '#FFFFFF',
      outlineColor: '#000000',
      fontSize: 34,
      alignment: 2,
      fontName: 'Consolas',
      animation: 'none',
      backgroundStyle: 'none',
      shadow: 2
    }
  },
  modern: {
    name: 'Modern Green',
    style: {
      primaryColor: '#00FF00',
      outlineColor: '#000000',
      fontSize: 36,
      alignment: 2,
      fontName: 'Arial Black',
      animation: 'fade',
      backgroundStyle: 'none',
      shadow: 3
    }
  },
  minimal: {
    name: 'Minimalist',
    style: {
      primaryColor: '#F3F4F6',
      outlineColor: '#1F2937',
      fontSize: 24,
      alignment: 2,
      fontName: 'Inter',
      animation: 'none',
      backgroundStyle: 'none',
      shadow: 1
    }
  }
};
