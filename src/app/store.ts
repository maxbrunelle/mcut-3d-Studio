import { Injectable, signal, computed } from '@angular/core';
import { SignageFont } from './fonts';

export type AppTab = 'source' | 'dimensions' | 'style' | 'layers' | 'mounting' | 'holes' | 'simulation' | 'export';
export type InputSource = 'svg' | 'text' | 'neon-flex';
export type LetterStyle = 'acrylic-printed-back' | 'acrylic-double-step';
export type WallProfileTemplate = 'straight' | 'double-step' | 'tapered';

export type MountingType = 'none' | 'backplate' | 'bar-system' | 'raceway' | 'desk-stand';
export type BackplateShape = 'contour' | 'rectangle' | 'rounded-rect' | 'capsule' | 'oval';
export type BackplateMaterial = 'clear-acrylic' | 'frosted-acrylic' | 'black-acrylic' | 'white-matte' | 'brushed-aluminum' | 'wood' | 'carbon-fiber';
export type BarProfile = 'rect-tube' | 'u-channel' | 'round-pipe' | 'strut-channel';
export type StandoffFinish = 'chrome' | 'black' | 'brass' | 'matte-silver';

export type NeonBackplateStyle = 'contour' | 'cut-to-letter' | 'rounded-rect' | 'rectangle' | 'stand-alone';
export type NeonBackplateMaterial = 'clear-acrylic' | 'frosted-acrylic' | 'black-acrylic' | 'gloss-white' | 'mirror-silver' | 'mirror-gold';

export interface HistoryEntry {
  settings: ProjectSettings;
  description: string;
  timestamp: number;
}

export interface Layers {
  body: boolean;
  acrylic: boolean;
  mounting?: boolean;
}

export type HoleType = 'keyhole' | 'round' | 'oval';

export interface CustomHole {
  id?: string;
  x: number;
  y: number;
  r: number; // Entry hole radius (bottom head diameter / 2)
  type?: HoleType; // 'keyhole' | 'round' | 'oval'
  slotWidth?: number; // Neck slot width in mm
  slotHeight?: number; // Distance from entry hole center to top of slot in mm
  rotation?: number; // Orientation in degrees (0 = slot upwards, 90 = right, 180 = downwards, 270 = left)
  width?: number; // Oval / slot width (X dimension) in mm
  height?: number; // Oval / slot height (Y dimension) in mm
  cornerRadius?: number; // Corner radius in mm (0 = sharp rect, min(w,h)/2 = full capsule/pill)
  holeCategory?: 'mounting' | 'wire';
}

export interface ProjectSettings {
  inputSource: InputSource;
  vectorData: string | null;
  text: string;
  font: string;
  letterSpacing: number; // mm
  customKerning?: Record<number, number>; // per-character kerning offset in mm (key is charIndex)

  // Parameters
  baseThickness: number; // mm
  externalWallThickness: number; // mm
  internalWallThickness: number; // mm
  wallHeight: number; // mm
  acrylicThickness: number; // mm
  acrylicClearance?: number; // mm (Laser kerf & fit offset tolerance, e.g. -0.2mm for loose fit)
  externalTab: boolean;
  mirror: boolean;

  // Multi-line, alignment & Arc text
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textAlign?: 'left' | 'center' | 'right';
  lineSpacing?: number; // mm
  arcEnabled?: boolean;
  arcAngle?: number; // degrees

  // 3D Print Material & Cost Estimation
  filamentType?: 'PLA' | 'PETG' | 'ABS' | 'ASA';
  filamentDensity?: number; // g/cm3
  infillPercentage?: number; // %
  filamentCostPerKg?: number; // $/kg

  // Mounting System & Backplate Configuration
  mountingType: MountingType;
  
  // Backplate Options
  backplateShape: BackplateShape;
  backplatePadding: number; // mm (margin around letters)
  backplateThickness: number; // mm
  backplateCornerRadius: number; // mm
  backplateStandoffGap: number; // mm (distance behind letters)
  backplateMaterial: BackplateMaterial;
  backplateOpacity: number; // 0.1 to 1.0
  backplateHangingHoles: boolean; // pre-drilled corner/wall mounting holes
  backplateHoleDiameter: number; // mm
  backplateHoleInset: number; // mm from edges
  backplateStandoffHardware: boolean; // 3D metallic standoff spacers & decorative caps
  backplateStandoffFinish: StandoffFinish;
  backplateTopSuspensionLoops: boolean; // Ceiling / window wire suspension eyelets

  // Bar / Rail System Options
  barCount: 1 | 2 | 3;
  barProfile: BarProfile;
  barWidth: number; // mm (height of bar face)
  barThickness: number; // mm (depth of bar extrusion)
  barOverhang: number; // mm (extension past outer letters)
  barVerticalOffset: number; // % (spacing from edges)
  barColor: string;
  barMaterial: 'matte-black' | 'silver-aluminum' | 'white-powder' | 'brass';
  barIncludeClamps: boolean; // Letter attachment clips/cleats
  barWallBrackets: boolean; // Wall mounting bracket flanges at rail ends
  barStandoffGap: number; // mm (depth behind letters)

  // Raceway Enclosure Options
  racewayHeight: number; // mm
  racewayDepth: number; // mm
  racewayOverhang: number; // mm
  racewayPosition: 'bottom' | 'center-back' | 'top';
  racewayColor: string;

  // Desk Stand / Pedestal Options
  deskStandDepth: number; // mm
  deskStandHeight: number; // mm
  deskStandOverhang: number; // mm
  deskStandLip: number; // mm
  deskStandColor: string;

  // LED Simulation
  ledEnabled: boolean;
  ledColor: string;
  ledIntensity: number;
  ledSpread: number;
  wallGap: number;
  roomAmbient: number;
  emissiveIntensity: number;

  // LED Electrical, Optical & Lighting Engineering
  ledType: 'modules' | 'strip';
  voltageSystem: '12V' | '24V';
  cctPreset?: '3000K' | '4000K' | '6500K' | '8000K' | 'custom' | 'rgb';
  cctKelvin?: number; // 2700 - 10000K
  lensBeamAngle?: number; // 120, 160, 175 degrees
  showDiffusionHeatmap?: boolean;
  wireRunLengthMeters?: number; // distance to PSU
  wireGaugeSelected?: 'auto' | '18 AWG' | '16 AWG' | '14 AWG' | '12 AWG';
  moduleWattage: number; // Watts per module (e.g., 0.72W or 1.2W)
  modulePitchMm: number; // Spacing in mm between modules
  stripWattagePerMeter: number; // Watts per meter (e.g. 14.4 W/m)
  stripWidthMm: number; // Width of strip (e.g. 8mm or 10mm)
  showWiringDiagram: boolean; // Show 3D wires & Power Supply Unit
  animationMode: 'static' | 'pulse' | 'rainbow' | 'chase';
  animationSpeed: number; // 1 to 5 scale
  powerSupplyEfficiency: number; // 0.85 safety factor
  customLeds: { id: string; x: number; y: number }[] | null;

