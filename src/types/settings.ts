export type FontStyleKey = 'sans' | 'rounded' | 'poppins' | 'serif' | 'mono';

export type FontSizeKey = 'sm' | 'md' | 'lg' | 'xl';

export interface FontStyleOption {
  id: FontStyleKey;
  name: string;
  fontFamily: string;
  description: string;
  sample: string;
}

export interface FontSizeOption {
  id: FontSizeKey;
  name: string;
  scalePercent: string;
  htmlFontSize: string; // e.g. '14px', '16px', '18px', '20px'
  description: string;
}

export const FONT_STYLE_OPTIONS: FontStyleOption[] = [
  {
    id: 'sans',
    name: 'Modern Sans',
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, -apple-system, sans-serif",
    description: 'Clean, balanced & modern interface',
    sample: 'Ag Explore gigs & local workers',
  },
  {
    id: 'rounded',
    name: 'Soft Rounded',
    fontFamily: "'Nunito', system-ui, -apple-system, sans-serif",
    description: 'Friendly, warm & rounded letterforms',
    sample: 'Ag Friendly, casual & approachable',
  },
  {
    id: 'poppins',
    name: 'Geometric Display',
    fontFamily: "'Poppins', system-ui, -apple-system, sans-serif",
    description: 'Crisp, bold & contemporary styling',
    sample: 'Ag Distinctive & high-impact text',
  },
  {
    id: 'serif',
    name: 'Classic Serif',
    fontFamily: "'Merriweather', Georgia, Cambria, serif",
    description: 'Distinguished, elegant & literary',
    sample: 'Ag Traditional, formal & readable',
  },
  {
    id: 'mono',
    name: 'Technical Mono',
    fontFamily: "'JetBrains Mono', Menlo, Consolas, monospace",
    description: 'Sharp, code-like & fixed-width precision',
    sample: 'Ag Coordinates 26.2041° S, 28.0473° E',
  },
];

export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  {
    id: 'sm',
    name: 'Small',
    scalePercent: '90%',
    htmlFontSize: '14px',
    description: 'Compact view with more content on screen',
  },
  {
    id: 'md',
    name: 'Default',
    scalePercent: '100%',
    htmlFontSize: '16px',
    description: 'Standard, balanced sizing across devices',
  },
  {
    id: 'lg',
    name: 'Large',
    scalePercent: '112%',
    htmlFontSize: '18px',
    description: 'Slightly enlarged for effortless reading',
  },
  {
    id: 'xl',
    name: 'Extra Large',
    scalePercent: '125%',
    htmlFontSize: '20px',
    description: 'Maximum legibility & accessibility',
  },
];
