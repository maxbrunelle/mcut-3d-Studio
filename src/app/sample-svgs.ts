export const DEFAULT_SIGN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 220" width="600" height="220">
  <!-- Outer Frame -->
  <path d="M 10 10 H 590 V 210 H 10 Z M 25 25 V 195 H 575 V 25 Z" fill="#3b82f6"/>
  <!-- Letter S -->
  <path d="M 70 50 H 140 V 85 H 105 V 95 H 140 V 170 H 70 V 135 H 105 V 125 H 70 Z" fill="#ef4444"/>
  <!-- Letter I -->
  <path d="M 170 50 H 210 V 170 H 170 Z" fill="#ef4444"/>
  <!-- Letter G -->
  <path d="M 240 50 H 310 V 85 H 275 V 95 H 310 V 170 H 240 Z" fill="#ef4444"/>
  <!-- Letter N -->
  <path d="M 340 50 H 375 L 405 130 V 50 H 440 V 170 H 405 L 375 90 V 170 H 340 Z" fill="#ef4444"/>
  <!-- Star Emblem -->
  <path d="M 500 50 L 512 85 L 548 85 L 518 108 L 529 143 L 500 120 L 471 143 L 482 108 L 452 85 L 488 85 Z" fill="#f59e0b"/>
</svg>`;

export const SAMPLE_SVG_PRESETS = [
  {
    name: 'Sign & Star',
    svg: DEFAULT_SIGN_SVG
  },
  {
    name: 'Badge Shield',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <path d="M 150 20 L 270 60 V 160 C 270 230 150 280 150 280 C 150 280 30 230 30 160 V 60 Z M 150 45 L 50 78 V 155 C 50 215 150 258 150 258 C 150 258 250 215 250 155 V 78 Z" fill="#3b82f6"/>
  <path d="M 110 100 H 190 V 125 H 165 V 200 H 135 V 125 H 110 Z" fill="#ef4444"/>
</svg>`
  },
  {
    name: 'Arrow Sign',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200" width="500" height="200">
  <path d="M 20 100 L 120 20 V 60 H 480 V 140 H 120 V 180 Z M 110 50 L 40 100 L 110 150 V 120 H 460 V 80 H 110 Z" fill="#10b981"/>
  <path d="M 160 80 H 200 V 120 H 160 Z M 220 80 H 260 V 120 H 220 Z M 280 80 H 320 V 120 H 280 Z" fill="#ffffff"/>
</svg>`
  },
  {
    name: 'Crown Logo',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
  <path d="M 50 190 L 20 60 L 120 120 L 200 30 L 280 120 L 380 60 L 350 190 Z M 75 170 H 325 L 348 88 L 272 135 L 200 58 L 128 135 L 52 88 Z" fill="#f59e0b"/>
  <path d="M 50 200 H 350 V 225 H 50 Z" fill="#3b82f6"/>
</svg>`
  }
];