  // Custom Holes & Auto Alignment
  customHoles: CustomHole[];
  mountingHoleType: HoleType; // 'keyhole' | 'round' | 'oval'
  holeRadius: number; // mm (Head entry radius for keyhole, or drill radius for round)
  keyholeSlotWidth: number; // mm (Neck/shank width)
  keyholeSlotHeight: number; // mm (Distance from entry hole center to top of slot)
  keyholeDirection: number; // degrees: 0 = Up, 90 = Right, 180 = Down, 270 = Left
  ovalHoleWidth: number; // mm (Width of oval/slot)
  ovalHoleHeight: number; // mm (Height of oval/slot)
  ovalCornerRadius: number; // mm (Corner fillet radius: 0 = sharp rect, min(w,h)/2 = full capsule/pill)
  ovalRotation: number; // degrees (Orientation: 0 = Vertical, 90 = Horizontal, etc.)
  interactionMode: 'view' | 'add-hole' | 'move-led';
  autoHolesMaxPerLetter: number;
  autoHolesEdgeMargin: number; // mm
  autoHolesMinDistance: number; // mm
  autoHolesPattern: 'corners-center' | 'top-bottom' | 'corners' | 'grid-balanced';
  autoHolesAddWireHole: boolean;
  autoHolesWireRadius: number; // mm

  // Dimensions
  targetHeight: number; // mm
  showBuildPlate: boolean;
  buildPlateWidth: number; // mm
  buildPlateHeight: number; // mm

  // Presentation Orbit & Camera Projection
  autoRotate: boolean;
  autoRotateSpeed: number;
  cameraType: 'perspective' | 'orthographic';

  style: LetterStyle;
  layers: Layers;

  // Colors & Materials
  faceMaterial: 'acrylic' | '3d-printed';
  diffuserHeightOffset?: number; // mm: Protrusion height of 3D diffuser above letter body walls (default 0)
  diffuserBevelEnabled?: boolean; // Enable decorative bevel/chamfer on diffuser cap
  diffuserBevelSize?: number; // mm: Width of bevel in XY plane (default 1.5)
  diffuserBevelThickness?: number; // mm: Height of bevel in Z axis (default 1.5)
  diffuserBevelSegments?: number; // 1 = 45° flat chamfer, >1 = rounded fillet curve (default 3)
  printedFaceHollow?: boolean; // Hollow interior cap for 3D printed face diffuser
  printedFaceWallThickness?: number; // Wall thickness (1 perimeter wall: 0.42mm)
  printedFaceBottomThickness?: number; // Face skin thickness (1 bottom shell: 0.20mm)
  printedFaceDownExport?: boolean; // Automatically orient face down on bed at Z=0 for export
  bodyColor: string;
  acrylicColor: string;

  // Wall Profile Template & Stepped Foot / Bump Parameters
  wallProfileTemplate?: WallProfileTemplate; // 'straight' | 'rodape' | 'double-step' | 'tapered'
  footOffset?: number; // Foot / Bump flare offset (mm)
  footHeight?: number; // Foot / Bump straight height (mm)
  footCloseAtBase?: boolean; // Close Foot at Base - 45° return ramp to original base contour
  footRampAngle?: number; // Maximum overhang ramp angle (°)
  bodyTaper?: number; // Wall body taper draft angle (mm)
  footStartHeight?: number; // mm from base where step/bump begins

  // Double Step Parameters
  step2Offset?: number; // 2nd Step Offset (mm)
  stepsGap?: number; // Vertical gap between bumps / steps (mm)
  step1Height?: number; // Step 1 straight height (mm)
  step2Height?: number; // Step 2 straight height (mm)

  // Sweeping Name Plate Parametric Options
  curvedSignTiltAngle?: number; // degrees backward tilt
  curvedSignSweepDepth?: number; // mm back sweep depth
  curvedSignBaseStyle?: 'rounded-rect' | 'chamfered-rect' | 'pedestal' | 'arc-curved' | 'minimal';
  curvedSignBasePadding?: number; // mm extra padding around text for base plate
  curvedSignBaseThickness?: number; // mm height of base plate
  curvedSignHiddenText?: string; // hidden text embossed on underside of base plate
  curvedSignMagnets?: boolean; // magnet sockets on bottom face of base plate

  // Neon Flex & Acrylic Backplate Configuration
  neonText?: string;
  neonFont?: string;
  neonTubeDiameter?: number; // mm (6, 8, 10, 12 - default 8)
  neonRoutingMode?: 'inline' | 'outline'; // 'inline' (single center path) vs 'outline' (full contour track) - default 'inline'
  neonTubeProfile?: 'dome' | 'round' | 'flat'; // default 'dome'
  neonColor?: string; // hex color for emissive glow (default '#ff2d87')
  neonGlowIntensity?: number; // 1 - 20 (default 10)
  neonJacketStyle?: 'milky-white' | 'colored-silicone'; // default 'milky-white'
  neonBackplateStyle?: 'contour' | 'cut-to-letter' | 'rounded-rect' | 'rectangle' | 'stand-alone'; // default 'contour'
  neonBackplateMargin?: number; // mm padding around neon curves (default 22)
  neonBackplateThickness?: number; // mm (default 5mm)
  neonBackplateMaterial?: 'clear-acrylic' | 'frosted-acrylic' | 'black-acrylic' | 'gloss-white' | 'mirror-silver' | 'mirror-gold'; // default 'clear-acrylic'
  neonBackplateOpacity?: number; // 0.1 to 1.0 (default 0.92)
  neonBackplateCornerRadius?: number; // mm (default 16)
  neonBackplateHoles?: boolean; // pre-drilled standoff wall mounting holes (default true)
  neonBackplateHoleDiameter?: number; // mm (default 6)
  neonBackplateHoleInset?: number; // mm (default 16)
  neonBackplateStandoffFinish?: StandoffFinish; // 'chrome' | 'black' | 'brass' | 'matte-silver'
  neonShowClips?: boolean; // 3D transparent silicone clips visible (default true)
  neonClipSpacing?: number; // mm spacing between silicone clips (default 45)
  neonShowWires?: boolean; // Show jumper wires & wire pass-through holes (default true)
  neonMountingTrack?: 'surface-clips' | 'cnc-groove' | 'both'; // default 'both'
  neonCncGrooveDepth?: number; // mm groove depth (default 1.8mm)
}

export interface DoubleStepBumpPreset {
  id: string;
  name: string;
  description: string;
  badge?: string;
  footOffset: number;       // Bump Offset (mm) - Identical outward step width for both bumps
  footHeight: number;       // Bump Height (mm) - Straight vertical facet height of each bump
  stepsGap: number;         // Gap Height between bumps (mm)
  footStartHeight: number;  // Distance from bed to first bump (mm)
  footRampAngle: number;    // Ramp overhang angle (°)
  wallHeight: number;       // Total wall height (mm)
  isCustom?: boolean;
  createdAt?: number;
}

export const DEFAULT_DOUBLE_STEP_PRESETS: DoubleStepBumpPreset[] = [
  {
    id: 'dsp-standard-35',
    name: 'Standard Signage (35mm)',
    description: 'Balanced dual architectural step profile for standard 300–500mm channel letters. Clean 45° support-free 3D printing.',
    badge: 'Standard',
    footOffset: 3.5,
    footHeight: 4.0,
    stepsGap: 5.0,
    footStartHeight: 4.0,
    footRampAngle: 45,
    wallHeight: 35
  },
  {
    id: 'dsp-slim-28',
    name: 'Slim & Low Profile (28mm)',
    description: 'Subtle low-profile ridges tailored for compact signs, indoor retail plaques, and desk logos.',
    badge: 'Compact',
    footOffset: 2.5,
    footHeight: 3.0,
    stepsGap: 3.5,
    footStartHeight: 3.0,
    footRampAngle: 45,
    wallHeight: 28
  },
  {
    id: 'dsp-architectural-45',
    name: 'Bold Architectural (45mm)',
    description: 'High-relief stepped tiers with deep shadow lines for oversized storefront exterior signs.',
    badge: 'Deep Relief',
    footOffset: 5.0,
    footHeight: 5.5,
    stepsGap: 7.0,
    footStartHeight: 5.0,
    footRampAngle: 45,
    wallHeight: 45
  },
  {
    id: 'dsp-fast-30',
    name: 'Fast Print / 50° Draft (30mm)',
    description: 'Steeper 50° overhangs and gentle bump offsets optimized for ultra-fast high-speed slicing.',
    badge: 'Fast Print',
    footOffset: 2.0,
    footHeight: 3.5,
    stepsGap: 4.0,
    footStartHeight: 3.0,
    footRampAngle: 50,
    wallHeight: 30
  },
  {
    id: 'dsp-uniform-40',
    name: 'Uniform 3-Zone (40mm)',
    description: 'Mathematically balanced step spacing producing identical visual bands on base, mid, and upper walls.',
    badge: 'Balanced',
    footOffset: 3.5,
    footHeight: 4.5,
    stepsGap: 6.0,
    footStartHeight: 4.5,
    footRampAngle: 45,
    wallHeight: 40
  },
  {
    id: 'dsp-heavy-50',
    name: 'Heavy Duty Base (50mm)',
    description: 'Heavy 6mm stepped flange offering maximum ground contact and structural rigidity for giant signs.',
    badge: 'Heavy Duty',
    footOffset: 6.0,
    footHeight: 6.0,
    stepsGap: 8.0,
    footStartHeight: 6.0,
    footRampAngle: 45,
    wallHeight: 50
  }
];

