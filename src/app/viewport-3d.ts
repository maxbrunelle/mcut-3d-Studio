import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, effect, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import * as ClipperLib from 'clipper-lib';
import JSZip from 'jszip';
import { AppStore, CustomHole, ProjectSettings } from './store';
import { FontLoaderService } from './font-loader-service';
import { calculateAutoHoles } from './auto-holes-generator';
import { extractGlyphOutlineStrokes, extractGlyphCenterlineStrokes, NeonStroke } from './neon-stroke-extractor';



function createBrickTextures() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = 1024;
  normalCanvas.height = 1024;
  const nCtx = normalCanvas.getContext('2d');

  if (!ctx || !nCtx) return { texture: null, normalMap: null };

  // Base mortar
  ctx.fillStyle = '#1c1918';
  ctx.fillRect(0, 0, 1024, 1024);
  
  // Normal map mortar (flat)
  nCtx.fillStyle = 'rgb(128, 128, 255)';
  nCtx.fillRect(0, 0, 1024, 1024);
  
  // Darker, realistic brick colors
  const brickColors = ['#4a332d', '#523731', '#422c26', '#4a2f29', '#3d2621', '#5e3a32'];
  
  const rows = 24;
  const cols = 12;
  const brickH = 1024 / rows;
  const brickW = 1024 / cols;
  const mortar = 6;
  
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2 === 0) ? 0 : brickW / 2;
    for (let c = -1; c < cols + 1; c++) {
      ctx.fillStyle = brickColors[Math.floor(Math.random() * brickColors.length)];
      const x = c * brickW + offset + mortar/2;
      const y = r * brickH + mortar/2;
      const w = brickW - mortar;
      const h = brickH - mortar;
      
      // Color
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x, y, w, h * 0.15); // Top shadow
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x, y + h * 0.85, w, h * 0.15); // Bottom highlight

      // Normal map
      const grad = nCtx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, 'rgb(128, 160, 255)'); 
      grad.addColorStop(1, 'rgb(128, 96, 255)'); 
      nCtx.fillStyle = grad;
      nCtx.fillRect(x, y, w, h);
      
      nCtx.fillStyle = 'rgb(160, 128, 255)'; // Right edge
      nCtx.fillRect(x + w - 3, y, 3, h);
      nCtx.fillStyle = 'rgb(96, 128, 255)'; // Left edge
      nCtx.fillRect(x, y, 3, h);
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  
  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(10, 10);

  return { texture, normalMap };
}

