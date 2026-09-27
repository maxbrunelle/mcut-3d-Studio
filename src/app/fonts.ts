export interface SignageFont {
  id: string;
  name: string;
  style: string;
  category: 'Sans Serif' | 'Serif' | 'Display' | 'Script' | 'Custom';
  url: string;
}

export const SIGNAGE_FONTS: SignageFont[] = [
  // Script / Cursive (Great for 3D printed neon signs)
  {
    id: 'Pacifico',
    name: 'Pacifico',
    style: 'Bold Retro Script',
    category: 'Script',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/pacifico/Pacifico-Regular.ttf'
  },
  {
    id: 'Lobster',
    name: 'Lobster',
    style: 'Thick Connected Cursive',
    category: 'Script',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/lobster/Lobster-Regular.ttf'
  },
  {
    id: 'Yellowtail',
    name: 'Yellowtail',
    style: 'Flat Brush Script',
    category: 'Script',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/yellowtail/Yellowtail-Regular.ttf'
  },
  {
    id: 'CaveatBrush',
    name: 'Caveat Brush',
    style: 'Playful Thick Marker',
    category: 'Script',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/caveatbrush/CaveatBrush-Regular.ttf'
  },
  {
    id: 'LeckerliOne',
    name: 'Leckerli One',
    style: 'Chunky Bold Script',
    category: 'Script',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/leckerlione/LeckerliOne-Regular.ttf'
  },
  {
    id: 'GreatVibes',
    name: 'Great Vibes',
    style: 'Elegant Flowing Script',
    category: 'Script',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/greatvibes/GreatVibes-Regular.ttf'
  },
  {
    id: 'Satisfy',
    name: 'Satisfy',
    style: 'Casual Brush Cursive',
    category: 'Script',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/satisfy/Satisfy-Regular.ttf'
  },

  // Display / Bold Channel Signage
  {
    id: 'Bangers',
    name: 'Bangers',
    style: 'Bold Comic & Poster',
    category: 'Display',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/bangers/Bangers-Regular.ttf'
  },
  {
    id: 'Righteous',
    name: 'Righteous',
    style: 'Retro Modern Display',
    category: 'Display',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/righteous/Righteous-Regular.ttf'
  },
  {
    id: 'Anton',
    name: 'Anton',
    style: 'Heavy Impact Headline',
    category: 'Display',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/anton/Anton-Regular.ttf'
  },
  {
    id: 'BebasNeue',
    name: 'Bebas Neue',
    style: 'Condensed Bold Signage',
    category: 'Display',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/bebasneue/BebasNeue-Regular.ttf'
  },
  {
    id: 'Audiowide',
    name: 'Audiowide',
    style: 'Futuristic Sci-Fi Neon',
    category: 'Display',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/audiowide/Audiowide-Regular.ttf'
  },
  {
    id: 'AlfaSlabOne',
    name: 'Alfa Slab One',
    style: 'Extra Heavy Slab',
    category: 'Display',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/alfaslabone/AlfaSlabOne-Regular.ttf'
  },

  // Architectural / Sans Serif
  {
    id: 'Helvetiker-Bold',
    name: 'Helvetiker Bold',
    style: 'Modern Architectural Sans',
    category: 'Sans Serif',
    url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json'
  },
  {
    id: 'Helvetiker-Regular',
    name: 'Helvetiker Regular',
    style: 'Clean Modern Sans',
    category: 'Sans Serif',
    url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_regular.typeface.json'
  },
  {
    id: 'Optimer-Bold',
    name: 'Optimer Bold',
    style: 'Sleek Corporate Display',
    category: 'Display',
    url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/optimer_bold.typeface.json'
  },
  {
    id: 'Optimer-Regular',
    name: 'Optimer Regular',
    style: 'Sleek Corporate',
    category: 'Display',
    url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/optimer_regular.typeface.json'
  },
  {
    id: 'Gentilis-Bold',
    name: 'Gentilis Bold',
    style: 'Heavy Channel Signage',
    category: 'Display',
    url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/gentilis_bold.typeface.json'
  },
  {
    id: 'Gentilis-Regular',
    name: 'Gentilis Regular',
    style: 'Geometric Block',
    category: 'Display',
    url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/gentilis_regular.typeface.json'
  },
  {
    id: 'DroidSans-Bold',
    name: 'Droid Sans Bold',
    style: 'Rounded Tech Signage',
    category: 'Sans Serif',
    url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_sans_bold.typeface.json'
  },
  {
    id: 'DroidSans-Regular',
    name: 'Droid Sans Regular',
    style: 'Friendly Modern Sans',
    category: 'Sans Serif',
    url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_sans_regular.typeface.json'
  },
  {
    id: 'DroidSerif-Bold',
    name: 'Droid Serif Bold',
    style: 'Classic Signage Serif',
    category: 'Serif',
    url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_serif_bold.typeface.json'
  },
  {
    id: 'DroidSerif-Regular',
    name: 'Droid Serif Regular',
    style: 'Traditional Elegant Serif',
    category: 'Serif',
    url: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_serif_regular.typeface.json'
  }
];
