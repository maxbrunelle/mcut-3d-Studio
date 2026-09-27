const fs = require('fs');
let code = fs.readFileSync('src/app/left-sidebar.ts', 'utf8');

const startStr = "@if (store.settings().inputSource === 'neon-flex') {";
const endStr = "              <!-- SVG / Vector Upload Mode -->";

let start = code.indexOf(startStr);
let end = code.indexOf(endStr);

if (start !== -1 && end !== -1) {
  const newBlock = `              @if (store.settings().inputSource === 'neon-flex') {
                <div class="space-y-4">
                  <!-- Neon Design Studio Header -->
                  <div class="p-3 bg-gradient-to-br from-pink-500/10 to-rose-500/10 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl border border-pink-200/50 dark:border-pink-800/30 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
                      <mat-icon>flare</mat-icon>
                    </div>
                    <div>
                      <h3 class="text-sm font-bold text-pink-700 dark:text-pink-300">Neon Studio</h3>
                      <p class="text-[10px] text-pink-600/70 dark:text-pink-400/70 leading-tight">Design & route LED silicone neon signs</p>
                    </div>
                  </div>

                  <!-- 1. Text & Typography -->
                  <div class="space-y-3">
                    <div class="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                      <mat-icon class="text-slate-400 scale-75">text_fields</mat-icon>
                      <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">1. Sign Text & Typography</h4>
                    </div>
                    
                    <div class="space-y-1.5">
                      <div class="flex justify-between items-center">
                        <label for="neonTextInput" class="block text-xs font-semibold text-slate-600 dark:text-slate-300">Text Content</label>
                      </div>
                      <textarea id="neonTextInput" rows="2" [value]="store.settings().neonText || store.settings().text" (input)="updateNeonText($event)"
                                placeholder="Type your sign..."
                                class="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold tracking-wider text-slate-800 dark:text-slate-100 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-all resize-none"></textarea>
                    </div>

                    <div class="space-y-1.5">
                      <div class="flex justify-between items-center">
                        <span class="block text-xs font-semibold text-slate-600 dark:text-slate-300">Script Font</span>
                        <button (click)="openFontModal()" class="text-[10px] font-bold text-pink-600 dark:text-pink-400 hover:underline cursor-pointer flex items-center">
                          <span>Browse Catalog</span>
                          <mat-icon class="scale-50">arrow_forward</mat-icon>
                        </button>
                      </div>
                      <div class="grid grid-cols-2 gap-1.5">
                        @for (f of neonScriptFonts(); track f.id) {
                          <button (click)="selectNeonFont(f.id)"
                                  [class.border-pink-500]="(store.settings().neonFont || store.settings().font || 'Pacifico') === f.id"
                                  [class.bg-pink-50]="(store.settings().neonFont || store.settings().font || 'Pacifico') === f.id"
                                  [class.dark:bg-pink-900/30]="(store.settings().neonFont || store.settings().font || 'Pacifico') === f.id"
                                  [class.text-pink-700]="(store.settings().neonFont || store.settings().font || 'Pacifico') === f.id"
                                  [class.dark:text-pink-300]="(store.settings().neonFont || store.settings().font || 'Pacifico') === f.id"
                                  class="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all cursor-pointer">
                            <span class="block text-xs font-bold leading-tight">{{ f.name }}</span>
                          </button>
                        }
                      </div>
                    </div>
                  </div>

                  <!-- 2. Illumination -->
                  <div class="space-y-3 pt-2">
                    <div class="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                      <mat-icon class="text-slate-400 scale-75">lightbulb</mat-icon>
                      <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">2. Illumination</h4>
                    </div>

                    <div class="space-y-2">
                      <span class="block text-xs font-semibold text-slate-600 dark:text-slate-300">Silicone Glow Color</span>
                      <div class="flex flex-wrap gap-1.5">
                        @for (c of neonColorPresets; track c.hex) {
                          <button (click)="selectNeonColor(c.hex)"
                                  [title]="c.name"
                                  class="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer relative shadow-sm border border-black/10 dark:border-white/10"
                                  [style.backgroundColor]="c.hex"
                                  [class.ring-2]="(store.settings().neonColor || '#ff2d87') === c.hex"
                                  [class.ring-offset-2]="(store.settings().neonColor || '#ff2d87') === c.hex"
                                  [class.ring-slate-900]="(store.settings().neonColor || '#ff2d87') === c.hex"
                                  [class.dark:ring-slate-100]="(store.settings().neonColor || '#ff2d87') === c.hex"
                                  [class.scale-110]="(store.settings().neonColor || '#ff2d87') === c.hex">
                            @if ((store.settings().neonColor || '#ff2d87') === c.hex) {
                              <mat-icon class="text-white scale-75 drop-shadow-md">check</mat-icon>
                            }
                          </button>
                        }
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Glow Bloom', key: 'neonGlowIntensity', value: store.settings().neonGlowIntensity || 10, min: 1, max: 25, step: 1, unit: '' }"></ng-container>
                      <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Cap Height', key: 'targetHeight', value: store.settings().targetHeight || 120, min: 50, max: 400, step: 5, unit: 'mm' }"></ng-container>
                    </div>
                  </div>

                  <!-- 3. Tube & Routing -->
                  <div class="space-y-3 pt-2">
                    <div class="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                      <mat-icon class="text-slate-400 scale-75">route</mat-icon>
                      <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">3. Tube & Routing</h4>
                    </div>

                    <!-- Tube Dimensions & Jacket -->
                    <div class="grid grid-cols-2 gap-3">
                      <div class="space-y-1.5">
                        <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Diameter</span>
                        <div class="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
                          @for (d of [6, 8, 10, 12]; track d) {
                            <button (click)="setNeonTubeDiameter(d)"
                                    [class.bg-white]="(store.settings().neonTubeDiameter || 8) === d"
                                    [class.dark:bg-slate-600]="(store.settings().neonTubeDiameter || 8) === d"
                                    [class.shadow-sm]="(store.settings().neonTubeDiameter || 8) === d"
                                    [class.text-pink-600]="(store.settings().neonTubeDiameter || 8) === d"
                                    [class.dark:text-pink-300]="(store.settings().neonTubeDiameter || 8) === d"
                                    class="flex-1 py-1 text-[11px] font-bold text-slate-500 rounded-md transition-all">
                              {{ d }}mm
                            </button>
                          }
                        </div>
                      </div>
                      
                      <div class="space-y-1.5">
                        <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Silicone Finish</span>
                        <div class="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
                          <button (click)="setNeonJacketStyle('milky-white')"
                                  [class.bg-white]="store.settings().neonJacketStyle !== 'colored-silicone'"
                                  [class.dark:bg-slate-600]="store.settings().neonJacketStyle !== 'colored-silicone'"
                                  [class.shadow-sm]="store.settings().neonJacketStyle !== 'colored-silicone'"
                                  [class.text-pink-600]="store.settings().neonJacketStyle !== 'colored-silicone'"
                                  [class.dark:text-pink-300]="store.settings().neonJacketStyle !== 'colored-silicone'"
                                  class="flex-1 py-1 text-[11px] font-bold text-slate-500 rounded-md transition-all">
                            Milky
                          </button>
                          <button (click)="setNeonJacketStyle('colored-silicone')"
                                  [class.bg-white]="store.settings().neonJacketStyle === 'colored-silicone'"
                                  [class.dark:bg-slate-600]="store.settings().neonJacketStyle === 'colored-silicone'"
                                  [class.shadow-sm]="store.settings().neonJacketStyle === 'colored-silicone'"
                                  [class.text-pink-600]="store.settings().neonJacketStyle === 'colored-silicone'"
                                  [class.dark:text-pink-300]="store.settings().neonJacketStyle === 'colored-silicone'"
                                  class="flex-1 py-1 text-[11px] font-bold text-slate-500 rounded-md transition-all">
                            Colored
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Routing Mode -->
                    <div class="space-y-1.5">
                      <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 block">CAD Tracing Engine</span>
                      <div class="grid grid-cols-2 gap-1.5">
                        <button (click)="setNeonRoutingMode('inline')"
                                [class.border-pink-500]="(store.settings().neonRoutingMode || 'inline') === 'inline'"
                                [class.bg-pink-50]="(store.settings().neonRoutingMode || 'inline') === 'inline'"
                                [class.dark:bg-pink-900/30]="(store.settings().neonRoutingMode || 'inline') === 'inline'"
                                [class.text-pink-700]="(store.settings().neonRoutingMode || 'inline') === 'inline'"
                                [class.dark:text-pink-300]="(store.settings().neonRoutingMode || 'inline') === 'inline'"
                                class="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1">
                          <div class="flex items-center gap-1.5">
                            <mat-icon class="scale-75">gesture</mat-icon>
                            <span class="text-[11px] font-bold leading-tight">Medial Centerline</span>
                          </div>
                          <span class="text-[9px] font-medium opacity-80 leading-tight">Extracts true skeleton stroke</span>
                        </button>
                        <button (click)="setNeonRoutingMode('outline')"
                                [class.border-pink-500]="store.settings().neonRoutingMode === 'outline'"
                                [class.bg-pink-50]="store.settings().neonRoutingMode === 'outline'"
                                [class.dark:bg-pink-900/30]="store.settings().neonRoutingMode === 'outline'"
                                [class.text-pink-700]="store.settings().neonRoutingMode === 'outline'"
                                [class.dark:text-pink-300]="store.settings().neonRoutingMode === 'outline'"
                                class="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1">
                          <div class="flex items-center gap-1.5">
                            <mat-icon class="scale-75">font_download</mat-icon>
                            <span class="text-[11px] font-bold leading-tight">Perimeter Outline</span>
                          </div>
                          <span class="text-[9px] font-medium opacity-80 leading-tight">Traces standard contour</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- 4. Backplate & Hardware -->
                  <div class="space-y-3 pt-2">
                    <div class="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                      <mat-icon class="text-slate-400 scale-75">layers</mat-icon>
                      <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">4. Backplate & Mount</h4>
                    </div>

                    <!-- Mounting Method -->
                    <div class="space-y-1.5">
                      <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Tube Mounting System</span>
                      <div class="grid grid-cols-2 gap-1.5">
                        <button (click)="setNeonMountingTrack('cnc-groove')"
                                [class.border-pink-500]="(store.settings().neonMountingTrack || 'both') === 'cnc-groove'"
                                [class.bg-pink-50]="(store.settings().neonMountingTrack || 'both') === 'cnc-groove'"
                                [class.dark:bg-pink-900/30]="(store.settings().neonMountingTrack || 'both') === 'cnc-groove'"
                                [class.text-pink-700]="(store.settings().neonMountingTrack || 'both') === 'cnc-groove'"
                                [class.dark:text-pink-300]="(store.settings().neonMountingTrack || 'both') === 'cnc-groove'"
                                class="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1">
                          <div class="flex items-center gap-1.5">
                            <mat-icon class="scale-75">precision_manufacturing</mat-icon>
                            <span class="text-[11px] font-bold leading-tight">CNC Inlaid Pocket</span>
                          </div>
                          <span class="text-[9px] font-medium opacity-80 leading-tight">Routed flush into acrylic</span>
                        </button>
                        <button (click)="setNeonMountingTrack('surface-clips')"
                                [class.border-pink-500]="(store.settings().neonMountingTrack || 'both') === 'surface-clips'"
                                [class.bg-pink-50]="(store.settings().neonMountingTrack || 'both') === 'surface-clips'"
                                [class.dark:bg-pink-900/30]="(store.settings().neonMountingTrack || 'both') === 'surface-clips'"
                                [class.text-pink-700]="(store.settings().neonMountingTrack || 'both') === 'surface-clips'"
                                [class.dark:text-pink-300]="(store.settings().neonMountingTrack || 'both') === 'surface-clips'"
                                class="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1">
                          <div class="flex items-center gap-1.5">
                            <mat-icon class="scale-75">attachment</mat-icon>
                            <span class="text-[11px] font-bold leading-tight">Surface Clips</span>
                          </div>
                          <span class="text-[9px] font-medium opacity-80 leading-tight">Screwed on top layer</span>
                        </button>
                      </div>
                    </div>

                    <!-- Sliders for Backplate / Groove -->
                    <div class="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      @if ((store.settings().neonMountingTrack || 'both') === 'cnc-groove') {
                        <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Groove Depth', key: 'neonCncGrooveDepth', value: store.settings().neonCncGrooveDepth || 2, min: 1, max: Math.min(store.settings().neonBackplateThickness || 5, 8), step: 0.5, unit: 'mm' }"></ng-container>
                      }
                      <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Plate Margin', key: 'neonBackplateMargin', value: store.settings().neonBackplateMargin || 22, min: 10, max: 60, step: 2, unit: 'mm' }"></ng-container>
                      <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Plate Thick', key: 'neonBackplateThickness', value: store.settings().neonBackplateThickness || 5, min: 3, max: 12, step: 1, unit: 'mm' }"></ng-container>
                    </div>

                    <!-- Cut Style & Material -->
                    <div class="grid grid-cols-2 gap-3">
                      <div class="space-y-1.5">
                        <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Cut Profile</span>
                        <select [value]="store.settings().neonBackplateStyle || 'contour'" (change)="setNeonBackplateStyle($any($event.target).value)" 
                                class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-pink-500 outline-none">
                          @for (st of neonBackplateStyles; track st.id) {
                            <option [value]="st.id">{{ st.name }}</option>
                          }
                        </select>
                      </div>
                      <div class="space-y-1.5">
                        <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Material</span>
                        <select [value]="store.settings().neonBackplateMaterial || 'clear-acrylic'" (change)="setNeonBackplateMaterial($any($event.target).value)" 
                                class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-pink-500 outline-none">
                          @for (m of neonBackplateMaterials; track m.id) {
                            <option [value]="m.id">{{ m.name }}</option>
                          }
                        </select>
                      </div>
                    </div>

                    <!-- Standoff Hardware -->
                    <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-slate-400 scale-75">build_circle</mat-icon>
                        <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Wall Standoff Holes</span>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" [checked]="store.settings().neonBackplateHoles !== false" (change)="toggleNeonBackplateHoles($event)" class="sr-only peer">
                        <div class="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-pink-500"></div>
                      </label>
                    </div>
                  </div>

                  <!-- Live Engineering Stats Card -->
                  @if (store.neonStats(); as ns) {
                    <div class="p-3 bg-slate-900 dark:bg-black rounded-2xl border border-slate-800 shadow-inner mt-4 overflow-hidden relative">
                      <div class="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/20 pointer-events-none"></div>
                      <div class="flex items-center justify-between mb-2 relative z-10">
                        <div class="flex items-center gap-1.5 text-xs font-bold text-white">
                          <mat-icon class="scale-75 text-pink-500">bolt</mat-icon>
                          <span>Engineering Spec</span>
                        </div>
                        <span class="text-[9px] font-mono font-bold text-green-400 bg-green-950/60 border border-green-900/60 px-1.5 py-0.5 rounded">12V DC</span>
                      </div>
                      <div class="grid grid-cols-3 gap-1 relative z-10 text-center pb-2">
                        <div class="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50 flex flex-col items-center">
                          <span class="block text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Length</span>
                          <span class="text-sm font-extrabold text-white font-mono leading-none">{{ ns.totalTubeLengthMeters }}<span class="text-[10px] text-slate-500 font-normal ml-0.5">m</span></span>
                        </div>
                        <div class="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50 flex flex-col items-center">
                          <span class="block text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Power</span>
                          <span class="text-sm font-extrabold text-pink-400 font-mono leading-none">{{ ns.powerWatts }}<span class="text-[10px] text-pink-600 font-normal ml-0.5">W</span></span>
                        </div>
                        <div class="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50 flex flex-col items-center">
                          <span class="block text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Current</span>
                          <span class="text-sm font-extrabold text-white font-mono leading-none">{{ ns.currentAmps }}<span class="text-[10px] text-slate-500 font-normal ml-0.5">A</span></span>
                        </div>
                      </div>
                      <div class="flex justify-between text-[10px] bg-slate-800/60 px-2 py-1.5 rounded-lg border border-slate-700/50 text-slate-300 relative z-10">
                        <span class="font-medium">Recommended PSU:</span>
                        <span class="font-mono font-bold text-pink-400">{{ ns.recommendedPowerSupply }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
`;
  code = code.substring(0, start) + newBlock + code.substring(end);
  fs.writeFileSync('src/app/left-sidebar.ts', code, 'utf8');
  console.log("Patched left sidebar successfully");
} else {
  console.log("Failed to find boundaries.", start, end);
}