const STYLE_PRESETS: Record<LetterStyle, Partial<ProjectSettings>> = {
  'acrylic-printed-back': {
    style: 'acrylic-printed-back',
    baseThickness: 2,
    externalWallThickness: 2,
    internalWallThickness: 2,
    wallHeight: 35,
    acrylicThickness: 3.1,
    bodyColor: '#415190',
    acrylicColor: '#CCFF00',
    mountingType: 'none',
    faceMaterial: 'acrylic',
    layers: { body: true, acrylic: true, mounting: false },
    wallProfileTemplate: 'straight',
    footOffset: 0,
    footHeight: 0,
    footCloseAtBase: true,
    footRampAngle: 45,
    bodyTaper: 0,
    footStartHeight: 2
  },
  'acrylic-double-step': {
    style: 'acrylic-double-step',
    baseThickness: 2,
    externalWallThickness: 2,
    internalWallThickness: 2,
    wallHeight: 35,
    acrylicThickness: 3.1,
    bodyColor: '#415190',
    acrylicColor: '#CCFF00',
    mountingType: 'none',
    faceMaterial: 'acrylic',
    layers: { body: true, acrylic: true, mounting: false },
    wallProfileTemplate: 'double-step',
    footOffset: 3.5, // Bump Offset (equal for both bumps)
    footHeight: 4,   // Bump Height (equal for both bumps)
    stepsGap: 5,     // Gap Height between the two equal bumps
    footCloseAtBase: true,
    footRampAngle: 45,
    bodyTaper: 0,
    footStartHeight: 4
  }
};

@Injectable({ providedIn: 'root' })
export class AppStore {
  settings = signal<ProjectSettings>({
    inputSource: 'text',
    vectorData: null,
    text: 'OPEN',
    font: 'Helvetiker-Bold',
    letterSpacing: 15,
    customKerning: {},
    textTransform: 'none',
    textAlign: 'center',
    lineSpacing: 25,
    arcEnabled: false,
    arcAngle: 60,

    filamentType: 'PLA',
    filamentDensity: 1.24,
    infillPercentage: 20,
    filamentCostPerKg: 20,

    // Mounting System Defaults
    mountingType: 'backplate',
    backplateShape: 'contour',
    backplatePadding: 20,
    backplateThickness: 4.5,
    backplateCornerRadius: 16,
    backplateStandoffGap: 0,
    backplateMaterial: 'clear-acrylic',
    backplateOpacity: 0.85,
    backplateHangingHoles: true,
    backplateHoleDiameter: 6,
    backplateHoleInset: 16,
    backplateStandoffHardware: true,
    backplateStandoffFinish: 'chrome',
    backplateTopSuspensionLoops: false,

    barCount: 2,
    barProfile: 'rect-tube',
    barWidth: 25,
    barThickness: 15,
    barOverhang: 20,
    barVerticalOffset: 25,
    barColor: '#1e293b',
    barMaterial: 'matte-black',
    barIncludeClamps: true,
    barWallBrackets: true,
    barStandoffGap: 10,

    racewayHeight: 80,
    racewayDepth: 50,
    racewayOverhang: 20,
    racewayPosition: 'bottom',
    racewayColor: '#1e293b',

    deskStandDepth: 80,
    deskStandHeight: 16,
    deskStandOverhang: 25,
    deskStandLip: 6,
    deskStandColor: '#0f172a',
    
    baseThickness: 2,
    externalWallThickness: 2,
    internalWallThickness: 2,
    wallHeight: 35,
    acrylicThickness: 3.1,
    acrylicClearance: 0,
    externalTab: false,
    mirror: false,

    // Wall Profile Template & Rodapé Defaults
    wallProfileTemplate: 'straight',
    footOffset: 4.5,
    footHeight: 8,
    footCloseAtBase: true,
    footRampAngle: 45,
    bodyTaper: 0,
    footStartHeight: 2,

    ledEnabled: true,
    ledColor: '#ffffff',
    ledIntensity: 20,
    ledSpread: 3500,
    wallGap: 30,
    roomAmbient: 1.0,
    emissiveIntensity: 5,

    ledType: 'modules',
    voltageSystem: '12V',
    cctPreset: '6500K',
    cctKelvin: 6500,
    lensBeamAngle: 160,
    showDiffusionHeatmap: false,
    wireRunLengthMeters: 3,
    wireGaugeSelected: 'auto',
    moduleWattage: 0.72,
    modulePitchMm: 45,
    stripWattagePerMeter: 14.4,
    stripWidthMm: 8,
    showWiringDiagram: false,
    animationMode: 'static',
    animationSpeed: 2,
    powerSupplyEfficiency: 0.85,
    customLeds: null,
    
    customHoles: [],
    mountingHoleType: 'keyhole',
    holeRadius: 4.5,
    keyholeSlotWidth: 4,
    keyholeSlotHeight: 10,
    keyholeDirection: 0,
    ovalHoleWidth: 10,
    ovalHoleHeight: 20,
    ovalCornerRadius: 5,
    ovalRotation: 0,
    interactionMode: 'view',
    autoHolesMaxPerLetter: 3,
    autoHolesEdgeMargin: 10,
    autoHolesMinDistance: 25,
    autoHolesPattern: 'corners-center',
    autoHolesAddWireHole: true,
    autoHolesWireRadius: 6,

    targetHeight: 150,
    showBuildPlate: true,
    buildPlateWidth: 220,
    buildPlateHeight: 220,
    
    autoRotate: false,
    autoRotateSpeed: 2.0,
    cameraType: 'perspective',

    style: 'acrylic-printed-back',
    
    layers: {
      body: true,
      acrylic: true
    },
    
    faceMaterial: 'acrylic',
    diffuserHeightOffset: 0,
    diffuserBevelEnabled: false,
    diffuserBevelSize: 1.5,
    diffuserBevelThickness: 1.5,
    diffuserBevelSegments: 3,
    printedFaceHollow: true,
    printedFaceWallThickness: 0.42,
    printedFaceBottomThickness: 0.20,
    printedFaceDownExport: true,
    bodyColor: '#415190',
    acrylicColor: '#CCFF00',

    // Neon Flex Defaults
    neonText: 'Dreams come true',
    neonFont: 'Pacifico',
    neonTubeDiameter: 8,
    neonRoutingMode: 'inline',
    neonTubeProfile: 'dome',
    neonColor: '#ff2d87',
    neonGlowIntensity: 10,
    neonJacketStyle: 'milky-white',
    neonBackplateStyle: 'contour',
    neonBackplateMargin: 22,
    neonBackplateThickness: 5,
    neonBackplateMaterial: 'clear-acrylic',
    neonBackplateOpacity: 0.92,
    neonBackplateCornerRadius: 16,
    neonBackplateHoles: true,
    neonBackplateHoleDiameter: 6,
    neonBackplateHoleInset: 16,
    neonBackplateStandoffFinish: 'chrome',
    neonShowClips: true,
    neonClipSpacing: 45,
    neonShowWires: true,
    neonMountingTrack: 'both',
    neonCncGrooveDepth: 1.8,
  });

