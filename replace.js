const fs = require('fs');

let content = fs.readFileSync('src/app/left-sidebar.ts', 'utf8');

const newTemplate = `
  template: \`
    <div class="flex h-full w-full bg-white text-gray-800">
      <!-- Sidebar Tabs -->
      <div class="w-16 bg-[#f8fafc] border-r border-gray-200 flex flex-col items-center py-4 space-y-4 shrink-0 shadow-sm z-10">
        <button (click)="store.setActiveTab('source')" [class.bg-blue-100]="store.activeTab() === 'source'" [class.text-blue-600]="store.activeTab() === 'source'" class="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Input Source">
          <mat-icon>upload_file</mat-icon>
        </button>
        <button (click)="store.setActiveTab('dimensions')" [class.bg-blue-100]="store.activeTab() === 'dimensions'" [class.text-blue-600]="store.activeTab() === 'dimensions'" class="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Dimensions">
          <mat-icon>straighten</mat-icon>
        </button>
        <button (click)="store.setActiveTab('style')" [class.bg-blue-100]="store.activeTab() === 'style'" [class.text-blue-600]="store.activeTab() === 'style'" class="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Style">
          <mat-icon>palette</mat-icon>
        </button>
        <button (click)="store.setActiveTab('holes')" [class.bg-blue-100]="store.activeTab() === 'holes'" [class.text-blue-600]="store.activeTab() === 'holes'" class="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Mounting Holes">
          <mat-icon>radio_button_unchecked</mat-icon>
        </button>
        <button (click)="store.setActiveTab('export')" [class.bg-blue-100]="store.activeTab() === 'export'" [class.text-blue-600]="store.activeTab() === 'export'" class="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Export">
          <mat-icon>download</mat-icon>
        </button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex flex-col h-full overflow-y-auto bg-white">
        @if (store.activeTab() === 'source') {
           <div class="px-4 py-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold bg-[#f8fafc] sticky top-0 z-10 border-b border-gray-200">
             INPUT SOURCE
           </div>
           <div class="p-4 space-y-6">
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-2">
                  <label class="relative flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors"
                         [class.border-blue-500]="store.settings().inputSource === 'svg'" [class.bg-blue-50]="store.settings().inputSource === 'svg'" [class.border-gray-200]="store.settings().inputSource !== 'svg'">
                    <input type="radio" name="inputSource" value="svg" class="sr-only" 
                           [checked]="store.settings().inputSource === 'svg'" (change)="store.updateSettings({ inputSource: 'svg' })">
                    <mat-icon class="mb-1" [class.text-blue-500]="store.settings().inputSource === 'svg'" [class.text-gray-400]="store.settings().inputSource !== 'svg'">upload_file</mat-icon>
                    <span class="text-xs font-medium text-gray-700">Upload SVG</span>
                  </label>
                  <label class="relative flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors"
                         [class.border-blue-500]="store.settings().inputSource === 'text'" [class.bg-blue-50]="store.settings().inputSource === 'text'" [class.border-gray-200]="store.settings().inputSource !== 'text'">
                    <input type="radio" name="inputSource" value="text" class="sr-only" 
                           [checked]="store.settings().inputSource === 'text'" (change)="store.updateSettings({ inputSource: 'text' })">
                    <mat-icon class="mb-1" [class.text-blue-500]="store.settings().inputSource === 'text'" [class.text-gray-400]="store.settings().inputSource !== 'text'">title</mat-icon>
                    <span class="text-xs font-medium text-gray-700">Type Text</span>
                  </label>
                </div>
              </div>
              
              <div class="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                @if (store.settings().inputSource === 'svg') {
                  <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-white transition-colors group">
                    <div class="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400 group-hover:text-blue-500 transition-colors">
                      <mat-icon class="mb-2">cloud_upload</mat-icon>
                      <p class="mb-1 text-sm font-bold">Click or drag an SVG</p>
                      <p class="text-xs text-gray-400">Accepts .svg files</p>
                    </div>
                    <input type="file" class="hidden" accept=".svg,.dxf" (change)="onFileSelected($event)" />
                  </label>
                  @if (store.settings().vectorData) {
                    <div class="flex items-center justify-between p-2 mt-2 bg-green-50 text-green-700 rounded text-xs border border-green-200 font-medium">
                      <div class="flex items-center gap-2"><mat-icon class="scale-75">check_circle</mat-icon> Vector data loaded</div>
                    </div>
                  }
                } @else {
                  <div class="space-y-2">
                    <label class="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Text Content</label>
                    <input type="text" [value]="store.settings().text" (input)="updateText($event)" 
                           class="w-full border border-gray-300 rounded-md p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Type here...">
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Font</label>
                    <div class="text-xs text-gray-500 p-2 bg-white border border-gray-200 rounded">
                      Using standard bold font. Custom font upload coming soon.
                    </div>
                  </div>
                }
              </div>
           </div>
        }

        @if (store.activeTab() === 'dimensions') {
           <div class="px-4 py-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold bg-[#f8fafc] sticky top-0 z-10 border-b border-gray-200">
             DIMENSIONS & SCALE
           </div>
           <div class="p-4 space-y-6">
              <div class="space-y-4">
                <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Target Height (mm)', key: 'targetHeight', value: store.settings().targetHeight, min: 50, max: 1000, step: 10 }"></ng-container>
              </div>
              
              <div class="pt-4 border-t border-gray-100">
                <label class="flex items-center gap-2 cursor-pointer mb-4">
                  <input type="checkbox" [checked]="store.settings().showBuildPlate" (change)="toggleBuildPlate($event)" class="w-4 h-4 text-blue-600 border-gray-300 rounded">
                  <span class="text-sm font-medium text-gray-700">Show Build Plate</span>
                </label>
                @if (store.settings().showBuildPlate) {
                  <div class="grid grid-cols-2 gap-4">
                    <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Width', key: 'buildPlateWidth', value: store.settings().buildPlateWidth, min: 100, max: 500, step: 10 }"></ng-container>
                    <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Height', key: 'buildPlateHeight', value: store.settings().buildPlateHeight, min: 100, max: 500, step: 10 }"></ng-container>
                  </div>
                  @if (store.oversizedWarning()) {
                    <div class="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex gap-2 font-medium">
                      <mat-icon class="scale-75 shrink-0 text-red-500">warning</mat-icon>
                      <p>Model exceeds build plate dimensions.</p>
                    </div>
                  }
                }
              </div>
           </div>
        }

        @if (store.activeTab() === 'style') {
           <div class="px-4 py-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold bg-[#f8fafc] sticky top-0 z-10 border-b border-gray-200">
             STYLE & SETTINGS
           </div>
           <div class="p-4 space-y-6">
              <div class="grid grid-cols-2 gap-2">
                @for (style of styles; track style.id) {
                  <button 
                    (click)="store.updateSettings({ style: style.id })"
                    [class.bg-blue-50]="store.settings().style === style.id"
                    [class.border-blue-500]="store.settings().style === style.id"
                    [class.border-gray-200]="store.settings().style !== style.id"
                    class="relative p-2 border rounded-md text-left transition-colors hover:bg-gray-50 group">
                    <span class="block text-[10px] font-bold" [class.text-blue-700]="store.settings().style === style.id" [class.text-gray-600]="store.settings().style !== style.id">{{ style.name }}</span>
                  </button>
                }
              </div>
              
              <div class="space-y-4 pt-4 border-t border-gray-200">
                <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Base Thickness', key: 'baseThickness', value: store.settings().baseThickness, min: 0, max: 10, step: 0.1 }"></ng-container>
                <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Ext Wall Thickness', key: 'externalWallThickness', value: store.settings().externalWallThickness, min: 0.5, max: 5, step: 0.1 }"></ng-container>
                <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Int Wall Thickness', key: 'internalWallThickness', value: store.settings().internalWallThickness, min: 0.5, max: 5, step: 0.1 }"></ng-container>
                <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Wall Height', key: 'wallHeight', value: store.settings().wallHeight, min: 10, max: 100, step: 1 }"></ng-container>
                <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Acrylic Thickness', key: 'acrylicThickness', value: store.settings().acrylicThickness, min: 1, max: 10, step: 0.1 }"></ng-container>
              </div>

              <div class="pt-4 border-t border-gray-200 space-y-3">
                <div class="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Layers visibility</div>
                <div class="flex items-center gap-3 p-2 border border-gray-200 rounded-lg cursor-pointer transition-colors" [class.bg-blue-50]="store.settings().layers.body">
                  <button (click)="store.updateLayer('body', !store.settings().layers.body)" class="text-gray-400 hover:text-gray-600 w-full flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded-sm border border-gray-300 shadow-sm" [style.backgroundColor]="store.settings().bodyColor"></div>
                      <span class="font-medium text-gray-700 text-xs">Body</span>
                    </div>
                    <mat-icon class="scale-75">{{ store.settings().layers.body ? 'visibility' : 'visibility_off' }}</mat-icon>
                  </button>
                </div>
                <div class="flex items-center gap-3 p-2 border border-gray-200 rounded-lg cursor-pointer transition-colors" [class.bg-blue-50]="store.settings().layers.acrylic">
                  <button (click)="store.updateLayer('acrylic', !store.settings().layers.acrylic)" class="text-gray-400 hover:text-gray-600 w-full flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded-sm border border-gray-300 shadow-sm" [style.backgroundColor]="store.settings().acrylicColor"></div>
                      <span class="font-medium text-gray-700 text-xs">Acrylic</span>
                    </div>
                    <mat-icon class="scale-75">{{ store.settings().layers.acrylic ? 'visibility' : 'visibility_off' }}</mat-icon>
                  </button>
                </div>
              </div>
           </div>
        }

        @if (store.activeTab() === 'holes') {
           <div class="px-4 py-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold bg-[#f8fafc] sticky top-0 z-10 border-b border-gray-200">
             MOUNTING HOLES
           </div>
           <div class="p-4 space-y-6">
              <label class="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" [checked]="store.settings().mirror" (change)="toggleMirror($event)" class="w-4 h-4 text-blue-600 border-gray-300 rounded">
                <span class="text-sm font-medium text-gray-700">Mirror Path</span>
              </label>
              
              <div class="pt-4 border-t border-gray-200">
                <div class="flex gap-2 mb-4">
                  <button class="flex-1 text-xs py-2 rounded font-medium border border-gray-300 transition-colors"
                          [class.bg-blue-100]="store.settings().interactionMode === 'view'"
                          [class.text-blue-700]="store.settings().interactionMode === 'view'"
                          [class.border-blue-300]="store.settings().interactionMode === 'view'"
                          (click)="store.updateSettings({ interactionMode: 'view' })">
                    View Mode
                  </button>
                  <button class="flex-1 text-xs py-2 rounded font-medium border border-gray-300 transition-colors flex justify-center items-center gap-1"
                          [class.bg-blue-600]="store.settings().interactionMode === 'add-hole'"
                          [class.text-white]="store.settings().interactionMode === 'add-hole'"
                          [class.border-blue-600]="store.settings().interactionMode === 'add-hole'"
                          (click)="store.updateSettings({ interactionMode: 'add-hole' })">
                    <mat-icon class="scale-75">add_circle</mat-icon> Add Holes
                  </button>
                </div>
                
                @if (store.settings().interactionMode === 'add-hole') {
                  <div class="bg-blue-50 text-blue-800 text-[10px] p-2 rounded mb-4 font-medium flex gap-2 border border-blue-200">
                    <mat-icon class="scale-75 shrink-0 text-blue-500">info</mat-icon>
                    Click on the backplate of the letter in the 3D view to place a mounting hole.
                  </div>
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Hole Radius (mm)', key: 'holeRadius', value: store.settings().holeRadius, min: 1, max: 50, step: 1 }"></ng-container>
                }
                
                @if (store.settings().customHoles.length > 0) {
                  <div class="space-y-2 mt-4">
                    @for (hole of store.settings().customHoles; track $index) {
                      <div class="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 shadow-sm">
                        <div class="text-[10px] text-gray-500 font-bold w-4 text-center">#{{$index + 1}}</div>
                        <div class="flex-1 flex gap-2">
                          <div class="flex flex-col flex-1">
                            <label class="text-[8px] uppercase tracking-wider text-gray-400 font-bold">X (mm)</label>
                            <input type="number" [value]="hole.x.toFixed(1)" (change)="updateHole($index, 'x', $event)" step="0.1" class="w-full text-xs font-mono border-b border-transparent focus:border-blue-500 bg-transparent outline-none">
                          </div>
                          <div class="flex flex-col flex-1">
                            <label class="text-[8px] uppercase tracking-wider text-gray-400 font-bold">Y (mm)</label>
                            <input type="number" [value]="hole.y.toFixed(1)" (change)="updateHole($index, 'y', $event)" step="0.1" class="w-full text-xs font-mono border-b border-transparent focus:border-blue-500 bg-transparent outline-none">
                          </div>
                          <div class="flex flex-col flex-1">
                            <label class="text-[8px] uppercase tracking-wider text-gray-400 font-bold">R (mm)</label>
                            <input type="number" [value]="hole.r.toFixed(1)" (change)="updateHole($index, 'r', $event)" step="0.1" class="w-full text-xs font-mono border-b border-transparent focus:border-blue-500 bg-transparent outline-none">
                          </div>
                        </div>
                        <button (click)="removeHole($index)" class="text-gray-400 hover:text-red-500 p-1 rounded transition-colors" title="Remove Hole">
                          <mat-icon class="scale-75">close</mat-icon>
                        </button>
                      </div>
                    }
                  </div>
                  <button class="w-full text-red-500 text-xs py-2 hover:bg-red-50 rounded border border-red-100 transition-colors mt-3 font-medium"
                          (click)="store.updateSettings({ customHoles: [] })">
                      Clear All Holes ({{ store.settings().customHoles.length }})
                  </button>
                }
              </div>
           </div>
        }

        @if (store.activeTab() === 'export') {
           <div class="px-4 py-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold bg-[#f8fafc] sticky top-0 z-10 border-b border-gray-200">
             EXPORT FILES
           </div>
           <div class="p-4 space-y-4">
             <button (click)="exportSTL()" class="w-full flex items-center justify-between bg-white border border-gray-200 hover:border-blue-500 hover:bg-blue-50 p-3 rounded-lg transition-colors text-left shadow-sm group">
               <div class="flex items-center gap-3">
                 <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
                   <mat-icon class="scale-75">3d_rotation</mat-icon>
                 </div>
                 <span class="font-bold text-gray-700">Export STL (3D Print)</span>
               </div>
               <mat-icon class="text-gray-400 group-hover:text-blue-500">download</mat-icon>
             </button>

             <button (click)="exportSVGAcrylic()" class="w-full flex items-center justify-between bg-white border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 p-3 rounded-lg transition-colors text-left shadow-sm group">
               <div class="flex items-center gap-3">
                 <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-200 transition-colors">
                   <mat-icon class="scale-75">content_cut</mat-icon>
                 </div>
                 <span class="font-bold text-gray-700">Export SVG (Face / Laser)</span>
               </div>
               <mat-icon class="text-gray-400 group-hover:text-emerald-500">download</mat-icon>
             </button>
             
             <button (click)="exportSVGBase()" class="w-full flex items-center justify-between bg-white border border-gray-200 hover:border-purple-500 hover:bg-purple-50 p-3 rounded-lg transition-colors text-left shadow-sm group">
               <div class="flex items-center gap-3">
                 <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition-colors">
                   <mat-icon class="scale-75">flip_to_back</mat-icon>
                 </div>
                 <span class="font-bold text-gray-700">Export SVG (Base / CNC)</span>
               </div>
               <mat-icon class="text-gray-400 group-hover:text-purple-500">download</mat-icon>
             </button>
           </div>
        }
      </div>
    </div>
    
    <!-- Reusable Slider Template -->
    <ng-template #sliderParam let-label="label" let-key="key" let-value="value" let-min="min" let-max="max" let-step="step">
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <span class="font-medium text-gray-600 text-xs">{{ label }}</span>
          <input type="number" [min]="min" [max]="max" [step]="step"
                 [value]="value"
                 (input)="updateNumber(key, $event)"
                 class="w-16 text-right bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono">
        </div>
        <div class="flex items-center gap-2">
          <input type="range" [min]="min" [max]="max" [step]="step"
                 [value]="value"
                 (input)="updateNumber(key, $event)"
                 class="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer">
        </div>
      </div>
    </ng-template>
  \`
`;

const startIndex = content.indexOf('template: `');
const endIndex = content.indexOf('`\n})');
if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newTemplate + content.substring(endIndex + 3);
  fs.writeFileSync('src/app/left-sidebar.ts', content, 'utf8');
  console.log("Template replaced successfully.");
} else {
  console.error("Could not find template block");
}