@Component({
  selector: 'app-viewport-3d',
  imports: [MatIconModule],
  template: `
    <div class="absolute inset-0 bg-[#eef2f5] dark:bg-slate-900" #canvasContainer></div>
    @if (isBrowser) {
      <div class="absolute top-20 left-6 z-20 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl select-none">
        <!-- Reset View -->
        <button class="px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold" 
                (click)="resetView()" title="Reset Camera Orientation">
          <mat-icon class="scale-75 text-slate-500">center_focus_strong</mat-icon>
          <span>Reset</span>
        </button>

        <!-- Camera View Projection Toggle Button -->
        <button [class.bg-indigo-500/15]="store.settings().cameraType === 'orthographic'"
                [class.text-indigo-600]="store.settings().cameraType === 'orthographic'"
                [class.dark:text-indigo-400]="store.settings().cameraType === 'orthographic'"
                [class.border-indigo-400/40]="store.settings().cameraType === 'orthographic'"
                [class.text-slate-700]="store.settings().cameraType !== 'orthographic'"
                [class.dark:text-slate-200]="store.settings().cameraType !== 'orthographic'"
                class="px-2.5 py-1.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                (click)="store.toggleCameraType()" 
                [title]="store.settings().cameraType === 'orthographic' ? 'Switch to Perspective View (Realistic 3D)' : 'Switch to Orthographic View (Blueprint / Technical)'">
          <mat-icon class="scale-75" [class.text-indigo-500]="store.settings().cameraType === 'orthographic'">
            {{ store.settings().cameraType === 'orthographic' ? 'architecture' : 'view_in_ar' }}
          </mat-icon>
          <span>{{ store.settings().cameraType === 'orthographic' ? 'Ortho View' : 'Perspective' }}</span>
        </button>

        <!-- Auto-Rotate Orbit Toggle -->
        <button [class.bg-blue-500/15]="store.settings().autoRotate"
                [class.text-blue-600]="store.settings().autoRotate"
                [class.dark:text-blue-400]="store.settings().autoRotate"
                [class.border-blue-400/40]="store.settings().autoRotate"
                [class.text-slate-700]="!store.settings().autoRotate"
                [class.dark:text-slate-200]="!store.settings().autoRotate"
                class="px-2.5 py-1.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                (click)="store.toggleAutoRotate()" 
                [title]="store.settings().autoRotate ? 'Pause 3D Orbit' : 'Start 3D Viewport Auto-Rotate Orbit'">
          <mat-icon class="scale-75" [class.animate-spin]="store.settings().autoRotate" [class.text-blue-500]="store.settings().autoRotate">3d_rotation</mat-icon>
          <span>Auto-Rotate</span>
        </button>

        <!-- Wireframe Toggle -->
        <button [class.bg-amber-500/15]="isWireframe()"
                [class.text-amber-600]="isWireframe()"
                [class.dark:text-amber-400]="isWireframe()"
                [class.border-amber-400/40]="isWireframe()"
                [class.text-slate-700]="!isWireframe()"
                [class.dark:text-slate-200]="!isWireframe()"
                class="px-2.5 py-1.5 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold" 
                (click)="toggleWireframe()" title="Toggle Mesh Wireframe Mode">
          <mat-icon class="scale-75" [class.text-amber-500]="isWireframe()">grid_3x3</mat-icon>
          <span>Wireframe</span>
        </button>
        
        <!-- Snapshot Button -->
        <button class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer" 
                (click)="takeSnapshot()" title="Capture High-Resolution 3D Snapshot (PNG)">
          <mat-icon class="scale-75">photo_camera</mat-icon>
          <span>Snapshot</span>
        </button>
      </div>

      <!-- Camera Shutter Flash Effect -->
      @if (isFlashing()) {
        <div class="absolute inset-0 bg-white/40 dark:bg-white/20 pointer-events-none z-30 transition-opacity duration-200 animate-pulse"></div>
      }

      <!-- Toast Feedback -->
      @if (toastMessage()) {
        <div class="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-900/95 dark:bg-slate-800/95 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-2xl border border-slate-700/80 flex items-center gap-2.5 z-30 backdrop-blur-xl animate-bounce">
          <div class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <mat-icon class="scale-75">check_circle</mat-icon>
          </div>
          <span>{{ toastMessage() }}</span>
        </div>
      }

      @if (store.settings().interactionMode === 'add-hole' && activeHoleCoords()) {
        <div class="absolute bottom-6 left-6 md:left-80 bg-white/95 dark:bg-slate-900/90 text-slate-800 dark:text-white px-3 py-2 rounded-xl text-xs font-mono shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1 pointer-events-none backdrop-blur-md transition-opacity z-10">
          <div class="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-bold uppercase tracking-wider mb-0.5">Hole Position</div>
          <div><span class="text-slate-400 dark:text-slate-500">X:</span> {{ activeHoleCoords()!.x.toFixed(1) }} mm</div>
          <div><span class="text-slate-400 dark:text-slate-500">Y:</span> {{ activeHoleCoords()!.y.toFixed(1) }} mm</div>
        </div>
      }

      @if (store.settings().interactionMode === 'add-hole' || store.settings().interactionMode === 'move-led') {
        <div class="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <button (click)="store.updateSettings({ interactionMode: 'view' })" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-bold shadow-xl shadow-blue-500/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer">
            <mat-icon class="scale-110">check</mat-icon>
            Done
          </button>
        </div>
      }

      <!-- Interactive View Cube -->
      @if (isBrowser) {
        <div class="absolute top-20 w-14 h-14 select-none z-10 transition-all duration-300 ease-in-out cursor-grab active:cursor-grabbing" 
             [class]="store.inspectorCollapsed() ? 'right-20' : 'right-4 md:right-[400px] lg:right-[440px]'"
             style="perspective: 800px;"
             (pointerdown)="onCubePointerDown($event)"
             (pointermove)="onCubePointerMove($event)"
             (pointerup)="onCubePointerUp($event)"
             (pointercancel)="onCubePointerUp($event)">
          <div #viewCube class="w-full h-full relative pointer-events-none" style="transform-style: preserve-3d;">
            <!-- Front -->
            <button (click)="onCubeFaceClick('front', $event)" class="pointer-events-auto absolute inset-0 bg-slate-100/90 dark:bg-slate-700/90 border border-slate-300 dark:border-slate-500 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-600/50 hover:text-emerald-700 dark:hover:text-emerald-100 transition-colors cursor-pointer w-full h-full" style="transform: translateZ(28px); backface-visibility: hidden;">Front</button>
            <!-- Back -->
            <button (click)="onCubeFaceClick('back', $event)" class="pointer-events-auto absolute inset-0 bg-slate-100/90 dark:bg-slate-700/90 border border-slate-300 dark:border-slate-500 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-600/50 hover:text-emerald-700 dark:hover:text-emerald-100 transition-colors cursor-pointer w-full h-full" style="transform: rotateY(180deg) translateZ(28px); backface-visibility: hidden;">Back</button>
            <!-- Right -->
            <button (click)="onCubeFaceClick('right', $event)" class="pointer-events-auto absolute inset-0 bg-slate-100/90 dark:bg-slate-700/90 border border-slate-300 dark:border-slate-500 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-600/50 hover:text-emerald-700 dark:hover:text-emerald-100 transition-colors cursor-pointer w-full h-full" style="transform: rotateY(90deg) translateZ(28px); backface-visibility: hidden;">Right</button>
            <!-- Left -->
            <button (click)="onCubeFaceClick('left', $event)" class="pointer-events-auto absolute inset-0 bg-slate-100/90 dark:bg-slate-700/90 border border-slate-300 dark:border-slate-500 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-600/50 hover:text-emerald-700 dark:hover:text-emerald-100 transition-colors cursor-pointer w-full h-full" style="transform: rotateY(-90deg) translateZ(28px); backface-visibility: hidden;">Left</button>
            <!-- Top -->
            <button (click)="onCubeFaceClick('top', $event)" class="pointer-events-auto absolute inset-0 bg-slate-100/90 dark:bg-slate-700/90 border border-slate-300 dark:border-slate-500 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-600/50 hover:text-emerald-700 dark:hover:text-emerald-100 transition-colors cursor-pointer w-full h-full" style="transform: rotateX(90deg) translateZ(28px); backface-visibility: hidden;">Top</button>
            <!-- Bottom -->
            <button (click)="onCubeFaceClick('bottom', $event)" class="pointer-events-auto absolute inset-0 bg-slate-100/90 dark:bg-slate-700/90 border border-slate-300 dark:border-slate-500 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-600/50 hover:text-emerald-700 dark:hover:text-emerald-100 transition-colors cursor-pointer w-full h-full" style="transform: rotateX(-90deg) translateZ(28px); backface-visibility: hidden;">Bottom</button>
          </div>
        </div>
      }

      @if (activeLetter()) {
        <div class="absolute bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-3 z-20 transform -translate-x-1/2 mt-4 transition-all duration-150 animate-in fade-in zoom-in-95 pointer-events-auto"
             [style.left.%]="activeLetter()!.x"
             [style.top.%]="activeLetter()!.y">
             
          <div class="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 dark:bg-slate-900/95 border-l border-t border-slate-200 dark:border-slate-700 rotate-45"></div>

          <div class="relative flex flex-col items-center gap-1.5 min-w-[120px]">
            <div class="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider text-center">
              Target: <span class="text-blue-600 dark:text-blue-400">"{{ activeLetter()!.char }}"</span>
            </div>
            
            <div class="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

            <div class="grid grid-cols-2 gap-x-4 gap-y-1 w-full text-[11px] font-mono whitespace-nowrap">
              <div class="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>W:</span>
                <span class="font-bold text-slate-700 dark:text-slate-200">{{ activeLetter()!.width.toFixed(1) }}</span>
              </div>
              <div class="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>H:</span>
                <span class="font-bold text-slate-700 dark:text-slate-200">{{ activeLetter()!.height.toFixed(1) }}</span>
              </div>
              <div class="col-span-2 flex justify-between items-center text-slate-500 dark:text-slate-400 pt-0.5 mt-0.5 border-t border-slate-100 dark:border-slate-800">
                <span>Depth:</span>
                <span class="font-bold text-slate-700 dark:text-slate-200">{{ activeLetter()!.depth.toFixed(1) }} mm</span>
              </div>
            </div>

            @if (activeLetter()!.charIndex !== undefined) {
              <div class="w-full pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1">
                <div class="flex items-center justify-between w-full text-[10px] text-slate-500 dark:text-slate-400 font-sans font-semibold">
                  <span>Kerning:</span>
                  <span class="font-mono text-blue-600 dark:text-blue-400 font-bold">
                    {{ (store.settings().customKerning?.[activeLetter()!.charIndex!] || 0) > 0 ? '+' : '' }}{{ store.settings().customKerning?.[activeLetter()!.charIndex!] || 0 }} mm
                  </span>
                </div>
                <div class="flex items-center justify-center gap-1 w-full">
                  <button (click)="store.nudgeLetterKerning(activeLetter()!.charIndex!, -5)"
                          title="Move 5mm Left"
                          class="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">-5</button>
                  <button (click)="store.nudgeLetterKerning(activeLetter()!.charIndex!, -1)"
                          title="Move 1mm Left"
                          class="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">-1</button>
                  @if (store.settings().customKerning?.[activeLetter()!.charIndex!]) {
                    <button (click)="store.setLetterKerning(activeLetter()!.charIndex!, 0)"
                            title="Reset Spacing"
                            class="px-1.5 py-0.5 text-[9px] font-sans font-bold bg-amber-100 dark:bg-amber-950/50 hover:bg-amber-200 text-amber-700 dark:text-amber-300 rounded transition-colors cursor-pointer">Reset</button>
                  }
                  <button (click)="store.nudgeLetterKerning(activeLetter()!.charIndex!, 1)"
                          title="Move 1mm Right"
                          class="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">+1</button>
                  <button (click)="store.nudgeLetterKerning(activeLetter()!.charIndex!, 5)"
                          title="Move 5mm Right"
                          class="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">+5</button>
                </div>
              </div>
            }
          </div>
        </div>
      }

    }
  `
})
export class Viewport3DComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('viewCube', { static: false }) viewCube?: ElementRef<HTMLDivElement>;
  
  store = inject(AppStore);
  fontLoader = inject(FontLoaderService);
  platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  activeHoleCoords = signal<{x: number, y: number} | null>(null);
  isFlashing = signal<boolean>(false);
  toastMessage = signal<string | null>(null);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private perspectiveCamera!: THREE.PerspectiveCamera;
  private orthographicCamera!: THREE.OrthographicCamera;
  private orthoFrustumSize = 1000;
  private currentCameraType: 'perspective' | 'orthographic' = 'perspective';
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  
  private animationId = 0;
  private font: Font | null = null;
  private loadedFonts = new Map<string, Font>();
  private currentFontId = '';
  private lettersGroup = new THREE.Group();
  private pivotGroup = new THREE.Group();
  private mountingGroup = new THREE.Group();
  public isWireframe = signal(false);
  
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private holePreview!: THREE.Mesh;
  private buildPlateMesh!: THREE.Mesh;
  private wallMesh!: THREE.Mesh;
  private ambientLight!: THREE.AmbientLight;
  private dirLight!: THREE.DirectionalLight;
  private ledGlowLight!: THREE.PointLight;
  private ledGlowLightLeft!: THREE.PointLight;
  private ledGlowLightRight!: THREE.PointLight;
  private glowMesh: THREE.Mesh | null = null;
  private wiringGroup = new THREE.Group();
  
  private export2DShapes: { 
    char?: string; 
    letterIndex?: number;
    acrylic: THREE.Shape[]; 
    base: THREE.Shape[]; 
    offsetX: number; 
    offsetY: number; 
    scaleX: number; 
    scaleY: number;
    rotation?: number;
  }[] = [];
  private backplate2DShapes: THREE.Shape[] = [];

  private lastActiveTab = '';
  private prevInteractionMode: 'view' | 'add-hole' | 'move-led' = 'view';
  private lastGeometryKey = '';

  private isDraggingLed = false;
  private activeLedId: string | null = null;
  private hoveredLedMesh: THREE.Mesh | null = null;
  private currentAutoLedsCache: { id: string, x: number, y: number }[] = [];
  private lastLedClickTime = 0;
  private lastLedClickId: string | null = null;
  private selectedObjectGroup: THREE.Object3D | null = null;
  private selectionBoxHelper: THREE.BoxHelper | null = null;

  private lastStyle = '';

  activeLetter = signal<{char: string, width: number, height: number, depth: number, x: number, y: number, charIndex?: number} | null>(null);

  private cameraAnim: {
    active: boolean;
    startPos: THREE.Vector3;
    targetPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    startTime: number;
    duration: number;
  } | null = null;

  constructor() {
    effect(() => {
      const isDark = this.store.isDarkMode();
      const activeTab = this.store.activeTab();
      const isSimulation = activeTab === 'simulation';
      const settings = this.store.settings();
      
      if (this.lastStyle && settings.style !== this.lastStyle) {
        this.lastStyle = settings.style;
        if (this.isBrowser && this.controls) {
          setTimeout(() => {
            this.syncCameraType(this.store.settings().cameraType || 'perspective', true);
          }, 80);
        }
      } else {
        this.lastStyle = settings.style;
      }

      if (this.lastActiveTab !== activeTab) {
        const isTabSwitch = this.lastActiveTab !== '';
        this.lastActiveTab = activeTab;
        if (isTabSwitch && this.isBrowser && this.controls) {
          setTimeout(() => {
            this.syncCameraType(this.store.settings().cameraType || 'perspective', true);
          });
        }
      }

      if (this.scene) {
        const ambientVal = Math.min(1, Math.max(0, settings.roomAmbient));

        if (isSimulation) {
          // Dynamic simulation room background based on environment lighting intensity
          const bgVal = Math.round(5 + ambientVal * 180);
          const bgBlue = Math.round(8 + ambientVal * 195);
          this.scene.background = new THREE.Color(`rgb(${bgVal}, ${bgVal}, ${bgBlue})`);

          if (this.ambientLight) this.ambientLight.intensity = Math.max(0.01, ambientVal * 1.2);
          if (this.dirLight) this.dirLight.intensity = Math.max(0.01, ambientVal * 1.5);
          if (this.wallMesh) {
            this.wallMesh.visible = true;
            this.wallMesh.position.z = -settings.wallGap;
          }
          if (this.buildPlateMesh) this.buildPlateMesh.visible = false;
          const axes = this.scene.children.find(c => c.type === 'AxesHelper');
          if (axes) axes.visible = false;
          if (this.pivotGroup) this.pivotGroup.rotation.x = 0; // Stand up!
          
          if (settings.ledEnabled) {
            const box = new THREE.Box3().setFromObject(this.lettersGroup);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            if (!box.isEmpty()) {
              box.getSize(size);
              box.getCenter(center);
            } else {
              size.set(300, 150, 40);
              center.set(0, 0, 0);
            }

            const color = new THREE.Color(settings.ledColor);
            const zPos = -settings.wallGap / 2;

            [this.ledGlowLight, this.ledGlowLightLeft, this.ledGlowLightRight].forEach((light, i) => {
              if (light) {
                light.color.copy(color);
                light.distance = settings.ledSpread;
                light.intensity = settings.ledIntensity;
                let xOffset = 0;
                if (i === 1) xOffset = -size.x * 0.35;
                if (i === 2) xOffset = size.x * 0.35;
                light.position.set(center.x + xOffset, center.y, zPos);
              }
            });

            if (!this.glowMesh) {
              this.createGlowMesh();
            }

            if (this.glowMesh) {
              this.glowMesh.visible = true;
              this.glowMesh.position.set(center.x, center.y, -settings.wallGap + 0.5);
              const spreadScale = Math.max(size.x, size.y) + (settings.ledSpread / 10);
              this.glowMesh.scale.set(size.x + spreadScale * 0.6, size.y + spreadScale * 0.6, 1);
              (this.glowMesh.material as THREE.MeshBasicMaterial).color.copy(color);
              (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = Math.min(0.95, settings.ledIntensity / 35);
            }
          } else {
            [this.ledGlowLight, this.ledGlowLightLeft, this.ledGlowLightRight].forEach(light => {
              if (light) light.intensity = 0;
            });
            if (this.glowMesh) this.glowMesh.visible = false;
          }
        } else {
          this.scene.background = new THREE.Color(isDark ? '#0f172a' : '#eef2f5');
          if (this.ambientLight) this.ambientLight.intensity = Math.max(0.1, 0.2 + ambientVal * 1.0);
          if (this.dirLight) this.dirLight.intensity = Math.max(0.1, 0.3 + ambientVal * 1.2);
          if (this.wallMesh) this.wallMesh.visible = false;
          if (this.buildPlateMesh) this.buildPlateMesh.visible = settings.showBuildPlate;
          const axes = this.scene.children.find(c => c.type === 'AxesHelper');
          if (axes) axes.visible = true;
          if (this.pivotGroup) this.pivotGroup.rotation.x = -Math.PI / 2; // Lay flat
          [this.ledGlowLight, this.ledGlowLightLeft, this.ledGlowLightRight].forEach(light => {
            if (light) light.intensity = 0;
          });
          if (this.glowMesh) this.glowMesh.visible = false;
        }
        
        const oldGrid = this.scene.children.find(c => c.type === 'GridHelper');
        if (oldGrid) {
          this.scene.remove(oldGrid);
          if (!isSimulation) {
             const gridHelper = new THREE.GridHelper(2000, 40, isDark ? '#4338ca' : '#a5b4fc', isDark ? '#334155' : '#d1d5db');
             gridHelper.material.opacity = 0.4;
             gridHelper.material.transparent = true;
             this.scene.add(gridHelper);
          }
        }
        
        // Update emissive on acrylic materials
        this.updateEmissiveMaterials();
        this.updateWiringHarness();
      }
    });

    effect(() => {
      if (!this.isBrowser) return;
      const settings = this.store.settings();
      const isSimulation = this.store.activeTab() === 'simulation';

      if (settings.cameraType) {
        this.syncCameraType(settings.cameraType);
      }

      if (this.controls) {
        const isInteractive = settings.interactionMode === 'add-hole' || settings.interactionMode === 'move-led';
        this.controls.enableRotate = !isInteractive;
        this.controls.autoRotate = settings.autoRotate && !isInteractive;
        this.controls.autoRotateSpeed = settings.autoRotateSpeed || 2.0;

        if (settings.interactionMode === 'add-hole' && this.prevInteractionMode !== 'add-hole') {
          this.store.updateSettings({ cameraType: 'orthographic' });
          this.store.updateLayer('acrylic', false);
          this.setTopView();
        } else if (settings.interactionMode === 'view' && this.prevInteractionMode === 'add-hole') {
          // Restore free-look 3D camera
          this.store.updateSettings({ cameraType: 'perspective' });
          this.store.updateLayer('acrylic', true);
          
          // Reset camera up vector to standard Y-up to prevent gimbal locking in OrbitControls
          this.perspectiveCamera.up.set(0, 1, 0);
          this.orthographicCamera.up.set(0, 1, 0);
          this.camera.up.set(0, 1, 0);
          
          this.syncCameraType('perspective', true);
          this.controls.enabled = true;
          this.controls.enableRotate = true;
          this.controls.update();
        }
      }
      this.prevInteractionMode = settings.interactionMode;

      if (this.buildPlateMesh) {
        this.buildPlateMesh.visible = settings.showBuildPlate && !isSimulation;
        if (settings.showBuildPlate) {
          this.buildPlateMesh.geometry.dispose();
          const newGeom = new THREE.PlaneGeometry(settings.buildPlateWidth, settings.buildPlateHeight);
          this.buildPlateMesh.geometry = newGeom;
          
          const line = this.buildPlateMesh.children[0] as THREE.LineSegments;
          if (line) {
            line.geometry.dispose();
            line.geometry = new THREE.EdgesGeometry(newGeom);
          }
        }
      }

      const desiredFont = settings.inputSource === 'neon-flex' ? (settings.neonFont || 'Pacifico') : settings.font;
      if ((settings.inputSource === 'text' || settings.inputSource === 'neon-flex') && desiredFont && desiredFont !== this.currentFontId) {
        this.loadFont(desiredFont);
      } else if (this.font || settings.inputSource === 'svg') {
        const geomProps: Partial<ProjectSettings> = { ...settings };
        delete geomProps.cameraType;
        delete geomProps.autoRotate;
        delete geomProps.autoRotateSpeed;
        delete geomProps.interactionMode;
        const geomKey = JSON.stringify(geomProps);

        if (geomKey !== this.lastGeometryKey) {
          this.lastGeometryKey = geomKey;
          this.rebuildGeometry(settings);
        }
      }
    });

    if (this.isBrowser) {
      window.addEventListener('export-stl', this.exportSTL);
      window.addEventListener('export-svg-acrylic', this.exportSVGAcrylic);
      window.addEventListener('export-svg-base', this.exportSVGBase);
      window.addEventListener('export-svg-backplate', this.exportSVGBackplate);
      window.addEventListener('export-snapshot', this.takeSnapshot);
      window.addEventListener('generate-auto-holes', this.generateAutoHoles);
      window.addEventListener('set-top-view', this.setTopViewEvent);
      window.addEventListener('set-mounting-view', this.onSetMountingViewEvent);
      window.addEventListener('request-template-data', this.dispatchTemplateData);
    }
  }

  private setTopViewEvent = () => {
    this.store.updateSettings({ cameraType: 'orthographic' });
    this.store.updateLayer('acrylic', false);
    this.setTopView();
  };

  private generateAutoHoles = () => {
    const holes = calculateAutoHoles(this.store.settings(), this.font);
    this.store.updateSettings({
      customHoles: holes,
      cameraType: 'orthographic'
    });
    this.store.updateLayer('acrylic', false);
    this.setTopView();
  };

  ngAfterViewInit() {
    if (!this.isBrowser) return;
    this.initThree();
    this.loadFont();
    this.animate();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('pointerup', this.onPointerUp);
    
    const container = this.canvasContainer.nativeElement;
    container.addEventListener('pointerdown', this.onPointerDown);
    container.addEventListener('pointermove', this.onPointerMove);
    container.addEventListener('contextmenu', this.onContextMenu);
  }

  ngOnDestroy() {
    if (!this.isBrowser) return;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('export-stl', this.exportSTL);
    window.removeEventListener('export-svg-acrylic', this.exportSVGAcrylic);
    window.removeEventListener('export-svg-base', this.exportSVGBase);
    window.removeEventListener('export-svg-backplate', this.exportSVGBackplate);
    window.removeEventListener('export-snapshot', this.takeSnapshot);
    window.removeEventListener('generate-auto-holes', this.generateAutoHoles);
    window.removeEventListener('set-top-view', this.setTopViewEvent);
    window.removeEventListener('set-mounting-view', this.onSetMountingViewEvent);
    window.removeEventListener('request-template-data', this.dispatchTemplateData);
    
    const container = this.canvasContainer.nativeElement;
    container.removeEventListener('pointerdown', this.onPointerDown);
    container.removeEventListener('pointermove', this.onPointerMove);
    container.removeEventListener('contextmenu', this.onContextMenu);
    
    this.renderer.dispose();
  }

  private onContextMenu = (event: MouseEvent) => {
    if (this.store.settings().interactionMode === 'move-led' || this.hoveredLedMesh || this.isDraggingLed) {
      event.preventDefault();
    }
  };

  private updateHolePreviewGeometry() {
    if (!this.holePreview) return;
    const s = this.store.settings();
    const shape = this.createHoleShape({
      x: 0,
      y: 0,
      r: s.holeRadius,
      type: s.mountingHoleType,
      slotWidth: s.keyholeSlotWidth,
      slotHeight: s.keyholeSlotHeight,
      rotation: s.mountingHoleType === 'oval' ? (s.ovalRotation ?? 0) : s.keyholeDirection,
      width: s.ovalHoleWidth,
      height: s.ovalHoleHeight,
      cornerRadius: s.ovalCornerRadius
    });

    if (this.holePreview.geometry) {
      this.holePreview.geometry.dispose();
    }

    this.holePreview.geometry = new THREE.ShapeGeometry([shape]);
    this.holePreview.scale.set(1, 1, 1);
  }

  private onPointerMove = (event: PointerEvent) => {
    if (!this.isBrowser) return;
    const container = this.canvasContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

    // Handle active dragging of an LED module
    if (this.isDraggingLed && this.activeLedId) {
      if (this.controls) this.controls.enabled = false;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      this.lettersGroup.updateMatrixWorld(true);
      const localPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2);
      const worldPlane = localPlane.clone().applyMatrix4(this.lettersGroup.matrixWorld);
      const targetWorldPt = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(worldPlane, targetWorldPt);

      if (targetWorldPt) {
        const localPt = this.lettersGroup.worldToLocal(targetWorldPt.clone());
        this.store.updateLedPosition(this.activeLedId, localPt.x, localPt.y);
      }
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check if hovering over any LED module
    const intersectsWiring = this.raycaster.intersectObjects(this.wiringGroup.children, true);
    const ledHit = intersectsWiring.find(i => i.object.userData && i.object.userData['isLedModule']);

    if (ledHit) {
      container.style.cursor = 'grab';
      if (this.controls) this.controls.enabled = false;
      if (this.hoveredLedMesh !== ledHit.object) {
        if (this.hoveredLedMesh) {
          this.hoveredLedMesh.scale.set(1, 1, 1);
        }
        this.hoveredLedMesh = ledHit.object as THREE.Mesh;
        this.hoveredLedMesh.scale.set(1.35, 1.35, 1.35);
      }
    } else {
      if (this.hoveredLedMesh) {
        this.hoveredLedMesh.scale.set(1, 1, 1);
        this.hoveredLedMesh = null;
      }

      const mode = this.store.settings().interactionMode;
      if (mode === 'add-hole') {
        if (this.controls) this.controls.enabled = false;
        container.style.cursor = 'crosshair';
        const intersects = this.raycaster.intersectObject(this.lettersGroup, true);
        if (intersects.length > 0) {
          const localPt = this.lettersGroup.worldToLocal(intersects[0].point.clone());
          this.updateHolePreviewGeometry();
          this.holePreview.position.copy(localPt);
          this.holePreview.position.z += 1.0; 
          this.holePreview.visible = true;
          this.activeHoleCoords.set({ x: localPt.x, y: localPt.y });
        } else {
          this.holePreview.visible = false;
          this.activeHoleCoords.set(null);
        }
      } else if (mode === 'move-led') {
        if (this.controls) this.controls.enabled = false;
        container.style.cursor = 'crosshair';
        this.holePreview.visible = false;
        this.activeHoleCoords.set(null);
      } else {
        if (this.controls) this.controls.enabled = true;
        container.style.cursor = 'default';
        this.holePreview.visible = false;
        this.activeHoleCoords.set(null);
      }
    }
  };

  private onPointerDown = (event: PointerEvent) => {
    if (!this.isBrowser) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check interaction with LED modules
    const intersectsWiring = this.raycaster.intersectObjects(this.wiringGroup.children, true);
    const ledHit = intersectsWiring.find(i => i.object.userData && i.object.userData['isLedModule']);

    if (ledHit) {
      event.stopPropagation();
      if (this.controls) this.controls.enabled = false;
      const ledId = ledHit.object.userData['ledId'];
      
      // Delete module on right click (button === 2) or Alt+click
      if (event.button === 2 || event.altKey) {
        event.preventDefault();
        if (!this.store.settings().customLeds) {
          this.store.setCustomLeds([...this.currentAutoLedsCache]);
        }
        this.store.deleteLed(ledId);
        return;
      }

      // Start drag on left click
      if (event.button === 0) {
        const now = Date.now();
        if (this.lastLedClickId === ledId && now - this.lastLedClickTime < 400) {
          // Double click detected
          if (!this.store.settings().customLeds) {
            this.store.setCustomLeds([...this.currentAutoLedsCache]);
          }
          this.store.deleteLed(ledId);
          this.lastLedClickTime = 0;
          this.lastLedClickId = null;
          this.isDraggingLed = false;
          this.activeLedId = null;
          return;
        }

        this.lastLedClickTime = now;
        this.lastLedClickId = ledId;

        if (!this.store.settings().customLeds) {
          this.store.setCustomLeds([...this.currentAutoLedsCache]);
        }
        this.isDraggingLed = true;
        this.activeLedId = ledId;
        return;
      }
    }

    if (this.store.settings().interactionMode === 'move-led') {
      event.stopPropagation();
      if (this.controls) this.controls.enabled = false;
      if (event.button === 0) {
        const intersects = this.raycaster.intersectObject(this.lettersGroup, true);
        if (intersects.length > 0) {
          const pt = this.lettersGroup.worldToLocal(intersects[0].point.clone());
          if (!this.store.settings().customLeds) {
            this.store.setCustomLeds([...this.currentAutoLedsCache]);
          }
          this.store.addCustomLed(pt.x, pt.y);
        }
      }
      return;
    }

    if (this.store.settings().interactionMode === 'add-hole') {
      event.stopPropagation();
      if (this.controls) this.controls.enabled = false;
      if (event.button === 0) {
        const intersects = this.raycaster.intersectObject(this.lettersGroup, true);
        if (intersects.length > 0) {
          const pt = this.lettersGroup.worldToLocal(intersects[0].point.clone());
          const s = this.store.settings();
          const currentHoles = s.customHoles || [];
          const newHole: CustomHole = {
            id: `hole-${Date.now()}`,
            x: pt.x,
            y: pt.y,
            r: s.holeRadius,
            type: s.mountingHoleType,
            slotWidth: s.keyholeSlotWidth,
            slotHeight: s.keyholeSlotHeight,
            rotation: s.mountingHoleType === 'oval' ? (s.ovalRotation ?? 0) : s.keyholeDirection,
            width: s.ovalHoleWidth,
            height: s.ovalHoleHeight,
            cornerRadius: s.ovalCornerRadius
          };
          this.store.updateSettings({
            customHoles: [...currentHoles, newHole]
          });
        }
      }
      return;
    }

    // Default viewing mode - Letter & Vector Object Selection
    if (this.store.settings().interactionMode === 'view' && event.button === 0) {
      const intersects = this.raycaster.intersectObject(this.lettersGroup, true);
      let hitLetter = false;

      if (intersects.length > 0) {
        let parent = intersects[0].object.parent;
        while (parent && !parent.userData['isLetterGroup']) {
          parent = parent.parent;
        }

        if (parent && parent.userData['isLetterGroup']) {
          const char = parent.userData['char'];
          
          this.selectedObjectGroup = parent;
          if (this.selectionBoxHelper) {
            this.scene.remove(this.selectionBoxHelper);
            this.selectionBoxHelper.dispose();
            this.selectionBoxHelper = null;
          }
          this.selectionBoxHelper = new THREE.BoxHelper(parent, 0x3b82f6);
          this.scene.add(this.selectionBoxHelper);

          // Calculate bounds (World X = Width, World Z = Height, World Y = Depth)
          const box = new THREE.Box3().setFromObject(parent);
          const width = box.max.x - box.min.x;
          const height = box.max.z - box.min.z;
          const depth = box.max.y - box.min.y;
          
          // Calculate center for overlay positioning
          const center = new THREE.Vector3();
          box.getCenter(center);
          
          // Project to 2D screen space
          const projected = center.clone().project(this.camera);
          
          const charIndex = parent.userData['charIndex'];
          this.activeLetter.set({
            char,
            width,
            height,
            depth,
            x: (projected.x * .5 + .5) * 100,
            y: (projected.y * -.5 + .5) * 100,
            charIndex: typeof charIndex === 'number' ? charIndex : undefined
          });
          
          hitLetter = true;
        }
      }

      if (!hitLetter) {
        if (this.selectionBoxHelper) {
          this.scene.remove(this.selectionBoxHelper);
          this.selectionBoxHelper.dispose();
          this.selectionBoxHelper = null;
        }
        this.selectedObjectGroup = null;
        this.activeLetter.set(null);
      }
    }
  };

  private onPointerUp = () => {
    if (this.isDraggingLed) {
      this.isDraggingLed = false;
      this.activeLedId = null;
    }
    const mode = this.store.settings().interactionMode;
    if (this.controls) {
      if (mode !== 'move-led' && mode !== 'add-hole') {
        this.controls.enabled = true;
        this.controls.enableRotate = true;
      } else {
        this.controls.enabled = false;
        this.controls.enableRotate = false;
      }
    }
  };

  private updateEmissiveMaterials() {
    if (!this.lettersGroup) return;
    const isSimulation = this.store.activeTab() === 'simulation';
    const settings = this.store.settings();
    const diff = this.store.getDiffusionAnalysis();
    
    this.lettersGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Find acrylic materials and update them
        // If it's a multi-material, traverse materials
        const updateMaterial = (mat: THREE.Material) => {
          if (mat && mat.userData && mat.userData['isAcrylic']) {
            const meshMat = mat as THREE.MeshStandardMaterial;
            if (isSimulation && settings.ledEnabled) {
              if (settings.showDiffusionHeatmap) {
                // Color acrylic face according to diffusion / hotspot severity:
                // Optimal (emerald/cyan glow), Warning (amber/yellow glow), Critical (fiery red hotspot glow)
                if (diff.hotspotStatus === 'critical') {
                  meshMat.emissive.setHex(0xff2200);
                  meshMat.emissiveIntensity = Math.max(2, settings.emissiveIntensity * 1.5);
                } else if (diff.hotspotStatus === 'warning') {
                  meshMat.emissive.setHex(0xffaa00);
                  meshMat.emissiveIntensity = Math.max(1.5, settings.emissiveIntensity * 1.2);
                } else if (diff.hotspotStatus === 'good') {
                  meshMat.emissive.setHex(0x00e5ff);
                  meshMat.emissiveIntensity = Math.max(1, settings.emissiveIntensity);
                } else {
                  // Optimal
                  meshMat.emissive.setHex(0x10b981);
                  meshMat.emissiveIntensity = Math.max(1, settings.emissiveIntensity);
                }
              } else {
                meshMat.emissive.set(settings.ledColor);
                meshMat.emissiveIntensity = settings.emissiveIntensity;
              }
            } else {
              meshMat.emissive.setHex(0x000000);
              meshMat.emissiveIntensity = 0;
            }
            meshMat.needsUpdate = true;
          }
        };

        if (Array.isArray(child.material)) {
          child.material.forEach(updateMaterial);
        } else {
          updateMaterial(child.material);
        }
      }
    });
  }

  private createGlowMesh() {
    if (this.glowMesh) return;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.glowMesh = new THREE.Mesh(geo, mat);
    this.glowMesh.visible = false;
    this.pivotGroup.add(this.glowMesh);
  }

  private syncCameraType(targetType: 'perspective' | 'orthographic', force = false) {
    if (!this.controls || !this.renderer) return;

    const isSimulation = this.store.activeTab() === 'simulation';
    const typeChanged = force || this.currentCameraType !== targetType ||
      (targetType === 'perspective' && !(this.camera instanceof THREE.PerspectiveCamera)) ||
      (targetType === 'orthographic' && !(this.camera instanceof THREE.OrthographicCamera));

    if (!typeChanged) return;

    const container = this.canvasContainer?.nativeElement;
    const width = container?.clientWidth || 1280;
    const height = container?.clientHeight || 720;
    const aspect = width / height;

    // Calculate bounding center and dimensions of letters
    const box = new THREE.Box3().setFromObject(this.lettersGroup);
    let targetX = 0, targetY = 0, targetZ = 0;
    let sizeX = 300, sizeY = 150, sizeZ = 40;

    if (!box.isEmpty()) {
      const center = new THREE.Vector3();
      box.getCenter(center);
      targetX = center.x;
      targetY = center.y;
      targetZ = center.z;

      const size = new THREE.Vector3();
      box.getSize(size);
      sizeX = size.x;
      sizeY = size.y;
      sizeZ = size.z;
    }

    const maxDim = Math.max(sizeX, sizeY, sizeZ, 200);

    if (targetType === 'orthographic') {
      this.orthoFrustumSize = Math.max(250, maxDim * 1.35);
      this.orthographicCamera.left = -aspect * this.orthoFrustumSize / 2;
      this.orthographicCamera.right = aspect * this.orthoFrustumSize / 2;
      this.orthographicCamera.top = this.orthoFrustumSize / 2;
      this.orthographicCamera.bottom = -this.orthoFrustumSize / 2;

      if (isSimulation) {
        // Front elevation view on wall (standing up, facing +Z)
        this.orthographicCamera.up.set(0, 1, 0);
        this.orthographicCamera.position.set(targetX, targetY, targetZ + 1000);
      } else {
        // Top blueprint view on build plate (laying flat)
        this.orthographicCamera.up.set(0, 0, -1);
        this.orthographicCamera.position.set(targetX, targetY + 1000, targetZ);
      }
      this.orthographicCamera.updateProjectionMatrix();
      this.camera = this.orthographicCamera;
    } else {
      this.perspectiveCamera.aspect = aspect;
      this.perspectiveCamera.up.set(0, 1, 0);

      if (isSimulation) {
        // Front 3D angled view on wall
        const dist = Math.max(500, maxDim * 1.8);
        this.perspectiveCamera.position.set(targetX, targetY + dist * 0.08, targetZ + dist);
      } else {
        // Angled 3D view on build plate
        const dist = Math.max(600, maxDim * 2.0);
        this.perspectiveCamera.position.set(targetX, targetY + dist * 0.35, targetZ + dist * 0.9);
      }
      this.perspectiveCamera.updateProjectionMatrix();
      this.camera = this.perspectiveCamera;
    }

    this.currentCameraType = targetType;
    this.controls.object = this.camera;
    this.controls.target.set(targetX, targetY, targetZ);
    this.controls.update();
  }

  private initThree() {
    const container = this.canvasContainer.nativeElement;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.store.isDarkMode() ? '#0f172a' : '#eef2f5');

    const aspect = container.clientWidth / container.clientHeight;
    this.perspectiveCamera = new THREE.PerspectiveCamera(35, aspect, 1, 10000);
    this.perspectiveCamera.position.set(0, 400, 1200);

    const frustumSize = 1000;
    this.orthoFrustumSize = frustumSize;
    this.orthographicCamera = new THREE.OrthographicCamera(
      -aspect * frustumSize / 2,
      aspect * frustumSize / 2,
      frustumSize / 2,
      -frustumSize / 2,
      1,
      10000
    );
    this.orthographicCamera.position.set(0, 400, 1200);

    const initialCameraType = this.store.settings().cameraType || 'perspective';
    this.currentCameraType = initialCameraType;
    this.camera = initialCameraType === 'orthographic' ? this.orthographicCamera : this.perspectiveCamera;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    // Map Right-click to rotate, Middle to pan to simulate CAD
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.PAN
    };

    // Grid and Axes
    const isDark = this.store.isDarkMode(); const gridHelper = new THREE.GridHelper(2000, 40, isDark ? '#4338ca' : '#a5b4fc', isDark ? '#334155' : '#d1d5db');
    gridHelper.material.opacity = 0.4;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(1000);
    this.scene.add(axesHelper);

    // Simulation Wall
    const { texture: brickTex, normalMap: brickNormal } = createBrickTextures();
    const wallGeo = new THREE.PlaneGeometry(5000, 5000);
    const wallMat = new THREE.MeshStandardMaterial({ 
      color: '#ffffff', 
      map: brickTex || null,
      normalMap: brickNormal || null,
      roughness: 0.9, 
      metalness: 0.0 
    });
    this.wallMesh = new THREE.Mesh(wallGeo, wallMat);
    // Position wall behind everything
    this.wallMesh.position.z = -50;
    this.wallMesh.visible = false;
    this.pivotGroup.add(this.wallMesh);
    
    // LED Glow Lights (multi-point distribution)
    this.ledGlowLight = new THREE.PointLight(0xffffff, 0, 3500, 1.2);
    this.ledGlowLightLeft = new THREE.PointLight(0xffffff, 0, 3500, 1.2);
    this.ledGlowLightRight = new THREE.PointLight(0xffffff, 0, 3500, 1.2);
    this.pivotGroup.add(this.ledGlowLight);
    this.pivotGroup.add(this.ledGlowLightLeft);
    this.pivotGroup.add(this.ledGlowLightRight);

    this.createGlowMesh();
    this.pivotGroup.add(this.wiringGroup);


    // Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.dirLight.position.set(200, 500, 300);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.scene.add(this.dirLight);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
    backLight.position.set(-200, -500, -300);
    this.scene.add(backLight);

    const previewGeom = new THREE.RingGeometry(0.85, 1.0, 32);
    this.holePreview = new THREE.Mesh(
      previewGeom, 
      new THREE.MeshBasicMaterial({color: 0xef4444, transparent: true, opacity: 0.9, side: THREE.DoubleSide})
    );
    this.holePreview.visible = false;
    this.lettersGroup.add(this.holePreview);

    this.pivotGroup.rotation.x = -Math.PI / 2;
    this.scene.add(this.pivotGroup);
    this.pivotGroup.add(this.mountingGroup);
    this.pivotGroup.add(this.lettersGroup);

    // Build Plate
    this.buildPlateMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 220),
      new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.1, side: THREE.DoubleSide })
    );
    this.buildPlateMesh.position.z = -0.5; // Slightly below zero to prevent z-fighting with the base of the letters
    this.pivotGroup.add(this.buildPlateMesh);
    
    // Add a grid outline to the build plate
    const edges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(220, 220));
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial( { color: 0x3b82f6, linewidth: 2 } ));
    this.buildPlateMesh.add(line);
  }

  private loadFont(fontId: string = this.store.settings().font) {
    this.fontLoader.loadFont(fontId, this.store.customFonts()).then(font => {
      this.font = font;
      this.currentFontId = fontId;
      this.lastGeometryKey = '';
      this.rebuildGeometry(this.store.settings());
    }).catch(err => {
      console.warn('[Viewport3D] Font loading error:', err);
    });
  }

  private rebuildGeometry(settings: ProjectSettings) {
    if ((settings.inputSource === 'text' || settings.inputSource === 'neon-flex') && !this.font) {
      console.log('Skipping rebuild: waiting for font');
      return;
    }
    if (settings.inputSource === 'svg' && !settings.vectorData) {
      console.log('Skipping rebuild: waiting for vectorData');
      return;
    }
    
    console.log('Rebuilding geometry. Input source:', settings.inputSource, 'Has vectorData:', !!settings.vectorData);

    this.export2DShapes = [];
    if (this.selectionBoxHelper) {
      this.scene.remove(this.selectionBoxHelper);
      this.selectionBoxHelper.dispose();
      this.selectionBoxHelper = null;
    }
    this.selectedObjectGroup = null;
    this.activeLetter.set(null);
    
    // Clear old
    while (this.lettersGroup.children.length > 0) {
      const child = this.lettersGroup.children[0] as THREE.Mesh;
      this.lettersGroup.remove(child);
      if (child !== this.holePreview) {
        if (child.geometry) child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    }
    if (this.holePreview) {
      this.lettersGroup.add(this.holePreview);
    }

    if (settings.inputSource === 'text') {
      this.buildFromText(settings);
    } else if (settings.inputSource === 'svg') {
      this.buildFromSVG(settings);
    } else if (settings.inputSource === 'neon-flex') {
      this.buildFromNeonFlex(settings);
    }

    if (settings.mirror) {
      this.lettersGroup.scale.x = -1;
      this.mountingGroup.scale.x = -1;
    } else {
      this.lettersGroup.scale.x = 1;
      this.mountingGroup.scale.x = 1;
    }

    this.buildMountingSystem(settings);
    this.updateEmissiveMaterials();

    setTimeout(() => {
      const finalBox = new THREE.Box3().setFromObject(this.lettersGroup);
      if (!finalBox.isEmpty()) {
        const finalWidth = finalBox.max.x - finalBox.min.x;
        const finalHeight = finalBox.max.z - finalBox.min.z;
        this.store.setEstimatedDimensions(finalWidth, finalHeight);

        // Estimate 3D printing slicer metrics
        // Base volume from letter geometry
        let totalVolMm3 = 0;
        this.lettersGroup.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            const meshBox = new THREE.Box3().setFromObject(child);
            if (!meshBox.isEmpty()) {
              const dx = meshBox.max.x - meshBox.min.x;
              const dy = meshBox.max.y - meshBox.min.y;
              const dz = meshBox.max.z - meshBox.min.z;
              // Approximate channel hull solidity factor (letter walls + bottom plate ~28% of bounding box)
              totalVolMm3 += dx * dy * dz * 0.28;
            }
          }
        });

        const totalVolCm3 = totalVolMm3 / 1000;
        const density = settings.filamentDensity || 1.24;
        const infillFactor = (settings.infillPercentage || 20) / 100;
        // Infill scales the core internal volume (~40% walls + 60% infill core)
        const effectiveDensity = density * (0.4 + 0.6 * infillFactor);
        const weightGrams = Math.max(1, Math.round(totalVolCm3 * effectiveDensity));
        const costPerKg = settings.filamentCostPerKg || 20;
        const estimatedCost = Number(((weightGrams / 1000) * costPerKg).toFixed(2));
        const printHours = Number(Math.max(0.2, (weightGrams / 35)).toFixed(1));

        this.store.setPrintStats({
          totalWeightGrams: weightGrams,
          estimatedCostUSD: estimatedCost,
          estimatedPrintHours: printHours,
          totalVolumeCm3: Math.round(totalVolCm3)
        });
      } else {
        this.store.setEstimatedDimensions(0, 0);
        this.store.setPrintStats({
          totalWeightGrams: 0,
          estimatedCostUSD: 0,
          estimatedPrintHours: 0,
          totalVolumeCm3: 0
        });
      }
      this.updateWiringHarness();
    });
  }

  private createMaterials(settings: ProjectSettings) {
    const is3dPrintedFace = settings.faceMaterial === '3d-printed';

    const acrylicMaterial = new THREE.MeshPhysicalMaterial({
      color: settings.acrylicColor, 
      roughness: is3dPrintedFace ? 0.8 : 0.15, 
      metalness: is3dPrintedFace ? 0.0 : 0.05,
      clearcoat: is3dPrintedFace ? 0.0 : 0.4,
      clearcoatRoughness: 0.1,
      transmission: 0.0, // Solid opaque, no transparency or see-through effect
      transparent: false,
      opacity: 1.0,
      depthWrite: true,
      wireframe: this.isWireframe(),
      side: THREE.DoubleSide
    });

    acrylicMaterial.userData = { isAcrylic: true };

    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: settings.bodyColor, 
      roughness: 0.55, 
      metalness: 0.15,
      transparent: false,
      opacity: 1.0,
      depthWrite: true,
      wireframe: this.isWireframe(),
      side: THREE.DoubleSide
    });

    return { acrylicMaterial, bodyMaterial };
  }

  private shapeToPaths(shape: THREE.Shape, scale: number): { X: number; Y: number }[][] {
    const paths = [];
    const points = shape.extractPoints(24);
    
    const outerPath = points.shape.map(p => ({ X: Math.round(p.x * scale), Y: Math.round(p.y * scale) }));
    if (!ClipperLib.Clipper.Orientation(outerPath)) {
      outerPath.reverse();
    }
    paths.push(outerPath);
    
    points.holes.forEach(hole => {
      const holePath = hole.map(p => ({ X: Math.round(p.x * scale), Y: Math.round(p.y * scale) }));
      if (ClipperLib.Clipper.Orientation(holePath)) {
        holePath.reverse();
      }
      paths.push(holePath);
    });
    
    return paths;
  }

  private polyTreeToShapes(polyTree: ClipperLib.PolyTree, scale: number): THREE.Shape[] {
    const shapes: THREE.Shape[] = [];
    
    const extractShapes = (nodes: ClipperLib.PolyNode[]) => {
      for (const outerNode of nodes) {
        const outerPath = outerNode.Contour();
        if (outerPath.length === 0) continue;

        const shape = new THREE.Shape();
        shape.moveTo(outerPath[0].X / scale, outerPath[0].Y / scale);
        for (let j = 1; j < outerPath.length; j++) {
          shape.lineTo(outerPath[j].X / scale, outerPath[j].Y / scale);
        }
        shape.closePath();

        const holeNodes = outerNode.Childs();
        for (const holeNode of holeNodes) {
          const holePath = holeNode.Contour();
          if (holePath.length > 0) {
            const hole = new THREE.Path();
            hole.moveTo(holePath[0].X / scale, holePath[0].Y / scale);
            for (let k = 1; k < holePath.length; k++) {
              hole.lineTo(holePath[k].X / scale, holePath[k].Y / scale);
            }
            hole.closePath();
            shape.holes.push(hole);
          }
          
          // Recursively process any nested polygons (e.g. inner walls inside holes)
          if (holeNode.Childs().length > 0) {
            extractShapes(holeNode.Childs());
          }
        }
        
        shapes.push(shape);
      }
    };
    
    extractShapes(polyTree.Childs());
    return shapes;
  }

  private booleanDifference(shapesA: THREE.Shape[], shapesB: THREE.Shape[]): THREE.Shape[] {
    const scale = 10000;
    const clpr = new ClipperLib.Clipper();
    
    shapesA.forEach(shape => {
      const paths = this.shapeToPaths(shape, scale);
      clpr.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
    });
    
    shapesB.forEach(shape => {
      const paths = this.shapeToPaths(shape, scale);
      clpr.AddPaths(paths, ClipperLib.PolyType.ptClip, true);
    });

    const solution = new ClipperLib.PolyTree();
    clpr.Execute(ClipperLib.ClipType.ctDifference, solution, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

    return this.polyTreeToShapes(solution, scale);
  }

  private subdivideShape(shape: THREE.Shape, maxSegmentLength = 2): THREE.Shape {
    const newShape = new THREE.Shape();

    const subdivideCurves = (curves: THREE.Curve<THREE.Vector2>[]): THREE.Curve<THREE.Vector2>[] => {
      const result: THREE.Curve<THREE.Vector2>[] = [];
      for (const curve of curves) {
        if (curve instanceof THREE.LineCurve) {
          const v1 = curve.v1;
          const v2 = curve.v2;
          const len = v1.distanceTo(v2);
          const numSub = Math.max(1, Math.ceil(len / maxSegmentLength));
          for (let i = 0; i < numSub; i++) {
            const pA = new THREE.Vector2().lerpVectors(v1, v2, i / numSub);
            const pB = new THREE.Vector2().lerpVectors(v1, v2, (i + 1) / numSub);
            result.push(new THREE.LineCurve(pA, pB));
          }
        } else {
          const len = curve.getLength();
          const numSub = Math.max(8, Math.ceil(len / maxSegmentLength));
          const pts = curve.getSpacedPoints(numSub);
          for (let i = 0; i < pts.length - 1; i++) {
            result.push(new THREE.LineCurve(pts[i], pts[i + 1]));
          }
        }
      }
      return result;
    };

    newShape.curves = subdivideCurves(shape.curves);

    if (shape.holes && shape.holes.length > 0) {
      newShape.holes = shape.holes.map(hole => {
        const newHole = new THREE.Path();
        newHole.curves = subdivideCurves(hole.curves);
        return newHole;
      });
    }

    return newShape;
  }

  private offsetShapes(shapes: THREE.Shape[], offset: number): THREE.Shape[] {
    if (!shapes || shapes.length === 0) return [];
    if (Math.abs(offset) < 0.001) return shapes;
    const scale = 10000;
    const co = new ClipperLib.ClipperOffset();
    co.MiterLimit = 2.0;
    co.ArcTolerance = 0.02 * scale;
    
    shapes.forEach(shape => {
      const paths = this.shapeToPaths(shape, scale);
      co.AddPaths(paths, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
    });
    
    const solution = new ClipperLib.PolyTree();
    co.Execute(solution, offset * scale);
    
    return this.polyTreeToShapes(solution, scale);
  }

  private cleanLoopPoints(points: THREE.Vector2[], minDistance = 0.5): THREE.Vector2[] {
    if (!points || points.length < 3) return points || [];

    // 1. Remove duplicate and near-identical consecutive points
    const step1: THREE.Vector2[] = [];
    const minDistSq = minDistance * minDistance;
    for (const p of points) {
      if (step1.length === 0 || p.distanceToSquared(step1[step1.length - 1]) > minDistSq) {
        step1.push(p.clone());
      }
    }
    while (step1.length > 2 && step1[0].distanceToSquared(step1[step1.length - 1]) < minDistSq) {
      step1.pop();
    }
    if (step1.length < 3) return step1;

    // 2. Remove redundant collinear points and sharp backtrack micro-spikes
    const step2: THREE.Vector2[] = [];
    const n1 = step1.length;
    for (let i = 0; i < n1; i++) {
      const prev = step1[(i - 1 + n1) % n1];
      const curr = step1[i];
      const next = step1[(i + 1) % n1];

      const v1 = new THREE.Vector2().subVectors(curr, prev);
      const v2 = new THREE.Vector2().subVectors(next, curr);
      const len1 = v1.length();
      const len2 = v2.length();
      if (len1 < 1e-4 || len2 < 1e-4) continue;
      v1.divideScalar(len1);
      v2.divideScalar(len2);

      const dot = v1.dot(v2);
      const cross = Math.abs(v1.x * v2.y - v1.y * v2.x);

      // Skip redundant point along a straight line segment
      if (dot > 0.999 && cross < 0.005) {
        continue;
      }

      // Skip glitchy reverse spike / hairpin micro-backtrack
      if (dot < -0.96) {
        continue;
      }

      step2.push(curr);
    }

    if (step2.length < 3) return step1;
    return step2;
  }

  private getSignedArea(points: THREE.Vector2[]): number {
    if (!points || points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y - points[j].x * points[i].y;
    }
    return area * 0.5;
  }

  private offsetContourPoints(canonicalPts: THREE.Vector2[], offset: number): THREE.Vector2[] {
    const N = canonicalPts ? canonicalPts.length : 0;
    if (N < 3) {
      return (canonicalPts || []).map(p => p.clone());
    }
    if (Math.abs(offset) < 0.001) {
      return canonicalPts.map(p => p.clone());
    }

    const area = this.getSignedArea(canonicalPts);
    const isCCW = area > 0;

    // 1. Compute baseline normal bisectors and clamped initial displacement vectors
    const rawDisplacements: THREE.Vector2[] = [];
    const edgeLengths: number[] = [];
    const edgeDirections: THREE.Vector2[] = [];

    for (let i = 0; i < N; i++) {
      const prevPt = canonicalPts[(i - 1 + N) % N];
      const currPt = canonicalPts[i];
      const nextPt = canonicalPts[(i + 1) % N];

      const vPrev = new THREE.Vector2().subVectors(currPt, prevPt);
      const vNext = new THREE.Vector2().subVectors(nextPt, currPt);
      const lenPrev = vPrev.length();
      const lenNext = vNext.length();

      edgeLengths.push(lenNext);
      edgeDirections.push(lenNext > 1e-5 ? vNext.clone().divideScalar(lenNext) : new THREE.Vector2(1, 0));

      if (lenPrev < 1e-5 || lenNext < 1e-5) {
        rawDisplacements.push(new THREE.Vector2(0, 0));
        continue;
      }
      vPrev.divideScalar(lenPrev);
      vNext.divideScalar(lenNext);

      // Edge outward normals: CCW = (vy, -vx), CW = (-vy, vx)
      const nPrev = isCCW ? new THREE.Vector2(vPrev.y, -vPrev.x) : new THREE.Vector2(-vPrev.y, vPrev.x);
      const nNext = isCCW ? new THREE.Vector2(vNext.y, -vNext.x) : new THREE.Vector2(-vNext.y, vNext.x);

      let nBis = new THREE.Vector2().addVectors(nPrev, nNext);
      if (nBis.lengthSq() < 1e-4) {
        nBis = nPrev.clone();
      } else {
        nBis.normalize();
      }

      // Cosine of half-angle between edge normals
      const cosHalf = Math.max(0.35, nBis.dot(nPrev));
      const miter = Math.min(1.2, 1.0 / cosHalf);

      // Bound displacement magnitude by adjacent edge lengths to prevent edge inversions
      const minAdjacentEdge = Math.min(lenPrev, lenNext);
      const maxAllowedDist = 0.5 * minAdjacentEdge + 0.5 * Math.abs(offset);
      const targetDist = Math.min(Math.abs(offset) * miter, maxAllowedDist);

      const disp = nBis.multiplyScalar(Math.sign(offset) * targetDist);
      rawDisplacements.push(disp);
    }

    // 2. Enforce Edge Preservation Constraint: prevent relative endpoint motion from inverting or collapsing any edge
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < N; i++) {
        const nextIdx = (i + 1) % N;
        const L = edgeLengths[i];
        if (L < 1e-4) continue;
        const u = edgeDirections[i];

        const dCurr = rawDisplacements[i];
        const dNext = rawDisplacements[nextIdx];

        // Projected relative displacement along edge direction
        const relProj = (dNext.x - dCurr.x) * u.x + (dNext.y - dCurr.y) * u.y;

        // If compression exceeds 50% of the original edge length, damp symmetrically
        if (relProj < -0.5 * L) {
          const excess = -0.5 * L - relProj;
          dNext.x += 0.5 * excess * u.x;
          dNext.y += 0.5 * excess * u.y;
          dCurr.x -= 0.5 * excess * u.x;
          dCurr.y -= 0.5 * excess * u.y;
        }
      }
    }

    // 3. Smooth Laplacian Relaxation to ensure fairing across adjacent vertices
    const smoothedDisplacements: THREE.Vector2[] = [];
    for (let i = 0; i < N; i++) {
      const prevD = rawDisplacements[(i - 1 + N) % N];
      const currD = rawDisplacements[i];
      const nextD = rawDisplacements[(i + 1) % N];

      const smX = 0.2 * prevD.x + 0.6 * currD.x + 0.2 * nextD.x;
      const smY = 0.2 * prevD.y + 0.6 * currD.y + 0.2 * nextD.y;
      smoothedDisplacements.push(new THREE.Vector2(smX, smY));
    }

    // 4. Generate final offset coordinates
    const result: THREE.Vector2[] = [];
    for (let i = 0; i < N; i++) {
      result.push(new THREE.Vector2(
        canonicalPts[i].x + smoothedDisplacements[i].x,
        canonicalPts[i].y + smoothedDisplacements[i].y
      ));
    }

    return result;
  }

  private loftContourBetweenLevels(
    ptsA: THREE.Vector2[],
    ptsB: THREE.Vector2[],
    zA: number,
    zB: number,
    faceInward: boolean,
    positions: number[],
    indices: number[]
  ) {
    if (!ptsA || !ptsB || ptsA.length < 3 || ptsB.length < 3 || ptsA.length !== ptsB.length) return;
    const N = ptsA.length;
    const area = this.getSignedArea(ptsA);
    const isCCW = area > 0;
    const baseIdx = positions.length / 3;

    for (let i = 0; i < N; i++) {
      positions.push(ptsA[i].x, ptsA[i].y, zA);
    }
    for (let i = 0; i < N; i++) {
      positions.push(ptsB[i].x, ptsB[i].y, zB);
    }

    for (let i = 0; i < N; i++) {
      const next = (i + 1) % N;
      const iA0 = baseIdx + i;
      const iA1 = baseIdx + next;
      const iB0 = baseIdx + N + i;
      const iB1 = baseIdx + N + next;

      const ccwFront = isCCW ? !faceInward : faceInward;
      if (ccwFront) {
        indices.push(iA0, iA1, iB1);
        indices.push(iA0, iB1, iB0);
      } else {
        indices.push(iA0, iB1, iA1);
        indices.push(iA0, iB0, iB1);
      }
    }
  }

  private buildContinuousProfiledWall(
    originalShapes: THREE.Shape[],
    cavityBelowAcrylic: THREE.Shape[],
    outerInsetShapes: THREE.Shape[],
    levels: { z: number; offset: number }[],
    material: THREE.Material,
    charGroup: THREE.Group,
    bottomCapZ?: number,
    cavityFloorZ?: number,
    holeShapes?: THREE.Shape[]
  ) {
    if (!originalShapes || originalShapes.length === 0 || levels.length < 2) return;

    // Filter valid progressive levels
    const validLevels: { z: number; offset: number }[] = [];
    levels.forEach(lvl => {
      if (validLevels.length === 0 || lvl.z > validLevels[validLevels.length - 1].z + 0.01) {
        validLevels.push(lvl);
      }
    });
    if (validLevels.length < 2) return;

    const zTop = validLevels[validLevels.length - 1].z;

    const positions: number[] = [];
    const indices: number[] = [];

    // 1. Build Outer Perimeter and Outer Holes Lofts across all consecutive height levels
    originalShapes.forEach(origShape => {
      const ptsData = origShape.extractPoints(24);
      const outerPts = this.cleanLoopPoints(ptsData.shape);

      if (outerPts.length >= 3) {
        for (let k = 0; k < validLevels.length - 1; k++) {
          const zA = validLevels[k].z;
          const zB = validLevels[k + 1].z;
          const offA = validLevels[k].offset;
          const offB = validLevels[k + 1].offset;

          const ptsA = this.offsetContourPoints(outerPts, offA);
          const ptsB = this.offsetContourPoints(outerPts, offB);

          this.loftContourBetweenLevels(ptsA, ptsB, zA, zB, false, positions, indices);
        }
      }

      // Letter holes (e.g. 'O', 'A', 'B', 'P', 'R') - follow profile offsets synchronously with outer perimeter
      if (ptsData.holes && ptsData.holes.length > 0) {
        ptsData.holes.forEach(holeLoop => {
          const holePts = this.cleanLoopPoints(holeLoop);
          if (holePts.length >= 3) {
            for (let k = 0; k < validLevels.length - 1; k++) {
              const zA = validLevels[k].z;
              const zB = validLevels[k + 1].z;
              const offA = validLevels[k].offset;
              const offB = validLevels[k + 1].offset;

              const hPtsA = this.offsetContourPoints(holePts, offA);
              const hPtsB = this.offsetContourPoints(holePts, offB);

              this.loftContourBetweenLevels(hPtsA, hPtsB, zA, zB, false, positions, indices);
            }
          }
        });
      }
    });

    // 2. Build Profiled Inner Cavity Wall (faces inward into cavity, hollows out behind the flare with matching wall profile)
    if (cavityBelowAcrylic && cavityBelowAcrylic.length > 0) {
      cavityBelowAcrylic.forEach(sCavity => {
        const ptsCavityData = sCavity.extractPoints(24);
        const cavPts = this.cleanLoopPoints(ptsCavityData.shape);
        if (cavPts.length >= 3) {
          for (let k = 0; k < validLevels.length - 1; k++) {
            const zA = validLevels[k].z;
            const zB = validLevels[k + 1].z;
            const offA = validLevels[k].offset;
            const offB = validLevels[k + 1].offset;

            const cavA = this.offsetContourPoints(cavPts, offA);
            const cavB = this.offsetContourPoints(cavPts, offB);

            this.loftContourBetweenLevels(cavA, cavB, zA, zB, true, positions, indices);
          }
        }

        // Holes inside the cavity around letter counters follow profile
        if (ptsCavityData.holes && ptsCavityData.holes.length > 0) {
          ptsCavityData.holes.forEach(hCavLoop => {
            const hCavPts = this.cleanLoopPoints(hCavLoop);
            if (hCavPts.length >= 3) {
              for (let k = 0; k < validLevels.length - 1; k++) {
                const zA = validLevels[k].z;
                const zB = validLevels[k + 1].z;
                const offA = validLevels[k].offset;
                const offB = validLevels[k + 1].offset;

                const hCavA = this.offsetContourPoints(hCavPts, offA);
                const hCavB = this.offsetContourPoints(hCavPts, offB);

                this.loftContourBetweenLevels(hCavA, hCavB, zA, zB, true, positions, indices);
              }
            }
          });
        }
      });
    }

    if (positions.length > 0 && indices.length > 0) {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();

      const mesh = new THREE.Mesh(geom, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { isBody: true, isAcrylic: false, partType: 'outer-wall' };
      charGroup.add(mesh);
    }

    // 3. Acrylic Supporting Ledge at zTop (Horizontal step between outer inset and cavity)
    if (outerInsetShapes && outerInsetShapes.length > 0 && cavityBelowAcrylic && cavityBelowAcrylic.length > 0) {
      const ledgeShapes = this.booleanDifference(outerInsetShapes, cavityBelowAcrylic);
      if (ledgeShapes && ledgeShapes.length > 0) {
        ledgeShapes.forEach(s => {
          const ledgeGeom = new THREE.ShapeGeometry([s]);
          const ledgeMesh = new THREE.Mesh(ledgeGeom, material);
          ledgeMesh.position.z = zTop;
          ledgeMesh.castShadow = true;
          ledgeMesh.receiveShadow = true;
          ledgeMesh.userData = { isBody: true, isAcrylic: false, partType: 'acrylic-ledge' };
          charGroup.add(ledgeMesh);
        });
      }
    }

    // 4. Seamless Bottom Cap at z = bottomCapZ
    if (bottomCapZ !== undefined) {
      const bottomShapes: THREE.Shape[] = [];
      const off0 = validLevels[0].offset;

      originalShapes.forEach(origShape => {
        const ptsData = origShape.extractPoints(24);
        const outerPts = this.cleanLoopPoints(ptsData.shape);
        if (outerPts.length >= 3) {
          const pts0 = this.offsetContourPoints(outerPts, off0);
          const bShape = new THREE.Shape();
          bShape.moveTo(pts0[0].x, pts0[0].y);
          for (let i = 1; i < pts0.length; i++) {
            bShape.lineTo(pts0[i].x, pts0[i].y);
          }
          bShape.closePath();

          if (ptsData.holes && ptsData.holes.length > 0) {
            ptsData.holes.forEach(holeLoop => {
              const hPts = this.cleanLoopPoints(holeLoop);
              if (hPts.length >= 3) {
                const hPts0 = this.offsetContourPoints(hPts, off0);
                const hPath = new THREE.Path();
                hPath.moveTo(hPts0[0].x, hPts0[0].y);
                for (let i = 1; i < hPts0.length; i++) {
                  hPath.lineTo(hPts0[i].x, hPts0[i].y);
                }
                hPath.closePath();
                bShape.holes.push(hPath);
              }
            });
          }
          bottomShapes.push(bShape);
        }
      });

      let finalBottomShapes = bottomShapes;
      if (holeShapes && holeShapes.length > 0 && finalBottomShapes.length > 0) {
        finalBottomShapes = this.booleanDifference(finalBottomShapes, holeShapes);
      }

      if (finalBottomShapes.length > 0) {
        finalBottomShapes.forEach(s => {
          const geom = new THREE.ShapeGeometry([s]);
          const mesh = new THREE.Mesh(geom, material);
          mesh.position.z = bottomCapZ;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData = { isBody: true, isAcrylic: false, partType: 'base-plate' };
          charGroup.add(mesh);
        });
      }
    }

    // 5. Seamless Cavity Floor at z = cavityFloorZ
    if (cavityFloorZ !== undefined && cavityBelowAcrylic && cavityBelowAcrylic.length > 0) {
      const cavFloorShapes: THREE.Shape[] = [];
      const z0 = validLevels[0].z;
      const z1 = validLevels[validLevels.length - 1].z;
      const tRatio = z1 > z0 ? Math.max(0, Math.min(1, (cavityFloorZ - z0) / (z1 - z0))) : 0;
      const off0 = validLevels[0].offset;
      const off1 = validLevels[validLevels.length - 1].offset;
      const offCav = off0 + (off1 - off0) * tRatio;

      cavityBelowAcrylic.forEach(sCavity => {
        const ptsData = sCavity.extractPoints(24);
        const cavPts = this.cleanLoopPoints(ptsData.shape);
        if (cavPts.length >= 3) {
          const cavPtsFloor = this.offsetContourPoints(cavPts, offCav);
          const cShape = new THREE.Shape();
          cShape.moveTo(cavPtsFloor[0].x, cavPtsFloor[0].y);
          for (let i = 1; i < cavPtsFloor.length; i++) {
            cShape.lineTo(cavPtsFloor[i].x, cavPtsFloor[i].y);
          }
          cShape.closePath();

          if (ptsData.holes && ptsData.holes.length > 0) {
            ptsData.holes.forEach(holeLoop => {
              const hPts = this.cleanLoopPoints(holeLoop);
              if (hPts.length >= 3) {
                const hPtsFloor = this.offsetContourPoints(hPts, offCav);
                const hPath = new THREE.Path();
                hPath.moveTo(hPtsFloor[0].x, hPtsFloor[0].y);
                for (let i = 1; i < hPtsFloor.length; i++) {
                  hPath.lineTo(hPtsFloor[i].x, hPtsFloor[i].y);
                }
                hPath.closePath();
                cShape.holes.push(hPath);
              }
            });
          }
          cavFloorShapes.push(cShape);
        }
      });

      let finalCavFloorShapes = cavFloorShapes;
      if (holeShapes && holeShapes.length > 0 && finalCavFloorShapes.length > 0) {
        finalCavFloorShapes = this.booleanDifference(finalCavFloorShapes, holeShapes);
      }

      if (finalCavFloorShapes.length > 0) {
        finalCavFloorShapes.forEach(s => {
          const geom = new THREE.ShapeGeometry([s]);
          const mesh = new THREE.Mesh(geom, material);
          mesh.position.z = cavityFloorZ;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData = { isBody: true, isAcrylic: false, partType: 'cavity-floor' };
          charGroup.add(mesh);
        });
      }
    }
  }

  private createHoleShape(h: CustomHole, xyScale = 1): THREE.Shape {
    const scale = Math.abs(xyScale) || 1;
    const holeType = h.type ?? this.store.settings().mountingHoleType ?? 'keyhole';

    if (holeType === 'round') {
      const circle = new THREE.Shape();
      circle.absarc(h.x, h.y, Math.max(0.5, h.r), 0, Math.PI * 2, false);
      return circle;
    }

    if (holeType === 'oval') {
      const configuredWidth = (h.width ?? this.store.settings().ovalHoleWidth ?? 10) / scale;
      const configuredHeight = (h.height ?? this.store.settings().ovalHoleHeight ?? 20) / scale;
      const W = Math.max(1, configuredWidth);
      const H = Math.max(1, configuredHeight);
      const maxCornerRadius = Math.min(W, H) / 2;
      const configuredCR = (h.cornerRadius !== undefined ? h.cornerRadius : (this.store.settings().ovalCornerRadius ?? maxCornerRadius)) / scale;
      const CR = Math.max(0, Math.min(maxCornerRadius, configuredCR));
      const rotDeg = h.rotation ?? this.store.settings().ovalRotation ?? 0;
      const rotRad = (rotDeg * Math.PI) / 180;

      const pts: { x: number; y: number }[] = [];
      const hw = W / 2;
      const hh = H / 2;

      if (CR < 0.05) {
        // Sharp rectangle
        pts.push({ x: hw, y: hh });
        pts.push({ x: -hw, y: hh });
        pts.push({ x: -hw, y: -hh });
        pts.push({ x: hw, y: -hh });
      } else {
        const numSteps = 8;
        // 1. Top-Right Corner (from angle 0 to PI/2, centered at (hw - CR, hh - CR))
        const cx1 = hw - CR;
        const cy1 = hh - CR;
        for (let i = 0; i <= numSteps; i++) {
          const a = (i / numSteps) * (Math.PI / 2);
          pts.push({ x: cx1 + Math.cos(a) * CR, y: cy1 + Math.sin(a) * CR });
        }

        // 2. Top-Left Corner (from angle PI/2 to PI, centered at (-hw + CR, hh - CR))
        const cx2 = -hw + CR;
        const cy2 = hh - CR;
        for (let i = 0; i <= numSteps; i++) {
          const a = Math.PI / 2 + (i / numSteps) * (Math.PI / 2);
          pts.push({ x: cx2 + Math.cos(a) * CR, y: cy2 + Math.sin(a) * CR });
        }

        // 3. Bottom-Left Corner (from angle PI to 3*PI/2, centered at (-hw + CR, -hh + CR))
        const cx3 = -hw + CR;
        const cy3 = -hh + CR;
        for (let i = 0; i <= numSteps; i++) {
          const a = Math.PI + (i / numSteps) * (Math.PI / 2);
          pts.push({ x: cx3 + Math.cos(a) * CR, y: cy3 + Math.sin(a) * CR });
        }

        // 4. Bottom-Right Corner (from angle 3*PI/2 to 2*PI, centered at (hw - CR, -hh + CR))
        const cx4 = hw - CR;
        const cy4 = -hh + CR;
        for (let i = 0; i <= numSteps; i++) {
          const a = (3 * Math.PI / 2) + (i / numSteps) * (Math.PI / 2);
          pts.push({ x: cx4 + Math.cos(a) * CR, y: cy4 + Math.sin(a) * CR });
        }
      }

      // Rotate and translate to (h.x, h.y)
      const cosT = Math.cos(rotRad);
      const sinT = Math.sin(rotRad);

      const shape = new THREE.Shape();
      const transformedPts = pts.map(p => ({
        x: h.x + (p.x * cosT - p.y * sinT),
        y: h.y + (p.x * sinT + p.y * cosT)
      }));

      if (transformedPts.length > 0) {
        shape.moveTo(transformedPts[0].x, transformedPts[0].y);
        for (let i = 1; i < transformedPts.length; i++) {
          shape.lineTo(transformedPts[i].x, transformedPts[i].y);
        }
        shape.closePath();
      }

      return shape;
    }

    // Keyhole mounting geometry:
    // Large round entry hole at bottom (center 0,0 relative), narrower slot going upwards (+Y), rounded top cap
    const R = Math.max(1, h.r);
    const configuredSlotWidth = (h.slotWidth ?? this.store.settings().keyholeSlotWidth ?? 4) / scale;
    const W_slot = Math.max(1.0, Math.min(R * 1.95, configuredSlotWidth));
    const w = W_slot / 2; // Half width of neck
    const configuredSlotHeight = (h.slotHeight ?? this.store.settings().keyholeSlotHeight ?? 10) / scale;
    const H_slot = Math.max(R + w + 1.0, configuredSlotHeight);
    const rotDeg = h.rotation ?? this.store.settings().keyholeDirection ?? 0;
    const rotRad = (rotDeg * Math.PI) / 180;

    // Intersection between vertical line x = w and circle x^2 + y^2 = R^2
    const yIntersect = Math.sqrt(Math.max(0.01, R * R - w * w));
    const alpha1 = Math.atan2(yIntersect, w); // right intersection angle (~60-70 deg)
    const alpha2 = Math.PI - alpha1;          // left intersection angle (~110-120 deg)

    const pts: { x: number; y: number }[] = [];

    // 1. Right slot edge going up from circle to top cap
    pts.push({ x: w, y: yIntersect });
    pts.push({ x: w, y: H_slot - w });

    // 2. Top semicircular cap from angle 0 to PI around center (0, H_slot - w)
    const topCapCenterY = H_slot - w;
    const numCapSteps = 12;
    for (let i = 1; i < numCapSteps; i++) {
      const angle = (i / numCapSteps) * Math.PI;
      pts.push({
        x: Math.cos(angle) * w,
        y: topCapCenterY + Math.sin(angle) * w
      });
    }
    pts.push({ x: -w, y: H_slot - w });

    // 3. Left slot edge going down to circle
    pts.push({ x: -w, y: yIntersect });

    // 4. Circular arc around entry circle bottom (from alpha2 around bottom back to alpha1)
    const numCircleSteps = 24;
    const sweepStart = alpha2;
    const sweepEnd = alpha1 + 2 * Math.PI;
    for (let i = 1; i < numCircleSteps; i++) {
      const angle = sweepStart + (i / numCircleSteps) * (sweepEnd - sweepStart);
      pts.push({
        x: Math.cos(angle) * R,
        y: Math.sin(angle) * R
      });
    }

    // 5. Rotate and translate to (h.x, h.y)
    const cosT = Math.cos(rotRad);
    const sinT = Math.sin(rotRad);

    const shape = new THREE.Shape();
    const transformedPts = pts.map(p => ({
      x: h.x + (p.x * cosT - p.y * sinT),
      y: h.y + (p.x * sinT + p.y * cosT)
    }));

    if (transformedPts.length > 0) {
      shape.moveTo(transformedPts[0].x, transformedPts[0].y);
      for (let i = 1; i < transformedPts.length; i++) {
        shape.lineTo(transformedPts[i].x, transformedPts[i].y);
      }
      shape.closePath();
    }

    return shape;
  }

  private buildLetterParts(
    charGroup: THREE.Group,
    originalShapes: THREE.Shape[],
    settings: ProjectSettings,
    materials: { acrylicMaterial: THREE.Material; bodyMaterial: THREE.Material },
    localHoles: CustomHole[],
    xyScale = 1
  ) {
    if (originalShapes.length === 0) return;

    const baseThickness = settings.baseThickness;
    const wallHeight = settings.wallHeight;
    const acrylicThickness = settings.acrylicThickness;
    // Divide by scale so they remain absolute in world space
    const extWallThickness = settings.externalWallThickness / Math.abs(xyScale);
    const intWallThickness = settings.internalWallThickness / Math.abs(xyScale);
    const bevelSize = 1.5 / Math.abs(xyScale);

    // Build hole shapes
    const holeShapes: THREE.Shape[] = [];
    localHoles.forEach(h => {
      holeShapes.push(this.createHoleShape(h, xyScale));
    });

    // Check if Double-Step profile or Tapered profile is active
    const isDoubleStep = settings.wallProfileTemplate === 'double-step' || settings.style === 'acrylic-double-step';
    const isTapered = settings.wallProfileTemplate === 'tapered' || (!isDoubleStep && (settings.bodyTaper ?? 0) > 0);
    const taper = isTapered ? Math.max(0.1, (settings.bodyTaper ?? 3) / Math.abs(xyScale)) : 0;

    const footCloseAtBase = isDoubleStep ? (settings.footCloseAtBase !== false) : true;
    const footRampAngle = isDoubleStep ? (settings.footRampAngle ?? 45) : 45;
    const footStartHeight = isDoubleStep ? Math.max(0.5, (settings.footStartHeight ?? 4) / Math.abs(xyScale)) : 0;

    // Double step (Equal Double Bumps with Configurable Gap) parameters
    const bumpOffset = isDoubleStep ? Math.max(0.5, (settings.footOffset ?? 3.5) / Math.abs(xyScale)) : 0;
    const bumpHeight = isDoubleStep ? Math.max(0.5, (settings.footHeight ?? 4) / Math.abs(xyScale)) : 0;
    const stepsGap = isDoubleStep ? Math.max(0.5, (settings.stepsGap ?? 5) / Math.abs(xyScale)) : 0;

    const maxProfileOffset = isDoubleStep ? bumpOffset : (isTapered ? taper : 0);

    // Offsets
    const flaredShapes = (maxProfileOffset > 0) ? this.offsetShapes(originalShapes, maxProfileOffset) : originalShapes;
    const outerInsetShapes = extWallThickness > 0 ? this.offsetShapes(originalShapes, -extWallThickness) : [];
    const innerInsetShapes = intWallThickness > 0 && outerInsetShapes.length > 0 ? this.offsetShapes(outerInsetShapes, -intWallThickness) : [];

    // Inner cavity below the acrylic ledge (if ledge is used, cavity is smaller to form a solid supporting step)
    const cavityBelowAcrylic = (intWallThickness > 0 && innerInsetShapes.length > 0) ? innerInsetShapes : outerInsetShapes;
    
    // Solid unified wall shapes
    const lowerWallShapes = cavityBelowAcrylic.length > 0 ? this.booleanDifference(originalShapes, cavityBelowAcrylic) : [];
    const upperRimShapes = (intWallThickness > 0 && outerInsetShapes.length > 0) 
      ? this.booleanDifference(originalShapes, outerInsetShapes) 
      : [];

    // Base shapes: When in tapered mode, the backplate/base follows the taper profile!
    let baseShapes = isTapered
      ? (flaredShapes.length > 0 ? [...flaredShapes] : [...originalShapes])
      : ((!footCloseAtBase && isDoubleStep && flaredShapes.length > 0) ? [...flaredShapes] : [...originalShapes]);
    
    const acrylicClearance = (settings.acrylicClearance ?? 0) / Math.abs(xyScale);
    let acrylicShapes = [...outerInsetShapes];
    if (acrylicClearance !== 0 && outerInsetShapes.length > 0) {
      const clearanceOffset = this.offsetShapes(outerInsetShapes, acrylicClearance);
      if (clearanceOffset.length > 0) {
        acrylicShapes = clearanceOffset;
      }
    }

    if (holeShapes.length > 0) {
      baseShapes = this.booleanDifference(baseShapes, holeShapes);
    }

    let baseMat = materials.bodyMaterial;
    if ((settings.style as string) === 'double-led' || (settings.style as string) === 'retroiluminado') {
      baseMat = materials.acrylicMaterial;
    }

    // 1. Base Layer (Bottom backplate with holes) - for straight, double-step, and curved styles
    if (settings.layers.body && baseThickness > 0 && baseShapes.length > 0 && !isTapered) {
      const isCurvedSign = (settings.style as string) === 'curved-sign' || (settings.style as string) === 'letra-curva';
      baseShapes.forEach((s, sIdx) => {
        const targetShape = isCurvedSign ? this.subdivideShape(s, 1.5) : s;
        const extDepth = isCurvedSign ? 4 : baseThickness;

        const baseGeom = new THREE.ExtrudeGeometry([targetShape], {
          depth: extDepth,
          steps: isCurvedSign ? 24 : 1,
          bevelEnabled: (settings.style as string) === 'organic' || isCurvedSign,
          bevelThickness: isCurvedSign ? 1.5 : ((settings.style as string) === 'organic' ? 1.5 : 0),
          bevelSize: isCurvedSign ? 1.0 : bevelSize,
          bevelSegments: isCurvedSign ? 3 : 3,
          curveSegments: isCurvedSign ? 24 : 16
        });

        if (isCurvedSign) {
          baseGeom.computeBoundingBox();
          const bb = baseGeom.boundingBox!;
          const yMin = bb.min.y;
          const yMax = bb.max.y;
          const h = Math.max(1, yMax - yMin);

          const zMin = bb.min.z;
          const zMax = bb.max.z;
          const extrudedDepth = Math.max(0.1, zMax - zMin);

          const tiltDeg = settings.curvedSignTiltAngle ?? 22;
          const tiltAngle = THREE.MathUtils.degToRad(tiltDeg); // backward tilt
          const cosTilt = Math.cos(tiltAngle);
          const sinTilt = Math.sin(tiltAngle);

          const topThickness = 12; // mm thickness at top edge of letter
          const sweepAmount = settings.curvedSignSweepDepth ?? 45; // mm curve sweep at bottom

          const posAttr = baseGeom.attributes['position'];

          for (let i = 0; i < posAttr.count; i++) {
            const y = posAttr.getY(i);
            const z = posAttr.getZ(i);

            const t = THREE.MathUtils.clamp((y - yMin) / h, 0, 1); // 0 at bottom, 1 at top
            const w = THREE.MathUtils.clamp((z - zMin) / extrudedDepth, 0, 1); // 0 at back face, 1 at front face

            // 1. Tilt letter face backwards by tiltAngle around yMin
            const yRotated = yMin + (y - yMin) * cosTilt;
            const zTiltOffset = - (y - yMin) * sinTilt;

            // 2. Back curve profile R(t): smoothly sweeps out towards bottom
            const backCurve = topThickness + sweepAmount * Math.cos(t * Math.PI / 2);

            // 3. Interpolate depth between back curve (w=0) and front face (w=1)
            const zDepth = (1 - w) * (-backCurve) + w * 4;

            posAttr.setY(i, yRotated);
            posAttr.setZ(i, zTiltOffset + zDepth);
          }

          baseGeom.computeVertexNormals();
        }

        const baseMesh = new THREE.Mesh(baseGeom, baseMat);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        baseMesh.position.z = 0;
        baseMesh.userData = { isBody: true, isAcrylic: false, partType: 'base', shapeIndex: sIdx };
        charGroup.add(baseMesh);
      });
    }

    // 2. Outer Wall (Perimeter channel letter wall - single unified solid)
    const H_acrylic = intWallThickness > 0 ? Math.max(baseThickness, wallHeight - acrylicThickness) : wallHeight;

    if (settings.layers.body) {
      if (isDoubleStep) {
        // Double-Bump architectural wall profile (two identical equal bumps with configurable gap & 45° overhangs)
        const Z0 = baseThickness;
        const totalAvailH = Math.max(1, H_acrylic - Z0);
        const radAngle = THREE.MathUtils.degToRad(Math.max(20, Math.min(70, footRampAngle)));

        const rampH = Math.max(0.5, bumpOffset / Math.tan(radAngle));

        let hStart = Math.min(footStartHeight, totalAvailH * 0.25);
        let hRamp = rampH;
        let hBump = bumpHeight;
        let hGap = stepsGap;

        // Total vertical span of the dual bumps and gap
        const totalBumpSection = hStart + 4 * hRamp + 2 * hBump + hGap;
        if (totalBumpSection > 0.92 * totalAvailH) {
          const sf = (0.92 * totalAvailH) / totalBumpSection;
          hStart *= sf;
          hRamp *= sf;
          hBump *= sf;
          hGap *= sf;
        }

        const Z1 = Z0 + hStart;
        const Z2 = Z1 + hRamp;
        const Z3 = Z2 + hBump;
        const Z4 = Z3 + hRamp;
        const Z5 = Z4 + hGap;
        const Z6 = Z5 + hRamp;
        const Z7 = Z6 + hBump;
        const Z8 = Z7 + hRamp;

        const levels = [
          { z: Z0, offset: 0 },
          { z: Z1, offset: 0 },
          { z: Z2, offset: bumpOffset },
          { z: Z3, offset: bumpOffset },
          { z: Z4, offset: 0 },
          { z: Z5, offset: 0 },
          { z: Z6, offset: bumpOffset },
          { z: Z7, offset: bumpOffset },
          { z: Z8, offset: 0 },
          { z: H_acrylic, offset: 0 }
        ];

        this.buildContinuousProfiledWall(originalShapes, cavityBelowAcrylic, outerInsetShapes, levels, materials.bodyMaterial, charGroup);
      } else if (isTapered) {
        // Tapered body profile (single continuous outer loft from z=0 to acrylic ledge, perfectly flush base with zero ledge)
        const levels = [
          { z: 0, offset: taper },
          { z: H_acrylic, offset: 0 }
        ];
        this.buildContinuousProfiledWall(
          originalShapes,
          cavityBelowAcrylic,
          outerInsetShapes,
          levels,
          materials.bodyMaterial,
          charGroup,
          0, // bottomCapZ
          baseThickness, // cavityFloorZ
          holeShapes
        );
      } else {
        // Standard straight extrusion (single solid wall from floor to acrylic ledge)
        const depth = H_acrylic - baseThickness;
        if (depth > 0 && lowerWallShapes.length > 0) {
          lowerWallShapes.forEach((s, sIdx) => {
            const outerWallGeom = new THREE.ExtrudeGeometry([s], {
              depth: depth,
              bevelEnabled: false,
              curveSegments: 16
            });
            const outerWallMesh = new THREE.Mesh(outerWallGeom, materials.bodyMaterial);
            outerWallMesh.castShadow = true;
            outerWallMesh.receiveShadow = true;
            outerWallMesh.position.z = baseThickness;
            outerWallMesh.userData = { isBody: true, isAcrylic: false, partType: 'outer-wall', shapeIndex: sIdx };
            charGroup.add(outerWallMesh);
          });
        }
      }

      // 3. Upper Retaining Rim (Top perimeter lip around the acrylic lens)
      if (intWallThickness > 0 && upperRimShapes.length > 0 && wallHeight > H_acrylic) {
        const rimDepth = wallHeight - H_acrylic;
        upperRimShapes.forEach((s, sIdx) => {
          const rimGeom = new THREE.ExtrudeGeometry([s], {
            depth: rimDepth,
            bevelEnabled: false,
            curveSegments: 16
          });
          const rimMesh = new THREE.Mesh(rimGeom, materials.bodyMaterial);
          rimMesh.position.z = H_acrylic;
          rimMesh.castShadow = true;
          rimMesh.receiveShadow = true;
          rimMesh.userData = { isBody: true, isAcrylic: false, partType: 'outer-wall-rim', shapeIndex: sIdx };
          charGroup.add(rimMesh);
        });
      }
    }

    let faceMat = materials.acrylicMaterial;
    if ((settings.style as string) === 'retroiluminado') {
      faceMat = materials.bodyMaterial;
    }

    // 4. Acrylic / 3D-Printed Face Diffuser (Straight lower seated body with top-only bevel/chamfer)
    if (acrylicShapes.length > 0) {
      const isOrganic = (settings.style as string) === 'organic';
      const heightOffset = Math.max(0, settings.diffuserHeightOffset ?? 0);
      const bevelEnabled = (settings.diffuserBevelEnabled ?? false) || isOrganic;

      const totalFaceDepth = acrylicThickness + heightOffset;

      let bevelThick = 0;
      let bevelSz = 0;
      let bevelSegs = 1;

      if (bevelEnabled) {
        bevelSz = settings.diffuserBevelSize ?? (isOrganic ? bevelSize : 1.5);
        const maxSafeBevelThick = Math.max(0.1, totalFaceDepth * 0.7);
        bevelThick = Math.min(settings.diffuserBevelThickness ?? (isOrganic ? 1.5 : 1.5), maxSafeBevelThick);
        bevelSegs = Math.max(1, Math.round(settings.diffuserBevelSegments ?? (isOrganic ? 3 : 3)));
      }

      acrylicShapes.forEach((s, sIdx) => {
        const acrylicGeom = this.buildTopBeveledDiffuserGeometry(
          s,
          totalFaceDepth,
          bevelEnabled,
          bevelThick,
          bevelSz,
          bevelSegs,
          16
        );

        const acrylicMesh = new THREE.Mesh(acrylicGeom, faceMat);
        // Base of the cap sits securely and flat on the retaining lip at wallHeight - acrylicThickness
        acrylicMesh.position.z = wallHeight - acrylicThickness;
        acrylicMesh.castShadow = true;
        acrylicMesh.visible = settings.layers.acrylic;
        acrylicMesh.userData = { isBody: false, isAcrylic: true, partType: 'acrylic', shapeIndex: sIdx, is3dPrintedFace: true };
        charGroup.add(acrylicMesh);
      });
    }

    return { acrylicShapes, baseShapes };
  }

  private buildTopBeveledDiffuserGeometry(
    shape: THREE.Shape,
    totalDepth: number,
    bevelEnabled: boolean,
    bevelThickness: number,
    bevelSize: number,
    bevelSegments: number,
    curveSegments = 16
  ): THREE.BufferGeometry {
    const shapePoints = shape.extractPoints(curveSegments);
    const rawOuter = [...shapePoints.shape];
    const rawHoles = (shapePoints.holes || []).map(h => [...h]);

    // Clean duplicate consecutive points
    const cleanLoop = (loop: THREE.Vector2[]) => {
      const res: THREE.Vector2[] = [];
      const n = loop.length;
      for (let i = 0; i < n; i++) {
        const next = (i + 1) % n;
        if (loop[i].distanceToSquared(loop[next]) > 1e-8) {
          res.push(loop[i]);
        }
      }
      return res;
    };

    const outer = cleanLoop(rawOuter);
    const holes = rawHoles.map(cleanLoop).filter(h => h.length >= 3);

    if (outer.length < 3) {
      return new THREE.BufferGeometry();
    }

    // Ensure outer is CCW, holes are CW
    if (THREE.ShapeUtils.isClockWise(outer)) outer.reverse();
    holes.forEach(h => {
      if (!THREE.ShapeUtils.isClockWise(h)) h.reverse();
    });

    const getContourOffsets = (points: THREE.Vector2[]) => {
      const n = points.length;
      const offsets: THREE.Vector2[] = [];
      for (let i = 0; i < n; i++) {
        const prev = points[(i - 1 + n) % n];
        const curr = points[i];
        const next = points[(i + 1) % n];

        const v1 = new THREE.Vector2().subVectors(curr, prev).normalize();
        const v2 = new THREE.Vector2().subVectors(next, curr).normalize();

        // Inward normal for CCW polygon and CW holes
        const n1 = new THREE.Vector2(-v1.y, v1.x);
        const n2 = new THREE.Vector2(-v2.y, v2.x);

        const bisector = new THREE.Vector2().addVectors(n1, n2).normalize();
        const dot = bisector.dot(n1);
        const miter = Math.abs(dot) > 0.05 ? Math.min(2.5, 1.0 / dot) : 1.0;
        offsets.push(bisector.multiplyScalar(miter));
      }
      return offsets;
    };

    const outerOffsets = getContourOffsets(outer);
    const holesOffsets = holes.map(h => getContourOffsets(h));

    const actualBevelThick = bevelEnabled ? Math.min(bevelThickness, totalDepth * 0.8) : 0;
    const actualBevelSize = bevelEnabled ? Math.max(0.01, bevelSize) : 0;
    const straightHeight = totalDepth - actualBevelThick;
    const segs = bevelEnabled && actualBevelThick > 0.001 ? Math.max(1, bevelSegments) : 0;

    interface MeshLayer {
      z: number;
      outer: THREE.Vector2[];
      holes: THREE.Vector2[][];
    }
    const layers: MeshLayer[] = [];

    // Layer 0: Flat bottom at z = 0 (un-offset base footprint)
    layers.push({
      z: 0,
      outer: outer.map(p => p.clone()),
      holes: holes.map(h => h.map(p => p.clone()))
    });

    // Layer 1: Straight vertical height at z = straightHeight (un-offset footprint)
    if (straightHeight > 0.0001 && segs > 0) {
      layers.push({
        z: straightHeight,
        outer: outer.map(p => p.clone()),
        holes: holes.map(h => h.map(p => p.clone()))
      });
    }

    // Bevel stages: from straightHeight to totalDepth
    for (let s = 1; s <= segs; s++) {
      const frac = s / segs;
      let zFrac = frac;
      let xyFrac = frac;

      if (segs > 1) {
        const angle = frac * (Math.PI / 2);
        zFrac = Math.sin(angle);
        xyFrac = 1 - Math.cos(angle);
      }

      const zLayer = straightHeight + zFrac * actualBevelThick;
      const curBevelDist = xyFrac * actualBevelSize;

      const layerOuter = outer.map((p, idx) => {
        const off = outerOffsets[idx];
        return new THREE.Vector2(p.x + off.x * curBevelDist, p.y + off.y * curBevelDist);
      });

      const layerHoles = holes.map((h, hIdx) => {
        const hOffs = holesOffsets[hIdx];
        return h.map((p, idx) => {
          const off = hOffs[idx];
          return new THREE.Vector2(p.x + off.x * curBevelDist, p.y + off.y * curBevelDist);
        });
      });

      layers.push({
        z: zLayer,
        outer: layerOuter,
        holes: layerHoles
      });
    }

    // If bevel is disabled, add un-offset top layer at totalDepth
    if (segs === 0) {
      layers.push({
        z: totalDepth,
        outer: outer.map(p => p.clone()),
        holes: holes.map(h => h.map(p => p.clone()))
      });
    }

    const vertices: number[] = [];

    const addTriangle = (p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3) => {
      vertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
    };

    const addQuad = (b1: THREE.Vector3, b2: THREE.Vector3, t2: THREE.Vector3, t1: THREE.Vector3) => {
      addTriangle(b1, b2, t2);
      addTriangle(b1, t2, t1);
    };

    // 1. Bottom flat face at z = 0
    const bottomTris = THREE.ShapeUtils.triangulateShape(layers[0].outer, layers[0].holes);
    const flatBottomPts: THREE.Vector2[] = [...layers[0].outer];
    layers[0].holes.forEach(h => h.forEach(p => flatBottomPts.push(p)));
    bottomTris.forEach(tri => {
      const p1 = new THREE.Vector3(flatBottomPts[tri[0]].x, flatBottomPts[tri[0]].y, 0);
      const p2 = new THREE.Vector3(flatBottomPts[tri[2]].x, flatBottomPts[tri[2]].y, 0);
      const p3 = new THREE.Vector3(flatBottomPts[tri[1]].x, flatBottomPts[tri[1]].y, 0);
      addTriangle(p1, p2, p3);
    });

    // 2. Connect side walls layer by layer with 1:1 vertex matching
    for (let l = 0; l < layers.length - 1; l++) {
      const L1 = layers[l];
      const L2 = layers[l + 1];

      // Outer contour vertical / bevel quads
      const nO = L1.outer.length;
      for (let i = 0; i < nO; i++) {
        const next = (i + 1) % nO;
        const b1 = new THREE.Vector3(L1.outer[i].x, L1.outer[i].y, L1.z);
        const b2 = new THREE.Vector3(L1.outer[next].x, L1.outer[next].y, L1.z);
        const t1 = new THREE.Vector3(L2.outer[i].x, L2.outer[i].y, L2.z);
        const t2 = new THREE.Vector3(L2.outer[next].x, L2.outer[next].y, L2.z);
        addQuad(b1, b2, t2, t1);
      }

      // Hole contour vertical / bevel quads
      for (let h = 0; h < L1.holes.length; h++) {
        const hL1 = L1.holes[h];
        const hL2 = L2.holes[h];
        const nH = hL1.length;
        for (let i = 0; i < nH; i++) {
          const next = (i + 1) % nH;
          const b1 = new THREE.Vector3(hL1[i].x, hL1[i].y, L1.z);
          const b2 = new THREE.Vector3(hL1[next].x, hL1[next].y, L1.z);
          const t1 = new THREE.Vector3(hL2[i].x, hL2[i].y, L2.z);
          const t2 = new THREE.Vector3(hL2[next].x, hL2[next].y, L2.z);
          addQuad(b1, b2, t2, t1);
        }
      }
    }

    // 3. Top face at topmost layer
    const topLayer = layers[layers.length - 1];
    const topTris = THREE.ShapeUtils.triangulateShape(topLayer.outer, topLayer.holes);
    const flatTopPts: THREE.Vector2[] = [...topLayer.outer];
    topLayer.holes.forEach(h => h.forEach(p => flatTopPts.push(p)));
    topTris.forEach(tri => {
      const p1 = new THREE.Vector3(flatTopPts[tri[0]].x, flatTopPts[tri[0]].y, topLayer.z);
      const p2 = new THREE.Vector3(flatTopPts[tri[1]].x, flatTopPts[tri[1]].y, topLayer.z);
      const p3 = new THREE.Vector3(flatTopPts[tri[2]].x, flatTopPts[tri[2]].y, topLayer.z);
      addTriangle(p1, p2, p3);
    });

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }

  private clean2DLoopPoints(loop: THREE.Vector2[], minDist = 0.5): THREE.Vector2[] {
    if (!loop || loop.length === 0) return [];
    const res: THREE.Vector2[] = [];
    const minDistSq = minDist * minDist;
    for (const p of loop) {
      if (res.length === 0 || p.distanceToSquared(res[res.length - 1]) >= minDistSq) {
        res.push(p);
      }
    }
    return res;
  }

  /**
   * Generates single-line centerline spine paths for neon flex ('inline' mode).
   * Extracts clean, natural stroke centerlines for cursive and display lettering.
   */
  private extractNeonCurves(
    shape: THREE.Shape,
    routingMode: 'inline' | 'outline',
    curveSegments = 40
  ): { points: THREE.Vector3[]; isClosed: boolean }[] {
    const shapePoints = shape.extractPoints(curveSegments);
    const outer = shapePoints.shape;
    const holes = shapePoints.holes || [];

    if (routingMode === 'outline') {
      // Outline mode: full perimeter tube around outer contour and holes
      const results: { points: THREE.Vector3[]; isClosed: boolean }[] = [];
      const allLoops = [outer, ...holes];
      for (const loop of allLoops) {
        if (!loop || loop.length < 3) continue;
        const cleaned = this.clean2DLoopPoints(loop, 0.7);
        if (cleaned.length < 3) continue;
        const pts = cleaned.map(p => new THREE.Vector3(p.x, p.y, 0));
        pts.push(pts[0].clone()); // close the loop
        results.push({ points: pts, isClosed: true });
      }
      return results;
    }

    // Inline (Single-Line Center Spine) mode
    const results: { points: THREE.Vector3[]; isClosed: boolean }[] = [];

    if (holes.length > 0) {
      // For loops and characters with interior holes (e.g. 'o', 'a', 'e', 'b', 'd', 'g', 'p', 'q', 'O', 'A', 'D', 'B', 'P', 'R', 'Q'),
      // compute the mean centerline equidistant between outer perimeter and interior hole contour
      for (const hole of holes) {
        if (!hole || hole.length < 3 || !outer || outer.length < 3) continue;
        const centerPoints: THREE.Vector3[] = [];

        for (const hPt of hole) {
          // Find closest point on outer contour
          let bestOuter = outer[0];
          let minDistSq = Infinity;
          for (const oPt of outer) {
            const dSq = hPt.distanceToSquared(oPt);
            if (dSq < minDistSq) {
              minDistSq = dSq;
              bestOuter = oPt;
            }
          }
          const midX = (hPt.x + bestOuter.x) * 0.5;
          const midY = (hPt.y + bestOuter.y) * 0.5;
          centerPoints.push(new THREE.Vector3(midX, midY, 0));
        }

        if (centerPoints.length >= 3) {
          const cleaned = this.clean3DPoints(centerPoints, 0.7);
          if (cleaned.length >= 3) {
            cleaned.push(cleaned[0].clone());
            results.push({ points: cleaned, isClosed: true });
          }
        }
      }
    } else {
      // For solid glyph strokes without interior holes (e.g. 'C', 'S', 'L', 'I', 'U', 'J', 'M', 'N', 'V', 'W', 'Z', 'l', 't', 'y', 'w', 's', 'c', 'u', 'v', 'z', 'm', 'n', 'r', 'h', 'k'),
      // extract the medial stroke axis by detecting the extreme tip vertices and pairing the two boundary flanks
      if (outer && outer.length >= 4) {
        const cleanedOuter = this.clean2DLoopPoints(outer, 0.5);
        const N = cleanedOuter.length;

        if (N >= 4) {
          // Find the two vertices on the closed loop with maximum Euclidean separation (the stroke terminals / tips)
          let maxDistSq = 0;
          let tip1 = 0;
          let tip2 = Math.floor(N / 2);

          for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
              const dSq = cleanedOuter[i].distanceToSquared(cleanedOuter[j]);
              if (dSq > maxDistSq) {
                maxDistSq = dSq;
                tip1 = i;
                tip2 = j;
              }
            }
          }

          // Build two flank curves running from tip1 to tip2: flankA (clockwise) and flankB (counter-clockwise)
          const flankA: THREE.Vector2[] = [];
          for (let i = tip1; i !== tip2; i = (i + 1) % N) {
            flankA.push(cleanedOuter[i]);
          }
          flankA.push(cleanedOuter[tip2]);

          const flankB: THREE.Vector2[] = [];
          for (let i = tip1; i !== tip2; i = (i - 1 + N) % N) {
            flankB.push(cleanedOuter[i]);
          }
          flankB.push(cleanedOuter[tip2]);

          // Sample medial points along equal normalized arc-lengths of both flanks
          const numSamples = Math.max(12, Math.min(60, Math.floor((flankA.length + flankB.length) * 0.6)));
          const spinePoints: THREE.Vector3[] = [];

          for (let s = 0; s <= numSamples; s++) {
            const u = s / numSamples;
            const idxA = Math.min(flankA.length - 1, Math.floor(u * (flankA.length - 1)));
            const idxB = Math.min(flankB.length - 1, Math.floor(u * (flankB.length - 1)));

            const pA = flankA[idxA];
            const pB = flankB[idxB];
            const midX = (pA.x + pB.x) * 0.5;
            const midY = (pA.y + pB.y) * 0.5;
            spinePoints.push(new THREE.Vector3(midX, midY, 0));
          }

          if (spinePoints.length >= 2) {
            const cleanedSpine = this.clean3DPoints(spinePoints, 0.6);
            if (cleanedSpine.length >= 2) {
              results.push({ points: cleanedSpine, isClosed: false });
            }
          }
        }
      }
    }

    // Fallback: If inline skeleton could not be extracted, default to outer contour
    if (results.length === 0 && outer && outer.length >= 3) {
      const cleaned = this.clean2DLoopPoints(outer, 0.7);
      if (cleaned.length >= 3) {
        const pts = cleaned.map(p => new THREE.Vector3(p.x, p.y, 0));
        pts.push(pts[0].clone());
        results.push({ points: pts, isClosed: true });
      }
    }

    return results;
  }

  private clean3DPoints(points: THREE.Vector3[], minDist = 0.5): THREE.Vector3[] {
    if (!points || points.length === 0) return [];
    const res: THREE.Vector3[] = [];
    const minDistSq = minDist * minDist;
    for (const p of points) {
      if (res.length === 0 || p.distanceToSquared(res[res.length - 1]) >= minDistSq) {
        res.push(p);
      }
    }
    return res;
  }

  private getShapesBoundingBox(shapes: THREE.Shape[]): THREE.Box3 {
    const box = new THREE.Box3();
    const vec = new THREE.Vector3();
    shapes.forEach(shape => {
      const points = shape.getPoints();
      points.forEach(p => {
        vec.set(p.x, p.y, 0);
        box.expandByPoint(vec);
      });
      shape.holes.forEach(hole => {
        const holePoints = hole.getPoints();
        holePoints.forEach(p => {
          vec.set(p.x, p.y, 0);
          box.expandByPoint(vec);
        });
      });
    });
    return box;
  }

  private buildFromText(settings: ProjectSettings) {
    const rawText = settings.text || ' ';
    const height = settings.targetHeight || 150; // base scale height
    const materials = this.createMaterials(settings);
    const lines = rawText.split('\n');
    const letterSpacing = settings.letterSpacing ?? 15;
    const lineSpacing = settings.lineSpacing ?? 25;
    const textAlign = settings.textAlign || 'center';
    const arcEnabled = settings.arcEnabled || false;
    const arcAngleDeg = settings.arcAngle || 60;
    const customKerning = settings.customKerning || {};

    let hasOversizedLetters = false;
    const globalRawBox = new THREE.Box3();

    // First pass: measure metrics for each line
    interface CharMetric {
      char: string;
      charIndex: number;
      shapes: THREE.Shape[];
      width: number;
      minX: number;
      box: THREE.Box3;
    }
    const lineMetrics: { chars: CharMetric[]; totalWidth: number }[] = [];

    let charGlobalCounter = 0;
    for (const line of lines) {
      const chars: CharMetric[] = [];
      let totalWidth = 0;
      for (const char of line) {
        const charIdx = charGlobalCounter++;
        const kerningShift = customKerning[charIdx] || 0;
        if (char === ' ') {
          chars.push({ char, charIndex: charIdx, shapes: [], width: height * 0.45, minX: 0, box: new THREE.Box3() });
          totalWidth += height * 0.45 + kerningShift;
        } else {
          const shapes = this.font!.generateShapes(char, height);
          const rawBox = this.getShapesBoundingBox(shapes);
          const minX = !rawBox.isEmpty() ? rawBox.min.x : 0;
          const maxX = !rawBox.isEmpty() ? rawBox.max.x : height * 0.5;
          let w = Math.max(1, maxX - minX);
          const fontData = (this.font as any)?.data;
          if (fontData && fontData.glyphs) {
            const glyph = fontData.glyphs[char] || fontData.glyphs['?'] || fontData.glyphs[char.toLowerCase()];
            if (glyph && glyph.ha) {
              const scale = height / fontData.resolution;
              w = glyph.ha * scale;
            }
          }
          chars.push({ char, charIndex: charIdx, shapes, width: w, minX, box: rawBox });
          totalWidth += w + letterSpacing + kerningShift;
        }
      }
      if (chars.length > 0 && chars[chars.length - 1].char !== ' ') {
        totalWidth -= letterSpacing; // remove trailing spacing
      }
      lineMetrics.push({ chars, totalWidth: Math.max(0, totalWidth) });
      charGlobalCounter++; // account for newline character
    }

    const maxLineWidth = Math.max(1, ...lineMetrics.map(l => l.totalWidth));

    // Second pass: construct 3D letter meshes per line
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const { chars, totalWidth } = lineMetrics[lineIndex];
      const lineYOffset = - lineIndex * (height + lineSpacing);

      let lineStartX = 0;
      if (textAlign === 'center') {
        lineStartX = (maxLineWidth - totalWidth) / 2;
      } else if (textAlign === 'right') {
        lineStartX = maxLineWidth - totalWidth;
      }

      let currentX = lineStartX;

      for (const charItem of chars) {
        const kerningShift = customKerning[charItem.charIndex] || 0;
        currentX += kerningShift;

        if (charItem.char === ' ') {
          currentX += charItem.width;
          continue;
        }

        const posX = currentX - charItem.minX;

        const charGroup = new THREE.Group();
        const localHoles: CustomHole[] = (settings.customHoles || []).map(h => ({
          ...h,
          x: h.x - posX,
          y: h.y - lineYOffset
        }));

        const parts = this.buildLetterParts(charGroup, charItem.shapes, settings, materials, localHoles);

        charGroup.userData = { 
          isLetterGroup: true, 
          char: charItem.char,
          charIndex: charItem.charIndex
        };

        // Apply Position & Arc Deformation
        if (arcEnabled && arcAngleDeg !== 0 && totalWidth > 10) {
          const arcAngleRad = (arcAngleDeg * Math.PI) / 180;
          const arcRadius = totalWidth / arcAngleRad;
          const charCenterRelX = (currentX - lineStartX + charItem.width / 2) - (totalWidth / 2);
          const theta = (charCenterRelX / totalWidth) * arcAngleRad;

          const arcPosX = lineStartX + (totalWidth / 2) + arcRadius * Math.sin(theta) - (charItem.width / 2);
          const arcPosY = lineYOffset + arcRadius * (Math.cos(theta) - 1);

          charGroup.position.set(arcPosX - charItem.minX, arcPosY, 0);
          charGroup.rotation.z = -theta;
        } else {
          charGroup.position.set(posX, lineYOffset, 0);
          charGroup.rotation.z = 0;
        }

        this.export2DShapes.push({
          char: charItem.char,
          letterIndex: charItem.charIndex,
          acrylic: parts?.acrylicShapes || [],
          base: parts?.baseShapes || [],
          offsetX: charGroup.position.x,
          offsetY: charGroup.position.y,
          scaleX: 1,
          scaleY: 1,
          rotation: charGroup.rotation.z
        });

        const localBox = new THREE.Box3().setFromObject(charGroup);
        const sizeX = localBox.max.x - localBox.min.x;
        const sizeY = localBox.max.y - localBox.min.y;
        if (sizeX > settings.buildPlateWidth || sizeY > settings.buildPlateHeight) {
          hasOversizedLetters = true;
        }

        this.lettersGroup.add(charGroup);

        if (!charItem.box.isEmpty()) {
          const shiftedBox = charItem.box.clone().translate(new THREE.Vector3(charGroup.position.x, charGroup.position.y, 0));
          globalRawBox.union(shiftedBox);
        }

        currentX += charItem.width + letterSpacing;
      }
    }

    if (!globalRawBox.isEmpty()) {
      const centerOffsetX = -0.5 * (globalRawBox.max.x + globalRawBox.min.x);
      const centerOffsetY = -0.5 * (globalRawBox.max.y + globalRawBox.min.y);
      this.lettersGroup.position.x = centerOffsetX;
      this.lettersGroup.position.y = centerOffsetY;
    }
    
    setTimeout(() => this.store.setOversizedWarning(hasOversizedLetters));
  }

  private buildFromSVG(settings: ProjectSettings) {
    if (!settings.vectorData) {
      console.log('buildFromSVG aborted: no vectorData');
      return;
    }
    
    console.log('buildFromSVG started. Parsing SVGLoader...');

    const loader = new SVGLoader();
    let svgData;
    try {
      svgData = loader.parse(settings.vectorData);
    } catch (e) {
      console.error('Failed to parse SVG data:', e);
      return;
    }

    const materials = this.createMaterials(settings);
    
    const rawGroup = new THREE.Group();
    const allShapes: THREE.Shape[][] = [];
    const shapeLabels: string[] = [];
    let pathIndex = 1;
    
    for (const path of svgData.paths) {
      let shapes: THREE.Shape[] = [];
      try {
        shapes = SVGLoader.createShapes(path);
      } catch (err) {
        console.warn('SVGLoader.createShapes failed for path, attempting fallback:', err);
      }

      // Fallback for subPaths if createShapes returned empty
      if (shapes.length === 0 && path.subPaths && path.subPaths.length > 0) {
        shapes = [];
        for (const subPath of path.subPaths) {
          const pts = subPath.getPoints();
          if (pts.length >= 3) {
            const s = new THREE.Shape();
            s.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
              s.lineTo(pts[i].x, pts[i].y);
            }
            s.closePath();
            shapes.push(s);
          }
        }
      }

      if (shapes.length > 0) {
        allShapes.push(shapes);

        const node = (path as { userData?: { node?: Element } }).userData?.node;
        const nodeId = node?.id || node?.getAttribute?.('id') || node?.getAttribute?.('name');
        const label = (nodeId && typeof nodeId === 'string' && nodeId.trim().length > 0)
          ? nodeId.trim()
          : `Object #${pathIndex}`;
        shapeLabels.push(label);
        pathIndex++;

        try {
          const rawGeom = new THREE.ShapeGeometry(shapes);
          rawGroup.add(new THREE.Mesh(rawGeom));
        } catch (e) {
          console.warn('ShapeGeometry creation failed for SVG path:', e);
        }
      }
    }
    
    console.log(`Parsed ${allShapes.length} valid shape groups, created ${rawGroup.children.length} meshes.`);

    if (rawGroup.children.length === 0) {
      console.warn('buildFromSVG aborted: No shapes could be generated from SVG paths.');
      return;
    }
    
    rawGroup.scale.y = -1;
    const rawBox = new THREE.Box3().setFromObject(rawGroup);
    if (rawBox.isEmpty()) {
      console.warn('buildFromSVG aborted: Raw bounding box is empty.');
      return;
    }
    
    const actualHeight = rawBox.max.y - rawBox.min.y;
    const targetHeight = settings.targetHeight || 150;
    const scale = actualHeight > 0 ? targetHeight / actualHeight : 1;
    
    rawGroup.scale.set(scale, -scale, 1);
    const scaledRawBox = new THREE.Box3().setFromObject(rawGroup);
    const centerX = - (scaledRawBox.max.x + scaledRawBox.min.x) / 2;
    const centerY = - (scaledRawBox.max.y + scaledRawBox.min.y) / 2;

    const group = new THREE.Group();
    group.scale.set(scale, -scale, 1);
    group.position.set(centerX, centerY, 0);

    const localHoles: CustomHole[] = (settings.customHoles || []).map(h => ({
      ...h,
      x: (h.x - centerX) / scale,
      y: (h.y - centerY) / -scale,
      r: h.r / Math.abs(scale),
      slotWidth: h.slotWidth !== undefined ? h.slotWidth / Math.abs(scale) : undefined,
      slotHeight: h.slotHeight !== undefined ? h.slotHeight / Math.abs(scale) : undefined
    }));

    let hasOversizedLetters = false;
    for (let i = 0; i < allShapes.length; i++) {
      const shapes = allShapes[i];
      const label = shapeLabels[i] || `Object #${i + 1}`;
      
      const subGroup = new THREE.Group();
      subGroup.userData = { isLetterGroup: true, char: label };

      const parts = this.buildLetterParts(subGroup, shapes, settings, materials, localHoles, scale);
      
      this.export2DShapes.push({
        char: label,
        letterIndex: i,
        acrylic: parts?.acrylicShapes || [],
        base: parts?.baseShapes || [],
        offsetX: centerX,
        offsetY: centerY,
        scaleX: scale,
        scaleY: -scale,
        rotation: 0
      });

      const localBox = new THREE.Box3().setFromObject(subGroup);
      const sizeX = (localBox.max.x - localBox.min.x) * Math.abs(scale);
      const sizeY = (localBox.max.y - localBox.min.y) * Math.abs(scale);
      if (sizeX > settings.buildPlateWidth || sizeY > settings.buildPlateHeight) {
        hasOversizedLetters = true;
      }
      
      group.add(subGroup);
    }
    
    this.lettersGroup.add(group);
    
    setTimeout(() => this.store.setOversizedWarning(hasOversizedLetters));
  }

  private buildFromNeonFlex(settings: ProjectSettings) {
    const rawText = settings.neonText || settings.text || 'Dreams come true';
    const height = settings.targetHeight || 120;
    const lines = rawText.split('\n');
    const letterSpacing = settings.letterSpacing ?? 8;
    const lineSpacing = settings.lineSpacing ?? 30;
    const textAlign = settings.textAlign || 'center';
    const tubeDiam = settings.neonTubeDiameter ?? 8;
    const tubeRadius = tubeDiam / 2;
    const neonColorHex = settings.neonColor || '#ff2d87';
    const glowIntensity = settings.neonGlowIntensity ?? 10;
    const isMilky = settings.neonJacketStyle !== 'colored-silicone';
    const showClips = settings.neonShowClips !== false;
    const clipSpacing = settings.neonClipSpacing ?? 45;
    const showWires = settings.neonShowWires !== false;
    const trackMode = settings.neonMountingTrack || 'both';
    const routingMode = settings.neonRoutingMode || 'inline';

    let hasOversizedLetters = false;
    const globalRawBox = new THREE.Box3();

    // 1. Neon Materials
    const neonGlowMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(neonColorHex),
      emissive: new THREE.Color(neonColorHex),
      emissiveIntensity: glowIntensity,
      roughness: 0.1,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    neonGlowMat.userData = { isAcrylic: true, isNeonGlow: true };

    const siliconeJacketMat = new THREE.MeshPhysicalMaterial({
      color: isMilky ? 0xffffff : new THREE.Color(neonColorHex),
      emissive: new THREE.Color(neonColorHex),
      emissiveIntensity: glowIntensity * 0.4,
      transmission: 0.42,
      roughness: 0.22,
      metalness: 0.0,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      ior: 1.45,
      transparent: true,
      opacity: 0.94,
      depthWrite: true,
      side: THREE.DoubleSide
    });
    siliconeJacketMat.userData = { isAcrylic: true, isNeonSilicone: true };

    const cutMarkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(neonColorHex).lerp(new THREE.Color(0x000000), 0.25),
      emissive: new THREE.Color(neonColorHex),
      emissiveIntensity: glowIntensity * 0.2,
      roughness: 0.45,
      metalness: 0.1
    });

    const clipMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      roughness: 0.08,
      ior: 1.49,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });

    const screwMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.95,
      roughness: 0.15
    });

    const grommetMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.8
    });

    const cncTrackMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.7,
      transparent: true,
      opacity: 0.35
    });

    // Unified Font Processing
    interface CharMetric {
      char: string;
      charIndex: number;
      shapes: THREE.Shape[];
      width: number;
      minX: number;
      box: THREE.Box3;
    }
    const lineMetrics: { chars: CharMetric[]; totalWidth: number }[] = [];
    let charGlobalCounter = 0;

    for (const line of lines) {
      const chars: CharMetric[] = [];
      let totalWidth = 0;
      for (const char of line) {
        const charIdx = charGlobalCounter++;
        if (char === ' ') {
          chars.push({ char, charIndex: charIdx, shapes: [], width: height * 0.38, minX: 0, box: new THREE.Box3() });
          totalWidth += height * 0.38;
        } else {
          const shapes = this.font!.generateShapes(char, height);
          const rawBox = this.getShapesBoundingBox(shapes);
          const minX = !rawBox.isEmpty() ? rawBox.min.x : 0;
          const maxX = !rawBox.isEmpty() ? rawBox.max.x : height * 0.5;
          let w = Math.max(1, maxX - minX);
          const fontData = (this.font as any)?.data;
          if (fontData && fontData.glyphs) {
            const glyph = fontData.glyphs[char] || fontData.glyphs['?'] || fontData.glyphs[char.toLowerCase()];
            if (glyph && glyph.ha) {
              const scale = height / fontData.resolution;
              w = glyph.ha * scale;
            }
          }
          chars.push({ char, charIndex: charIdx, shapes, width: w, minX, box: rawBox });
          totalWidth += w + letterSpacing;
        }
      }
      if (chars.length > 0 && chars[chars.length - 1].char !== ' ') {
        totalWidth -= letterSpacing;
      }
      lineMetrics.push({ chars, totalWidth });
    }

    const maxWidth = Math.max(...lineMetrics.map(l => l.totalWidth), 1);
    const totalLinesHeight = (lines.length - 1) * lineSpacing + height;
    
    // Depth variables for Inline / CNC Groove mode
    const grooveDepth = (trackMode === 'cnc-groove' || trackMode === 'both') ? (settings.neonCncGrooveDepth ?? 1.8) : 0;
    const baseTubeZ = tubeRadius - grooveDepth;

    for (let lineIndex = 0; lineIndex < lineMetrics.length; lineIndex++) {
      const { chars, totalWidth } = lineMetrics[lineIndex];
      const lineYOffset = (totalLinesHeight / 2) - height - (lineIndex * lineSpacing);
      
      let lineStartX = -maxWidth / 2;
      if (textAlign === 'center') {
        lineStartX = -totalWidth / 2;
      } else if (textAlign === 'right') {
        lineStartX = (maxWidth / 2) - totalWidth;
      }

      let currentX = lineStartX;

      for (const charItem of chars) {
        if (charItem.char === ' ' || charItem.shapes.length === 0) {
          currentX += charItem.width + letterSpacing;
          continue;
        }

        const posX = currentX - charItem.minX;
        const charGroup = new THREE.Group();
        charGroup.userData = { isLetterGroup: true, char: charItem.char, charIndex: charItem.charIndex };

        const strokes: NeonStroke[] = routingMode === 'inline'
          ? extractGlyphCenterlineStrokes(charItem.shapes, 36)
          : extractGlyphOutlineStrokes(charItem.shapes, 36);

        strokes.forEach((stroke, strkIdx) => {
          const pts3d = stroke.points;
          if (!pts3d || pts3d.length < 2) return;
          const isClosed = stroke.isClosed;
          
          // Smoother curves for inline tracing to match natural neon bending
          const spline = new THREE.CatmullRomCurve3(pts3d, isClosed, 'catmullrom', routingMode === 'inline' ? 0.35 : 0.15);
          const curveLen = spline.getLength();
          const segments = Math.max(20, Math.floor(curveLen / 2.2));

          // 1. Glowing Core Tube
          const coreGeom = new THREE.TubeGeometry(spline, segments, tubeRadius * 0.72, 12, isClosed);
          const coreMesh = new THREE.Mesh(coreGeom, neonGlowMat);
          coreMesh.position.z = baseTubeZ - tubeRadius * 0.25;
          coreMesh.castShadow = true;
          charGroup.add(coreMesh);

          // 2. Silicone Translucent Jacket
          const jacketGeom = new THREE.TubeGeometry(spline, segments, tubeRadius, 16, isClosed);
          const jacketMesh = new THREE.Mesh(jacketGeom, siliconeJacketMat);
          jacketMesh.position.z = baseTubeZ;
          jacketMesh.castShadow = true;
          jacketMesh.receiveShadow = true;
          charGroup.add(jacketMesh);

          // 3. Silicone End-Caps
          if (!isClosed && pts3d.length >= 2) {
            const startCapGeom = new THREE.SphereGeometry(tubeRadius, 12, 12);
            const startCapMesh = new THREE.Mesh(startCapGeom, siliconeJacketMat);
            startCapMesh.position.set(pts3d[0].x, pts3d[0].y, baseTubeZ);
            charGroup.add(startCapMesh);

            const endCapMesh = new THREE.Mesh(startCapGeom, siliconeJacketMat);
            endCapMesh.position.set(pts3d[pts3d.length - 1].x, pts3d[pts3d.length - 1].y, baseTubeZ);
            charGroup.add(endCapMesh);
          }

          // 4. Mounting Clips & Screws
          if (showClips && trackMode !== 'cnc-groove') {
            const numClips = Math.max(1, Math.floor(curveLen / clipSpacing));
            for (let ci = 0; ci < numClips; ci++) {
              const u = (ci + 0.5) / numClips;
              const pt = spline.getPointAt(u);
              const tangent = spline.getTangentAt(u);
              const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
              const clipGroup = new THREE.Group();
              clipGroup.position.set(pt.x, pt.y, 0);

              const clipGeom = new THREE.CylinderGeometry(tubeRadius * 1.25, tubeRadius * 1.25, 4, 16, 1, true, 0, Math.PI);
              const clipMesh = new THREE.Mesh(clipGeom, clipMat);
              clipMesh.rotation.z = Math.atan2(tangent.y, tangent.x) + Math.PI / 2;
              clipMesh.position.z = baseTubeZ + tubeRadius * 0.02;
              clipGroup.add(clipMesh);

              const screwGeom = new THREE.CylinderGeometry(1.2, 1.2, 2, 12);
              const screwMesh = new THREE.Mesh(screwGeom, screwMat);
              screwMesh.rotation.x = Math.PI / 2;
              screwMesh.position.set(normal.x * (tubeRadius * 1.2), normal.y * (tubeRadius * 1.2), 0.8);
              clipGroup.add(screwMesh);

              charGroup.add(clipGroup);
            }
          }

          // 5. CNC Routing track groove (shows as a grey track inset into the acrylic)
          if (trackMode === 'cnc-groove' || trackMode === 'both') {
            const cncGeom = new THREE.TubeGeometry(spline, Math.max(20, Math.floor(curveLen / 3.5)), tubeRadius * 1.06, 8, isClosed);
            const cncMesh = new THREE.Mesh(cncGeom, cncTrackMat);
            cncMesh.position.z = -grooveDepth; // Set to the depth of the groove
            charGroup.add(cncMesh);
          }

          // 6. Subtle Cut-Mark / Solder Point Badges on Neon Flex
          if (curveLen >= 20) {
            const cutSpacing = 45; // standard ~45-50mm neon cut interval
            const numCutMarks = Math.max(1, Math.floor(curveLen / cutSpacing));
            for (let cm = 1; cm <= numCutMarks; cm++) {
              const u = cm / (numCutMarks + 1);
              const pt = spline.getPointAt(u);
              const tangent = spline.getTangentAt(u);
              const cutMarkGeom = new THREE.CylinderGeometry(tubeRadius * 1.012, tubeRadius * 1.012, 1.6, 16);
              const cutMarkMesh = new THREE.Mesh(cutMarkGeom, cutMarkMat);
              cutMarkMesh.position.set(pt.x, pt.y, baseTubeZ);
              cutMarkMesh.rotation.z = Math.atan2(tangent.y, tangent.x) + Math.PI / 2;
              charGroup.add(cutMarkMesh);
            }
          }

          // 7. Wire Exit Bushing
          if (showWires && strkIdx === 0) {
            const exitPt = pts3d[0];
            const grommetGeom = new THREE.CylinderGeometry(3.5, 3.5, 4, 16);
            const grommetMesh = new THREE.Mesh(grommetGeom, grommetMat);
            grommetMesh.rotation.x = Math.PI / 2;
            grommetMesh.position.set(exitPt.x, exitPt.y, -2);
            charGroup.add(grommetMesh);
          }
        });

        charGroup.position.set(posX, lineYOffset, 0);
        this.export2DShapes.push({
          char: charItem.char,
          letterIndex: charItem.charIndex,
          acrylic: charItem.shapes,
          base: charItem.shapes,
          offsetX: charGroup.position.x,
          offsetY: charGroup.position.y,
          scaleX: 1,
          scaleY: 1,
          rotation: 0
        });

        const localBox = new THREE.Box3().setFromObject(charGroup);
        const sizeX = localBox.max.x - localBox.min.x;
        const sizeY = localBox.max.y - localBox.min.y;
        if (sizeX > settings.buildPlateWidth || sizeY > settings.buildPlateHeight) {
          hasOversizedLetters = true;
        }

        this.lettersGroup.add(charGroup);

        if (!charItem.box.isEmpty()) {
          const shiftedBox = charItem.box.clone().translate(new THREE.Vector3(charGroup.position.x, charGroup.position.y, 0));
          globalRawBox.union(shiftedBox);
        }

        currentX += charItem.width + letterSpacing;
      }
    }

    if (!globalRawBox.isEmpty()) {
      const centerOffsetX = -0.5 * (globalRawBox.max.x + globalRawBox.min.x);
      const centerOffsetY = -0.5 * (globalRawBox.max.y + globalRawBox.min.y);
      this.lettersGroup.position.x = centerOffsetX;
      this.lettersGroup.position.y = centerOffsetY;
    }

    setTimeout(() => this.store.setOversizedWarning(hasOversizedLetters));
  }

  private buildMountingSystem(settings: ProjectSettings) {
    this.backplate2DShapes = [];

    // Clear old mounting meshes
    while (this.mountingGroup.children.length > 0) {
      const child = this.mountingGroup.children[0] as THREE.Mesh;
      this.mountingGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else if (child.material) {
        child.material.dispose();
      }
    }

    const isNeon = settings.inputSource === 'neon-flex';
    if (!isNeon && (!settings.layers?.mounting || settings.mountingType === 'none')) {
      return;
    }
    if (isNeon && settings.neonBackplateStyle === 'stand-alone') {
      return;
    }

    const lettersBox = new THREE.Box3().setFromObject(this.lettersGroup);
    if (lettersBox.isEmpty()) return;

    const width = lettersBox.max.x - lettersBox.min.x;
    const height = lettersBox.max.y - lettersBox.min.y;
    const centerX = (lettersBox.min.x + lettersBox.max.x) / 2;
    const centerY = (lettersBox.min.y + lettersBox.max.y) / 2;

    const isBackplateMode = isNeon || settings.mountingType === 'backplate';

    if (isBackplateMode) {
      const padding = isNeon ? (settings.neonBackplateMargin ?? 22) : (settings.backplatePadding ?? 25);
      const thickness = isNeon ? (settings.neonBackplateThickness ?? 5) : (settings.backplateThickness ?? 5);
      const standoffGap = isNeon ? 15 : (settings.backplateStandoffGap ?? 15);
      const shapeType = isNeon ? (settings.neonBackplateStyle ?? 'contour') : (settings.backplateShape ?? 'contour');
      const backplateZ = isNeon ? -thickness : (-standoffGap - thickness);

      let shapes: THREE.Shape[] = [];

      const minX = lettersBox.min.x - padding;
      const maxX = lettersBox.max.x + padding;
      const minY = lettersBox.min.y - padding;
      const maxY = lettersBox.max.y + padding;
      const totalW = maxX - minX;
      const totalH = maxY - minY;

      if (shapeType === 'contour' || shapeType === 'cut-to-letter') {
        const allPaths: { X: number; Y: number }[][] = [];
        const scale = 1000;
        const groupOffsetX = this.lettersGroup.position.x;
        const groupOffsetY = this.lettersGroup.position.y;

        this.export2DShapes.forEach(d => {
          const targetShapes = d.base.length > 0 ? d.base : d.acrylic;
          targetShapes.forEach(shape => {
            const pts = shape.getPoints();
            if (pts.length > 0) {
              const path = pts.map(p => ({
                X: Math.round((p.x * d.scaleX + d.offsetX + groupOffsetX) * scale),
                Y: Math.round((p.y * d.scaleY + d.offsetY + groupOffsetY) * scale)
              }));
              if (!ClipperLib.Clipper.Orientation(path)) path.reverse();
              allPaths.push(path);
            }
          });
        });

        if (allPaths.length > 0) {
          try {
            const co = new ClipperLib.ClipperOffset();
            co.AddPaths(allPaths, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
            const solution = new ClipperLib.PolyTree();
            co.Execute(solution, padding * scale);

            shapes = this.polyTreeToShapes(solution, scale);
          } catch (e) {
            console.warn('[Viewport3D] Backplate contour offset error, falling back to rounded rect:', e);
          }
        }

        if (shapes.length === 0) {
          const rectShape = new THREE.Shape();
          const r = Math.min(isNeon ? (settings.neonBackplateCornerRadius ?? 16) : (settings.backplateCornerRadius ?? 16), totalW / 2, totalH / 2);
          rectShape.moveTo(minX + r, minY);
          rectShape.lineTo(maxX - r, minY);
          rectShape.quadraticCurveTo(maxX, minY, maxX, minY + r);
          rectShape.lineTo(maxX, maxY - r);
          rectShape.quadraticCurveTo(maxX, maxY, maxX - r, maxY);
          rectShape.lineTo(minX + r, maxY);
          rectShape.quadraticCurveTo(minX, maxY, minX, maxY - r);
          rectShape.lineTo(minX, minY + r);
          rectShape.quadraticCurveTo(minX, minY, minX + r, minY);
          shapes = [rectShape];
        }
      } else if (shapeType === 'rounded-rect') {
        const rectShape = new THREE.Shape();
        const r = Math.min(isNeon ? (settings.neonBackplateCornerRadius ?? 16) : (settings.backplateCornerRadius ?? 16), totalW / 2, totalH / 2);
        rectShape.moveTo(minX + r, minY);
        rectShape.lineTo(maxX - r, minY);
        rectShape.quadraticCurveTo(maxX, minY, maxX, minY + r);
        rectShape.lineTo(maxX, maxY - r);
        rectShape.quadraticCurveTo(maxX, maxY, maxX - r, maxY);
        rectShape.lineTo(minX + r, maxY);
        rectShape.quadraticCurveTo(minX, maxY, minX, maxY - r);
        rectShape.lineTo(minX, minY + r);
        rectShape.quadraticCurveTo(minX, minY, minX + r, minY);
        shapes = [rectShape];
      } else if (shapeType === 'capsule') {
        const capShape = new THREE.Shape();
        const r = totalH / 2;
        capShape.moveTo(minX + r, minY);
        capShape.lineTo(maxX - r, minY);
        capShape.absarc(maxX - r, centerY, r, -Math.PI / 2, Math.PI / 2, false);
        capShape.lineTo(minX + r, maxY);
        capShape.absarc(minX + r, centerY, r, Math.PI / 2, (3 * Math.PI) / 2, false);
        shapes = [capShape];
      } else if (shapeType === 'oval') {
        const ovalShape = new THREE.Shape();
        ovalShape.absellipse(centerX, centerY, totalW / 2, totalH / 2, 0, Math.PI * 2, false);
        shapes = [ovalShape];
      } else {
        const rectShape = new THREE.Shape();
        rectShape.moveTo(minX, minY);
        rectShape.lineTo(maxX, minY);
        rectShape.lineTo(maxX, maxY);
        rectShape.lineTo(minX, maxY);
        rectShape.closePath();
        shapes = [rectShape];
      }

      // Add Pre-drilled Hanging / Standoff Holes
      const holeCoords: { x: number; y: number }[] = [];
      const showHoles = isNeon ? (settings.neonBackplateHoles !== false) : settings.backplateHangingHoles;
      const holeDiam = isNeon ? (settings.neonBackplateHoleDiameter ?? 6) : (settings.backplateHoleDiameter ?? 6);
      const holeInset = isNeon ? (settings.neonBackplateHoleInset ?? 16) : (settings.backplateHoleInset ?? 18);

      if (showHoles) {
        const holeR = holeDiam / 2;
        const inset = Math.max(holeR + 4, holeInset);

        holeCoords.push(
          { x: minX + inset, y: minY + inset },
          { x: maxX - inset, y: minY + inset },
          { x: minX + inset, y: maxY - inset },
          { x: maxX - inset, y: maxY - inset }
        );

        if (totalW > 600) {
          holeCoords.push(
            { x: centerX, y: minY + inset },
            { x: centerX, y: maxY - inset }
          );
        }

        if (!isNeon && settings.backplateTopSuspensionLoops) {
          holeCoords.push(
            { x: minX + totalW * 0.3, y: maxY - inset },
            { x: minX + totalW * 0.7, y: maxY - inset }
          );
        }

        shapes.forEach(shape => {
          holeCoords.forEach(hc => {
            const holePath = new THREE.Path();
            holePath.absarc(hc.x, hc.y, holeR, 0, Math.PI * 2, true);
            shape.holes.push(holePath);
          });
        });
      }

      this.backplate2DShapes = shapes;

      // 3D Backplate Extrusion
      const backplateGeom = new THREE.ExtrudeGeometry(shapes, {
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: 0.8,
        bevelSize: 0.8,
        curveSegments: 16
      });

      let backplateMat: THREE.Material;
      const matType = isNeon ? (settings.neonBackplateMaterial || 'clear-acrylic') : (settings.backplateMaterial || 'clear-acrylic');
      const opacity = isNeon ? (settings.neonBackplateOpacity ?? 0.92) : (settings.backplateOpacity ?? 0.85);

      if (matType === 'clear-acrylic') {
        backplateMat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transmission: 0.95,
          roughness: 0.05,
          ior: 1.49,
          thickness: thickness,
          transparent: true,
          opacity: opacity,
          wireframe: this.isWireframe(),
          depthWrite: false
        });
      } else if (matType === 'frosted-acrylic') {
        backplateMat = new THREE.MeshPhysicalMaterial({
          color: 0xf1f5f9,
          transmission: 0.65,
          roughness: 0.4,
          ior: 1.45,
          thickness: thickness,
          transparent: true,
          opacity: opacity,
          wireframe: this.isWireframe()
        });
      } else if (matType === 'black-acrylic') {
        backplateMat = new THREE.MeshStandardMaterial({
          color: 0x09090b,
          roughness: 0.15,
          metalness: 0.1,
          wireframe: this.isWireframe()
        });
      } else if (matType === 'white-matte' || matType === 'gloss-white') {
        backplateMat = new THREE.MeshPhysicalMaterial({
          color: 0xf8fafc,
          roughness: matType === 'gloss-white' ? 0.05 : 0.75,
          metalness: 0.0,
          clearcoat: matType === 'gloss-white' ? 1.0 : 0.0,
          wireframe: this.isWireframe()
        });
      } else if (matType === 'mirror-silver') {
        backplateMat = new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          roughness: 0.05,
          metalness: 0.95,
          wireframe: this.isWireframe()
        });
      } else if (matType === 'mirror-gold') {
        backplateMat = new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          roughness: 0.05,
          metalness: 0.95,
          wireframe: this.isWireframe()
        });
      } else if (matType === 'brushed-aluminum') {
        backplateMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.35,
          metalness: 0.85,
          wireframe: this.isWireframe()
        });
      } else if (matType === 'wood') {
        backplateMat = new THREE.MeshStandardMaterial({
          color: 0x78350f,
          roughness: 0.65,
          metalness: 0.05,
          wireframe: this.isWireframe()
        });
      } else {
        backplateMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.4,
          metalness: 0.5,
          wireframe: this.isWireframe()
        });
      }

      const backplateMesh = new THREE.Mesh(backplateGeom, backplateMat);
      backplateMesh.position.z = backplateZ;
      backplateMesh.castShadow = true;
      backplateMesh.receiveShadow = true;
      backplateMesh.userData = { isBackplate: true, isMounting: true, partType: 'backplate' };
      this.mountingGroup.add(backplateMesh);

      // Add 3D Standoff Hardware (Barrels + Knurled Caps)
      const showStandoffs = isNeon ? (settings.neonBackplateHoles !== false) : (settings.backplateStandoffHardware && settings.backplateHangingHoles);
      if (showStandoffs && standoffGap > 0) {
        const finish = isNeon ? (settings.neonBackplateStandoffFinish || 'chrome') : (settings.backplateStandoffFinish || 'chrome');
        let standoffColor = 0xdddddd;
        let metalness = 0.95;
        let roughness = 0.1;

        if (finish === 'black') {
          standoffColor = 0x18181b;
          metalness = 0.8;
          roughness = 0.3;
        } else if (finish === 'brass') {
          standoffColor = 0xd4af37;
          metalness = 0.9;
          roughness = 0.2;
        } else if (finish === 'matte-silver') {
          standoffColor = 0xc0c5ce;
          metalness = 0.7;
          roughness = 0.4;
        }

        const standoffMat = new THREE.MeshStandardMaterial({
          color: standoffColor,
          metalness: metalness,
          roughness: roughness
        });

        const barrelR = Math.max(5, (settings.backplateHoleDiameter ?? 6) * 1.1);

        holeCoords.forEach(hc => {
          const barrelGeom = new THREE.CylinderGeometry(barrelR, barrelR, standoffGap, 24);
          const barrelMesh = new THREE.Mesh(barrelGeom, standoffMat);
          barrelMesh.rotation.x = Math.PI / 2;
          barrelMesh.position.set(hc.x, hc.y, backplateZ - (standoffGap / 2));
          barrelMesh.castShadow = true;
          barrelMesh.userData = { isMounting: true, partType: 'standoff-barrel' };
          this.mountingGroup.add(barrelMesh);

          const capGeom = new THREE.CylinderGeometry(barrelR * 1.15, barrelR * 1.15, 3, 24);
          const capMesh = new THREE.Mesh(capGeom, standoffMat);
          capMesh.rotation.x = Math.PI / 2;
          capMesh.position.set(hc.x, hc.y, backplateZ + thickness + 1.5);
          capMesh.castShadow = true;
          capMesh.userData = { isMounting: true, partType: 'standoff-cap' };
          this.mountingGroup.add(capMesh);
        });
      }

    } else if (settings.mountingType === 'bar-system') {
      const barCount = settings.barCount ?? 2;
      const barWidth = settings.barWidth ?? 25;
      const barThickness = settings.barThickness ?? 15;
      const overhang = settings.barOverhang ?? 30;
      const standoffGap = settings.barStandoffGap ?? 10;
      const profile = settings.barProfile ?? 'rect-tube';

      const railLength = width + 2 * overhang;
      const barZ = - standoffGap - barThickness / 2;

      const barMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.8,
        roughness: 0.3,
        wireframe: this.isWireframe()
      });

      const yPositions: number[] = [];
      if (barCount === 1) {
        yPositions.push(centerY);
      } else if (barCount === 2) {
        yPositions.push(lettersBox.min.y + height * 0.25, lettersBox.min.y + height * 0.75);
      } else {
        yPositions.push(
          lettersBox.min.y + height * 0.15,
          centerY,
          lettersBox.min.y + height * 0.85
        );
      }

      yPositions.forEach(yPos => {
        let railMesh: THREE.Mesh;
        if (profile === 'round-pipe') {
          const pipeGeom = new THREE.CylinderGeometry(barWidth / 2, barWidth / 2, railLength, 24);
          railMesh = new THREE.Mesh(pipeGeom, barMat);
          railMesh.rotation.z = Math.PI / 2;
        } else {
          const boxGeom = new THREE.BoxGeometry(railLength, barWidth, barThickness);
          railMesh = new THREE.Mesh(boxGeom, barMat);
        }

        railMesh.position.set(centerX, yPos, barZ);
        railMesh.castShadow = true;
        railMesh.receiveShadow = true;
        railMesh.userData = { isMounting: true, isBackplate: true, partType: 'mounting-bar' };
        this.mountingGroup.add(railMesh);

        if (settings.barWallBrackets) {
          const flangeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
          [-railLength / 2 + 10, railLength / 2 - 10].forEach(flangeX => {
            const flangeGeom = new THREE.CylinderGeometry(barWidth * 0.8, barWidth * 0.8, 4, 16);
            const flange = new THREE.Mesh(flangeGeom, flangeMat);
            flange.rotation.x = Math.PI / 2;
            flange.position.set(centerX + flangeX, yPos, barZ - barThickness / 2 - 2);
            flange.userData = { isMounting: true, isBackplate: true };
            this.mountingGroup.add(flange);
          });
        }
      });

      if (settings.barIncludeClamps) {
        const clampMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 });
        this.export2DShapes.forEach(d => {
          yPositions.forEach(yPos => {
            const clampGeom = new THREE.BoxGeometry(16, barWidth * 0.9, standoffGap + 4);
            const clamp = new THREE.Mesh(clampGeom, clampMat);
            clamp.position.set(d.offsetX + this.lettersGroup.position.x, yPos, - (standoffGap / 2));
            clamp.userData = { isMounting: true, isBackplate: true };
            this.mountingGroup.add(clamp);
          });
        });
      }

    } else if (settings.mountingType === 'raceway') {
      const racewayH = settings.racewayHeight ?? 70;
      const racewayD = settings.racewayDepth ?? 50;
      const overhang = settings.racewayOverhang ?? 20;
      const racewayW = width + 2 * overhang;

      const racewayGeom = new THREE.BoxGeometry(racewayW, racewayH, racewayD);
      const racewayMat = new THREE.MeshStandardMaterial({
        color: settings.bodyColor || '#1e293b',
        roughness: 0.4,
        metalness: 0.5,
        wireframe: this.isWireframe()
      });

      const racewayMesh = new THREE.Mesh(racewayGeom, racewayMat);
      racewayMesh.position.set(centerX, centerY, - racewayD / 2);
      racewayMesh.castShadow = true;
      racewayMesh.receiveShadow = true;
      racewayMesh.userData = { isMounting: true, isBackplate: true, partType: 'raceway' };
      this.mountingGroup.add(racewayMesh);

      const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 });
      [-racewayW / 2 - 2, racewayW / 2 + 2].forEach(capX => {
        const capGeom = new THREE.BoxGeometry(4, racewayH + 10, racewayD + 6);
        const cap = new THREE.Mesh(capGeom, capMat);
        cap.position.set(centerX + capX, centerY, - racewayD / 2);
        cap.userData = { isMounting: true, isBackplate: true };
        this.mountingGroup.add(cap);
      });

    } else if (settings.mountingType === 'desk-stand') {
      const isCurvedSign = (settings.style as string) === 'curved-sign' || (settings.style as string) === 'letra-curva';
      const basePadding = isCurvedSign ? (settings.curvedSignBasePadding ?? 20) : 20;
      const baseW = width + basePadding * 2;
      const baseD = isCurvedSign ? ((settings.curvedSignSweepDepth ?? 45) + (settings.deskStandDepth ?? 35)) : (settings.deskStandDepth ?? 80);
      const baseH = isCurvedSign ? (settings.curvedSignBaseThickness ?? 6) : (settings.deskStandHeight ?? 14);
      const lipH = isCurvedSign ? 0 : (settings.deskStandLip ?? 0);

      const standColor = isCurvedSign 
        ? new THREE.Color(settings.bodyColor || '#e2e8f0') 
        : new THREE.Color(0x0f172a);

      const standMat = new THREE.MeshStandardMaterial({
        color: standColor,
        roughness: 0.35,
        metalness: 0.05,
        wireframe: this.isWireframe()
      });

      const baseStyle = isCurvedSign ? (settings.curvedSignBaseStyle || 'rounded-rect') : 'rounded-rect';
      const rectShape = new THREE.Shape();
      const w2 = baseW / 2;
      const d2 = baseD / 2;

      if (baseStyle === 'chamfered-rect') {
        const chamfer = 12;
        rectShape.moveTo(-w2 + chamfer, -d2);
        rectShape.lineTo(w2 - chamfer, -d2);
        rectShape.lineTo(w2, -d2 + chamfer);
        rectShape.lineTo(w2, d2 - chamfer);
        rectShape.lineTo(w2 - chamfer, d2);
        rectShape.lineTo(-w2 + chamfer, d2);
        rectShape.lineTo(-w2, d2 - chamfer);
        rectShape.lineTo(-w2, -d2 + chamfer);
        rectShape.closePath();
      } else if (baseStyle === 'minimal') {
        const r = 8;
        const minW2 = (width / 2) + 10;
        rectShape.moveTo(-minW2 + r, -d2);
        rectShape.lineTo(minW2 - r, -d2);
        rectShape.quadraticCurveTo(minW2, -d2, minW2, -d2 + r);
        rectShape.lineTo(minW2, d2 - r);
        rectShape.quadraticCurveTo(minW2, d2, minW2 - r, d2);
        rectShape.lineTo(-minW2 + r, d2);
        rectShape.quadraticCurveTo(-minW2, d2, -minW2, d2 - r);
        rectShape.lineTo(-minW2, -d2 + r);
        rectShape.quadraticCurveTo(-minW2, -d2, -minW2 + r, -d2);
      } else {
        // 'rounded-rect', 'pedestal', 'arc-curved'
        const r = 14;
        rectShape.moveTo(-w2 + r, -d2);
        rectShape.lineTo(w2 - r, -d2);
        rectShape.quadraticCurveTo(w2, -d2, w2, -d2 + r);
        rectShape.lineTo(w2, d2 - r);
        rectShape.quadraticCurveTo(w2, d2, w2 - r, d2);
        rectShape.lineTo(-w2 + r, d2);
        rectShape.quadraticCurveTo(-w2, d2, -w2, d2 - r);
        rectShape.lineTo(-w2, -d2 + r);
        rectShape.quadraticCurveTo(-w2, -d2, -w2 + r, -d2);
      }

      const slabGeom = new THREE.ExtrudeGeometry(rectShape, {
        depth: baseH,
        bevelEnabled: true,
        bevelThickness: 1.5,
        bevelSize: 1.5,
        bevelSegments: 4,
        curveSegments: 16
      });

      const slabMesh = new THREE.Mesh(slabGeom, standMat);
      slabMesh.rotation.x = -Math.PI / 2;
      const slabY = isCurvedSign ? lettersBox.min.y - baseH + 0.1 : lettersBox.min.y - 2;
      const slabZ = isCurvedSign ? -25 : 0;
      slabMesh.position.set(centerX, slabY, slabZ);
      slabMesh.castShadow = true;
      slabMesh.receiveShadow = true;
      slabMesh.userData = { isMounting: true, isBackplate: true, partType: 'desk-stand' };

      // Pedestal step top tier
      if (isCurvedSign && baseStyle === 'pedestal') {
        const pedShape = new THREE.Shape();
        const pw2 = w2 - 12;
        const pd2 = d2 - 8;
        const pr = 8;
        pedShape.moveTo(-pw2 + pr, -pd2);
        pedShape.lineTo(pw2 - pr, -pd2);
        pedShape.quadraticCurveTo(pw2, -pd2, pw2, -pd2 + pr);
        pedShape.lineTo(pw2, pd2 - pr);
        pedShape.quadraticCurveTo(pw2, pd2, pw2 - pr, pd2);
        pedShape.lineTo(-pw2 + pr, pd2);
        pedShape.quadraticCurveTo(-pw2, pd2, -pw2, pd2 - pr);
        pedShape.lineTo(-pw2, -pd2 + pr);
        pedShape.quadraticCurveTo(-pw2, -pd2, -pw2 + pr, -pd2);

        const pedGeom = new THREE.ExtrudeGeometry(pedShape, {
          depth: 3,
          bevelEnabled: true,
          bevelThickness: 1,
          bevelSize: 1,
          bevelSegments: 3
        });
        const pedMesh = new THREE.Mesh(pedGeom, standMat);
        pedMesh.position.set(0, 0, baseH);
        slabMesh.add(pedMesh);
      }

      // Hidden Underside Text
      if (isCurvedSign && settings.curvedSignHiddenText && settings.curvedSignHiddenText.trim() && this.font) {
        try {
          const textStr = settings.curvedSignHiddenText.trim();
          const hiddenShapes = this.font.generateShapes(textStr, 8);
          if (hiddenShapes && hiddenShapes.length > 0) {
            const hiddenGeom = new THREE.ExtrudeGeometry(hiddenShapes, { depth: 1.2, bevelEnabled: false });
            hiddenGeom.computeBoundingBox();
            const hbb = hiddenGeom.boundingBox!;
            const hw = hbb.max.x - hbb.min.x;
            const hh = hbb.max.y - hbb.min.y;

            const hiddenMat = new THREE.MeshStandardMaterial({
              color: 0x334155,
              roughness: 0.5,
              metalness: 0.1
            });

            const hiddenMesh = new THREE.Mesh(hiddenGeom, hiddenMat);
            hiddenMesh.rotation.x = Math.PI;
            hiddenMesh.position.set(-hw / 2, baseH + 0.1, hh / 2);
            slabMesh.add(hiddenMesh);
          }
        } catch (e) {
          console.warn('Could not generate hidden text:', e);
        }
      }

      // Magnet Socket Sockets
      if (isCurvedSign && settings.curvedSignMagnets) {
        const magMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.9 });
        const magGeom = new THREE.CylinderGeometry(4, 4, 3, 24);
        
        [-baseW / 3, baseW / 3].forEach(xOff => {
          const magMesh = new THREE.Mesh(magGeom, magMat);
          magMesh.rotation.x = Math.PI / 2;
          magMesh.position.set(xOff, 0, baseH - 1.5);
          slabMesh.add(magMesh);
        });
      }

      this.mountingGroup.add(slabMesh);

      if (lipH > 0) {
        const lipGeom = new THREE.BoxGeometry(baseW, lipH, 6);
        const lipMesh = new THREE.Mesh(lipGeom, standMat);
        lipMesh.position.set(centerX, lettersBox.min.y + lipH / 2 + 4, baseD / 2 - 3);
        lipMesh.castShadow = true;
        lipMesh.userData = { isMounting: true, isBackplate: true };
        this.mountingGroup.add(lipMesh);
      }
    }
  }

  setTopView() {
    this.store.updateSettings({ cameraType: 'orthographic' });
    this.syncCameraType('orthographic');

    const isSimulation = this.store.activeTab() === 'simulation';
    const box = new THREE.Box3().setFromObject(this.lettersGroup);

    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let frustumSize = 600;

    if (!box.isEmpty()) {
      const center = new THREE.Vector3();
      box.getCenter(center);
      targetX = center.x;
      targetY = center.y;
      targetZ = center.z;

      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, isSimulation ? size.y : size.z);
      if (maxDim > 10) {
        frustumSize = Math.max(150, maxDim * 1.35);
      }
    }

    const container = this.canvasContainer?.nativeElement;
    const width = container?.clientWidth || 1280;
    const height = container?.clientHeight || 720;
    const aspect = width / height;

    this.orthoFrustumSize = frustumSize;
    this.orthographicCamera.left = -aspect * frustumSize / 2;
    this.orthographicCamera.right = aspect * frustumSize / 2;
    this.orthographicCamera.top = frustumSize / 2;
    this.orthographicCamera.bottom = -frustumSize / 2;

    if (isSimulation) {
      this.orthographicCamera.position.set(targetX, targetY, targetZ + 1000);
      this.orthographicCamera.up.set(0, 1, 0);
    } else {
      this.orthographicCamera.position.set(targetX, targetY + 1000, targetZ);
      this.orthographicCamera.up.set(0, 0, -1);
    }

    this.orthographicCamera.updateProjectionMatrix();

    if (this.controls) {
      this.controls.target.set(targetX, targetY, targetZ);
      this.controls.update();
    }
  }

  resetView() {
    if (this.camera instanceof THREE.OrthographicCamera) {
      const container = this.canvasContainer.nativeElement;
      const aspect = (container.clientWidth || 1280) / (container.clientHeight || 720);
      this.orthoFrustumSize = 1000;
      this.camera.left = -aspect * this.orthoFrustumSize / 2;
      this.camera.right = aspect * this.orthoFrustumSize / 2;
      this.camera.top = this.orthoFrustumSize / 2;
      this.camera.bottom = -this.orthoFrustumSize / 2;
      this.camera.updateProjectionMatrix();
    }
    this.camera.position.set(0, 300, 1000);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  toggleWireframe() {
    this.isWireframe.update(v => !v);
    this.rebuildGeometry(this.store.settings());
  }

  takeSnapshot = () => {
    if (!this.renderer || !this.scene || !this.camera || !this.isBrowser) return;

    const container = this.canvasContainer.nativeElement;
    const currentWidth = container.clientWidth || 1280;
    const currentHeight = container.clientHeight || 720;
    const currentPixelRatio = this.renderer.getPixelRatio();

    // Temporarily hide interactive hole preview helper
    const holePreviewWasVisible = this.holePreview ? this.holePreview.visible : false;
    if (this.holePreview) this.holePreview.visible = false;

    // Scale up for crisp 4K / high-res output
    const scaleFactor = 2;
    const targetWidth = Math.max(2560, Math.round(currentWidth * scaleFactor));
    const targetHeight = Math.max(1440, Math.round(currentHeight * scaleFactor));

    // Update aspect & size
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = targetWidth / targetHeight;
      this.camera.updateProjectionMatrix();
    } else if (this.camera instanceof THREE.OrthographicCamera) {
      const snapAspect = targetWidth / targetHeight;
      this.camera.left = -snapAspect * this.orthoFrustumSize / 2;
      this.camera.right = snapAspect * this.orthoFrustumSize / 2;
      this.camera.top = this.orthoFrustumSize / 2;
      this.camera.bottom = -this.orthoFrustumSize / 2;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.setSize(targetWidth, targetHeight, false);
    this.renderer.setPixelRatio(1);

    // Render offscreen frame
    this.renderer.render(this.scene, this.camera);

    // Extract high resolution image data
    const dataUrl = this.renderer.domElement.toDataURL('image/png', 1.0);

    // Restore original aspect & viewport size
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = currentWidth / currentHeight;
      this.camera.updateProjectionMatrix();
    } else if (this.camera instanceof THREE.OrthographicCamera) {
      const origAspect = currentWidth / currentHeight;
      this.camera.left = -origAspect * this.orthoFrustumSize / 2;
      this.camera.right = origAspect * this.orthoFrustumSize / 2;
      this.camera.top = this.orthoFrustumSize / 2;
      this.camera.bottom = -this.orthoFrustumSize / 2;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.setSize(currentWidth, currentHeight, false);
    this.renderer.setPixelRatio(currentPixelRatio);
    this.renderer.render(this.scene, this.camera);

    if (this.holePreview) this.holePreview.visible = holePreviewWasVisible;

    // Generate filename
    const settings = this.store.settings();
    const rawName = settings.inputSource === 'text' ? (settings.text || 'sign') : 'sign-project';
    const sanitized = rawName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24) || 'mcut-sign';
    const filename = `mcut-${sanitized}-snapshot.png`;

    // Trigger download
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Shutter animation flash & toast notification
    this.isFlashing.set(true);
    setTimeout(() => this.isFlashing.set(false), 200);

    this.toastMessage.set(`Snapshot exported: ${filename} (${targetWidth}x${targetHeight}px)`);
    setTimeout(() => this.toastMessage.set(null), 3500);
  };

  private triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private safeMergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
    if (!geometries || geometries.length === 0) return null;
    if (geometries.length === 1) return geometries[0].clone();

    const allPositions: number[] = [];
    const allIndices: number[] = [];
    let vertexOffset = 0;

    for (const geom of geometries) {
      const posAttr = geom.getAttribute('position');
      if (!posAttr || posAttr.count === 0) continue;

      for (let i = 0; i < posAttr.count; i++) {
        allPositions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      }

      const indexAttr = geom.getIndex();
      if (indexAttr) {
        for (let i = 0; i < indexAttr.count; i++) {
          allIndices.push(indexAttr.getX(i) + vertexOffset);
        }
      } else {
        for (let i = 0; i < posAttr.count; i++) {
          allIndices.push(i + vertexOffset);
        }
      }

      vertexOffset += posAttr.count;
    }

    if (allPositions.length === 0) return null;

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3));
    if (allIndices.length > 0) {
      if (vertexOffset > 65535) {
        merged.setIndex(new THREE.Uint32BufferAttribute(allIndices, 1));
      } else {
        merged.setIndex(new THREE.Uint16BufferAttribute(allIndices, 1));
      }
    }
    merged.computeVertexNormals();
    return merged;
  }

  private async export3MF(
    items: { name: string; letterChar?: string; letterIndex?: number; mesh: THREE.Mesh }[],
    filename: string
  ) {
    const zip = new JSZip();

    let objectsXml = '';
    let buildItemsXml = '';
    let objectIdCounter = 1;

    for (const item of items) {
      const geom = item.mesh?.geometry;
      if (!geom) continue;

      const posAttr = geom.getAttribute('position');
      if (!posAttr || posAttr.count === 0) continue;

      let verticesXml = '';
      let trianglesXml = '';
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        const x = Number(posAttr.getX(i)).toFixed(4);
        const y = Number(posAttr.getY(i)).toFixed(4);
        const z = Number(posAttr.getZ(i)).toFixed(4);
        verticesXml += `\n        <vertex x="${x}" y="${y}" z="${z}"/>`;
      }

      const indexAttr = geom.getIndex();
      if (indexAttr) {
        const triCount = Math.floor(indexAttr.count / 3);
        for (let i = 0; i < triCount; i++) {
          const v1 = indexAttr.getX(i * 3);
          const v2 = indexAttr.getX(i * 3 + 1);
          const v3 = indexAttr.getX(i * 3 + 2);
          trianglesXml += `\n        <triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`;
        }
      } else {
        const triCount = Math.floor(count / 3);
        for (let i = 0; i < triCount; i++) {
          const v1 = i * 3;
          const v2 = i * 3 + 1;
          const v3 = i * 3 + 2;
          trianglesXml += `\n        <triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`;
        }
      }

      if (trianglesXml.length > 0) {
        const objectId = objectIdCounter++;
        const safeName = item.name.replace(/["&'<>]/g, '_');
        objectsXml += `\n    <object id="${objectId}" type="model" name="${safeName}">\n      <mesh>\n        <vertices>${verticesXml}\n        </vertices>\n        <triangles>${trianglesXml}\n        </triangles>\n      </mesh>\n    </object>`;
        buildItemsXml += `\n    <item objectid="${objectId}"/>`;
      }
    }

    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>${objectsXml}
  </resources>
  <build>${buildItemsXml}
  </build>
</model>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

    zip.file('[Content_Types].xml', contentTypesXml);
    zip.folder('_rels')?.file('.rels', relsXml);
    zip.folder('3D')?.file('3dmodel.model', modelXml);

    const blob = await zip.generateAsync({ type: 'blob' });
    this.triggerDownload(blob, filename);
  }

  exportSTL = async (event?: Event) => {
    const customEvt = event as CustomEvent<{
      mode?: 'all' | 'body' | 'acrylic' | 'backplate';
      format?: 'zip-letters' | 'zip-parts' | '3mf' | 'ascii-multisolid' | 'combined-stl';
    }>;
    const mode = customEvt?.detail?.mode || 'body';
    const format = customEvt?.detail?.format || 'zip-letters';

    this.lettersGroup.updateMatrixWorld(true);
    const invLettersMatrix = this.lettersGroup.matrixWorld.clone().invert();

    interface ExportPartItem {
      name: string;
      letterChar: string;
      letterIndex: number;
      partType: string;
      mesh: THREE.Mesh;
    }

    const items: ExportPartItem[] = [];

    if (mode !== 'backplate') {
      this.lettersGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.geometry) {
          if (obj === this.holePreview || obj.userData?.['isLedModule']) return;

          const isAcrylic = obj.userData?.['isAcrylic'] === true || obj.userData?.['partType'] === 'acrylic' || obj.material?.userData?.['isAcrylic'] === true;
          const isBody = obj.userData?.['isBody'] === true || (!isAcrylic && obj.userData?.['partType'] !== 'acrylic');

          let shouldInclude = false;
          if (mode === 'all') shouldInclude = true;
          else if (mode === 'body') shouldInclude = isBody && !isAcrylic;
          else if (mode === 'acrylic') shouldInclude = isAcrylic;

          if (shouldInclude) {
            const clonedGeo = obj.geometry.clone();
            obj.updateWorldMatrix(true, false);

            const matrix = obj.matrixWorld.clone();
            matrix.premultiply(invLettersMatrix);
            clonedGeo.applyMatrix4(matrix);

            // If exporting only the acrylic/diffuser faces for 3D printing, orient face-down and ground flat to Z=0 on the bed
            if (mode === 'acrylic') {
              // Place face-down on the print bed: rotate 180° around X axis so front exterior face sits on Z=0
              clonedGeo.rotateX(Math.PI);
              clonedGeo.computeBoundingBox();
              if (clonedGeo.boundingBox) {
                clonedGeo.translate(0, 0, -clonedGeo.boundingBox.min.z);
              }
            }

            const exportMesh = new THREE.Mesh(clonedGeo);

            let parentLetterGroup: THREE.Object3D | null = obj.parent;
            while (parentLetterGroup && !parentLetterGroup.userData?.['isLetterGroup'] && parentLetterGroup !== this.lettersGroup) {
              parentLetterGroup = parentLetterGroup.parent;
            }

            const char = parentLetterGroup?.userData?.['char'] || obj.userData?.['char'] || 'Shape';
            const letterIdx = parentLetterGroup?.userData?.['charIndex'] !== undefined ? parentLetterGroup.userData['charIndex'] : 0;
            const partType = obj.userData?.['partType'] || 'part';
            const shapeIdx = obj.userData?.['shapeIndex'];
            const shapeSuffix = shapeIdx !== undefined ? `_p${shapeIdx + 1}` : '';

            const name = `Letter_${letterIdx + 1}_${char}_${partType}${shapeSuffix}`;

            items.push({
              name,
              letterChar: char,
              letterIndex: letterIdx,
              partType,
              mesh: exportMesh
            });
          }
        }
      });
    }

    if (mode === 'backplate' || mode === 'all') {
      this.mountingGroup.updateMatrixWorld(true);
      this.mountingGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.geometry) {
          const clonedGeo = obj.geometry.clone();
          obj.updateWorldMatrix(true, false);
          const matrix = obj.matrixWorld.clone();
          matrix.premultiply(invLettersMatrix);
          clonedGeo.applyMatrix4(matrix);

          const exportMesh = new THREE.Mesh(clonedGeo);
          items.push({
            name: 'Mounting_Backplate',
            letterChar: 'Backplate',
            letterIndex: 999,
            partType: 'backplate',
            mesh: exportMesh
          });
        }
      });
    }

    if (items.length === 0) {
      this.toastMessage.set('No meshes available for the selected export mode.');
      setTimeout(() => this.toastMessage.set(null), 3000);
      return;
    }

    const settings = this.store.settings();
    const rawName = settings.inputSource === 'text' ? (settings.text || 'sign') : 'sign-project';
    const sanitized = rawName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) || 'mcut';
    const suffix = mode === 'body' ? 'bodies' : (mode === 'acrylic' ? 'acrylic-faces' : (mode === 'backplate' ? 'backplate' : 'assembly'));

    if (format === '3mf') {
      const filename = `mcut-${sanitized}-${suffix}-multi-object.3mf`;
      await this.export3MF(items, filename);
      this.toastMessage.set(`Exported 3MF Multi-Object Project: ${filename}`);
      setTimeout(() => this.toastMessage.set(null), 3500);
      return;
    }

    if (format === 'zip-letters') {
      const zip = new JSZip();
      const exporter = new STLExporter();

      const letterMap = new Map<number, { char: string; meshes: THREE.Mesh[] }>();
      items.forEach(item => {
        if (!letterMap.has(item.letterIndex)) {
          letterMap.set(item.letterIndex, { char: item.letterChar, meshes: [] });
        }
        letterMap.get(item.letterIndex)!.meshes.push(item.mesh);
      });

      letterMap.forEach((val, letterIndex) => {
        const geoms = val.meshes.map(m => m.geometry).filter(Boolean);
        const mergedGeom = this.safeMergeBufferGeometries(geoms);
        
        let exportObj: THREE.Object3D;
        if (mergedGeom) {
          exportObj = new THREE.Mesh(mergedGeom);
        } else {
          const letterGroup = new THREE.Group();
          val.meshes.forEach(m => letterGroup.add(m));
          exportObj = letterGroup;
        }

        const stlBuffer = exporter.parse(exportObj, { binary: true });
        const padIdx = String(letterIndex + 1).padStart(2, '0');
        const safeChar = val.char.replace(/[^a-zA-Z0-9]/g, '_');
        const stlData = stlBuffer instanceof DataView ? stlBuffer.buffer : stlBuffer;
        zip.file(`${padIdx}_letter_${safeChar}_${suffix}.stl`, stlData as ArrayBuffer);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const filename = `mcut-${sanitized}-${suffix}-per-letter.zip`;
      this.triggerDownload(zipBlob, filename);
      this.toastMessage.set(`Exported ZIP with Single Solid STLs per Letter: ${filename}`);
      setTimeout(() => this.toastMessage.set(null), 3500);
      return;
    }

    if (format === 'zip-parts') {
      const zip = new JSZip();
      const exporter = new STLExporter();

      items.forEach((item, idx) => {
        const singleGroup = new THREE.Group();
        singleGroup.add(item.mesh);
        const stlBuffer = exporter.parse(singleGroup, { binary: true });
        const padIdx = String(idx + 1).padStart(2, '0');
        const stlData = stlBuffer instanceof DataView ? stlBuffer.buffer : stlBuffer;
        zip.file(`${padIdx}_${item.name}.stl`, stlData as ArrayBuffer);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const filename = `mcut-${sanitized}-${suffix}-separate-parts.zip`;
      this.triggerDownload(zipBlob, filename);
      this.toastMessage.set(`Exported ZIP with Separate Part STLs: ${filename}`);
      setTimeout(() => this.toastMessage.set(null), 3500);
      return;
    }

    if (format === 'ascii-multisolid') {
      const exporter = new STLExporter();
      let multiSolidStl = '';

      items.forEach(item => {
        const singleGroup = new THREE.Group();
        singleGroup.add(item.mesh);
        const asciiText = exporter.parse(singleGroup, { binary: false }) as string;
        const customSolid = asciiText
          .replace(/^solid\s+.*$/m, `solid ${item.name}`)
          .replace(/^endsolid\s+.*$/m, `endsolid ${item.name}`);
        multiSolidStl += customSolid + '\n';
      });

      const blob = new Blob([multiSolidStl], { type: 'text/plain' });
      const filename = `mcut-${sanitized}-${suffix}-multi-solid.stl`;
      this.triggerDownload(blob, filename);
      this.toastMessage.set(`Exported Multi-Solid ASCII STL: ${filename}`);
      setTimeout(() => this.toastMessage.set(null), 3500);
      return;
    }

    // Default: Single Combined Binary STL (all parts merged into one solid object)
    const allGeoms = items.map(i => i.mesh.geometry).filter(Boolean);
    const combinedGeom = this.safeMergeBufferGeometries(allGeoms);

    let exportRoot: THREE.Object3D;
    if (combinedGeom) {
      exportRoot = new THREE.Mesh(combinedGeom);
    } else {
      exportRoot = new THREE.Group();
      items.forEach(item => exportRoot.add(item.mesh));
    }

    const exporter = new STLExporter();
    const stlData = exporter.parse(exportRoot, { binary: true });
    const blob = new Blob([stlData], { type: 'application/octet-stream' });
    const filename = `mcut-${sanitized}-${suffix}-combined.stl`;
    this.triggerDownload(blob, filename);
    this.toastMessage.set(`Exported Combined Solid STL: ${filename}`);
    setTimeout(() => this.toastMessage.set(null), 3500);
  };

  private generateDXFFromPolygons(polygons: { points: { x: number; y: number }[]; isHole?: boolean }[], layerName = 'CUT'): string {
    let dxf = '0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n';
    dxf += '0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n1\n0\nLAYER\n2\n' + layerName + '\n70\n0\n62\n7\n6\nCONTINUOUS\n0\nENDTAB\n0\nENDSEC\n';
    dxf += '0\nSECTION\n2\nENTITIES\n';

    polygons.forEach(poly => {
      const pts = poly.points;
      if (pts.length < 2) return;
      dxf += '0\nLWPOLYLINE\n8\n' + layerName + '\n90\n' + pts.length + '\n70\n1\n43\n0.0\n';
      pts.forEach(p => {
        dxf += `10\n${p.x.toFixed(4)}\n20\n${p.y.toFixed(4)}\n`;
      });
    });

    dxf += '0\nENDSEC\n0\nEOF\n';
    return dxf;
  }

  exportSVGAcrylic = (e?: Event) => {
    const custom = e as CustomEvent<{ format?: 'combined' | 'zip-letters' | 'dxf' }>;
    this.exportSVG('acrylic', custom?.detail?.format || 'combined');
  };

  exportSVGBase = (e?: Event) => {
    const custom = e as CustomEvent<{ format?: 'combined' | 'zip-letters' | 'dxf' }>;
    this.exportSVG('base', custom?.detail?.format || 'combined');
  };

  exportSVGBackplate = (e?: Event) => {
    if (this.backplate2DShapes.length === 0) {
      this.toastMessage.set('No backplate shape currently generated to export.');
      setTimeout(() => this.toastMessage.set(null), 3000);
      return;
    }

    const custom = e as CustomEvent<{ format?: 'combined' | 'dxf' }>;
    const format = custom?.detail?.format || 'combined';
    const sanitized = (this.store.settings().text || 'sign').trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (format === 'dxf') {
      const allPolys: { points: { x: number; y: number }[]; isHole?: boolean }[] = [];
      this.backplate2DShapes.forEach(shape => {
        const outerPts = shape.getPoints();
        if (outerPts.length > 0) {
          allPolys.push({
            points: outerPts.map(p => ({ x: p.x, y: p.y })),
            isHole: false
          });
        }
        shape.holes.forEach(hole => {
          const holePts = hole.getPoints();
          if (holePts.length > 0) {
            allPolys.push({
              points: holePts.map(p => ({ x: p.x, y: p.y })),
              isHole: true
            });
          }
        });
      });

      const dxfContent = this.generateDXFFromPolygons(allPolys, 'BACKPLATE_CUT');
      const blob = new Blob([dxfContent], { type: 'application/dxf' });
      const filename = `mcut-${sanitized}-backplate-1to1-precision.dxf`;
      this.triggerDownload(blob, filename);
      this.toastMessage.set(`Exported 1:1 Backplate DXF: ${filename}`);
      setTimeout(() => this.toastMessage.set(null), 3500);
      return;
    }

    let pathData = '';
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.backplate2DShapes.forEach(shape => {
      const points = shape.getPoints();
      if (points.length === 0) return;

      points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (-p.y < minY) minY = -p.y;
        if (-p.y > maxY) maxY = -p.y;
      });

      pathData += `M ${points[0].x.toFixed(3)} ${(-points[0].y).toFixed(3)} `;
      for (let i = 1; i < points.length; i++) {
        pathData += `L ${points[i].x.toFixed(3)} ${(-points[i].y).toFixed(3)} `;
      }
      pathData += 'Z ';

      shape.holes.forEach(hole => {
        const hp = hole.getPoints();
        if (hp.length === 0) return;
        hp.forEach(p => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (-p.y < minY) minY = -p.y;
          if (-p.y > maxY) maxY = -p.y;
        });
        pathData += `M ${hp[0].x.toFixed(3)} ${(-hp[0].y).toFixed(3)} `;
        for (let i = 1; i < hp.length; i++) {
          pathData += `L ${hp[i].x.toFixed(3)} ${(-hp[i].y).toFixed(3)} `;
        }
        pathData += 'Z ';
      });
    });

    if (minX === Infinity) return;

    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const padding = 15;
    const vbMinX = minX - padding;
    const vbMinY = minY - padding;
    const vbWidth = width + padding * 2;
    const vbHeight = height + padding * 2;

    const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg viewBox="${vbMinX.toFixed(3)} ${vbMinY.toFixed(3)} ${vbWidth.toFixed(3)} ${vbHeight.toFixed(3)}" width="${vbWidth.toFixed(3)}mm" height="${vbHeight.toFixed(3)}mm" xmlns="http://www.w3.org/2000/svg">
  <!-- MCUT Sign Backplate Laser Cut Vector with Pre-Drilled Standoff Holes -->
  <!-- Dimensions: ${width.toFixed(2)}mm (W) x ${height.toFixed(2)}mm (H) -->
  <!-- 1 coordinate unit = 1.000 mm (True 1:1 Scale) -->
  <path d="${pathData.trim()}" fill="none" stroke="#dc2626" stroke-width="0.2" />
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const filename = `mcut-${sanitized}-backplate-1to1-precision.svg`;
    this.triggerDownload(blob, filename);
    this.toastMessage.set(`Exported: ${filename} (1:1 Laser Vector)`);
    setTimeout(() => this.toastMessage.set(null), 3500);
  };

  exportSVG = async (layer: 'acrylic' | 'base' = 'acrylic', format: 'combined' | 'zip-letters' | 'dxf' = 'combined') => {
    if (!this.export2DShapes || this.export2DShapes.length === 0) {
      this.toastMessage.set('No letters generated to export.');
      setTimeout(() => this.toastMessage.set(null), 3000);
      return;
    }

    const groupOffsetX = this.lettersGroup.position.x;
    const groupOffsetY = this.lettersGroup.position.y;
    const sanitized = (this.store.settings().text || 'sign').trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Helper to transform a point into sign coordinates
    const transformPt = (pt: THREE.Vector2, d: { scaleX: number; scaleY: number; offsetX: number; offsetY: number; rotation?: number }) => {
      const cosR = Math.cos(d.rotation || 0);
      const sinR = Math.sin(d.rotation || 0);
      const rx = (pt.x * cosR - pt.y * sinR) * d.scaleX;
      const ry = (pt.x * sinR + pt.y * cosR) * d.scaleY;
      return {
        signX: rx + d.offsetX + groupOffsetX,
        signY: -(ry + d.offsetY + groupOffsetY), // SVG +Y is down
        dxfX: rx + d.offsetX + groupOffsetX,
        dxfY: ry + d.offsetY + groupOffsetY,    // DXF +Y is up (standard Cartesian mm)
        localX: rx,
        localY: -ry
      };
    };

    if (format === 'dxf') {
      const allPolys: { points: { x: number; y: number }[]; isHole?: boolean }[] = [];
      this.export2DShapes.forEach(d => {
        const targetShapes = layer === 'acrylic' ? d.acrylic : d.base;
        targetShapes.forEach(shape => {
          const outerPts = shape.getPoints();
          if (outerPts.length > 0) {
            allPolys.push({
              points: outerPts.map(p => {
                const t = transformPt(p, d);
                return { x: t.dxfX, y: t.dxfY };
              }),
              isHole: false
            });
          }
          shape.holes.forEach(hole => {
            const holePts = hole.getPoints();
            if (holePts.length > 0) {
              allPolys.push({
                points: holePts.map(p => {
                  const t = transformPt(p, d);
                  return { x: t.dxfX, y: t.dxfY };
                }),
                isHole: true
              });
            }
          });
        });
      });

      if (allPolys.length === 0) return;
      const dxfContent = this.generateDXFFromPolygons(allPolys, `${layer.toUpperCase()}_CUT`);
      const blob = new Blob([dxfContent], { type: 'application/dxf' });
      const filename = `mcut-${sanitized}-${layer}-1to1-precision.dxf`;
      this.triggerDownload(blob, filename);
      this.toastMessage.set(`Exported 1:1 Precision DXF: ${filename}`);
      setTimeout(() => this.toastMessage.set(null), 3500);
      return;
    }

    if (format === 'zip-letters') {
      const zip = new JSZip();
      let exportedCount = 0;

      this.export2DShapes.forEach((d, idx) => {
        const targetShapes = layer === 'acrylic' ? d.acrylic : d.base;
        if (targetShapes.length === 0) return;

        let letterMinX = Infinity, letterMinY = Infinity;
        let letterMaxX = -Infinity, letterMaxY = -Infinity;
        let letterPath = '';

        targetShapes.forEach(shape => {
          const outerPts = shape.getPoints();
          if (outerPts.length === 0) return;

          const ptsTransformed = outerPts.map(p => transformPt(p, d));
          ptsTransformed.forEach(p => {
            if (p.signX < letterMinX) letterMinX = p.signX;
            if (p.signX > letterMaxX) letterMaxX = p.signX;
            if (p.signY < letterMinY) letterMinY = p.signY;
            if (p.signY > letterMaxY) letterMaxY = p.signY;
          });

          letterPath += `M ${ptsTransformed[0].signX.toFixed(3)} ${ptsTransformed[0].signY.toFixed(3)} `;
          for (let i = 1; i < ptsTransformed.length; i++) {
            letterPath += `L ${ptsTransformed[i].signX.toFixed(3)} ${ptsTransformed[i].signY.toFixed(3)} `;
          }
          letterPath += 'Z ';

          shape.holes.forEach(hole => {
            const holePts = hole.getPoints();
            if (holePts.length === 0) return;
            const hTransformed = holePts.map(p => transformPt(p, d));
            hTransformed.forEach(p => {
              if (p.signX < letterMinX) letterMinX = p.signX;
              if (p.signX > letterMaxX) letterMaxX = p.signX;
              if (p.signY < letterMinY) letterMinY = p.signY;
              if (p.signY > letterMaxY) letterMaxY = p.signY;
            });

            letterPath += `M ${hTransformed[0].signX.toFixed(3)} ${hTransformed[0].signY.toFixed(3)} `;
            for (let i = 1; i < hTransformed.length; i++) {
              letterPath += `L ${hTransformed[i].signX.toFixed(3)} ${hTransformed[i].signY.toFixed(3)} `;
            }
            letterPath += 'Z ';
          });
        });

        if (letterMinX === Infinity) return;

        const lWidth = Math.max(1, letterMaxX - letterMinX);
        const lHeight = Math.max(1, letterMaxY - letterMinY);
        const pad = 5;
        const vbMinX = letterMinX - pad;
        const vbMinY = letterMinY - pad;
        const vbWidth = lWidth + pad * 2;
        const vbHeight = lHeight + pad * 2;

        const charLabel = (d.char || `Letter_${idx + 1}`).trim().replace(/[^a-z0-9]/gi, '_');
        const padIdx = String(idx + 1).padStart(2, '0');

        const letterSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg viewBox="${vbMinX.toFixed(3)} ${vbMinY.toFixed(3)} ${vbWidth.toFixed(3)} ${vbHeight.toFixed(3)}" width="${vbWidth.toFixed(3)}mm" height="${vbHeight.toFixed(3)}mm" xmlns="http://www.w3.org/2000/svg">
  <!-- MCUT Precision 1:1 Scale Vector | Letter ${d.char || idx + 1} (${layer.toUpperCase()}) -->
  <!-- Bounding Dimensions: ${lWidth.toFixed(2)}mm (W) x ${lHeight.toFixed(2)}mm (H) -->
  <!-- 1 coordinate unit = 1.000 mm (True Physical Scale) -->
  <path d="${letterPath.trim()}" fill="none" stroke="${layer === 'acrylic' ? '#059669' : '#7c3aed'}" stroke-width="0.2" />
</svg>`;

        zip.file(`${padIdx}_Letter_${charLabel}_${layer}.svg`, letterSvg);
        exportedCount++;
      });

      if (exportedCount === 0) return;
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const filename = `mcut-${sanitized}-${layer}-per-letter-svgs.zip`;
      this.triggerDownload(zipBlob, filename);
      this.toastMessage.set(`Exported ZIP with 1:1 SVGs per Letter: ${filename}`);
      setTimeout(() => this.toastMessage.set(null), 3500);
      return;
    }

    // Default 'combined' format: All letters in single 1:1 scale SVG
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    let pathData = '';

    this.export2DShapes.forEach(d => {
      const targetShapes = layer === 'acrylic' ? d.acrylic : d.base;
      targetShapes.forEach(shape => {
        const points = shape.getPoints();
        if (points.length === 0) return;

        const ptsTransformed = points.map(p => transformPt(p, d));
        ptsTransformed.forEach(p => {
          if (p.signX < minX) minX = p.signX;
          if (p.signX > maxX) maxX = p.signX;
          if (p.signY < minY) minY = p.signY;
          if (p.signY > maxY) maxY = p.signY;
        });

        pathData += `M ${ptsTransformed[0].signX.toFixed(3)} ${ptsTransformed[0].signY.toFixed(3)} `;
        for (let i = 1; i < ptsTransformed.length; i++) {
          pathData += `L ${ptsTransformed[i].signX.toFixed(3)} ${ptsTransformed[i].signY.toFixed(3)} `;
        }
        pathData += 'Z ';

        shape.holes.forEach(hole => {
          const holePoints = hole.getPoints();
          if (holePoints.length === 0) return;
          const hTransformed = holePoints.map(p => transformPt(p, d));
          hTransformed.forEach(p => {
            if (p.signX < minX) minX = p.signX;
            if (p.signX > maxX) maxX = p.signX;
            if (p.signY < minY) minY = p.signY;
            if (p.signY > maxY) maxY = p.signY;
          });

          pathData += `M ${hTransformed[0].signX.toFixed(3)} ${hTransformed[0].signY.toFixed(3)} `;
          for (let i = 1; i < hTransformed.length; i++) {
            pathData += `L ${hTransformed[i].signX.toFixed(3)} ${hTransformed[i].signY.toFixed(3)} `;
          }
          pathData += 'Z ';
        });
      });
    });

    if (minX === Infinity) return;

    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const padding = 10;
    const vbMinX = minX - padding;
    const vbMinY = minY - padding;
    const vbWidth = width + padding * 2;
    const vbHeight = height + padding * 2;

    const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg viewBox="${vbMinX.toFixed(3)} ${vbMinY.toFixed(3)} ${vbWidth.toFixed(3)} ${vbHeight.toFixed(3)}" width="${vbWidth.toFixed(3)}mm" height="${vbHeight.toFixed(3)}mm" xmlns="http://www.w3.org/2000/svg">
  <!-- MCUT Precision 1:1 Scale Vector | Layer: ${layer.toUpperCase()} -->
  <!-- Total Dimensions: ${width.toFixed(2)}mm (W) x ${height.toFixed(2)}mm (H) -->
  <!-- 1 coordinate unit = 1.000 mm (True Physical Scale for Laser Cutters & CNC) -->
  <path d="${pathData.trim()}" fill="none" stroke="${layer === 'acrylic' ? '#059669' : '#7c3aed'}" stroke-width="0.2" />
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const filename = `mcut-${sanitized}-${layer}-1to1-precision.svg`;
    this.triggerDownload(blob, filename);
    this.toastMessage.set(`Exported 1:1 Precision SVG: ${filename}`);
    setTimeout(() => this.toastMessage.set(null), 3500);
  };

  dispatchTemplateData = () => {
    let pathData = '';
    let ledGuideData = '';
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const groupOffsetX = this.lettersGroup.position.x;
    const groupOffsetY = this.lettersGroup.position.y;

    const processPoint = (pt: THREE.Vector2, d: { scaleX: number; scaleY: number; offsetX: number; offsetY: number }) => {
      const x = (pt.x * d.scaleX + d.offsetX + groupOffsetX);
      const y = -(pt.y * d.scaleY + d.offsetY + groupOffsetY);

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      return { x, y };
    };

    const grommets: { x: number; y: number }[] = [];

    this.export2DShapes.forEach(d => {
      let letterMinX = Infinity, letterMaxX = -Infinity, letterMinY = Infinity, letterMaxY = -Infinity;
      const targetShapes = d.acrylic.length > 0 ? d.acrylic : d.base;

      targetShapes.forEach(shape => {
        const points = shape.getPoints();
        if (points.length === 0) return;

        const p0 = processPoint(points[0], d);
        pathData += `M ${p0.x.toFixed(3)} ${p0.y.toFixed(3)} `;
        for (let i = 1; i < points.length; i++) {
          const p = processPoint(points[i], d);
          pathData += `L ${p.x.toFixed(3)} ${p.y.toFixed(3)} `;

          if (p.x < letterMinX) letterMinX = p.x;
          if (p.x > letterMaxX) letterMaxX = p.x;
          if (p.y < letterMinY) letterMinY = p.y;
          if (p.y > letterMaxY) letterMaxY = p.y;
        }
        pathData += 'Z ';

        shape.holes.forEach(hole => {
          const holePoints = hole.getPoints();
          if (holePoints.length === 0) return;
          const h0 = processPoint(holePoints[0], d);
          pathData += `M ${h0.x.toFixed(3)} ${h0.y.toFixed(3)} `;
          for (let i = 1; i < holePoints.length; i++) {
            const p = processPoint(holePoints[i], d);
            pathData += `L ${p.x.toFixed(3)} ${p.y.toFixed(3)} `;
          }
          pathData += 'Z ';
        });
      });

      if (letterMinX !== Infinity) {
        // Wire grommet at bottom center of letter
        const grommetX = (letterMinX + letterMaxX) / 2;
        const grommetY = letterMaxY - 10;
        grommets.push({ x: grommetX, y: grommetY });

        // Simple LED guide path
        const midY = (letterMinY + letterMaxY) / 2;
        ledGuideData += `M ${(letterMinX + 8).toFixed(1)} ${midY.toFixed(1)} L ${(letterMaxX - 8).toFixed(1)} ${midY.toFixed(1)} `;
      }
    });

    const customHoles = (this.store.settings().customHoles || []).map(h => ({
      ...h,
      x: h.x + groupOffsetX,
      y: -(h.y + groupOffsetY)
    }));

    const ledModules = (this.store.settings().customLeds || this.currentAutoLedsCache || []).map(l => ({
      x: l.x + groupOffsetX,
      y: -(l.y + groupOffsetY)
    }));

    if (minX === Infinity) {
      minX = -150; maxX = 150; minY = -50; maxY = 50;
    }

    window.dispatchEvent(new CustomEvent('installation-template-data', {
      detail: {
        letterPath: pathData,
        ledGuidePath: ledGuideData,
        holes: customHoles,
        grommets: grommets,
        ledModules: ledModules,
        bounds: { minX, maxX, minY, maxY }
      }
    }));
  };

  private onResize = () => {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const aspect = width / height;

    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    } else if (this.camera instanceof THREE.OrthographicCamera) {
      this.camera.left = -aspect * this.orthoFrustumSize / 2;
      this.camera.right = aspect * this.orthoFrustumSize / 2;
      this.camera.top = this.orthoFrustumSize / 2;
      this.camera.bottom = -this.orthoFrustumSize / 2;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.setSize(width, height);
  };

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    if (this.cameraAnim && this.cameraAnim.active) {
      const elapsed = performance.now() - this.cameraAnim.startTime;
      const progress = Math.min(1, elapsed / this.cameraAnim.duration);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      this.camera.position.lerpVectors(this.cameraAnim.startPos, this.cameraAnim.targetPos, ease);
      this.controls.target.lerpVectors(this.cameraAnim.startTarget, this.cameraAnim.targetLookAt, ease);
      if (progress >= 1) {
        this.cameraAnim = null;
      }
    }
    this.controls.update();

    if (this.selectionBoxHelper) {
      this.selectionBoxHelper.update();
    }

    if (this.selectedObjectGroup && this.activeLetter()) {
      const box = new THREE.Box3().setFromObject(this.selectedObjectGroup);
      const width = box.max.x - box.min.x;
      const height = box.max.z - box.min.z;
      const depth = box.max.y - box.min.y;
      const center = new THREE.Vector3();
      box.getCenter(center);
      const projected = center.clone().project(this.camera);
      const x = (projected.x * 0.5 + 0.5) * 100;
      const y = (projected.y * -0.5 + 0.5) * 100;
      const curr = this.activeLetter()!;
      if (Math.abs(curr.x - x) > 0.05 || Math.abs(curr.y - y) > 0.05) {
        this.activeLetter.set({
          char: curr.char,
          width,
          height,
          depth,
          x,
          y,
          charIndex: curr.charIndex
        });
      }
    }
    
    if (this.viewCube && this.camera) {
      const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'ZYX');
      this.viewCube.nativeElement.style.transform = `rotateX(${euler.x}rad) rotateY(${-euler.y}rad) rotateZ(${euler.z}rad)`;
    }

    this.updateDynamicLighting();
    this.renderer.render(this.scene, this.camera);
  };

  private updateWiringHarness() {
    if (!this.wiringGroup) return;
    this.wiringGroup.clear();
    this.currentAutoLedsCache = [];

    const settings = this.store.settings();
    if (!settings.showWiringDiagram || settings.inputSource === 'neon-flex') {
      this.wiringGroup.visible = false;
      return;
    }

    this.wiringGroup.visible = true;

    // Match lettersGroup transform position and orientation
    this.wiringGroup.position.copy(this.lettersGroup.position);
    this.wiringGroup.rotation.copy(this.lettersGroup.rotation);
    this.wiringGroup.scale.copy(this.lettersGroup.scale);

    if (!this.export2DShapes || this.export2DShapes.length === 0) return;

    const redWireMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // +V Bright Red Wire
    
    const grommetMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const moduleMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Bright Yellow Module Pod (exact match to user drawing)
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Bright Yellow Center Lens Dome

    // LED Strip Materials
    const stripPcbMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 }); // Flex PCB Tape
    const copperPadMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
    const smdChipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const totalBox = new THREE.Box3();
    const letterFeeds: { grommetPos: THREE.Vector3; shapeBox: THREE.Box3 }[] = [];

    // Process each letter/shape in export2DShapes
    this.export2DShapes.forEach((item) => {
      const shapes = item.base.length > 0 ? item.base : item.acrylic;
      if (!shapes || shapes.length === 0) return;

      shapes.forEach((shape) => {
        const shapeBox = new THREE.Box3();
        const contours: THREE.Vector3[][] = [];

        // Sample points along outer shape boundary
        const samplePitch = settings.ledType === 'strip' ? 12 : Math.max(20, settings.modulePitchMm || 45);
        const approxLen = shape.getLength ? shape.getLength() : 120;
        const count = Math.max(8, Math.floor(approxLen / samplePitch));

        const outerPts = shape.getSpacedPoints(count);
        const outerWorld = outerPts.map((pt) => {
          const wx = pt.x * item.scaleX + item.offsetX;
          const wy = pt.y * item.scaleY + item.offsetY;
          const vec = new THREE.Vector3(wx, wy, 2); // 2mm above backplate
          shapeBox.expandByPoint(vec);
          totalBox.expandByPoint(vec);
          return vec;
        });

        if (settings.ledType === 'strip') {
          // --- FLEXIBLE STRIP: Follow the inside contours of the letter ---
          const insetOuter = this.createInsetContour(outerWorld, 6, false);
          contours.push(insetOuter);

          if (shape.holes && shape.holes.length > 0) {
            shape.holes.forEach((hole) => {
              const hLen = hole.getLength ? hole.getLength() : 60;
              const hCount = Math.max(6, Math.floor(hLen / samplePitch));
              const hPts = hole.getSpacedPoints(hCount);
              const hWorld = hPts.map((pt) => {
                const wx = pt.x * item.scaleX + item.offsetX;
                const wy = pt.y * item.scaleY + item.offsetY;
                const vec = new THREE.Vector3(wx, wy, 2);
                shapeBox.expandByPoint(vec);
                totalBox.expandByPoint(vec);
                return vec;
              });
              const insetHole = this.createInsetContour(hWorld, 6, true);
              contours.push(insetHole);
            });
          }
        } else {
          // --- LED MODULES: Single centered stroke spine per character ---
          const spinePts = this.getLetterStrokeSpine(item.char || '', shapeBox);
          if (spinePts && spinePts.length >= 2) {
            contours.push(spinePts);
          } else {
            // Fallback for custom shapes
            const sizeX = shapeBox.max.x - shapeBox.min.x;
            const sizeY = shapeBox.max.y - shapeBox.min.y;
            const centerInset = Math.min(18, Math.max(8, Math.min(sizeX, sizeY) * 0.22));
            const rawInset = this.createInsetContour(outerWorld, centerInset, false);
            contours.push(rawInset);
          }
        }

        // Grommet / Rear passthrough hole position (bottom-center of letter backplate)
        const shapeCenter = new THREE.Vector3();
        shapeBox.getCenter(shapeCenter);
        const grommetPos = new THREE.Vector3(
          shapeCenter.x,
          shapeBox.min.y + (shapeBox.max.y - shapeBox.min.y) * 0.18,
          0
        );

        letterFeeds.push({ grommetPos, shapeBox });

        // 1. Rubber Grommet Fitting in Rear Backplate
        const grommetMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(4, 4, 3, 16),
          grommetMat
        );
        grommetMesh.rotation.x = Math.PI / 2;
        grommetMesh.position.copy(grommetPos);
        this.wiringGroup.add(grommetMesh);

        // 2. Render LEDs (Modules vs Continuous Flex Strip) matching exact contour
        contours.forEach((worldContour) => {
          if (worldContour.length < 2) return;

          const isClosed = worldContour.length > 2 && worldContour[0].distanceTo(worldContour[worldContour.length - 1]) < 12;
          const curve = new THREE.CatmullRomCurve3(worldContour, isClosed);

          if (settings.ledType === 'strip') {
            // --- FLEXIBLE LED TAPE STRIP ---
            const stripWidth = settings.stripWidthMm || 8;
            const curvePoints = curve.getSpacedPoints(Math.max(20, Math.floor(curve.getLength() / 6)));

            const stripTubeGeo = new THREE.TubeGeometry(curve, curvePoints.length, stripWidth / 2, 4, isClosed);
            const stripMesh = new THREE.Mesh(stripTubeGeo, stripPcbMat);
            this.wiringGroup.add(stripMesh);

            // Add SMD LED emitter chips + copper cut pads every ~15mm
            const chipInterval = 15;
            const totalLen = curve.getLength();
            const chipCount = Math.floor(totalLen / chipInterval);

            const chipGeo = new THREE.BoxGeometry(3, 3, 1.5);
            const padGeo = new THREE.BoxGeometry(1.5, stripWidth * 0.8, 0.5);

            for (let c = 0; c < chipCount; c++) {
              const t = c / Math.max(1, chipCount);
              const pos = curve.getPointAt(t);
              const tangent = curve.getTangentAt(t);

              const chipMesh = new THREE.Mesh(chipGeo, smdChipMat);
              chipMesh.position.set(pos.x, pos.y, pos.z + 1);
              this.wiringGroup.add(chipMesh);

              if (c % 4 === 0) {
                const padMesh = new THREE.Mesh(padGeo, copperPadMat);
                padMesh.position.set(pos.x, pos.y, pos.z + 0.5);
                padMesh.rotation.z = Math.atan2(tangent.y, tangent.x);
                this.wiringGroup.add(padMesh);
              }
            }

            // Lead wire from strip feed end into rear grommet (smooth curve)
            const startPt = worldContour[0];
            const midFeed = startPt.clone().add(grommetPos).multiplyScalar(0.5).add(new THREE.Vector3(0, -5, 0.5));
            const feedCurve = new THREE.CatmullRomCurve3([startPt, midFeed, grommetPos]);
            const feedGeo = new THREE.TubeGeometry(feedCurve, 10, 0.8, 6, false);
            this.wiringGroup.add(new THREE.Mesh(feedGeo, redWireMat));
          } else {
            // --- INDIVIDUAL WATERPROOF LED MODULES (Yellow Nodes & Bright Red Inter-Module Wires) ---
            const pitch = Math.max(35, settings.modulePitchMm || 45);
            const totalLen = curve.getLength();
            const moduleCount = Math.max(2, Math.floor(totalLen / pitch));

            // Yellow LED module disc & center lens
            const moduleGeo = new THREE.CylinderGeometry(5.5, 5.5, 2.5, 16);
            const lensGeo = new THREE.CylinderGeometry(2.5, 2.5, 1.2, 12);
            const modulePositions: THREE.Vector3[] = [];

            const customLeds = settings.customLeds;
            if (customLeds && customLeds.length > 0) {
              // Render user's custom placed / dragged LED modules
              customLeds.forEach((led) => {
                const pos = new THREE.Vector3(led.x, led.y, 2);
                modulePositions.push(pos);

                const modMesh = new THREE.Mesh(moduleGeo, moduleMat);
                modMesh.rotation.x = Math.PI / 2;
                modMesh.position.set(pos.x, pos.y, pos.z + 1.5);
                modMesh.userData = { isLedModule: true, ledId: led.id };
                this.wiringGroup.add(modMesh);

                const lensMesh = new THREE.Mesh(lensGeo, lensMat);
                lensMesh.rotation.x = Math.PI / 2;
                lensMesh.position.set(pos.x, pos.y, pos.z + 3);
                lensMesh.userData = { isLedModule: true, ledId: led.id };
                this.wiringGroup.add(lensMesh);
              });
            } else {
              // Render auto-generated stroke modules
              for (let m = 0; m <= moduleCount; m++) {
                if (m === moduleCount && isClosed) continue;
                const t = isClosed ? m / moduleCount : m / moduleCount;
                const pos = curve.getPointAt(t);

                if (modulePositions.length === 0 || modulePositions[modulePositions.length - 1].distanceTo(pos) > 6) {
                  modulePositions.push(pos);
                  const ledId = `auto_${item.char || 'x'}_${m}_${pos.x.toFixed(1)}_${pos.y.toFixed(1)}`;
                  this.currentAutoLedsCache.push({ id: ledId, x: pos.x, y: pos.y });

                  const modMesh = new THREE.Mesh(moduleGeo, moduleMat);
                  modMesh.rotation.x = Math.PI / 2;
                  modMesh.position.set(pos.x, pos.y, pos.z + 1.5);
                  modMesh.userData = { isLedModule: true, ledId: ledId };
                  this.wiringGroup.add(modMesh);

                  const lensMesh = new THREE.Mesh(lensGeo, lensMat);
                  lensMesh.rotation.x = Math.PI / 2;
                  lensMesh.position.set(pos.x, pos.y, pos.z + 3);
                  lensMesh.userData = { isLedModule: true, ledId: ledId };
                  this.wiringGroup.add(lensMesh);
                }
              }
            }

            // Optical diffusion beam cones and beam spread footprint visualization
            if (settings.showDiffusionHeatmap && modulePositions.length > 0) {
              const diff = this.store.getDiffusionAnalysis();
              const halfAngleRad = ((diff.beamAngle / 2) * Math.PI) / 180;
              const coneHeight = Math.max(8, diff.cavityDepthMm);
              const coneRadius = Math.max(6, diff.cavityDepthMm * Math.tan(halfAngleRad));
              
              const coneColor = diff.hotspotStatus === 'critical' ? 0xff2200 : (diff.hotspotStatus === 'warning' ? 0xffaa00 : 0x00e5ff);
              const coneMat = new THREE.MeshBasicMaterial({
                color: coneColor,
                transparent: true,
                opacity: 0.16,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
              });
              const discMat = new THREE.MeshBasicMaterial({
                color: coneColor,
                transparent: true,
                opacity: 0.22,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
              });

              const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 20, 1, true);
              const discGeo = new THREE.CircleGeometry(coneRadius, 20);

              modulePositions.forEach((pos) => {
                const coneMesh = new THREE.Mesh(coneGeo, coneMat);
                coneMesh.rotation.x = -Math.PI / 2;
                coneMesh.position.set(pos.x, pos.y, pos.z + coneHeight / 2 + 1);
                this.wiringGroup.add(coneMesh);

                const discMesh = new THREE.Mesh(discGeo, discMat);
                discMesh.position.set(pos.x, pos.y, pos.z + coneHeight + 1);
                this.wiringGroup.add(discMesh);
              });
            }

            // Wires and power supplies rendering removed per user request
          }
        });
      });
    });

    if (totalBox.isEmpty() || letterFeeds.length === 0) return;

    // Remaining wiring elements (like PSU and rear wiring) have been removed per user request
  }

  private updateDynamicLighting() {
    const settings = this.store.settings();
    if (!settings.ledEnabled) return;

    if (settings.animationMode && settings.animationMode !== 'static') {
      const time = Date.now() * 0.001 * (settings.animationSpeed || 2);
      const baseColor = new THREE.Color(settings.ledColor);

      if (settings.animationMode === 'pulse') {
        const factor = (Math.sin(time * 3) + 1) * 0.5 * 0.8 + 0.2;
        const targetIntensity = settings.ledIntensity * factor;
        [this.ledGlowLight, this.ledGlowLightLeft, this.ledGlowLightRight].forEach(light => {
          if (light) light.intensity = targetIntensity;
        });
        if (this.glowMesh) {
          (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = Math.min(0.95, targetIntensity / 35);
        }
      } else if (settings.animationMode === 'rainbow') {
        baseColor.setHSL((time * 0.15) % 1.0, 0.95, 0.55);
        [this.ledGlowLight, this.ledGlowLightLeft, this.ledGlowLightRight].forEach(light => {
          if (light) light.color.copy(baseColor);
        });
        if (this.glowMesh) {
          (this.glowMesh.material as THREE.MeshBasicMaterial).color.copy(baseColor);
        }
      } else if (settings.animationMode === 'chase') {
        const hue = (time * 0.25) % 1.0;
        const wave = (Math.sin(time * 6) + 1) * 0.5 * 0.7 + 0.3;
        if (this.ledGlowLightLeft) this.ledGlowLightLeft.color.setHSL((hue + 0.2) % 1.0, 0.9, 0.5);
        if (this.ledGlowLight) this.ledGlowLight.color.setHSL((hue + 0.1) % 1.0, 0.9, 0.5);
        if (this.ledGlowLightRight) this.ledGlowLightRight.color.setHSL(hue, 0.9, 0.5);

        [this.ledGlowLight, this.ledGlowLightLeft, this.ledGlowLightRight].forEach(light => {
          if (light) light.intensity = settings.ledIntensity * wave;
        });
      }
    }
  }

  private createInsetContour(pts: THREE.Vector3[], insetDist: number, isHole = false): THREE.Vector3[] {
    if (pts.length < 3) return pts;

    let signedArea = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      signedArea += (p1.x * p2.y - p2.x * p1.y);
    }
    const isCCW = signedArea > 0;

    const result: THREE.Vector3[] = [];

    for (let i = 0; i < n; i++) {
      const pPrev = pts[(i - 1 + n) % n];
      const pCurr = pts[i];
      const pNext = pts[(i + 1) % n];

      const v1 = new THREE.Vector2(pCurr.x - pPrev.x, pCurr.y - pPrev.y);
      const v2 = new THREE.Vector2(pNext.x - pCurr.x, pNext.y - pCurr.y);

      if (v1.lengthSq() < 0.0001 || v2.lengthSq() < 0.0001) {
        result.push(pCurr.clone());
        continue;
      }
      v1.normalize();
      v2.normalize();

      let normal: THREE.Vector2;
      if (isHole) {
        normal = isCCW ? new THREE.Vector2(v1.y, -v1.x) : new THREE.Vector2(-v1.y, v1.x);
      } else {
        normal = isCCW ? new THREE.Vector2(-v1.y, v1.x) : new THREE.Vector2(v1.y, -v1.x);
      }

      const v2Normal = isHole
        ? (isCCW ? new THREE.Vector2(v2.y, -v2.x) : new THREE.Vector2(-v2.y, v2.x))
        : (isCCW ? new THREE.Vector2(-v2.y, v2.x) : new THREE.Vector2(v2.y, -v2.x));

      const nAvg = new THREE.Vector2().addVectors(normal, v2Normal);
      if (nAvg.lengthSq() < 0.001) {
        nAvg.copy(normal);
      } else {
        nAvg.normalize();
      }

      const dotVal = nAvg.dot(normal);
      const miterScale = Math.min(1.5, 1 / Math.max(0.35, dotVal));

      const offset = nAvg.multiplyScalar(insetDist * miterScale);
      result.push(new THREE.Vector3(pCurr.x + offset.x, pCurr.y + offset.y, pCurr.z));
    }

    return result;
  }

  private getLetterStrokeSpine(char: string, box: THREE.Box3): THREE.Vector3[] {
    const c = (char || '').toUpperCase().trim();
    const minX = box.min.x;
    const maxX = box.max.x;
    const minY = box.min.y;
    const maxY = box.max.y;
    const w = maxX - minX;
    const h = maxY - minY;

    // Inset padding so LEDs sit centered inside letter channel strokes
    const px = Math.max(8, Math.min(w * 0.22, 16));
    const py = Math.max(8, Math.min(h * 0.22, 16));

    const xL = minX + px;
    const xC = (minX + maxX) / 2;
    const xR = maxX - px;

    const yB = minY + py;
    const yM = (minY + maxY) / 2;
    const yT = maxY - py;
    const z = 2; // 2mm above backplate surface

    switch (c) {
      case 'T':
        return [
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xC, yB, z)
        ];

      case 'U':
        return [
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xL + (xC - xL) * 0.3, yB + (yM - yB) * 0.2, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xR - (xR - xC) * 0.3, yB + (yM - yB) * 0.2, z),
          new THREE.Vector3(xR, yM, z),
          new THREE.Vector3(xR, yT, z)
        ];

      case 'D':
        return [
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xL, yB, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xR, yB + (yM - yB) * 0.3, z),
          new THREE.Vector3(xR, yM, z),
          new THREE.Vector3(xR, yT - (yT - yM) * 0.3, z),
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xL, yT, z)
        ];

      case 'P':
        // Crucial: Vertical stem goes all the way from top to the VERY BOTTOM (yB)!
        return [
          new THREE.Vector3(xL, yB, z),
          new THREE.Vector3(xL, (yB + yM) / 2, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xL, (yM + yT) / 2, z),
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xR, (yT + yM) / 2, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xL, yM, z)
        ];

      case 'S':
        return [
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xL, yT - (yT - yM) * 0.3, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xR, yM - (yM - yB) * 0.3, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xL, yB, z)
        ];

      case 'A':
        return [
          new THREE.Vector3(xL, yB, z),
          new THREE.Vector3((xL + xC) / 2, (yB + yT) / 2, z),
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3((xC + xR) / 2, (yB + yT) / 2, z),
          new THREE.Vector3(xR, yB, z),
          new THREE.Vector3(xR - (xR - xC) * 0.2, yM, z),
          new THREE.Vector3(xL + (xC - xL) * 0.2, yM, z)
        ];

      case 'B':
        return [
          new THREE.Vector3(xL, yB, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xR, (yT + yM) / 2, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xR, (yM + yB) / 2, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xL, yB, z)
        ];

      case 'C':
        return [
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xL, (yT + yM) / 2, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xL, (yM + yB) / 2, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xR, yB, z)
        ];

      case 'E':
        return [
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xL + (xR - xL) * 0.6, yM, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xL, yB, z),
          new THREE.Vector3(xR, yB, z)
        ];

      case 'F':
        return [
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xL + (xR - xL) * 0.6, yM, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xL, yB, z)
        ];

      case 'G':
        return [
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xR, yB, z),
          new THREE.Vector3(xR, yM, z),
          new THREE.Vector3(xC, yM, z)
        ];

      case 'H':
        return [
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xL, yB, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xR, yM, z),
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xR, yM, z),
          new THREE.Vector3(xR, yB, z)
        ];

      case 'I':
      case '1':
        return [
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xC, yB, z)
        ];

      case 'J':
        return [
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xR, yM, z),
          new THREE.Vector3(xR, yB + (yM - yB) * 0.3, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xL, yB + (yM - yB) * 0.3, z)
        ];

      case 'K':
        return [
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xL, yB, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xR, yB, z)
        ];

      case 'L':
        return [
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xL, yB, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xR, yB, z)
        ];

      case 'M':
        return [
          new THREE.Vector3(xL, yB, z),
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xR, yB, z)
        ];

      case 'N':
        return [
          new THREE.Vector3(xL, yB, z),
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xR, yB, z),
          new THREE.Vector3(xR, yT, z)
        ];

      case 'O':
      case '0':
        return [
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xR, yM, z),
          new THREE.Vector3(xC, yT, z)
        ];

      case 'Q':
        return [
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xR, yM, z),
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xR + px * 0.4, yB - py * 0.4, z)
        ];

      case 'R':
        return [
          new THREE.Vector3(xL, yB, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xR, (yT + yM) / 2, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xR, yB, z)
        ];

      case 'V':
        return [
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xR, yT, z)
        ];

      case 'W':
        return [
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3((xL + xC) / 2, yB, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3((xC + xR) / 2, yB, z),
          new THREE.Vector3(xR, yT, z)
        ];

      case 'X':
        return [
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xR, yB, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xL, yB, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xR, yT, z)
        ];

      case 'Y':
        return [
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xC, yB, z)
        ];

      case 'Z':
        return [
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xL, yB, z),
          new THREE.Vector3(xR, yB, z)
        ];

      case '2':
        return [
          new THREE.Vector3(xL, yT - py, z),
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xR, yT - py / 2, z),
          new THREE.Vector3(xL, yB, z),
          new THREE.Vector3(xR, yB, z)
        ];

      case '3':
        return [
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xR, yB + py / 2, z),
          new THREE.Vector3(xL, yB, z)
        ];

      case '4':
        return [
          new THREE.Vector3(xR, yM, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xR - px, yT, z),
          new THREE.Vector3(xR - px, yB, z)
        ];

      case '5':
        return [
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xR, yM, z),
          new THREE.Vector3(xR, yB + py / 2, z),
          new THREE.Vector3(xL, yB, z)
        ];

      case '6':
        return [
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xR, yM - py / 2, z),
          new THREE.Vector3(xL, yM, z)
        ];

      case '7':
        return [
          new THREE.Vector3(xL, yT, z),
          new THREE.Vector3(xR, yT, z),
          new THREE.Vector3(xC, yB, z)
        ];

      case '8':
        return [
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xL, yT - py / 2, z),
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xR, yT - py / 2, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xL, yB + py / 2, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xR, yB + py / 2, z),
          new THREE.Vector3(xC, yM, z)
        ];

      case '9':
        return [
          new THREE.Vector3(xR, yM, z),
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xL, yT - py / 2, z),
          new THREE.Vector3(xC, yM, z),
          new THREE.Vector3(xR, yM, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xL, yB, z)
        ];

      default:
        return [
          new THREE.Vector3(xC, yT, z),
          new THREE.Vector3(xL, yM, z),
          new THREE.Vector3(xC, yB, z),
          new THREE.Vector3(xR, yM, z),
          new THREE.Vector3(xC, yT, z)
        ];
    }
  }

  private onSetMountingViewEvent = (e: Event) => {
    const detail = (e as CustomEvent<{ angle?: 'standoff-3d' | 'front' | 'side' | 'rear' | 'top' }>).detail;
    this.setMountingView(detail?.angle || 'standoff-3d');
  };

  private isDraggingCube = false;
  private previousCubePointer = new THREE.Vector2();
  private cubeDragDelta = 0;

  onCubePointerDown(event: PointerEvent) {
    if (event.button !== 0) return; // Only left click
    this.isDraggingCube = true;
    this.previousCubePointer.set(event.clientX, event.clientY);
    this.cubeDragDelta = 0;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  onCubePointerMove(event: PointerEvent) {
    if (!this.isDraggingCube) return;
    
    const deltaX = event.clientX - this.previousCubePointer.x;
    const deltaY = event.clientY - this.previousCubePointer.y;
    
    this.cubeDragDelta += Math.abs(deltaX) + Math.abs(deltaY);
    this.previousCubePointer.set(event.clientX, event.clientY);

    // Orbit controls rotation speed
    const rotateSpeed = 0.01;
    
    const offset = new THREE.Vector3().copy(this.camera.position).sub(this.controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    
    spherical.theta -= deltaX * rotateSpeed;
    spherical.phi -= deltaY * rotateSpeed;
    
    // Constrain phi (polar angle) to avoid flipping over
    spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, spherical.phi));
    
    offset.setFromSpherical(spherical);
    this.camera.position.copy(this.controls.target).add(offset);
    this.camera.lookAt(this.controls.target);
    
    this.controls.update(); // Update OrbitControls internal state
  }

  onCubePointerUp(event: PointerEvent) {
    if (!this.isDraggingCube) return;
    this.isDraggingCube = false;
    try {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // Ignore if pointer capture was already released
    }
  }

  onCubeFaceClick(angle: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom', event: MouseEvent) {
    if (this.cubeDragDelta > 5) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.setViewAngle(angle);
  }

  setViewAngle(angle: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom') {
    const box = new THREE.Box3().setFromObject(this.lettersGroup);
    let targetX = 0, targetY = 0, targetZ = 0;
    let maxDim = 300;

    if (!box.isEmpty()) {
      const center = new THREE.Vector3();
      box.getCenter(center);
      targetX = center.x;
      targetY = center.y;
      targetZ = center.z;

      const size = new THREE.Vector3();
      box.getSize(size);
      maxDim = Math.max(size.x, size.y, size.z, 200);
    }

    const dist = Math.max(480, maxDim * 1.5);
    const targetLookAt = new THREE.Vector3(targetX, targetY, targetZ);
    const targetPos = new THREE.Vector3();

    switch (angle) {
      case 'front':
        targetPos.set(targetX, targetY, targetZ + dist);
        break;
      case 'back':
        targetPos.set(targetX, targetY, targetZ - dist);
        break;
      case 'left':
        targetPos.set(targetX - dist, targetY, targetZ);
        break;
      case 'right':
        targetPos.set(targetX + dist, targetY, targetZ);
        break;
      case 'top':
        // slightly offset Z so up vector doesn't flip out
        targetPos.set(targetX, targetY + dist, targetZ + 0.1);
        break;
      case 'bottom':
        targetPos.set(targetX, targetY - dist, targetZ + 0.1);
        break;
    }

    this.animateCameraTo(targetPos, targetLookAt, 650);
  }

  setMountingView(angle: 'standoff-3d' | 'front' | 'side' | 'rear' | 'top' = 'standoff-3d') {
    if (this.camera instanceof THREE.OrthographicCamera) {
      this.store.updateSettings({ cameraType: 'perspective' });
      this.syncCameraType('perspective');
    }

    const box = new THREE.Box3().setFromObject(this.lettersGroup);
    let targetX = 0, targetY = 0, targetZ = 0;
    let maxDim = 300;

    if (!box.isEmpty()) {
      const center = new THREE.Vector3();
      box.getCenter(center);
      targetX = center.x;
      targetY = center.y;
      targetZ = center.z;

      const size = new THREE.Vector3();
      box.getSize(size);
      maxDim = Math.max(size.x, size.y, size.z, 200);
    }

    const dist = Math.max(480, maxDim * 1.55);
    const targetLookAt = new THREE.Vector3(targetX, targetY, targetZ);
    const targetPos = new THREE.Vector3();

    if (angle === 'standoff-3d') {
      // 3/4 isometric perspective angle highlighting standoff gap and hardware depth
      targetPos.set(targetX + dist * 0.75, targetY + dist * 0.4, targetZ + dist * 0.95);
    } else if (angle === 'front') {
      targetPos.set(targetX, targetY + dist * 0.05, targetZ + dist * 1.35);
    } else if (angle === 'side') {
      targetPos.set(targetX + dist * 1.35, targetY + dist * 0.1, targetZ);
    } else if (angle === 'rear') {
      targetPos.set(targetX - dist * 0.45, targetY + dist * 0.35, targetZ - dist * 1.25);
    } else if (angle === 'top') {
      targetPos.set(targetX, targetY + dist * 1.45, targetZ + 15);
    }

    this.animateCameraTo(targetPos, targetLookAt, 650);
  }

  animateCameraTo(targetPos: THREE.Vector3, targetLookAt: THREE.Vector3, durationMs = 650) {
    if (!this.controls || !this.camera) return;
    this.cameraAnim = {
      active: true,
      startPos: this.camera.position.clone(),
      targetPos: targetPos.clone(),
      startTarget: this.controls.target.clone(),
      targetLookAt: targetLookAt.clone(),
      startTime: performance.now(),
      duration: durationMs
    };
  }
}