  oversizedWarning = signal<boolean>(false);
  estimatedWidth = signal<number>(0);
  estimatedHeight = signal<number>(0);
  printStats = signal<{
    totalWeightGrams: number;
    estimatedCostUSD: number;
    estimatedPrintHours: number;
    totalVolumeCm3: number;
  }>({
    totalWeightGrams: 0,
    estimatedCostUSD: 0,
    estimatedPrintHours: 0,
    totalVolumeCm3: 0
  });
  activeTab = signal<AppTab>('source');
  inspectorCollapsed = signal<boolean>(false);
  isDarkMode = signal<boolean>(false);
  showTemplateModal = signal<boolean>(false);
  showFontModal = signal<boolean>(false);
  customFonts = signal<SignageFont[]>([]);
  neonStats = computed(() => this.getNeonStats());
  doubleStepPresets = signal<DoubleStepBumpPreset[]>(this.initDoubleStepPresets());

  // State History Stack (Undo / Redo)
  undoStack = signal<HistoryEntry[]>([]);
  redoStack = signal<HistoryEntry[]>([]);
  canUndo = computed(() => this.undoStack().length > 0);
  canRedo = computed(() => this.redoStack().length > 0);
  undoCount = computed(() => this.undoStack().length);
  redoCount = computed(() => this.redoStack().length);
  lastUndoDescription = computed(() => {
    const stack = this.undoStack();
    return stack.length > 0 ? stack[stack.length - 1].description : null;
  });
  lastRedoDescription = computed(() => {
    const stack = this.redoStack();
    return stack.length > 0 ? stack[stack.length - 1].description : null;
  });
  historyToast = signal<{ message: string; type: 'undo' | 'redo' } | null>(null);

  private isPerformingHistoryAction = false;
  private lastHistoryTime = 0;
  private lastHistoryKeys = '';
  private readonly MAX_HISTORY_LENGTH = 80;
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  private initDoubleStepPresets(): DoubleStepBumpPreset[] {
    const defaults = [...DEFAULT_DOUBLE_STEP_PRESETS];
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaults;
    }
    try {
      const savedJson = window.localStorage.getItem('channel_letter_double_step_presets');
      if (savedJson) {
        const customPresets = JSON.parse(savedJson) as DoubleStepBumpPreset[];
        if (Array.isArray(customPresets) && customPresets.length > 0) {
          // Merge custom presets with defaults, avoiding ID collisions
          const customWithFlags = customPresets.map(p => ({ ...p, isCustom: true }));
          return [...defaults, ...customWithFlags];
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved double step presets:', e);
    }
    return defaults;
  }

  private persistCustomDoubleStepPresets(presets: DoubleStepBumpPreset[]) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const customOnly = presets.filter(p => p.isCustom);
      window.localStorage.setItem('channel_letter_double_step_presets', JSON.stringify(customOnly));
    } catch (e) {
      console.warn('Failed to save double step presets to localStorage:', e);
    }
  }

  saveCustomDoubleStepPreset(name: string, description?: string): DoubleStepBumpPreset {
    const s = this.settings();
    const cleanName = (name || '').trim() || `Custom Preset ${this.doubleStepPresets().filter(p => p.isCustom).length + 1}`;
    const newPreset: DoubleStepBumpPreset = {
      id: `custom-dsp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      description: (description || '').trim() || `Custom dual step config: ${s.footOffset || 3.5}mm offset × ${s.footHeight || 4}mm height, ${s.stepsGap || 5}mm gap`,
      badge: 'Custom',
      footOffset: s.footOffset ?? 3.5,
      footHeight: s.footHeight ?? 4.0,
      stepsGap: s.stepsGap ?? 5.0,
      footStartHeight: s.footStartHeight ?? 4.0,
      footRampAngle: s.footRampAngle ?? 45,
      wallHeight: s.wallHeight || 35,
      isCustom: true,
      createdAt: Date.now()
    };

    this.doubleStepPresets.update(list => {
      const updated = [...list, newPreset];
      this.persistCustomDoubleStepPresets(updated);
      return updated;
    });

    return newPreset;
  }

  deleteCustomDoubleStepPreset(presetId: string) {
    this.doubleStepPresets.update(list => {
      const updated = list.filter(p => p.id !== presetId);
      this.persistCustomDoubleStepPresets(updated);
      return updated;
    });
  }

  applyDoubleStepPreset(preset: DoubleStepBumpPreset) {
    this.updateSettings({
      wallProfileTemplate: 'double-step',
      style: 'acrylic-double-step',
      footOffset: preset.footOffset,
      footHeight: preset.footHeight,
      stepsGap: preset.stepsGap,
      footStartHeight: preset.footStartHeight,
      footRampAngle: preset.footRampAngle,
      wallHeight: preset.wallHeight,
      footCloseAtBase: true
    });
  }

  resetDoubleStepPresets() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('channel_letter_double_step_presets');
      } catch {
        // ignore
      }
    }
    this.doubleStepPresets.set([...DEFAULT_DOUBLE_STEP_PRESETS]);
  }

  importDoubleStepPresets(jsonString: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const items: DoubleStepBumpPreset[] = Array.isArray(parsed) ? parsed : [parsed];
      const validPresets: DoubleStepBumpPreset[] = [];

      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        if (typeof item.footOffset !== 'number' || typeof item.footHeight !== 'number') continue;
        
        validPresets.push({
          id: item.id || `custom-dsp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: item.name || 'Imported Preset',
          description: item.description || 'Imported double step bump preset',
          badge: item.badge || 'Imported',
          footOffset: Number(item.footOffset) || 3.5,
          footHeight: Number(item.footHeight) || 4.0,
          stepsGap: Number(item.stepsGap) || 5.0,
          footStartHeight: Number(item.footStartHeight) || 4.0,
          footRampAngle: Number(item.footRampAngle) || 45,
          wallHeight: Number(item.wallHeight) || 35,
          isCustom: true,
          createdAt: Date.now()
        });
      }

      if (validPresets.length === 0) {
        return { success: false, count: 0, error: 'No valid double step preset configurations found in JSON.' };
      }

      this.doubleStepPresets.update(list => {
        // Filter out any duplicates with same ID
        const existingIds = new Set(validPresets.map(p => p.id));
        const kept = list.filter(p => !existingIds.has(p.id));
        const merged = [...kept, ...validPresets];
        this.persistCustomDoubleStepPresets(merged);
        return merged;
      });

      return { success: true, count: validPresets.length };
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : 'Invalid JSON format';
      return { success: false, count: 0, error: err };
    }
  }

  exportDoubleStepPresetsJson(): string {
    const customPresets = this.doubleStepPresets().filter(p => p.isCustom);
    return JSON.stringify(customPresets.length > 0 ? customPresets : this.doubleStepPresets(), null, 2);
  }

  addCustomFont(font: SignageFont) {
    this.customFonts.update(fonts => [...fonts, font]);
  }

  openTemplateModal() {
    this.showTemplateModal.set(true);
  }

  closeTemplateModal() {
    this.showTemplateModal.set(false);
  }

  openFontModal() {
    this.showFontModal.set(true);
  }

  closeFontModal() {
    this.showFontModal.set(false);
  }

  setActiveTab(tab: AppTab) {
    this.activeTab.set(tab);
  }

  toggleDarkMode() {
    this.isDarkMode.update(v => !v);
  }

  toggleAutoRotate() {
    this.updateSettings({ autoRotate: !this.settings().autoRotate });
  }

  toggleCameraType() {
    const current = this.settings().cameraType || 'perspective';
    this.updateSettings({ cameraType: current === 'perspective' ? 'orthographic' : 'perspective' });
  }

  showHistoryToast(message: string, type: 'undo' | 'redo') {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.historyToast.set({ message, type });
    this.toastTimeout = setTimeout(() => {
      this.historyToast.set(null);
    }, 2400);
  }

  private describeSettingsChange(partial: Partial<ProjectSettings>): string {
    const keys = Object.keys(partial) as (keyof ProjectSettings)[];
    if (keys.length === 1) {
      const k = keys[0];
      if (k === 'text') {
        const txt = String(partial.text ?? '').trim();
        return txt ? `Text: "${txt.length > 18 ? txt.substring(0, 15) + '...' : txt}"` : 'Clear Text';
      }
      if (k === 'font') return `Font: ${partial.font}`;
      if (k === 'neonText') return `Neon Text: "${String(partial.neonText ?? '').substring(0, 15)}"`;
      if (k === 'neonFont') return `Neon Font: ${partial.neonFont}`;
      if (k === 'letterSpacing') return `Letter Spacing: ${partial.letterSpacing}mm`;
      if (k === 'lineSpacing') return `Line Spacing: ${partial.lineSpacing}mm`;
      if (k === 'textAlign') return `Align: ${partial.textAlign}`;
      if (k === 'textTransform') return `Case: ${partial.textTransform}`;
      if (k === 'wallHeight') return `Wall Height: ${partial.wallHeight}mm`;
      if (k === 'baseThickness') return `Base Thickness: ${partial.baseThickness}mm`;
      if (k === 'externalWallThickness') return `Wall Thickness: ${partial.externalWallThickness}mm`;
      if (k === 'internalWallThickness') return `Inner Wall: ${partial.internalWallThickness}mm`;
      if (k === 'acrylicThickness') return `Acrylic Thickness: ${partial.acrylicThickness}mm`;
      if (k === 'footOffset') return `Bump Offset: ${partial.footOffset}mm`;
      if (k === 'footHeight') return `Bump Height: ${partial.footHeight}mm`;
      if (k === 'stepsGap') return `Steps Gap: ${partial.stepsGap}mm`;
      if (k === 'footStartHeight') return `Bump Step 1 Height: ${partial.footStartHeight}mm`;
      if (k === 'footRampAngle') return `Bump Bevel Angle: ${partial.footRampAngle}°`;
      if (k === 'footCloseAtBase') return partial.footCloseAtBase ? 'Double-Step Base Attached' : 'Double-Step Floating';
      if (k === 'wallProfileTemplate') return `Wall Profile: ${partial.wallProfileTemplate}`;
      if (k === 'style') return `Style: ${partial.style}`;
      if (k === 'mountingType') return `Mounting: ${partial.mountingType}`;
      if (k === 'backplateShape') return `Backplate Shape: ${partial.backplateShape}`;
      if (k === 'backplateMaterial') return `Backplate Material: ${partial.backplateMaterial}`;
      if (k === 'backplatePadding') return `Backplate Margin: ${partial.backplatePadding}mm`;
      if (k === 'backplateThickness') return `Backplate Thickness: ${partial.backplateThickness}mm`;
      if (k === 'ledColor') return `LED Color: ${partial.ledColor}`;
      if (k === 'ledIntensity') return `LED Brightness: ${partial.ledIntensity}`;
      if (k === 'ledEnabled') return partial.ledEnabled ? 'Enable LEDs' : 'Disable LEDs';
      if (k === 'cctPreset') return `Color Temp: ${partial.cctPreset}`;
      if (k === 'cctKelvin') return `Color Temp: ${partial.cctKelvin}K`;
      if (k === 'lensBeamAngle') return `Lens Angle: ${partial.lensBeamAngle}°`;
      if (k === 'mirror') return partial.mirror ? 'Mirror Geometry: ON' : 'Mirror Geometry: OFF';
      if (k === 'arcEnabled') return partial.arcEnabled ? 'Curved Arc: ON' : 'Curved Arc: OFF';
      if (k === 'arcAngle') return `Curved Arc: ${partial.arcAngle}°`;
      if (k === 'customKerning') return 'Custom Kerning';
      if (k === 'customHoles') return 'Mounting Holes';
      if (k === 'customLeds') return 'LED Placement';
      if (k === 'inputSource') return `Input Mode: ${partial.inputSource?.toUpperCase()}`;
    }
    if (partial.footOffset !== undefined || partial.footHeight !== undefined || partial.stepsGap !== undefined) {
      return 'Double-Step Bump Settings';
    }
    if (partial.text !== undefined || partial.font !== undefined || partial.letterSpacing !== undefined) {
      return 'Typography & Lettering';
    }
    if (partial.style !== undefined) {
      return `Letter Style Preset`;
    }
    return `Design Changes`;
  }

  updateSettings(
    partial: Partial<ProjectSettings>,
    options?: { pushHistory?: boolean; description?: string; immediate?: boolean }
  ) {
    const updated = { ...partial };
    if (updated.neonFont !== undefined && updated.font === undefined) {
      updated.font = updated.neonFont;
    } else if (updated.font !== undefined && updated.neonFont === undefined) {
      updated.neonFont = updated.font;
    }

    const current = this.settings();

    // Check if any actual value differs
    const keys = Object.keys(updated) as (keyof ProjectSettings)[];
    const hasChanges = keys.some(k => updated[k] !== current[k]);
    if (!hasChanges) {
      return;
    }

    // Determine if this change should be pushed to the undo history stack
    const shouldRecord = options?.pushHistory !== false && !this.isPerformingHistoryAction;
    if (shouldRecord) {
      const now = Date.now();
      const keysKey = keys.slice().sort().join(',');
      // If the user is dragging a slider or typing rapidly on the exact same property, coalesce into one undo state
      const isRapidCoalesce = (now - this.lastHistoryTime < 600) && (keysKey === this.lastHistoryKeys);

      const desc = options?.description || this.describeSettingsChange(updated);

      if (!isRapidCoalesce || options?.immediate) {
        // Capture a clean deep clone snapshot of the current state before the change is applied
        const snapshot: ProjectSettings = JSON.parse(JSON.stringify(current));
        this.undoStack.update(stack => {
          const next = [...stack, { settings: snapshot, description: desc, timestamp: now }];
          if (next.length > this.MAX_HISTORY_LENGTH) {
            return next.slice(next.length - this.MAX_HISTORY_LENGTH);
          }
          return next;
        });
        // Clear redo stack on every new modification
        this.redoStack.set([]);
      }

      this.lastHistoryTime = now;
      this.lastHistoryKeys = keysKey;
    }

    this.settings.update(s => ({ ...s, ...updated }));
  }

  undo(): boolean {
    const stack = this.undoStack();
    if (stack.length === 0) return false;

    const previousEntry = stack[stack.length - 1];
    const currentSnapshot: ProjectSettings = JSON.parse(JSON.stringify(this.settings()));

    this.isPerformingHistoryAction = true;
    try {
      this.undoStack.set(stack.slice(0, -1));
      this.redoStack.update(redo => [
        ...redo,
        {
          settings: currentSnapshot,
          description: previousEntry.description || 'Design Change',
          timestamp: Date.now()
        }
      ]);
      this.settings.set(previousEntry.settings);
      this.showHistoryToast(`Undone: ${previousEntry.description}`, 'undo');
      return true;
    } finally {
      this.isPerformingHistoryAction = false;
      this.lastHistoryTime = 0;
      this.lastHistoryKeys = '';
    }
  }

  redo(): boolean {
    const stack = this.redoStack();
    if (stack.length === 0) return false;

    const nextEntry = stack[stack.length - 1];
    const currentSnapshot: ProjectSettings = JSON.parse(JSON.stringify(this.settings()));

    this.isPerformingHistoryAction = true;
    try {
      this.redoStack.set(stack.slice(0, -1));
      this.undoStack.update(undo => [
        ...undo,
        {
          settings: currentSnapshot,
          description: nextEntry.description || 'Design Change',
          timestamp: Date.now()
        }
      ]);
      this.settings.set(nextEntry.settings);
      this.showHistoryToast(`Redone: ${nextEntry.description}`, 'redo');
      return true;
    } finally {
      this.isPerformingHistoryAction = false;
      this.lastHistoryTime = 0;
      this.lastHistoryKeys = '';
    }
  }

  clearHistory() {
    this.undoStack.set([]);
    this.redoStack.set([]);
    this.lastHistoryTime = 0;
    this.lastHistoryKeys = '';
  }

  recordSnapshot(description?: string) {
    const currentSnapshot: ProjectSettings = JSON.parse(JSON.stringify(this.settings()));
    const now = Date.now();
    const desc = description || 'Design Checkpoint';
    this.undoStack.update(stack => {
      const next = [...stack, { settings: currentSnapshot, description: desc, timestamp: now }];
      if (next.length > this.MAX_HISTORY_LENGTH) {
        return next.slice(next.length - this.MAX_HISTORY_LENGTH);
      }
      return next;
    });
    this.redoStack.set([]);
  }

  setOversizedWarning(val: boolean) {
    if (this.oversizedWarning() !== val) {
      this.oversizedWarning.set(val);
    }
  }

  setEstimatedDimensions(width: number, height: number) {
    this.estimatedWidth.set(width);
    this.estimatedHeight.set(height);
  }

  setPrintStats(stats: { totalWeightGrams: number; estimatedCostUSD: number; estimatedPrintHours: number; totalVolumeCm3: number }) {
    this.printStats.set(stats);
  }

  applyStylePreset(style: LetterStyle) {
    const preset = STYLE_PRESETS[style] || {};
    this.updateSettings({ style, ...preset });
  }

  applyPreset(style: LetterStyle) {
    this.applyStylePreset(style);
  }

  static kelvinToHex(kelvin: number): string {
    const temp = Math.max(2000, Math.min(12000, kelvin)) / 100;
    let red = 0, green = 0, blue = 0;

    if (temp <= 66) {
      red = 255;
      green = 99.4708025861 * Math.log(temp) - 161.1195681661;
      if (temp <= 19) {
        blue = 0;
      } else {
        blue = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
      }
    } else {
      red = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
      green = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
      blue = 255;
    }

    const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
    const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
  }

  setCCTPreset(preset: '3000K' | '4000K' | '6500K' | '8000K' | 'custom' | 'rgb', customK?: number) {
    if (preset === 'rgb') {
      this.updateSettings({ cctPreset: 'rgb' });
      return;
    }

    let kelvin = 6500;
    if (preset === '3000K') kelvin = 3000;
    else if (preset === '4000K') kelvin = 4000;
    else if (preset === '6500K') kelvin = 6500;
    else if (preset === '8000K') kelvin = 8000;
    else if (preset === 'custom' && customK) kelvin = customK;

    const hexColor = AppStore.kelvinToHex(kelvin);
    this.updateSettings({
      cctPreset: preset,
      cctKelvin: kelvin,
      ledColor: hexColor
    });
  }

  setCCTKelvin(kelvin: number) {
    const clampedK = Math.max(2700, Math.min(10000, kelvin));
    const hexColor = AppStore.kelvinToHex(clampedK);
    this.updateSettings({
      cctPreset: 'custom',
      cctKelvin: clampedK,
      ledColor: hexColor
    });
  }

  getDiffusionAnalysis() {
    const s = this.settings();
    const cavityDepthMm = Math.max(2, s.wallHeight - s.baseThickness - s.acrylicThickness);
    const pitchMm = s.ledType === 'strip' ? 15 : (s.modulePitchMm || 45);
    const beamAngle = s.lensBeamAngle || 160;
    const halfAngleRad = ((beamAngle / 2) * Math.PI) / 180;
    
    // Conical beam radius at the underside of the acrylic face
    const beamRadiusMm = Math.round(cavityDepthMm * Math.tan(halfAngleRad) * 10) / 10;
    const beamSpreadDiameterMm = beamRadiusMm * 2;
    
    // Overlap Ratio: > 1.2 ensures continuous light overlap with zero hotspots
    const overlapRatio = Math.round((beamSpreadDiameterMm / pitchMm) * 100) / 100;
    
    // Uniformity Index (0 - 100%)
    let uniformityPercent = 100;
    if (overlapRatio < 0.9) {
      uniformityPercent = Math.max(30, Math.round(overlapRatio * 60));
    } else if (overlapRatio < 1.3) {
      uniformityPercent = Math.min(95, Math.round(75 + (overlapRatio - 0.9) * 50));
    } else {
      uniformityPercent = Math.min(100, Math.round(95 + (overlapRatio - 1.3) * 5));
    }

    let hotspotStatus: 'optimal' | 'good' | 'warning' | 'critical' = 'optimal';
    let statusMessage = 'Optimal depth! Perfect homogeneous face diffusion with zero visible hotspots.';

    if (overlapRatio < 0.8) {
      hotspotStatus = 'critical';
      statusMessage = 'Severe hotspot risk! Channel is too shallow for current LED pitch. Diode dots will be visible on face.';
    } else if (overlapRatio < 1.1) {
      hotspotStatus = 'warning';
      statusMessage = 'Marginal diffusion. Minor scalloping / diode hotspots may appear through thin acrylic.';
    } else if (overlapRatio < 1.35) {
      hotspotStatus = 'good';
      statusMessage = 'Good diffusion. Smooth illumination with standard 3mm opal acrylic.';
    }

    const recommendedMinDepthMm = Math.max(15, Math.ceil(pitchMm / (2 * Math.tan(halfAngleRad))));

    return {
      cavityDepthMm,
      pitchMm,
      beamAngle,
      beamSpreadDiameterMm,
      overlapRatio,
      uniformityPercent,
      hotspotStatus,
      statusMessage,
      recommendedMinDepthMm
    };
  }

  getElectricalSummary() {
    const s = this.settings();
    const width = this.estimatedWidth() || (s.text.length * s.targetHeight * 0.75);
    const height = this.estimatedHeight() || s.targetHeight;
    const pitch = s.modulePitchMm || 45;

    // Estimate total contour length for letters in millimeters
    const approxPerimeterMm = (width * 2.2 + height * 1.8) * Math.max(1, s.text.length > 0 ? Math.min(s.text.length * 0.4, 3) : 1);
    const totalMeters = Math.round((approxPerimeterMm / 1000) * 100) / 100;

    let totalWatts = 0;
    let totalModules = 0;
    let maxChainCapacity = 0;
    let chainCount = 1;

    if (s.ledType === 'strip') {
      const wPerMeter = s.stripWattagePerMeter || 14.4;
      totalWatts = Math.round(totalMeters * wPerMeter * 10) / 10;
      // Max continuous run for LED tape before voltage drop
      const maxMetersPerFeed = s.voltageSystem === '12V' ? 5 : 10;
      maxChainCapacity = maxMetersPerFeed;
      chainCount = Math.max(1, Math.ceil(totalMeters / maxMetersPerFeed));
    } else {
      totalModules = Math.max(12, Math.ceil(approxPerimeterMm / pitch));
      totalWatts = Math.round((totalModules * s.moduleWattage) * 10) / 10;
      const maxModulesPerChain = s.voltageSystem === '12V' ? 50 : 100;
      maxChainCapacity = maxModulesPerChain;
      chainCount = Math.max(1, Math.ceil(totalModules / maxModulesPerChain));
    }
    
    // Safety margin 80-85% continuous load rule for LED drivers (UL Class 2 / CE standard)
    const requiredPsuRaw = totalWatts / (s.powerSupplyEfficiency || 0.85);
    const standardPsuSizes = [35, 50, 75, 100, 150, 200, 320, 450, 600];
    const recommendedPsuWatts = standardPsuSizes.find(size => size >= requiredPsuRaw) || Math.ceil(requiredPsuRaw / 50) * 50;

    const voltage = s.voltageSystem === '24V' ? 24 : 12;
    const totalAmps = Math.round((totalWatts / voltage) * 100) / 100;
    
    // Wire Gauge & Voltage Drop Calculation
    const leadDistanceMeters = s.wireRunLengthMeters || 3;
    const recommendedGauge = totalAmps < 2.5 ? '18 AWG' : (totalAmps < 6 ? '16 AWG' : (totalAmps < 10 ? '14 AWG' : '12 AWG'));
    const selectedGauge = (!s.wireGaugeSelected || s.wireGaugeSelected === 'auto') ? recommendedGauge : s.wireGaugeSelected;

    // Resistance per meter (ohms/m) for 2 conductors (out and return = 2x)
    const resistanceLookup: Record<string, number> = {
      '18 AWG': 0.021,
      '16 AWG': 0.013,
      '14 AWG': 0.008,
      '12 AWG': 0.005
    };
    const rPerMeter = resistanceLookup[selectedGauge] || 0.013;
    const totalLoopResistance = rPerMeter * leadDistanceMeters * 2;
    const voltageDropV = Math.round(totalAmps * totalLoopResistance * 100) / 100;
    const voltageDropPercent = Math.round((voltageDropV / voltage) * 1000) / 10;
    const isVoltageDropSafe = voltageDropPercent <= 5.0;

    // Optical output estimation (~90 lm/W for modern sign LEDs)
    const totalLumens = Math.round(totalWatts * 90);
    const hourlyKwh = Math.round((totalWatts / 1000) * 1000) / 1000;
    const estimatedMonthlyCost = Math.round(hourlyKwh * 8 * 30 * 0.15 * 100) / 100; // 8 hrs/day @ $0.15/kWh

    return {
      ledType: s.ledType,
      totalModules,
      totalMeters,
      totalWatts,
      totalLumens,
      recommendedPsuWatts,
      voltage,
      totalAmps,
      maxChainCapacity,
      chainCount,
      wireGauge: selectedGauge,
      recommendedGauge,
      leadDistanceMeters,
      voltageDropV,
      voltageDropPercent,
      isVoltageDropSafe,
      requiresParallelFeeds: chainCount > 1,
      estimatedMonthlyCost
    };
  }

  getElectricalSpecSheetMarkdown(): string {
    const s = this.settings();
    const elec = this.getElectricalSummary();
    const diff = this.getDiffusionAnalysis();
    const now = new Date().toISOString().split('T')[0];

    return `# CHANNEL LETTER ELECTRICAL & LIGHTING SPEC SHEET
Generated on: ${now}
Project Sign Text: "${s.text}" | Target Height: ${s.targetHeight} mm | Depth: ${s.wallHeight} mm

--------------------------------------------------------------------------------
1. LIGHTING ENGINE SPECIFICATIONS
--------------------------------------------------------------------------------
- Light Source Type:       ${s.ledType === 'modules' ? 'Injection Molded Sign Modules' : 'Flexible LED Tape Strip'}
- Color / CCT:             ${s.cctPreset || 'Custom'} (${s.ledColor}) ${s.cctKelvin ? `[${s.cctKelvin}K]` : ''}
- Operating Voltage:       ${elec.voltage}V DC (Constant Voltage)
- Total Emitter Quantity:  ${s.ledType === 'modules' ? `${elec.totalModules} modules` : `${elec.totalMeters} linear meters`}
- Estimated Luminous Flux: ${elec.totalLumens.toLocaleString()} Lumens (approx. 90 lm/W)
- Optical Lens Beam Angle: ${diff.beamAngle}° Batwing Diffuser

--------------------------------------------------------------------------------
2. OPTICAL DIFFUSION & HOTSPOT DIAGNOSTICS
--------------------------------------------------------------------------------
- Effective Cavity Depth:  ${diff.cavityDepthMm} mm (Wall: ${s.wallHeight}mm - Base: ${s.baseThickness}mm - Face: ${s.acrylicThickness}mm)
- Diode / Module Pitch:    ${diff.pitchMm} mm
- Beam Spread Diameter:    ${diff.beamSpreadDiameterMm} mm at underside of acrylic
- Overlap Ratio:           ${diff.overlapRatio}x
- Face Uniformity Score:   ${diff.uniformityPercent}%
- Hotspot Risk Rating:     ${diff.hotspotStatus.toUpperCase()} (${diff.statusMessage})
- Recommended Min Depth:   ≥ ${diff.recommendedMinDepthMm} mm

--------------------------------------------------------------------------------
3. ELECTRICAL LOAD & POWER SUPPLY REQUIREMENTS
--------------------------------------------------------------------------------
- Total Power Dissipation: ${elec.totalWatts} Watts
- Operating Current Draw:  ${elec.totalAmps} Amps DC
- Safety Duty Factor:      85% (Continuous Commercial Rating)
- Recommended Driver PSU:  ${elec.recommendedPsuWatts}W ${elec.voltage}V DC Class 2 / IP67 Power Supply
- Primary Cable Lead:      ${elec.wireGauge} (${elec.leadDistanceMeters}m run to driver enclosure)
- Estimated Voltage Drop:  ${elec.voltageDropV}V (${elec.voltageDropPercent}%) - ${elec.isVoltageDropSafe ? 'PASSED (≤ 5% standard)' : 'WARNING (High voltage drop - increase gauge)'}
- Parallel Feed Circuits:  ${elec.chainCount} circuit feed(s) (Max ${elec.maxChainCapacity} ${s.ledType === 'modules' ? 'mods' : 'm'} per run)
- Est. Monthly Energy:     ~${elec.estimatedMonthlyCost} USD (Based on 8h daily duty cycle @ $0.15/kWh)

--------------------------------------------------------------------------------
4. INSTALLATION & FABRICATION CHECKLIST
--------------------------------------------------------------------------------
[ ] Clean letter cavities with 99% IPA before bonding LED tape / module VHB pads
[ ] Ensure silicone / rubber wire grommets are fitted in rear feed holes
[ ] Ensure all interconnect soldering / wire-nuts are sealed with dielectric heatshrink
[ ] Verify power supply is ventilated and installed in an accessible NEMA / IP enclosure
[ ] Perform 30-minute thermal burn-in test before adhering acrylic diffuser faces
`;
  }

  updateLayer(layer: keyof Layers, visible: boolean) {
    this.settings.update(s => ({
      ...s,
      layers: { ...s.layers, [layer]: visible }
    }));
  }

  setCustomLeds(leds: { id: string; x: number; y: number }[] | null) {
    this.updateSettings({ customLeds: leds });
  }

  updateLedPosition(id: string, x: number, y: number) {
    const current = this.settings().customLeds || [];
    const idx = current.findIndex(l => l.id === id);
    if (idx >= 0) {
      const updated = [...current];
      updated[idx] = { ...updated[idx], x, y };
      this.updateSettings({ customLeds: updated });
    } else {
      this.updateSettings({ customLeds: [...current, { id, x, y }] });
    }
  }

  addCustomLed(x: number, y: number) {
    const current = this.settings().customLeds || [];
    const newId = 'led_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    this.updateSettings({ customLeds: [...current, { id: newId, x, y }] });
  }

  deleteLed(id: string) {
    const current = this.settings().customLeds || [];
    this.updateSettings({ customLeds: current.filter(l => l.id !== id) });
  }

  setLetterKerning(index: number, offsetMm: number) {
    const current = this.settings().customKerning || {};
    this.updateSettings({
      customKerning: { ...current, [index]: offsetMm }
    });
  }

  nudgeLetterKerning(index: number, deltaMm: number) {
    const current = this.settings().customKerning || {};
    const existing = current[index] || 0;
    this.setLetterKerning(index, existing + deltaMm);
  }

  resetKerning() {
    this.updateSettings({ customKerning: {} });
  }

  getMountingSummary() {
    const s = this.settings();
    const signW = this.estimatedWidth() || 300;
    const signH = this.estimatedHeight() || 150;
    
    const pad = s.backplatePadding || 20;
    const backplateW = Math.round((signW + pad * 2) * 10) / 10;
    const backplateH = Math.round((signH + pad * 2) * 10) / 10;
    const backplateThick = s.backplateThickness || 4.5;
    
    // Area in cm2
    const areaCm2 = Math.round(((backplateW * backplateH) / 100) * 10) / 10;
    const perimeterMm = Math.round((backplateW + backplateH) * 2);
    
    // Weight estimation based on acrylic density 1.19 g/cm3 or aluminum 2.7 g/cm3
    const density = s.backplateMaterial === 'brushed-aluminum' ? 2.7 : (s.backplateMaterial === 'wood' ? 0.65 : 1.19);
    const volumeCm3 = (areaCm2 * (backplateThick / 10));
    const estimatedWeightGrams = Math.round(volumeCm3 * density);

    // Standoff hardware count
    let standoffCount = 0;
    if (s.mountingType === 'backplate' && s.backplateHangingHoles) {
      standoffCount = backplateW > 600 ? 6 : 4;
    }

    // Rail system telemetry
    const railLength = Math.round(signW + (s.barOverhang || 20) * 2);
    const railCount = s.barCount || 2;
    const totalRailLength = railLength * railCount;

    return {
      mountingType: s.mountingType,
      backplateWidthMm: backplateW,
      backplateHeightMm: backplateH,
      backplateThicknessMm: backplateThick,
      backplateAreaCm2: areaCm2,
      backplatePerimeterMm: perimeterMm,
      estimatedWeightGrams,
      standoffCount,
      standoffDiameterMm: s.backplateHoleDiameter || 6,
      standoffFinish: s.backplateStandoffFinish || 'chrome',
      railCount,
      railLengthMm: railLength,
      totalRailLengthMm: totalRailLength,
      barWidthMm: s.barWidth || 25,
      barThicknessMm: s.barThickness || 15
    };
  }

  applyMountingPreset(type: MountingType, shape?: BackplateShape) {
    if (type === 'none') {
      this.updateSettings({ mountingType: 'none' });
    } else if (type === 'backplate') {
      this.updateSettings({
        mountingType: 'backplate',
        backplateShape: shape || 'contour',
        backplatePadding: shape === 'contour' ? 18 : 25,
        backplateThickness: 4.5,
        backplateMaterial: 'clear-acrylic',
        backplateHangingHoles: true,
        backplateStandoffHardware: true,
        backplateStandoffGap: 15
      });
    } else if (type === 'bar-system') {
      this.updateSettings({
        mountingType: 'bar-system',
        barCount: 2,
        barProfile: 'rect-tube',
        barWidth: 25,
        barThickness: 15,
        barOverhang: 20,
        barColor: '#1e293b',
        barMaterial: 'matte-black',
        barIncludeClamps: true,
        barWallBrackets: true,
        barStandoffGap: 15
      });
    } else if (type === 'raceway') {
      this.updateSettings({
        mountingType: 'raceway',
        racewayHeight: 80,
        racewayDepth: 50,
        racewayOverhang: 25,
        racewayPosition: 'bottom',
        racewayColor: '#1e293b'
      });
    } else if (type === 'desk-stand') {
      this.updateSettings({
        mountingType: 'desk-stand',
        deskStandDepth: 90,
        deskStandHeight: 18,
        deskStandOverhang: 30,
        deskStandLip: 8,
        deskStandColor: '#0f172a'
      });
    }
  }

  resetLedsToAuto() {
    this.updateSettings({ customLeds: null });
  }

  getNeonStats() {
    const s = this.settings();
    const signW = this.estimatedWidth() || 350;
    const signH = this.estimatedHeight() || 180;
    const margin = s.neonBackplateMargin ?? 22;
    const plateW = Math.round(signW + margin * 2);
    const plateH = Math.round(signH + margin * 2);
    const plateThickness = s.neonBackplateThickness ?? 5;
    
    const textStr = (s.neonText || s.text || 'Dreams come true').replace(/\s+/g, '');
    const textLen = Math.max(4, textStr.length);
    const targetH = s.targetHeight || 120;
    const lengthMultiplier = s.neonRoutingMode === 'outline' ? 3.2 : 1.45;
    const estimatedTubeLengthMm = Math.round(textLen * targetH * lengthMultiplier);
    const tubeLengthM = Math.max(0.3, Math.round((estimatedTubeLengthMm / 1000) * 10) / 10);
    const tubeLengthFt = Math.round((tubeLengthM * 3.28084) * 10) / 10;
    
    const powerWatts = Math.round(tubeLengthM * 9.6 * 10) / 10;
    const currentAmps12V = Math.round((powerWatts / 12) * 10) / 10;
    const recommendedPsuWatts = Math.max(24, Math.ceil((powerWatts * 1.25) / 10) * 10);
    
    const areaCm2 = Math.round((plateW * plateH) / 100);
    const density = 1.19; // PMMA acrylic density
    const plateWeightGrams = Math.round((areaCm2 * (plateThickness / 10)) * density);
    
    const clipSpacing = s.neonClipSpacing ?? 45;
    const clipCount = Math.max(6, Math.round(estimatedTubeLengthMm / clipSpacing));
    const standoffCount = plateW > 600 ? 6 : 4;
    
    return {
      tubeLengthMm: estimatedTubeLengthMm,
      tubeLengthM,
      totalTubeLengthMeters: tubeLengthM,
      tubeLengthFt,
      powerWatts,
      currentAmps: currentAmps12V,
      currentAmps12V,
      recommendedPsuWatts,
      recommendedPowerSupply: `${recommendedPsuWatts}W 12V DC Adapter`,
      backplateWidthMm: plateW,
      backplateHeightMm: plateH,
      backplateThicknessMm: plateThickness,
      backplateAreaCm2: areaCm2,
      backplateWeightGrams: plateWeightGrams,
      clipCount,
      standoffCount,
      standoffFinish: s.neonBackplateStandoffFinish || 'chrome'
    };
  }
}
