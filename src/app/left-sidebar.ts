import { Component, inject, computed, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AppStore, AppTab, LetterStyle, WallProfileTemplate, MountingType, BackplateShape, ProjectSettings, NeonBackplateStyle, NeonBackplateMaterial, DoubleStepBumpPreset } from './store';
import { SIGNAGE_FONTS } from './fonts';
import { Helper } from 'dxf';
import { DEFAULT_SIGN_SVG, SAMPLE_SVG_PRESETS } from './sample-svgs';

@Component({
  selector: 'app-left-sidebar',
  imports: [MatIconModule, NgTemplateOutlet],
  template: `
    <div class="flex flex-row h-full bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-md shadow-2xl border-l border-slate-200/50 dark:border-slate-800/50 transition-transform duration-300 ease-in-out pointer-events-auto"
         [style.transform]="isCollapsed() ? 'translateX(calc(100% - 4rem))' : 'translateX(0)'">
      <!-- Sidebar Navigation Rail -->
      <div class="w-16 h-full bg-slate-100/60 dark:bg-[#0b0f17]/60 border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center justify-between py-4 shrink-0 shadow-sm z-10 backdrop-blur-md">
        
        <div class="flex flex-col items-center space-y-3">
          <button (click)="selectTab('source')" 
                  [class.bg-blue-600]="store.activeTab() === 'source'"
                  [class.text-white]="store.activeTab() === 'source'"
                  [class.shadow-md]="store.activeTab() === 'source'"
                  [class.shadow-blue-500/30]="store.activeTab() === 'source'"
                  [class.text-slate-500]="store.activeTab() !== 'source'"
                  [class.dark:text-slate-400]="store.activeTab() !== 'source'"
                  [class.hover:bg-slate-200/80]="store.activeTab() !== 'source'"
                  [class.dark:hover:bg-slate-800/80]="store.activeTab() !== 'source'"
                  class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer"
                  [title]="isCollapsed() ? 'Input Source (Click to expand)' : 'Input Source'">
            <mat-icon class="scale-90">upload_file</mat-icon>
          </button>

          <button (click)="selectTab('dimensions')" 
                  [class.bg-blue-600]="store.activeTab() === 'dimensions'"
                  [class.text-white]="store.activeTab() === 'dimensions'"
                  [class.shadow-md]="store.activeTab() === 'dimensions'"
                  [class.shadow-blue-500/30]="store.activeTab() === 'dimensions'"
                  [class.text-slate-500]="store.activeTab() !== 'dimensions'"
                  [class.dark:text-slate-400]="store.activeTab() !== 'dimensions'"
                  [class.hover:bg-slate-200/80]="store.activeTab() !== 'dimensions'"
                  [class.dark:hover:bg-slate-800/80]="store.activeTab() !== 'dimensions'"
                  class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer"
                  [title]="isCollapsed() ? 'Dimensions (Click to expand)' : 'Dimensions'">
            <mat-icon class="scale-90">straighten</mat-icon>
          </button>

          <button (click)="selectTab('style')" 
                  [class.bg-blue-600]="store.activeTab() === 'style'"
                  [class.text-white]="store.activeTab() === 'style'"
                  [class.shadow-md]="store.activeTab() === 'style'"
                  [class.shadow-blue-500/30]="store.activeTab() === 'style'"
                  [class.text-slate-500]="store.activeTab() !== 'style'"
                  [class.dark:text-slate-400]="store.activeTab() !== 'style'"
                  [class.hover:bg-slate-200/80]="store.activeTab() !== 'style'"
                  [class.dark:hover:bg-slate-800/80]="store.activeTab() !== 'style'"
                  class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer"
                  [title]="isCollapsed() ? 'Style & Materials (Click to expand)' : 'Style & Materials'">
            <mat-icon class="scale-90">palette</mat-icon>
          </button>

          <button (click)="selectTab('layers')" 
                  [class.bg-blue-600]="store.activeTab() === 'layers'"
                  [class.text-white]="store.activeTab() === 'layers'"
                  [class.shadow-md]="store.activeTab() === 'layers'"
                  [class.shadow-blue-500/30]="store.activeTab() === 'layers'"
                  [class.text-slate-500]="store.activeTab() !== 'layers'"
                  [class.dark:text-slate-400]="store.activeTab() !== 'layers'"
                  [class.hover:bg-slate-200/80]="store.activeTab() !== 'layers'"
                  [class.dark:hover:bg-slate-800/80]="store.activeTab() !== 'layers'"
                  class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer"
                  [title]="isCollapsed() ? 'Layers Visibility (Click to expand)' : 'Layers Visibility'">
            <mat-icon class="scale-90">layers</mat-icon>
          </button>

          <button (click)="selectTab('mounting')" 
                  [class.bg-emerald-600]="store.activeTab() === 'mounting'"
                  [class.text-white]="store.activeTab() === 'mounting'"
                  [class.shadow-md]="store.activeTab() === 'mounting'"
                  [class.shadow-emerald-500/30]="store.activeTab() === 'mounting'"
                  [class.text-slate-500]="store.activeTab() !== 'mounting'"
                  [class.dark:text-slate-400]="store.activeTab() !== 'mounting'"
                  [class.hover:bg-slate-200/80]="store.activeTab() !== 'mounting'"
                  [class.dark:hover:bg-slate-800/80]="store.activeTab() !== 'mounting'"
                  class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer"
                  [title]="isCollapsed() ? 'Mounting & Bar System (Click to expand)' : 'Mounting & Bar System'">
            <mat-icon class="scale-90">grid_view</mat-icon>
          </button>

          <button (click)="selectTab('holes')" 
                  [class.bg-blue-600]="store.activeTab() === 'holes'"
                  [class.text-white]="store.activeTab() === 'holes'"
                  [class.shadow-md]="store.activeTab() === 'holes'"
                  [class.shadow-blue-500/30]="store.activeTab() === 'holes'"
                  [class.text-slate-500]="store.activeTab() !== 'holes'"
                  [class.dark:text-slate-400]="store.activeTab() !== 'holes'"
                  [class.hover:bg-slate-200/80]="store.activeTab() !== 'holes'"
                  [class.dark:hover:bg-slate-800/80]="store.activeTab() !== 'holes'"
                  class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer"
                  [title]="isCollapsed() ? 'Mounting Holes (Click to expand)' : 'Mounting Holes'">
            <mat-icon class="scale-90">radio_button_unchecked</mat-icon>
          </button>

          <button (click)="selectTab('simulation')" 
                  [class.bg-amber-500]="store.activeTab() === 'simulation'"
                  [class.text-white]="store.activeTab() === 'simulation'"
                  [class.shadow-md]="store.activeTab() === 'simulation'"
                  [class.shadow-amber-500/30]="store.activeTab() === 'simulation'"
                  [class.text-slate-500]="store.activeTab() !== 'simulation'"
                  [class.dark:text-slate-400]="store.activeTab() !== 'simulation'"
                  [class.hover:bg-slate-200/80]="store.activeTab() !== 'simulation'"
                  [class.dark:hover:bg-slate-800/80]="store.activeTab() !== 'simulation'"
                  class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer"
                  [title]="isCollapsed() ? 'LED Lighting Simulation (Click to expand)' : 'LED Lighting Simulation'">
            <mat-icon class="scale-90">lightbulb</mat-icon>
          </button>

          <button (click)="selectTab('export')" 
                  [class.bg-blue-600]="store.activeTab() === 'export'"
                  [class.text-white]="store.activeTab() === 'export'"
                  [class.shadow-md]="store.activeTab() === 'export'"
                  [class.shadow-blue-500/30]="store.activeTab() === 'export'"
                  [class.text-slate-500]="store.activeTab() !== 'export'"
                  [class.dark:text-slate-400]="store.activeTab() !== 'export'"
                  [class.hover:bg-slate-200/80]="store.activeTab() !== 'export'"
                  [class.dark:hover:bg-slate-800/80]="store.activeTab() !== 'export'"
                  class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer"
                  [title]="isCollapsed() ? 'Export CAD Files (Click to expand)' : 'Export CAD Files'">
            <mat-icon class="scale-90">download</mat-icon>
          </button>
        </div>

        <!-- Dedicated Sidebar Collapse Toggle Button -->
        <div class="flex flex-col items-center justify-center pt-2 mt-auto border-t border-slate-200 dark:border-slate-800 w-full">
          <button (click)="toggleCollapse()"
                  class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  [title]="isCollapsed() ? 'Expand Sidebar (Slide Left)' : 'Collapse Sidebar (Slide Right)'">
            <mat-icon class="scale-90">{{ isCollapsed() ? 'chevron_left' : 'chevron_right' }}</mat-icon>
          </button>
        </div>
      </div>

      <!-- Main Inspector Content Body -->
      <div class="flex flex-col h-full bg-white dark:bg-[#0f172a] w-[calc(100vw-4rem)] md:w-80 lg:w-[360px] shrink-0">
        <div class="w-full h-full overflow-y-auto flex flex-col shrink-0">
        
        <!-- Tab 1: Source -->
        @if (store.activeTab() === 'source') {
           <div class="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold bg-slate-50/90 dark:bg-[#0b0f17]/90 sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
             <div class="flex items-center gap-2">
               <mat-icon class="scale-75 text-blue-500">source</mat-icon>
               <span>INPUT SOURCE & GEOMETRY</span>
             </div>
             <!-- Quick Undo / Redo in sidebar header -->
             <div class="flex items-center gap-1">
               <button (click)="store.undo()"
                       [disabled]="!store.canUndo()"
                       [class.opacity-40]="!store.canUndo()"
                       [class.cursor-not-allowed]="!store.canUndo()"
                       [class.hover:bg-slate-200]="store.canUndo()"
                       [class.dark:hover:bg-slate-800]="store.canUndo()"
                       [class.text-blue-600]="store.canUndo()"
                       [class.dark:text-blue-400]="store.canUndo()"
                       class="p-1 rounded flex items-center transition-colors cursor-pointer text-slate-400"
                       [title]="store.canUndo() ? ('Undo: ' + (store.lastUndoDescription() || 'Last action') + ' (Ctrl+Z)') : 'Nothing to undo'">
                 <mat-icon class="scale-75">undo</mat-icon>
               </button>
               <button (click)="store.redo()"
                       [disabled]="!store.canRedo()"
                       [class.opacity-40]="!store.canRedo()"
                       [class.cursor-not-allowed]="!store.canRedo()"
                       [class.hover:bg-slate-200]="store.canRedo()"
                       [class.dark:hover:bg-slate-800]="store.canRedo()"
                       [class.text-blue-600]="store.canRedo()"
                       [class.dark:text-blue-400]="store.canRedo()"
                       class="p-1 rounded flex items-center transition-colors cursor-pointer text-slate-400"
                       [title]="store.canRedo() ? ('Redo: ' + (store.lastRedoDescription() || 'Next action') + ' (Ctrl+Y / ⌘⇧Z)') : 'Nothing to redo'">
                 <mat-icon class="scale-75">redo</mat-icon>
               </button>
             </div>
           </div>
           <div class="p-5 space-y-5">
              <!-- Source Type Toggle (Text vs SVG/Vector vs Neon Flex) -->
              <div class="space-y-1.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Input Mode</span>
                <div class="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                  <button (click)="store.updateSettings({ inputSource: 'text' })"
                          [class.bg-white]="store.settings().inputSource === 'text'"
                          [class.dark:bg-slate-700]="store.settings().inputSource === 'text'"
                          [class.text-blue-600]="store.settings().inputSource === 'text'"
                          [class.dark:text-blue-400]="store.settings().inputSource === 'text'"
                          [class.shadow-sm]="store.settings().inputSource === 'text'"
                          class="py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer text-slate-600 dark:text-slate-400">
                    <mat-icon class="scale-75">title</mat-icon>
                    <span>Text</span>
                  </button>
                  <button (click)="selectSvgSource()"
                          [class.bg-white]="store.settings().inputSource === 'svg'"
                          [class.dark:bg-slate-700]="store.settings().inputSource === 'svg'"
                          [class.text-blue-600]="store.settings().inputSource === 'svg'"
                          [class.dark:text-blue-400]="store.settings().inputSource === 'svg'"
                          [class.shadow-sm]="store.settings().inputSource === 'svg'"
                          class="py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer text-slate-600 dark:text-slate-400">
                    <mat-icon class="scale-75">folder_open</mat-icon>
                    <span>SVG</span>
                  </button>
                  
                </div>
              </div>

              <!-- Neon Flex with Acrylic Backplate Mode -->
                            <!-- SVG / Vector Upload Mode -->
              @if (store.settings().inputSource === 'svg') {
                <div class="space-y-4">
                  <!-- File Upload Dropzone / Trigger -->
                  <div class="space-y-1.5">
                    <div class="flex justify-between items-center">
                      <span class="block text-xs font-semibold text-slate-600 dark:text-slate-300">Upload Vector File</span>
                      <span class="text-[10px] text-slate-400">SVG or DXF</span>
                    </div>
                    <label class="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group text-center block">
                      <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <mat-icon>file_upload</mat-icon>
                      </div>
                      <span class="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">Click or drag & drop SVG / DXF</span>
                      <span class="text-[10px] text-slate-400 mt-0.5">Vector paths will be extruded into 3D channel letters</span>
                      <input type="file" accept=".svg,.dxf" (change)="onFileSelected($event)" class="hidden" />
                    </label>
                  </div>

                  <!-- Sample Presets -->
                  <div class="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Or Load Sample Preset</span>
                    <div class="grid grid-cols-2 gap-2">
                      @for (preset of sampleSvgPresets; track preset.name) {
                        <button (click)="loadSvgPreset(preset.svg)"
                                class="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl text-left transition-all cursor-pointer group">
                          <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            <mat-icon class="scale-75 text-blue-500">shapes</mat-icon>
                            <span>{{ preset.name }}</span>
                          </div>
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }

              <!-- Text Input Mode -->
              @if (store.settings().inputSource === 'text') {
              <div class="space-y-4">
                <div class="space-y-1.5">
                  <div class="flex justify-between items-center">
                    <label for="signTextInput" class="block text-xs font-semibold text-slate-600 dark:text-slate-300">Sign Text</label>
                    <span class="text-[10px] text-slate-400">Multi-line supported</span>
                  </div>
                  <div class="relative">
                    <textarea id="signTextInput" rows="2" [value]="store.settings().text" (input)="updateText($event)" 
                              placeholder="Enter sign text..."
                              class="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold tracking-wider text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"></textarea>
                  </div>
                </div>

                  <!-- Text Casing & Alignment Controls -->
                  <div class="grid grid-cols-2 gap-2">
                    <!-- Casing -->
                    <div class="space-y-1">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Casing</span>
                      <div class="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                        <button (click)="setTextTransform('uppercase')"
                                [class.bg-white]="store.settings().textTransform === 'uppercase'"
                                [class.dark:bg-slate-700]="store.settings().textTransform === 'uppercase'"
                                [class.text-blue-600]="store.settings().textTransform === 'uppercase'"
                                [class.dark:text-blue-400]="store.settings().textTransform === 'uppercase'"
                                [class.shadow-sm]="store.settings().textTransform === 'uppercase'"
                                class="py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">AA</button>
                        <button (click)="setTextTransform('capitalize')"
                                [class.bg-white]="store.settings().textTransform === 'capitalize'"
                                [class.dark:bg-slate-700]="store.settings().textTransform === 'capitalize'"
                                [class.text-blue-600]="store.settings().textTransform === 'capitalize'"
                                [class.dark:text-blue-400]="store.settings().textTransform === 'capitalize'"
                                [class.shadow-sm]="store.settings().textTransform === 'capitalize'"
                                class="py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Aa</button>
                        <button (click)="setTextTransform('none')"
                                [class.bg-white]="store.settings().textTransform === 'none'"
                                [class.dark:bg-slate-700]="store.settings().textTransform === 'none'"
                                [class.text-blue-600]="store.settings().textTransform === 'none'"
                                [class.dark:text-blue-400]="store.settings().textTransform === 'none'"
                                [class.shadow-sm]="store.settings().textTransform === 'none'"
                                class="py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Raw</button>
                      </div>
                    </div>

                    <!-- Alignment -->
                    <div class="space-y-1">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Align</span>
                      <div class="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                        <button (click)="setTextAlign('left')"
                                [class.bg-white]="store.settings().textAlign === 'left'"
                                [class.dark:bg-slate-700]="store.settings().textAlign === 'left'"
                                [class.text-blue-600]="store.settings().textAlign === 'left'"
                                [class.dark:text-blue-400]="store.settings().textAlign === 'left'"
                                [class.shadow-sm]="store.settings().textAlign === 'left'"
                                class="py-1 flex items-center justify-center rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
                                title="Align Left">
                          <mat-icon class="scale-75">format_align_left</mat-icon>
                        </button>
                        <button (click)="setTextAlign('center')"
                                [class.bg-white]="store.settings().textAlign === 'center'"
                                [class.dark:bg-slate-700]="store.settings().textAlign === 'center'"
                                [class.text-blue-600]="store.settings().textAlign === 'center'"
                                [class.dark:text-blue-400]="store.settings().textAlign === 'center'"
                                [class.shadow-sm]="store.settings().textAlign === 'center'"
                                class="py-1 flex items-center justify-center rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
                                title="Align Center">
                          <mat-icon class="scale-75">format_align_center</mat-icon>
                        </button>
                        <button (click)="setTextAlign('right')"
                                [class.bg-white]="store.settings().textAlign === 'right'"
                                [class.dark:bg-slate-700]="store.settings().textAlign === 'right'"
                                [class.text-blue-600]="store.settings().textAlign === 'right'"
                                [class.dark:text-blue-400]="store.settings().textAlign === 'right'"
                                [class.shadow-sm]="store.settings().textAlign === 'right'"
                                class="py-1 flex items-center justify-center rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
                                title="Align Right">
                          <mat-icon class="scale-75">format_align_right</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Signage Font Selection Dropdown -->
                  <div class="space-y-1.5 pt-1">
                    <div class="flex justify-between items-center">
                      <span class="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Signage Font Family
                      </span>
                      <span class="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200/50 dark:border-blue-800/40">Real-time 3D</span>
                    </div>
                    <div class="relative">
                      <button (click)="openFontModal()" 
                              class="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-left hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 transition-all cursor-pointer group">
                        <div class="flex flex-col">
                          <span class="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{{ selectedFontInfo().name }}</span>
                          <span class="text-[10px] text-slate-500 font-normal">Browse Fonts...</span>
                        </div>
                        <div class="flex items-center text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1.5 rounded-lg shadow-sm">
                          <mat-icon class="scale-90">font_download</mat-icon>
                        </div>
                      </button>
                    </div>
                    
                    @if (selectedFontInfo(); as info) {
                      <div class="flex items-center justify-between px-2.5 py-1.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/50 text-[11px]">
                        <span class="text-slate-600 dark:text-slate-300 font-medium">Style: {{ info.style }}</span>
                        <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold">{{ info.category }}</span>
                      </div>
                    }
                  </div>

                  <!-- Spacing Grid -->
                  <div class="grid grid-cols-2 gap-2 pt-1">
                    <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Global Letter Gap', key: 'letterSpacing', value: store.settings().letterSpacing, min: -20, max: 100, step: 1, unit: 'mm' }"></ng-container>
                    <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Line Spacing', key: 'lineSpacing', value: store.settings().lineSpacing || 25, min: 0, max: 150, step: 5, unit: 'mm' }"></ng-container>
                  </div>

                  <!-- Per-Letter Kerning Fine-Tuning -->
                  <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <mat-icon class="scale-75 text-blue-500">space_bar</mat-icon>
                        <div>
                          <span class="block text-xs font-bold text-slate-800 dark:text-slate-200">Specific Letter Spacing (Kerning)</span>
                          <span class="text-[10px] text-slate-400 dark:text-slate-500">Fine-tune gap between individual characters</span>
                        </div>
                      </div>
                      @if (hasCustomKerning()) {
                        <button (click)="store.resetKerning()" 
                                class="px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer">
                          Reset All
                        </button>
                      }
                    </div>

                    <div class="flex flex-col gap-1.5 pt-1">
                      @for (charItem of textCharacters(); track charItem.index) {
                        <div class="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                          <div class="flex items-center gap-2 font-mono font-bold">
                            <span class="w-5 h-5 flex items-center justify-center bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-md text-[11px] border border-blue-200/60 dark:border-blue-800">
                              {{ charItem.char }}
                            </span>
                            <span class="text-[10px] text-slate-400 font-sans font-normal">#{{ charItem.index + 1 }}</span>
                          </div>

                          <div class="flex items-center gap-1">
                            <button (click)="store.nudgeLetterKerning(charItem.index, -2)" 
                                    title="-2mm"
                                    class="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 cursor-pointer">-2</button>
                            <button (click)="store.nudgeLetterKerning(charItem.index, -1)" 
                                    title="-1mm"
                                    class="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 cursor-pointer">-1</button>
                            <span class="w-12 text-center font-mono font-bold text-[11px]"
                                  [class.text-blue-600]="(store.settings().customKerning?.[charItem.index] || 0) !== 0"
                                  [class.text-slate-600]="(store.settings().customKerning?.[charItem.index] || 0) === 0"
                                  [class.dark:text-slate-300]="(store.settings().customKerning?.[charItem.index] || 0) === 0">
                              {{ (store.settings().customKerning?.[charItem.index] || 0) > 0 ? '+' : '' }}{{ store.settings().customKerning?.[charItem.index] || 0 }} mm
                            </span>
                            <button (click)="store.nudgeLetterKerning(charItem.index, 1)" 
                                    title="+1mm"
                                    class="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 cursor-pointer">+1</button>
                            <button (click)="store.nudgeLetterKerning(charItem.index, 2)" 
                                    title="+2mm"
                                    class="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 cursor-pointer">+2</button>
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Arc / Curved Layout -->
                  <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <mat-icon class="scale-75 text-blue-500">gesture</mat-icon>
                        <div>
                          <span class="block text-xs font-bold text-slate-800 dark:text-slate-200">Curved / Arc Layout</span>
                          <span class="text-[10px] text-slate-400 dark:text-slate-500">Bend text along circular arc</span>
                        </div>
                      </div>
                      <button (click)="toggleArc()" 
                              class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer"
                              [class.bg-blue-600]="store.settings().arcEnabled"
                              [class.bg-slate-300]="!store.settings().arcEnabled"
                              [class.dark:bg-slate-700]="!store.settings().arcEnabled">
                        <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                              [class.translate-x-4.5]="store.settings().arcEnabled"
                              [class.translate-x-1]="!store.settings().arcEnabled"></span>
                      </button>
                    </div>

                    @if (store.settings().arcEnabled) {
                      <div class="pt-1 space-y-2">
                        <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Arc Curve Angle', key: 'arcAngle', value: store.settings().arcAngle || 60, min: -180, max: 180, step: 5, unit: '°' }"></ng-container>
                        <div class="flex gap-1 justify-end">
                          <button (click)="store.updateSettings({ arcAngle: 60 })" class="px-2 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">60° Arch</button>
                          <button (click)="store.updateSettings({ arcAngle: -60 })" class="px-2 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">-60° Inverted</button>
                          <button (click)="store.updateSettings({ arcAngle: 120 })" class="px-2 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">120° Semi</button>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Quick Word Chips -->
                  <div class="flex flex-wrap gap-1.5 pt-1">
                    <span class="text-[10px] text-slate-400 dark:text-slate-500 w-full font-medium">Quick presets:</span>
                    @for (sample of ['OPEN\n24/7', 'NEON\nBAR', 'CAFE\nSTUDIO', 'LETRA\nMAKER']; track sample) {
                      <button (click)="setSampleText(sample)" 
                              class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
                        {{ sample.replace('\n', ' • ') }}
                      </button>
                    }
                  </div>
              </div>
              }
           </div>
        }

        <!-- Tab 2: Dimensions -->
        @if (store.activeTab() === 'dimensions') {
           <div class="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold bg-slate-50/90 dark:bg-[#0b0f17]/90 sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2">
             <mat-icon class="scale-75 text-blue-500">straighten</mat-icon>
             <span>DIMENSIONS & BUILD PLATE</span>
           </div>
           <div class="p-5 space-y-5">
              <div class="space-y-4">
                <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Target Height (Y Axis)', key: 'targetHeight', value: store.settings().targetHeight, min: 50, max: 1000, step: 10, unit: 'mm' }"></ng-container>

                <!-- Quick Height Preset Buttons -->
                <div class="flex items-center gap-2 pt-1">
                  <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Quick sizes:</span>
                  @for (size of [150, 200, 300, 500]; track size) {
                    <button (click)="store.updateSettings({ targetHeight: size })" 
                            [class.bg-blue-600]="store.settings().targetHeight === size"
                            [class.text-white]="store.settings().targetHeight === size"
                            class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 transition-colors">
                      {{ size }}mm
                    </button>
                  }
                </div>
              </div>
              
              <div class="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">3D Printer Bed Grid</span>
                  <button (click)="toggleBuildPlateFromButton()" 
                          class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                          [class.bg-blue-600]="store.settings().showBuildPlate"
                          [class.bg-slate-300]="!store.settings().showBuildPlate"
                          [class.dark:bg-slate-700]="!store.settings().showBuildPlate">
                    <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                          [class.translate-x-4.5]="store.settings().showBuildPlate"
                          [class.translate-x-1]="!store.settings().showBuildPlate"></span>
                  </button>
                </div>

                @if (store.settings().showBuildPlate) {
                  <div class="mb-3">
                    <label for="printer-preset" class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Printer Preset</label>
                    <select id="printer-preset" (change)="applyPrinterPreset($event)"
                            class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors">
                      <option value="custom" [selected]="isCustomPrinter()">Custom Size</option>
                      <option value="bambu-h2d" [selected]="isPreset('bambu-h2d')">Bambu Lab H2D (350x320)</option>
                      <option value="bambu-x1" [selected]="isPreset('bambu-x1')">Bambu Lab X1/P1/A1 (256x256)</option>
                      <option value="bambu-mini" [selected]="isPreset('bambu-mini')">Bambu Lab A1 Mini (180x180)</option>
                      <option value="prusa-mk4" [selected]="isPreset('prusa-mk4')">Prusa MK3/MK4 (250x210)</option>
                      <option value="standard-200" [selected]="isPreset('standard-200')">Standard 200x200</option>
                    </select>
                  </div>
                  <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Bed Width', key: 'buildPlateWidth', value: store.settings().buildPlateWidth, min: 100, max: 600, step: 10, unit: 'mm' }"></ng-container>
                    <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Bed Depth', key: 'buildPlateHeight', value: store.settings().buildPlateHeight, min: 100, max: 600, step: 10, unit: 'mm' }"></ng-container>
                  </div>

                  @if (store.oversizedWarning()) {
                    <div class="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex gap-2 font-medium">
                      <mat-icon class="scale-75 shrink-0 text-rose-500">warning</mat-icon>
                      <p>Sign dimensions exceed print bed boundaries! Highlighted in red.</p>
                    </div>
                  }
                }
              </div>

              <!-- 3D Presentation Auto-Rotate Settings -->
              <div class="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <mat-icon class="scale-75 text-blue-500" [class.animate-spin]="store.settings().autoRotate">3d_rotation</mat-icon>
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">Auto-Rotate Orbit Presentation</span>
                  </div>
                  <button (click)="store.toggleAutoRotate()" 
                          class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer"
                          [class.bg-blue-600]="store.settings().autoRotate"
                          [class.bg-slate-300]="!store.settings().autoRotate"
                          [class.dark:bg-slate-700]="!store.settings().autoRotate">
                    <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                          [class.translate-x-4.5]="store.settings().autoRotate"
                          [class.translate-x-1]="!store.settings().autoRotate"></span>
                  </button>
                </div>

                <!-- Rotation Speed Control -->
                <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Orbit Rotation Speed', key: 'autoRotateSpeed', value: store.settings().autoRotateSpeed, min: 0.2, max: 10, step: 0.2, unit: 'x' }"></ng-container>

                  <!-- Rotation Speed Presets -->
                  <div class="flex items-center gap-1.5 pt-1">
                    <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Quick speeds:</span>
                    @for (speed of [0.5, 2.0, 5.0, 10.0]; track speed) {
                      <button (click)="store.updateSettings({ autoRotateSpeed: speed })" 
                              [class.bg-blue-600]="store.settings().autoRotateSpeed === speed"
                              [class.text-white]="store.settings().autoRotateSpeed === speed"
                              class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
                        {{ speed }}x
                      </button>
                    }
                  </div>
                </div>
              </div>
           </div>
        }

        <!-- Tab 3: Style & Materials -->
        @if (store.activeTab() === 'style') {
           <div class="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold bg-slate-50/90 dark:bg-[#0b0f17]/90 sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2">
             <mat-icon class="scale-75 text-blue-500">palette</mat-icon>
             <span>SIGN PRESET & WALL THICKNESS</span>
           </div>
           <div class="p-5 space-y-5">
              <!-- Color Palettes Picker -->
              <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <!-- Body Color -->
                <div>
                  <label for="bodyColorPicker" class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">Sign Shell Color</label>
                  <div class="flex items-center gap-2">
                    <input id="bodyColorPicker" type="color" [value]="store.settings().bodyColor" (input)="updateColor('bodyColor', $event)" 
                           class="w-9 h-9 p-0 border-0 rounded-xl cursor-pointer shrink-0 shadow-sm">
                    <span class="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">{{ store.settings().bodyColor }}</span>
                  </div>
                </div>

                <!-- Face Material -->
                <div>
                  <label for="faceMaterialPicker" class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">Front Face Material</label>
                  <select id="faceMaterialPicker"
                          (change)="updateFaceMaterial($event)"
                          class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors cursor-pointer">
                    <option value="acrylic" [selected]="store.settings().faceMaterial === 'acrylic'">Acrylic (Solid Glossy)</option>
                    <option value="3d-printed" [selected]="store.settings().faceMaterial === '3d-printed'">3D Printed (Solid Matte)</option>
                  </select>
                </div>

                <!-- Face Color -->
                <div>
                  <label for="acrylicColorPicker" class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">Front Face Color</label>
                  <div class="flex items-center gap-2">
                    <input id="acrylicColorPicker" type="color" [value]="store.settings().acrylicColor" (input)="updateColor('acrylicColor', $event)" 
                           class="w-9 h-9 p-0 border-0 rounded-xl cursor-pointer shrink-0 shadow-sm">
                    <span class="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">{{ store.settings().acrylicColor }}</span>
                  </div>
                </div>

                <!-- 3D Diffuser Protrusion & Bevel Enhancement Controls -->
                <div class="col-span-2 p-3.5 bg-gradient-to-br from-indigo-50/80 to-blue-50/80 dark:from-indigo-950/40 dark:to-blue-950/40 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      <mat-icon class="scale-75 text-indigo-500">height</mat-icon>
                      <span>DIFFUSER PROTRUSION & BEVEL</span>
                    </div>
                    @if ((store.settings().diffuserHeightOffset ?? 0) > 0) {
                      <span class="px-2 py-0.5 text-[9px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono">
                        +{{ store.settings().diffuserHeightOffset }}mm Higher
                      </span>
                    }
                  </div>

                  <!-- Diffuser Height Offset (Protrusion above letter walls) Slider -->
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label for="diffuserOffsetInput" class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Protrusion Height (Above Walls)
                      </label>
                      <span class="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {{ store.settings().diffuserHeightOffset ?? 0 }} mm
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <input id="diffuserOffsetSlider" type="range" 
                             [value]="store.settings().diffuserHeightOffset ?? 0" 
                             min="0" max="25" step="0.5"
                             (input)="updateNumber('diffuserHeightOffset', $event)"
                             class="flex-1 accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer">
                      <div class="flex items-center gap-1 shrink-0">
                        <input id="diffuserOffsetInput" type="number" 
                               [value]="store.settings().diffuserHeightOffset ?? 0" 
                               min="0" max="25" step="0.5"
                               (input)="updateNumber('diffuserHeightOffset', $event)"
                               class="w-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 outline-none text-center">
                        <span class="text-[10px] text-slate-400 font-mono">mm</span>
                      </div>
                    </div>
                    <p class="text-[9.5px] text-slate-500 dark:text-slate-400 mt-1">
                      Makes the diffuser cap stand higher than the letter body walls for high-contrast 3D pop.
                    </p>
                  </div>

                  <!-- Bevel Toggle & Settings -->
                  <div class="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60 space-y-2.5">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1.5">
                        <mat-icon class="scale-75 text-indigo-500">rounded_corner</mat-icon>
                        <div>
                          <span class="block text-xs font-bold text-slate-800 dark:text-slate-200">Diffuser Bevel / Chamfer</span>
                          <span class="text-[9.5px] text-slate-500 dark:text-slate-400">Chamfered or rounded 3D edge styling</span>
                        </div>
                      </div>
                      <button (click)="toggleDiffuserBevel()" 
                              class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer"
                              [class.bg-indigo-600]="store.settings().diffuserBevelEnabled"
                              [class.bg-slate-300]="!store.settings().diffuserBevelEnabled"
                              [class.dark:bg-slate-700]="!store.settings().diffuserBevelEnabled">
                        <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm"
                              [class.translate-x-4.5]="store.settings().diffuserBevelEnabled"
                              [class.translate-x-1]="!store.settings().diffuserBevelEnabled"></span>
                      </button>
                    </div>

                    @if (store.settings().diffuserBevelEnabled) {
                      <div class="p-2.5 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-2.5">
                        <!-- Bevel Profile Segmented Selector -->
                        <div>
                          <span class="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Bevel Profile Style</span>
                          <div class="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <button (click)="setDiffuserBevelSegments(1)"
                                    [class.bg-white]="(store.settings().diffuserBevelSegments ?? 3) === 1"
                                    [class.dark:bg-slate-700]="(store.settings().diffuserBevelSegments ?? 3) === 1"
                                    [class.text-indigo-600]="(store.settings().diffuserBevelSegments ?? 3) === 1"
                                    [class.dark:text-indigo-300]="(store.settings().diffuserBevelSegments ?? 3) === 1"
                                    [class.shadow-sm]="(store.settings().diffuserBevelSegments ?? 3) === 1"
                                    [class.text-slate-600]="(store.settings().diffuserBevelSegments ?? 3) !== 1"
                                    [class.dark:text-slate-400]="(store.settings().diffuserBevelSegments ?? 3) !== 1"
                                    class="py-1 px-1 rounded-md text-[10px] font-bold text-center transition-all cursor-pointer">
                              45° Chamfer
                            </button>
                            <button (click)="setDiffuserBevelSegments(3)"
                                    [class.bg-white]="(store.settings().diffuserBevelSegments ?? 3) === 3"
                                    [class.dark:bg-slate-700]="(store.settings().diffuserBevelSegments ?? 3) === 3"
                                    [class.text-indigo-600]="(store.settings().diffuserBevelSegments ?? 3) === 3"
                                    [class.dark:text-indigo-300]="(store.settings().diffuserBevelSegments ?? 3) === 3"
                                    [class.shadow-sm]="(store.settings().diffuserBevelSegments ?? 3) === 3"
                                    [class.text-slate-600]="(store.settings().diffuserBevelSegments ?? 3) !== 3"
                                    [class.dark:text-slate-400]="(store.settings().diffuserBevelSegments ?? 3) !== 3"
                                    class="py-1 px-1 rounded-md text-[10px] font-bold text-center transition-all cursor-pointer">
                              Smooth Fillet
                            </button>
                            <button (click)="setDiffuserBevelSegments(6)"
                                    [class.bg-white]="(store.settings().diffuserBevelSegments ?? 3) === 6"
                                    [class.dark:bg-slate-700]="(store.settings().diffuserBevelSegments ?? 3) === 6"
                                    [class.text-indigo-600]="(store.settings().diffuserBevelSegments ?? 3) === 6"
                                    [class.dark:text-indigo-300]="(store.settings().diffuserBevelSegments ?? 3) === 6"
                                    [class.shadow-sm]="(store.settings().diffuserBevelSegments ?? 3) === 6"
                                    [class.text-slate-600]="(store.settings().diffuserBevelSegments ?? 3) !== 6"
                                    [class.dark:text-slate-400]="(store.settings().diffuserBevelSegments ?? 3) !== 6"
                                    class="py-1 px-1 rounded-md text-[10px] font-bold text-center transition-all cursor-pointer">
                              Round Dome
                            </button>
                          </div>
                        </div>

                        <!-- Bevel Width & Height Sliders -->
                        <div class="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div class="flex items-center justify-between mb-1">
                              <label for="bevelSizeInput" class="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">Bevel Width</label>
                              <span class="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ store.settings().diffuserBevelSize ?? 1.5 }}mm</span>
                            </div>
                            <div class="flex items-center gap-1">
                              <input id="bevelSizeInput" type="number" 
                                     [value]="store.settings().diffuserBevelSize ?? 1.5" 
                                     step="0.2" min="0.2" max="6.0" 
                                     (input)="updateNumber('diffuserBevelSize', $event)"
                                     class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 outline-none">
                              <span class="text-[10px] text-slate-400 font-mono">mm</span>
                            </div>
                          </div>

                          <div>
                            <div class="flex items-center justify-between mb-1">
                              <label for="bevelThicknessInput" class="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">Bevel Depth</label>
                              <span class="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ store.settings().diffuserBevelThickness ?? 1.5 }}mm</span>
                            </div>
                            <div class="flex items-center gap-1">
                              <input id="bevelThicknessInput" type="number" 
                                     [value]="store.settings().diffuserBevelThickness ?? 1.5" 
                                     step="0.2" min="0.2" max="6.0" 
                                     (input)="updateNumber('diffuserBevelThickness', $event)"
                                     class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 outline-none">
                              <span class="text-[10px] text-slate-400 font-mono">mm</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- 3D Printed Diffuser Parameters -->
                @if (store.settings().faceMaterial === '3d-printed') {
                  <div class="col-span-2 p-3 bg-cyan-50/80 dark:bg-cyan-950/40 rounded-xl border border-cyan-200/80 dark:border-cyan-800/60 space-y-2.5">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-900 dark:text-cyan-200">
                        <mat-icon class="scale-75 text-cyan-500">view_in_ar</mat-icon>
                        <span>3D PRINTED DIFFUSER SPECS</span>
                      </div>
                      <span class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-cyan-200/80 dark:bg-cyan-900/80 text-cyan-800 dark:text-cyan-200 font-mono">Face Down Z=0</span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <label for="printedFaceWallInput" class="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">Wall Width (1 Wall)</label>
                          <span class="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">1 Wall</span>
                        </div>
                        <div class="flex items-center gap-1">
                          <input id="printedFaceWallInput" type="number" [value]="store.settings().printedFaceWallThickness ?? 0.42" step="0.02" min="0.2" max="2.0" (input)="updateNumber('printedFaceWallThickness', $event)"
                                 class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 outline-none">
                          <span class="text-[10px] text-slate-400 font-mono">mm</span>
                        </div>
                      </div>

                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <label for="printedFaceBottomInput" class="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">Bottom Shell (1 Layer)</label>
                          <span class="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">1 Shell</span>
                        </div>
                        <div class="flex items-center gap-1">
                          <input id="printedFaceBottomInput" type="number" [value]="store.settings().printedFaceBottomThickness ?? 0.20" step="0.02" min="0.1" max="1.5" (input)="updateNumber('printedFaceBottomThickness', $event)"
                                 class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 outline-none">
                          <span class="text-[10px] text-slate-400 font-mono">mm</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-cyan-200/60 dark:border-cyan-800/60">
                      <span>0.42mm Single Wall • 0.20mm (1 Bottom Shell)</span>
                      <span class="font-bold text-cyan-600 dark:text-cyan-400 font-mono">Zero Supports</span>
                    </div>
                  </div>
                }

                <!-- Acrylic Laser Cut Specs & Kerf Tolerance -->
                @if (store.settings().faceMaterial === 'acrylic') {
                  <div class="col-span-2 p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        <mat-icon class="scale-75 text-emerald-500">content_cut</mat-icon>
                        <span>ACRYLIC LASER CUT & TOLERANCE</span>
                      </div>
                      <span class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-mono">
                        {{ (store.settings().acrylicClearance ?? 0) === 0 ? 'Nominal 1:1' : ((store.settings().acrylicClearance ?? 0) > 0 ? '+' + store.settings().acrylicClearance + 'mm' : store.settings().acrylicClearance + 'mm') }}
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <label for="acrylicThicknessInput" class="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">Sheet Thickness</label>
                          <span class="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{{ store.settings().acrylicThickness ?? 2.8 }}mm</span>
                        </div>
                        <div class="flex items-center gap-1">
                          <input id="acrylicThicknessInput" type="number" [value]="store.settings().acrylicThickness ?? 2.8" step="0.2" min="1.0" max="10.0" (input)="updateNumber('acrylicThickness', $event)"
                                 class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 outline-none">
                          <span class="text-[10px] text-slate-400 font-mono">mm</span>
                        </div>
                      </div>

                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <label for="acrylicClearanceInput" class="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">Kerf / Fit Offset</label>
                          <span class="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            {{ store.settings().acrylicClearance ?? 0 }}mm
                          </span>
                        </div>
                        <div class="flex items-center gap-1">
                          <input id="acrylicClearanceInput" type="number" [value]="store.settings().acrylicClearance ?? 0" step="0.05" min="-2.0" max="2.0" (input)="updateNumber('acrylicClearance', $event)"
                                 class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 outline-none">
                          <span class="text-[10px] text-slate-400 font-mono">mm</span>
                        </div>
                      </div>
                    </div>

                    <!-- Slider for Clearance / Kerf Offset -->
                    <div class="pt-1">
                      <div class="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                        <span>Laser Kerf Compensation Slider</span>
                        <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">{{ store.settings().acrylicClearance ?? 0 }} mm</span>
                      </div>
                      <input type="range" min="-1.0" max="1.0" step="0.05" 
                             [value]="store.settings().acrylicClearance ?? 0"
                             (input)="updateNumber('acrylicClearance', $event)"
                             class="w-full h-1.5 bg-emerald-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                    </div>

                    <div class="flex items-center justify-between text-[9.5px] text-slate-500 dark:text-slate-400 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                      <span>Negative = laser kerf / tight fit • 0.00mm = exact nominal</span>
                      <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">1:1 Vector Export</span>
                    </div>
                  </div>
                }
              </div>

              <!-- Style Presets Grid -->
              <div>
                <div class="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">Construction Preset</div>
                <div class="grid grid-cols-1 gap-2">
                  @for (style of styles; track style.id) {
                    <button (click)="store.applyPreset(style.id)"
                            [class.border-blue-600]="store.settings().style === style.id"
                            [class.dark:border-blue-400]="store.settings().style === style.id"
                            [class.bg-blue-50-80]="store.settings().style === style.id"
                            [class.dark:bg-blue-950-30]="store.settings().style === style.id"
                            [class.border-slate-200]="store.settings().style !== style.id"
                            [class.dark:border-slate-800]="store.settings().style !== style.id"
                            class="p-3 border rounded-xl text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between group cursor-pointer">
                      <div class="pr-2">
                        <div class="flex items-center gap-1.5">
                          <span class="block text-xs font-bold text-slate-800 dark:text-slate-100">{{ style.name }}</span>
                          @if (style.badge) {
                            <span class="px-1.5 py-0.5 rounded bg-lime-500/20 text-lime-600 dark:text-lime-400 text-[8px] font-black uppercase tracking-wider">{{ style.badge }}</span>
                          }
                        </div>
                        <span class="text-[10px] text-slate-400 dark:text-slate-500">{{ style.description }}</span>
                      </div>
                      @if (store.settings().style === style.id) {
                        <span class="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-extrabold uppercase shrink-0">Active</span>
                      }
                    </button>
                  }
                </div>
              </div>
              
              <!-- WALL PROFILE TEMPLATE -->
              <div class="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <mat-icon class="scale-75 text-blue-500">architecture</mat-icon>
                    <span>WALL PROFILE TEMPLATE</span>
                  </div>
                  <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">{{ store.settings().wallProfileTemplate || 'straight' }}</span>
                </div>

                <!-- Segmented Template Selector (Straight vs Double Step vs Tapered) -->
                <div class="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button (click)="setWallProfileTemplate('straight')"
                          [class.bg-white]="store.settings().wallProfileTemplate === 'straight'"
                          [class.dark:bg-slate-800]="store.settings().wallProfileTemplate === 'straight'"
                          [class.text-blue-600]="store.settings().wallProfileTemplate === 'straight'"
                          [class.dark:text-blue-400]="store.settings().wallProfileTemplate === 'straight'"
                          [class.shadow-sm]="store.settings().wallProfileTemplate === 'straight'"
                          [class.text-slate-600]="store.settings().wallProfileTemplate !== 'straight'"
                          [class.dark:text-slate-400]="store.settings().wallProfileTemplate !== 'straight'"
                          class="py-1.5 px-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer">
                    Straight
                  </button>
                  <button (click)="setWallProfileTemplate('double-step')"
                          [class.bg-white]="store.settings().wallProfileTemplate === 'double-step'"
                          [class.dark:bg-slate-800]="store.settings().wallProfileTemplate === 'double-step'"
                          [class.text-blue-600]="store.settings().wallProfileTemplate === 'double-step'"
                          [class.dark:text-blue-400]="store.settings().wallProfileTemplate === 'double-step'"
                          [class.shadow-sm]="store.settings().wallProfileTemplate === 'double-step'"
                          [class.text-slate-600]="store.settings().wallProfileTemplate !== 'double-step'"
                          [class.dark:text-slate-400]="store.settings().wallProfileTemplate !== 'double-step'"
                          class="py-1.5 px-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1">
                    <span>Double Step</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  </button>
                  <button (click)="setWallProfileTemplate('tapered')"
                          [class.bg-white]="store.settings().wallProfileTemplate === 'tapered'"
                          [class.dark:bg-slate-800]="store.settings().wallProfileTemplate === 'tapered'"
                          [class.text-blue-600]="store.settings().wallProfileTemplate === 'tapered'"
                          [class.dark:text-blue-400]="store.settings().wallProfileTemplate === 'tapered'"
                          [class.shadow-sm]="store.settings().wallProfileTemplate === 'tapered'"
                          [class.text-slate-600]="store.settings().wallProfileTemplate !== 'tapered'"
                          [class.dark:text-slate-400]="store.settings().wallProfileTemplate !== 'tapered'"
                          class="py-1.5 px-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer">
                    Tapered
                  </button>
                </div>

                <!-- 2D Cross-Section SVG Diagram -->
                <div class="relative bg-slate-950/90 rounded-2xl p-3.5 border border-slate-800 overflow-hidden shadow-inner text-slate-100">
                  <div class="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-1.5 mb-2">
                    <span class="flex items-center gap-1">
                      <span class="w-2 h-2 rounded-full bg-lime-400 inline-block"></span>
                      FRONT (ACRYLIC)
                    </span>
                    <span class="text-[9px] text-slate-500">2D PROFILE CROSS-SECTION</span>
                  </div>

                  <div class="flex justify-center my-1">
                    <svg class="w-full max-w-[260px] h-[155px]" viewBox="0 0 240 160">
                      <defs>
                        <linearGradient id="wallGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stop-color="#94a3b8" />
                          <stop offset="100%" stop-color="#64748b" />
                        </linearGradient>
                        <pattern id="diagGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
                        </pattern>
                      </defs>

                      <rect width="240" height="160" fill="url(#diagGrid)" rx="6" />

                      <!-- Baseplate Bed Line -->
                      <line x1="20" y1="140" x2="220" y2="140" stroke="#334155" stroke-width="1.5" stroke-dasharray="3 3" />
                      <text x="25" y="152" fill="#64748b" font-size="9" font-family="monospace" font-weight="bold">BACK - BED</text>

                      <!-- Face Top Line -->
                      <line x1="20" y1="24" x2="220" y2="24" stroke="#334155" stroke-width="1" stroke-dasharray="2 2" />
                      <text x="25" y="18" fill="#64748b" font-size="9" font-family="monospace" font-weight="bold">FRONT</text>

                      <!-- Dynamic Profile Wall Polygon -->
                      <path [attr.d]="getProfileSvgPath()" fill="url(#wallGrad)" stroke="#cbd5e1" stroke-width="1.5" stroke-linejoin="round" />

                      <!-- Acrylic Face Slot (Yellow/Chartreuse) -->
                      <path [attr.d]="getAcrylicSvgPath()" fill="#ccff00" stroke="#a3e635" stroke-width="1" />

                      <!-- Dimension indicator annotations -->
                      @if (store.settings().wallProfileTemplate === 'double-step' || store.settings().style === 'acrylic-double-step') {
                        <line x1="170" y1="110" x2="190" y2="110" stroke="#38bdf8" stroke-width="1" />
                        <text x="193" y="113" fill="#38bdf8" font-size="7.5" font-family="monospace">B1 +{{ store.settings().footOffset || 3.5 }}mm</text>
                        <line x1="170" y1="58" x2="190" y2="58" stroke="#38bdf8" stroke-width="1" />
                        <text x="193" y="61" fill="#38bdf8" font-size="7.5" font-family="monospace">B2 +{{ store.settings().footOffset || 3.5 }}mm</text>
                        <text x="130" y="85" fill="#f59e0b" font-size="7.5" font-family="monospace">Gap {{ store.settings().stepsGap || 5 }}mm</text>
                      }
                    </svg>
                  </div>

                  <div class="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>Height: {{ store.settings().wallHeight }}mm</span>
                    @if (store.settings().wallProfileTemplate === 'double-step' || store.settings().style === 'acrylic-double-step') {
                      <span>2× Bumps: +{{ (store.settings().footOffset || 3.5) }}mm × {{ (store.settings().footHeight || 4) }}mm</span>
                      <span>Gap: {{ store.settings().stepsGap || 5 }}mm</span>
                    } @else if (store.settings().wallProfileTemplate === 'tapered') {
                      <span>Draft Taper: +{{ store.settings().bodyTaper || 3 }}mm</span>
                    } @else {
                      <span>Profile: Straight</span>
                    }
                  </div>
                </div>

                <!-- Sliders for the Profile (Foot, Double-Step & Wall) -->
                <div class="space-y-3.5 pt-2">
                  @if (store.settings().wallProfileTemplate === 'double-step' || store.settings().style === 'acrylic-double-step') {
                    <!-- DOUBLE STEP BUMP PRESETS SECTION -->
                    <div class="p-3 bg-gradient-to-br from-amber-500/5 via-slate-50 to-blue-500/5 dark:from-amber-950/20 dark:via-slate-900/60 dark:to-blue-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 space-y-2.5">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-100">
                          <mat-icon class="scale-75 text-amber-500">bookmarks</mat-icon>
                          <span>Step Bump Presets</span>
                        </div>
                        <div class="flex items-center gap-1">
                          <button (click)="openSavePresetDialog()"
                                  class="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-extrabold rounded-lg shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                                  title="Save current bump parameters as a reusable preset">
                            <mat-icon class="scale-75">bookmark_add</mat-icon>
                            <span>Save Current</span>
                          </button>
                          <button (click)="exportDoubleStepPresets()"
                                  class="p-1 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] transition-all cursor-pointer"
                                  title="Export presets as JSON">
                            <mat-icon class="scale-75">file_download</mat-icon>
                          </button>
                          <button (click)="openImportDialog()"
                                  class="p-1 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] transition-all cursor-pointer"
                                  title="Import presets JSON">
                            <mat-icon class="scale-75">file_upload</mat-icon>
                          </button>
                        </div>
                      </div>

                      @if (presetSaveToast()) {
                        <div class="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
                          <div class="flex items-center gap-1.5">
                            <mat-icon class="scale-75 text-emerald-600 dark:text-emerald-400">check_circle</mat-icon>
                            <span>{{ presetSaveToast() }}</span>
                          </div>
                          <button (click)="presetSaveToast.set(null)" class="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 cursor-pointer">
                            <mat-icon class="scale-75">close</mat-icon>
                          </button>
                        </div>
                      }

                      <!-- Inline Save Dialog Form -->
                      @if (showSavePresetDialog()) {
                        <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-700 shadow-md space-y-2 animate-fadeIn">
                          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                            <span class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                              <mat-icon class="scale-75 text-amber-500">add_task</mat-icon>
                              Save Double Step Preset
                            </span>
                            <button (click)="cancelSavePresetDialog()" class="text-slate-400 hover:text-slate-600 cursor-pointer">
                              <mat-icon class="scale-75">close</mat-icon>
                            </button>
                          </div>

                          <div class="bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-lg text-[10px] font-mono text-slate-600 dark:text-slate-300 flex flex-wrap gap-x-2 gap-y-0.5 border border-amber-100 dark:border-amber-900/40">
                            <span>Offset: +{{ store.settings().footOffset || 3.5 }}mm</span>
                            <span>Height: {{ store.settings().footHeight || 4 }}mm</span>
                            <span>Gap: {{ store.settings().stepsGap || 5 }}mm</span>
                            <span>Base: {{ store.settings().footStartHeight || 4 }}mm</span>
                            <span>Angle: {{ store.settings().footRampAngle || 45 }}°</span>
                            <span>Wall: {{ store.settings().wallHeight || 35 }}mm</span>
                          </div>

                          <div class="space-y-1.5">
                            <div>
                              <label for="savePresetNameInput" class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">Preset Name</label>
                              <input id="savePresetNameInput" type="text" [value]="newPresetName()" (input)="newPresetName.set($any($event.target).value)"
                                     placeholder="e.g. Architectural 38mm Sign"
                                     class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-amber-500" />
                            </div>
                            <div>
                              <label for="savePresetDescInput" class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">Description / Sign Type (Optional)</label>
                              <input id="savePresetDescInput" type="text" [value]="newPresetDesc()" (input)="newPresetDesc.set($any($event.target).value)"
                                     placeholder="e.g. Best for outdoor illuminated acrylic letters"
                                     class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-amber-500" />
                            </div>
                          </div>

                          <div class="flex items-center justify-end gap-1.5 pt-1">
                            <button (click)="cancelSavePresetDialog()"
                                    class="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer">
                              Cancel
                            </button>
                            <button (click)="submitSavePreset()"
                                    class="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer">
                              <mat-icon class="scale-75">save</mat-icon>
                              <span>Save Preset</span>
                            </button>
                          </div>
                        </div>
                      }

                      <!-- Inline Import Dialog Form -->
                      @if (showImportPresetDialog()) {
                        <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-300 dark:border-blue-700 shadow-md space-y-2 animate-fadeIn">
                          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                            <span class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                              <mat-icon class="scale-75 text-blue-500">file_upload</mat-icon>
                              Import Presets (JSON)
                            </span>
                            <button (click)="closeImportDialog()" class="text-slate-400 hover:text-slate-600 cursor-pointer">
                              <mat-icon class="scale-75">close</mat-icon>
                            </button>
                          </div>

                          <label class="block border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-xl p-2.5 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/50 transition-all">
                            <mat-icon class="text-blue-500 scale-90">upload_file</mat-icon>
                            <span class="block text-xs font-bold text-slate-700 dark:text-slate-200">Select .json Preset File</span>
                            <input type="file" accept=".json" (change)="onPresetFileImport($event)" class="hidden" />
                          </label>

                          <div class="space-y-1">
                            <label for="importPresetJsonText" class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">Or Paste JSON Content</label>
                            <textarea id="importPresetJsonText" rows="3" [value]="importPresetJson()" (input)="importPresetJson.set($any($event.target).value)"
                                      placeholder='[ { "name": "My Preset", "footOffset": 3.5, ... } ]'
                                      class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-[11px] font-mono text-slate-800 dark:text-slate-100 outline-none resize-none"></textarea>
                          </div>

                          @if (importPresetError()) {
                            <span class="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block">{{ importPresetError() }}</span>
                          }

                          <div class="flex items-center justify-end gap-1.5 pt-1">
                            <button (click)="closeImportDialog()"
                                    class="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer">
                              Cancel
                            </button>
                            <button (click)="submitImportPresets()"
                                    class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer">
                              <mat-icon class="scale-75">check</mat-icon>
                              <span>Import</span>
                            </button>
                          </div>
                        </div>
                      }

                      <!-- Presets Grid -->
                      <div class="space-y-2 max-h-64 overflow-y-auto pr-0.5 custom-scrollbar">
                        @for (preset of store.doubleStepPresets(); track preset.id) {
                          <div role="button"
                               tabindex="0"
                               (click)="applyDoubleStepPreset(preset)"
                               (keydown.enter)="applyDoubleStepPreset(preset)"
                               (keydown.space)="$event.preventDefault(); applyDoubleStepPreset(preset)"
                               [class.border-amber-500]="isDoubleStepPresetActive(preset)"
                               [class.dark:border-amber-400]="isDoubleStepPresetActive(preset)"
                               [class.bg-amber-50-60]="isDoubleStepPresetActive(preset)"
                               [class.dark:bg-amber-950-30]="isDoubleStepPresetActive(preset)"
                               [class.shadow-sm]="isDoubleStepPresetActive(preset)"
                               [class.border-slate-200]="!isDoubleStepPresetActive(preset)"
                               [class.dark:border-slate-800]="!isDoubleStepPresetActive(preset)"
                               [class.bg-white]="!isDoubleStepPresetActive(preset)"
                               [class.dark:bg-slate-900-80]="!isDoubleStepPresetActive(preset)"
                               class="p-2.5 rounded-xl border transition-all text-left cursor-pointer hover:border-amber-400 dark:hover:border-amber-600 group relative">
                            <div class="flex items-center justify-between mb-1">
                              <div class="flex items-center gap-1.5">
                                <span class="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                  {{ preset.name }}
                                </span>
                                @if (preset.badge) {
                                  <span [class.bg-amber-500-20]="preset.isCustom"
                                        [class.text-amber-700]="preset.isCustom"
                                        [class.dark:text-amber-300]="preset.isCustom"
                                        [class.bg-blue-500-15]="!preset.isCustom"
                                        [class.text-blue-700]="!preset.isCustom"
                                        [class.dark:text-blue-300]="!preset.isCustom"
                                        class="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider">
                                    {{ preset.badge }}
                                  </span>
                                }
                              </div>
                              <div class="flex items-center gap-1">
                                @if (isDoubleStepPresetActive(preset)) {
                                  <span class="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded-full text-[8px] font-black uppercase tracking-wider shadow-xs">
                                    <mat-icon class="scale-50">check</mat-icon>
                                    <span>Active</span>
                                  </span>
                                }
                                @if (preset.isCustom) {
                                  <button (click)="deletePreset(preset.id, $event)"
                                          title="Delete custom preset"
                                          class="w-5 h-5 rounded hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer ml-1">
                                    <mat-icon class="scale-75">delete_outline</mat-icon>
                                  </button>
                                }
                              </div>
                            </div>

                            <p class="text-[10px] text-slate-500 dark:text-slate-400 mb-1.5 leading-tight line-clamp-2">{{ preset.description }}</p>

                            <!-- Parametric Spec Badges -->
                            <div class="flex flex-wrap gap-1 text-[9px] font-mono font-semibold">
                              <span class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                                Offset: +{{ preset.footOffset }}mm
                              </span>
                              <span class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                                H: {{ preset.footHeight }}mm
                              </span>
                              <span class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                                Gap: {{ preset.stepsGap }}mm
                              </span>
                              <span class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                                Base: {{ preset.footStartHeight }}mm
                              </span>
                              <span class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                                Wall: {{ preset.wallHeight }}mm
                              </span>
                            </div>
                          </div>
                        }
                      </div>
                    </div>

                    <div class="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Fine-Tune Equal Bump Sliders</div>
                    </div>

                    <ng-container *ngTemplateOutlet="sliderParam; context: { 
                      label: 'Equal Bump Offset', 
                      key: 'footOffset', 
                      value: store.settings().footOffset ?? 3.5, 
                      min: 1, 
                      max: 10, 
                      step: 0.5, 
                      unit: 'mm', 
                      desc: 'Identical outward step width for both bumps' 
                    }"></ng-container>

                    <ng-container *ngTemplateOutlet="sliderParam; context: { 
                      label: 'Equal Bump Height', 
                      key: 'footHeight', 
                      value: store.settings().footHeight ?? 4, 
                      min: 1, 
                      max: 12, 
                      step: 0.5, 
                      unit: 'mm', 
                      desc: 'Straight vertical facet height of each bump' 
                    }"></ng-container>

                    <ng-container *ngTemplateOutlet="sliderParam; context: { 
                      label: 'Gap Height Between Bumps', 
                      key: 'stepsGap', 
                      value: store.settings().stepsGap ?? 5, 
                      min: 1, 
                      max: 18, 
                      step: 0.5, 
                      unit: 'mm', 
                      desc: 'Vertical gap distance between the two bumps' 
                    }"></ng-container>

                    <ng-container *ngTemplateOutlet="sliderParam; context: { 
                      label: 'Base Start Height', 
                      key: 'footStartHeight', 
                      value: store.settings().footStartHeight ?? 4, 
                      min: 1, 
                      max: 15, 
                      step: 0.5, 
                      unit: 'mm', 
                      desc: 'Distance from the print bed up to the first bump' 
                    }"></ng-container>

                    <ng-container *ngTemplateOutlet="sliderParam; context: { 
                      label: 'Ramp Overhang Angle', 
                      key: 'footRampAngle', 
                      value: store.settings().footRampAngle ?? 45, 
                      min: 30, 
                      max: 60, 
                      step: 1, 
                      unit: '°', 
                      desc: 'Overhang angle for support-free 3D printing (45° standard for FDM)' 
                    }"></ng-container>
                  } @else if (store.settings().wallProfileTemplate === 'tapered') {
                    <ng-container *ngTemplateOutlet="sliderParam; context: { 
                      label: 'Wall Draft Angle / Taper', 
                      key: 'bodyTaper', 
                      value: store.settings().bodyTaper ?? 3, 
                      min: 0.5, 
                      max: 15, 
                      step: 0.5, 
                      unit: 'mm', 
                      desc: 'Flares the base contour smoothly outwards from top face to print bed' 
                    }"></ng-container>
                  }

                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Wall Height', key: 'wallHeight', value: store.settings().wallHeight, min: 10, max: 100, step: 1, unit: 'mm' }"></ng-container>
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'External Wall Thickness', key: 'externalWallThickness', value: store.settings().externalWallThickness, min: 0.5, max: 5, step: 0.1, unit: 'mm' }"></ng-container>
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Internal Lip Wall Thickness', key: 'internalWallThickness', value: store.settings().internalWallThickness, min: 0, max: 5, step: 0.1, unit: 'mm' }"></ng-container>
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Backplate Thickness', key: 'baseThickness', value: store.settings().baseThickness, min: 0, max: 10, step: 0.1, unit: 'mm' }"></ng-container>
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Acrylic Lens Thickness', key: 'acrylicThickness', value: store.settings().acrylicThickness, min: 0, max: 10, step: 0.1, unit: 'mm' }"></ng-container>
                </div>
              </div>
           </div>
        }

        <!-- Tab 4: Layers Visibility -->
        @if (store.activeTab() === 'layers') {
           <div class="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold bg-slate-50/90 dark:bg-[#0b0f17]/90 sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2">
             <mat-icon class="scale-75 text-blue-500">layers</mat-icon>
             <span>3D LAYERS VISIBILITY</span>
           </div>
           <div class="p-5 space-y-3">
              <button (click)="store.updateLayer('body', !store.settings().layers.body)"
                      [class.border-blue-500]="store.settings().layers.body"
                      [class.bg-blue-50-40]="store.settings().layers.body"
                      [class.dark:bg-blue-950-20]="store.settings().layers.body"
                      [class.border-slate-200]="!store.settings().layers.body"
                      [class.dark:border-slate-800]="!store.settings().layers.body"
                      class="w-full flex items-center justify-between p-3.5 border rounded-2xl transition-all text-left">
                <div class="flex items-center gap-3">
                  <div class="w-5 h-5 rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm shrink-0" [style.backgroundColor]="store.settings().bodyColor"></div>
                  <div>
                    <span class="block text-xs font-bold text-slate-800 dark:text-slate-100">Sign Body (Housing Shell)</span>
                    <span class="text-[10px] text-slate-400 dark:text-slate-500">3D extruded channel box structure</span>
                  </div>
                </div>
                <mat-icon class="scale-90 text-slate-400 dark:text-slate-500" [class.text-blue-600]="store.settings().layers.body">{{ store.settings().layers.body ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>

              <button (click)="store.updateLayer('acrylic', !store.settings().layers.acrylic)"
                      [class.border-blue-500]="store.settings().layers.acrylic"
                      [class.bg-blue-50-40]="store.settings().layers.acrylic"
                      [class.dark:bg-blue-950-20]="store.settings().layers.acrylic"
                      [class.border-slate-200]="!store.settings().layers.acrylic"
                      [class.dark:border-slate-800]="!store.settings().layers.acrylic"
                      class="w-full flex items-center justify-between p-3.5 border rounded-2xl transition-all text-left">
                <div class="flex items-center gap-3">
                  <div class="w-5 h-5 rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm shrink-0" [style.backgroundColor]="store.settings().acrylicColor"></div>
                  <div>
                    <span class="block text-xs font-bold text-slate-800 dark:text-slate-100">Acrylic Front Face</span>
                    <span class="text-[10px] text-slate-400 dark:text-slate-500">Translucent diffuser front lens</span>
                  </div>
                </div>
                <mat-icon class="scale-90 text-slate-400 dark:text-slate-500" [class.text-blue-600]="store.settings().layers.acrylic">{{ store.settings().layers.acrylic ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>

              <button (click)="store.updateLayer('mounting', store.settings().layers.mounting === false ? true : false)"
                      [class.border-emerald-500]="store.settings().layers.mounting !== false"
                      [class.bg-emerald-50-40]="store.settings().layers.mounting !== false"
                      [class.dark:bg-emerald-950-20]="store.settings().layers.mounting !== false"
                      [class.border-slate-200]="store.settings().layers.mounting === false"
                      [class.dark:border-slate-800]="store.settings().layers.mounting === false"
                      class="w-full flex items-center justify-between p-3.5 border rounded-2xl transition-all text-left">
                <div class="flex items-center gap-3">
                  <div class="w-5 h-5 rounded-lg border border-emerald-400 bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <mat-icon class="scale-75 text-emerald-600 dark:text-emerald-400">grid_view</mat-icon>
                  </div>
                  <div>
                    <span class="block text-xs font-bold text-slate-800 dark:text-slate-100">Mounting System / Backplate</span>
                    <span class="text-[10px] text-slate-400 dark:text-slate-500">Rear panel, crossbars & hardware</span>
                  </div>
                </div>
                <mat-icon class="scale-90 text-slate-400 dark:text-slate-500" [class.text-emerald-600]="store.settings().layers.mounting !== false">{{ store.settings().layers.mounting !== false ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>
           </div>
        }

        <!-- Tab: Mounting & Bar System -->
        @if (store.activeTab() === 'mounting') {
           <div class="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold bg-slate-50/90 dark:bg-[#0b0f17]/90 sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2">
             <mat-icon class="scale-75 text-emerald-500">grid_view</mat-icon>
             <span>MOUNTING & BAR SYSTEM</span>
           </div>
           <div class="p-5 space-y-5">
              <!-- System Architecture Cards -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Mounting Architecture</div>
                  <button (click)="selectMountingPreset(store.settings().mountingType, store.settings().backplateShape)" 
                          class="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer">
                    <mat-icon class="scale-50">visibility</mat-icon>
                    <span>Focus 3D</span>
                  </button>
                </div>
                <div class="grid grid-cols-2 gap-2.5">
                  <!-- 1. Direct Wall -->
                  <button (click)="selectMountingPreset('none')"
                          [class.border-emerald-500]="store.settings().mountingType === 'none'"
                          [class.ring-2]="store.settings().mountingType === 'none'"
                          [class.ring-emerald-500/20]="store.settings().mountingType === 'none'"
                          [class.bg-emerald-50/70]="store.settings().mountingType === 'none'"
                          [class.dark:bg-emerald-950/40]="store.settings().mountingType === 'none'"
                          [class.border-slate-200]="store.settings().mountingType !== 'none'"
                          [class.dark:border-slate-800]="store.settings().mountingType !== 'none'"
                          class="p-2.5 border rounded-xl text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer group relative overflow-hidden">
                    <svg viewBox="0 0 100 36" class="w-full h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 mb-2 border border-slate-200/50 dark:border-slate-700/50">
                      <line x1="0" y1="12" x2="100" y2="12" stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="0.75" stroke-dasharray="6,3" />
                      <line x1="0" y1="24" x2="100" y2="24" stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="0.75" stroke-dasharray="6,3" />
                      <rect x="18" y="7" width="16" height="22" rx="2" fill="#64748b" fill-opacity="0.3" stroke="#64748b" stroke-width="1.2" />
                      <rect x="42" y="7" width="16" height="22" rx="2" fill="#64748b" fill-opacity="0.3" stroke="#64748b" stroke-width="1.2" />
                      <rect x="66" y="7" width="16" height="22" rx="2" fill="#64748b" fill-opacity="0.3" stroke="#64748b" stroke-width="1.2" />
                      <circle cx="26" cy="18" r="1.5" fill="#ef4444" />
                      <circle cx="50" cy="18" r="1.5" fill="#ef4444" />
                      <circle cx="74" cy="18" r="1.5" fill="#ef4444" />
                    </svg>
                    <div class="flex items-center gap-1.5 mb-0.5 text-slate-800 dark:text-slate-100 font-bold text-xs">
                      <mat-icon class="scale-75 text-slate-400">wallpaper</mat-icon>
                      <span>Direct Wall</span>
                    </div>
                    <p class="text-[10px] text-slate-400 leading-tight">Individual letters</p>
                  </button>

                  <!-- 2. Contour Plate -->
                  <button (click)="selectMountingPreset('backplate', 'contour')"
                          [class.border-emerald-500]="store.settings().mountingType === 'backplate' && store.settings().backplateShape === 'contour'"
                          [class.ring-2]="store.settings().mountingType === 'backplate' && store.settings().backplateShape === 'contour'"
                          [class.ring-emerald-500/20]="store.settings().mountingType === 'backplate' && store.settings().backplateShape === 'contour'"
                          [class.bg-emerald-50/70]="store.settings().mountingType === 'backplate' && store.settings().backplateShape === 'contour'"
                          [class.dark:bg-emerald-950/40]="store.settings().mountingType === 'backplate' && store.settings().backplateShape === 'contour'"
                          [class.border-slate-200]="!(store.settings().mountingType === 'backplate' && store.settings().backplateShape === 'contour')"
                          [class.dark:border-slate-800]="!(store.settings().mountingType === 'backplate' && store.settings().backplateShape === 'contour')"
                          class="p-2.5 border rounded-xl text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer group relative overflow-hidden">
                    <svg viewBox="0 0 100 36" class="w-full h-8 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 mb-2 border border-emerald-200/50 dark:border-emerald-800/50">
                      <path d="M 10 18 Q 10 5 22 5 L 78 5 Q 90 5 90 18 Q 90 31 78 31 L 22 31 Q 10 31 10 18 Z" fill="#10b981" fill-opacity="0.18" stroke="#10b981" stroke-width="1.2" stroke-dasharray="2,2" />
                      <circle cx="16" cy="11" r="1.5" fill="#f59e0b" />
                      <circle cx="84" cy="11" r="1.5" fill="#f59e0b" />
                      <circle cx="16" cy="25" r="1.5" fill="#f59e0b" />
                      <circle cx="84" cy="25" r="1.5" fill="#f59e0b" />
                      <rect x="22" y="8" width="14" height="20" rx="2" fill="#10b981" fill-opacity="0.8" />
                      <rect x="43" y="8" width="14" height="20" rx="2" fill="#10b981" fill-opacity="0.8" />
                      <rect x="64" y="8" width="14" height="20" rx="2" fill="#10b981" fill-opacity="0.8" />
                    </svg>
                    <div class="flex items-center gap-1.5 mb-0.5 text-slate-800 dark:text-slate-100 font-bold text-xs">
                      <mat-icon class="scale-75 text-emerald-500">gesture</mat-icon>
                      <span>Contour Plate</span>
                    </div>
                    <p class="text-[10px] text-slate-400 leading-tight">Offset silhouette</p>
                  </button>

                  <!-- 3. Panel Board -->
                  <button (click)="selectMountingPreset('backplate', 'rounded-rect')"
                          [class.border-emerald-500]="store.settings().mountingType === 'backplate' && store.settings().backplateShape !== 'contour'"
                          [class.ring-2]="store.settings().mountingType === 'backplate' && store.settings().backplateShape !== 'contour'"
                          [class.ring-emerald-500/20]="store.settings().mountingType === 'backplate' && store.settings().backplateShape !== 'contour'"
                          [class.bg-emerald-50/70]="store.settings().mountingType === 'backplate' && store.settings().backplateShape !== 'contour'"
                          [class.dark:bg-emerald-950/40]="store.settings().mountingType === 'backplate' && store.settings().backplateShape !== 'contour'"
                          [class.border-slate-200]="!(store.settings().mountingType === 'backplate' && store.settings().backplateShape !== 'contour')"
                          [class.dark:border-slate-800]="!(store.settings().mountingType === 'backplate' && store.settings().backplateShape !== 'contour')"
                          class="p-2.5 border rounded-xl text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer group relative overflow-hidden">
                    <svg viewBox="0 0 100 36" class="w-full h-8 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 mb-2 border border-blue-200/50 dark:border-blue-800/50">
                      <rect x="6" y="4" width="88" height="28" rx="4" fill="#3b82f6" fill-opacity="0.15" stroke="#3b82f6" stroke-width="1.2" />
                      <circle cx="12" cy="10" r="1.5" fill="#94a3b8" stroke="#475569" stroke-width="0.8" />
                      <circle cx="88" cy="10" r="1.5" fill="#94a3b8" stroke="#475569" stroke-width="0.8" />
                      <circle cx="12" cy="26" r="1.5" fill="#94a3b8" stroke="#475569" stroke-width="0.8" />
                      <circle cx="88" cy="26" r="1.5" fill="#94a3b8" stroke="#475569" stroke-width="0.8" />
                      <rect x="22" y="8" width="14" height="20" rx="2" fill="#3b82f6" fill-opacity="0.8" />
                      <rect x="43" y="8" width="14" height="20" rx="2" fill="#3b82f6" fill-opacity="0.8" />
                      <rect x="64" y="8" width="14" height="20" rx="2" fill="#3b82f6" fill-opacity="0.8" />
                    </svg>
                    <div class="flex items-center gap-1.5 mb-0.5 text-slate-800 dark:text-slate-100 font-bold text-xs">
                      <mat-icon class="scale-75 text-blue-500">crop_square</mat-icon>
                      <span>Panel Board</span>
                    </div>
                    <p class="text-[10px] text-slate-400 leading-tight">Geometric panel</p>
                  </button>

                  <!-- 4. Bar Rails -->
                  <button (click)="selectMountingPreset('bar-system')"
                          [class.border-emerald-500]="store.settings().mountingType === 'bar-system'"
                          [class.ring-2]="store.settings().mountingType === 'bar-system'"
                          [class.ring-emerald-500/20]="store.settings().mountingType === 'bar-system'"
                          [class.bg-emerald-50/70]="store.settings().mountingType === 'bar-system'"
                          [class.dark:bg-emerald-950/40]="store.settings().mountingType === 'bar-system'"
                          [class.border-slate-200]="store.settings().mountingType !== 'bar-system'"
                          [class.dark:border-slate-800]="store.settings().mountingType !== 'bar-system'"
                          class="p-2.5 border rounded-xl text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer group relative overflow-hidden">
                    <svg viewBox="0 0 100 36" class="w-full h-8 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 mb-2 border border-amber-200/50 dark:border-amber-800/50">
                      <rect x="4" y="9" width="92" height="4" rx="1" fill="#f59e0b" fill-opacity="0.4" stroke="#f59e0b" stroke-width="0.8" />
                      <rect x="4" y="23" width="92" height="4" rx="1" fill="#f59e0b" fill-opacity="0.4" stroke="#f59e0b" stroke-width="0.8" />
                      <rect x="4" y="7" width="3" height="8" rx="0.5" fill="#78350f" />
                      <rect x="93" y="7" width="3" height="8" rx="0.5" fill="#78350f" />
                      <rect x="4" y="21" width="3" height="8" rx="0.5" fill="#78350f" />
                      <rect x="93" y="21" width="3" height="8" rx="0.5" fill="#78350f" />
                      <rect x="22" y="6" width="14" height="24" rx="2" fill="#d97706" fill-opacity="0.85" />
                      <rect x="43" y="6" width="14" height="24" rx="2" fill="#d97706" fill-opacity="0.85" />
                      <rect x="64" y="6" width="14" height="24" rx="2" fill="#d97706" fill-opacity="0.85" />
                    </svg>
                    <div class="flex items-center gap-1.5 mb-0.5 text-slate-800 dark:text-slate-100 font-bold text-xs">
                      <mat-icon class="scale-75 text-amber-500">table_rows</mat-icon>
                      <span>Bar Rails</span>
                    </div>
                    <p class="text-[10px] text-slate-400 leading-tight">Crossbar spine</p>
                  </button>

                  <!-- 5. Raceway Box -->
                  <button (click)="selectMountingPreset('raceway')"
                          [class.border-emerald-500]="store.settings().mountingType === 'raceway'"
                          [class.ring-2]="store.settings().mountingType === 'raceway'"
                          [class.ring-emerald-500/20]="store.settings().mountingType === 'raceway'"
                          [class.bg-emerald-50/70]="store.settings().mountingType === 'raceway'"
                          [class.dark:bg-emerald-950/40]="store.settings().mountingType === 'raceway'"
                          [class.border-slate-200]="store.settings().mountingType !== 'raceway'"
                          [class.dark:border-slate-800]="store.settings().mountingType !== 'raceway'"
                          class="p-2.5 border rounded-xl text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer group relative overflow-hidden">
                    <svg viewBox="0 0 100 36" class="w-full h-8 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 mb-2 border border-purple-200/50 dark:border-purple-800/50">
                      <rect x="6" y="14" width="88" height="18" rx="2" fill="#a855f7" fill-opacity="0.25" stroke="#a855f7" stroke-width="1.2" />
                      <rect x="4" y="12" width="3" height="22" rx="0.5" fill="#7e22ce" />
                      <rect x="93" y="12" width="3" height="22" rx="0.5" fill="#7e22ce" />
                      <rect x="22" y="5" width="14" height="18" rx="2" fill="#9333ea" fill-opacity="0.85" />
                      <rect x="43" y="5" width="14" height="18" rx="2" fill="#9333ea" fill-opacity="0.85" />
                      <rect x="64" y="5" width="14" height="18" rx="2" fill="#9333ea" fill-opacity="0.85" />
                    </svg>
                    <div class="flex items-center gap-1.5 mb-0.5 text-slate-800 dark:text-slate-100 font-bold text-xs">
                      <mat-icon class="scale-75 text-purple-500">view_compact</mat-icon>
                      <span>Raceway Box</span>
                    </div>
                    <p class="text-[10px] text-slate-400 leading-tight">Hollow wireway</p>
                  </button>

                  <!-- 6. Desk Stand -->
                  <button (click)="selectMountingPreset('desk-stand')"
                          [class.border-emerald-500]="store.settings().mountingType === 'desk-stand'"
                          [class.ring-2]="store.settings().mountingType === 'desk-stand'"
                          [class.ring-emerald-500/20]="store.settings().mountingType === 'desk-stand'"
                          [class.bg-emerald-50/70]="store.settings().mountingType === 'desk-stand'"
                          [class.dark:bg-emerald-950/40]="store.settings().mountingType === 'desk-stand'"
                          [class.border-slate-200]="store.settings().mountingType !== 'desk-stand'"
                          [class.dark:border-slate-800]="store.settings().mountingType !== 'desk-stand'"
                          class="p-2.5 border rounded-xl text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer group relative overflow-hidden">
                    <svg viewBox="0 0 100 36" class="w-full h-8 rounded-lg bg-teal-50/50 dark:bg-teal-950/20 mb-2 border border-teal-200/50 dark:border-teal-800/50">
                      <rect x="10" y="24" width="80" height="8" rx="2" fill="#14b8a6" fill-opacity="0.3" stroke="#0d9488" stroke-width="1.2" />
                      <rect x="14" y="22" width="72" height="2" rx="0.5" fill="#0f766e" />
                      <rect x="22" y="6" width="14" height="18" rx="2" fill="#0d9488" fill-opacity="0.85" />
                      <rect x="43" y="6" width="14" height="18" rx="2" fill="#0d9488" fill-opacity="0.85" />
                      <rect x="64" y="6" width="14" height="18" rx="2" fill="#0d9488" fill-opacity="0.85" />
                    </svg>
                    <div class="flex items-center gap-1.5 mb-0.5 text-slate-800 dark:text-slate-100 font-bold text-xs">
                      <mat-icon class="scale-75 text-teal-500">desktop_windows</mat-icon>
                      <span>Desk Stand</span>
                    </div>
                    <p class="text-[10px] text-slate-400 leading-tight">Table pedestal</p>
                  </button>
                </div>
              </div>

              <!-- BACKPLATE CONFIGURATION SECTION -->
              @if (store.settings().mountingType === 'backplate') {
                <div class="p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-100">Backplate Panel Shape</span>
                    <span class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">{{ store.settings().backplateShape }}</span>
                  </div>

                  <div class="grid grid-cols-3 gap-1.5">
                    <button (click)="store.updateSettings({ backplateShape: 'contour' })"
                            [class.bg-emerald-600]="store.settings().backplateShape === 'contour'"
                            [class.text-white]="store.settings().backplateShape === 'contour'"
                            [class.bg-white]="store.settings().backplateShape !== 'contour'"
                            [class.dark:bg-slate-800]="store.settings().backplateShape !== 'contour'"
                            [class.text-slate-700]="store.settings().backplateShape !== 'contour'"
                            [class.dark:text-slate-300]="store.settings().backplateShape !== 'contour'"
                            class="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-all text-center">
                      Contour
                    </button>
                    <button (click)="store.updateSettings({ backplateShape: 'rounded-rect' })"
                            [class.bg-emerald-600]="store.settings().backplateShape === 'rounded-rect'"
                            [class.text-white]="store.settings().backplateShape === 'rounded-rect'"
                            [class.bg-white]="store.settings().backplateShape !== 'rounded-rect'"
                            [class.dark:bg-slate-800]="store.settings().backplateShape !== 'rounded-rect'"
                            [class.text-slate-700]="store.settings().backplateShape !== 'rounded-rect'"
                            [class.dark:text-slate-300]="store.settings().backplateShape !== 'rounded-rect'"
                            class="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-all text-center">
                      Round Rect
                    </button>
                    <button (click)="store.updateSettings({ backplateShape: 'capsule' })"
                            [class.bg-emerald-600]="store.settings().backplateShape === 'capsule'"
                            [class.text-white]="store.settings().backplateShape === 'capsule'"
                            [class.bg-white]="store.settings().backplateShape !== 'capsule'"
                            [class.dark:bg-slate-800]="store.settings().backplateShape !== 'capsule'"
                            [class.text-slate-700]="store.settings().backplateShape !== 'capsule'"
                            [class.dark:text-slate-300]="store.settings().backplateShape !== 'capsule'"
                            class="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-all text-center">
                      Capsule
                    </button>
                    <button (click)="store.updateSettings({ backplateShape: 'oval' })"
                            [class.bg-emerald-600]="store.settings().backplateShape === 'oval'"
                            [class.text-white]="store.settings().backplateShape === 'oval'"
                            [class.bg-white]="store.settings().backplateShape !== 'oval'"
                            [class.dark:bg-slate-800]="store.settings().backplateShape !== 'oval'"
                            [class.text-slate-700]="store.settings().backplateShape !== 'oval'"
                            [class.dark:text-slate-300]="store.settings().backplateShape !== 'oval'"
                            class="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-all text-center">
                      Oval
                    </button>
                    <button (click)="store.updateSettings({ backplateShape: 'rectangle' })"
                            [class.bg-emerald-600]="store.settings().backplateShape === 'rectangle'"
                            [class.text-white]="store.settings().backplateShape === 'rectangle'"
                            [class.bg-white]="store.settings().backplateShape !== 'rectangle'"
                            [class.dark:bg-slate-800]="store.settings().backplateShape !== 'rectangle'"
                            [class.text-slate-700]="store.settings().backplateShape !== 'rectangle'"
                            [class.dark:text-slate-300]="store.settings().backplateShape !== 'rectangle'"
                            class="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-all text-center">
                      Square Rect
                    </button>
                  </div>

                  <!-- Material Finish Selector -->
                  <div class="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Backplate Material & Finish</span>
                    <div class="grid grid-cols-2 gap-2">
                      <button (click)="store.updateSettings({ backplateMaterial: 'clear-acrylic', backplateOpacity: 0.85 })"
                              [class.border-emerald-500]="store.settings().backplateMaterial === 'clear-acrylic'"
                              [class.bg-white]="store.settings().backplateMaterial === 'clear-acrylic'"
                              [class.dark:bg-slate-800]="store.settings().backplateMaterial === 'clear-acrylic'"
                              [class.border-slate-200]="store.settings().backplateMaterial !== 'clear-acrylic'"
                              [class.dark:border-slate-700]="store.settings().backplateMaterial !== 'clear-acrylic'"
                              class="p-2 border rounded-xl flex items-center gap-2 text-left transition-all">
                        <div class="w-4 h-4 rounded-full border border-sky-400 bg-sky-200/40 shadow-inner"></div>
                        <span class="text-xs font-semibold text-slate-800 dark:text-slate-100">Clear Acrylic</span>
                      </button>

                      <button (click)="store.updateSettings({ backplateMaterial: 'frosted-acrylic', backplateOpacity: 0.75 })"
                              [class.border-emerald-500]="store.settings().backplateMaterial === 'frosted-acrylic'"
                              [class.bg-white]="store.settings().backplateMaterial === 'frosted-acrylic'"
                              [class.dark:bg-slate-800]="store.settings().backplateMaterial === 'frosted-acrylic'"
                              [class.border-slate-200]="store.settings().backplateMaterial !== 'frosted-acrylic'"
                              [class.dark:border-slate-700]="store.settings().backplateMaterial !== 'frosted-acrylic'"
                              class="p-2 border rounded-xl flex items-center gap-2 text-left transition-all">
                        <div class="w-4 h-4 rounded-full border border-slate-300 bg-slate-100 dark:bg-slate-400"></div>
                        <span class="text-xs font-semibold text-slate-800 dark:text-slate-100">Frosted Opal</span>
                      </button>

                      <button (click)="store.updateSettings({ backplateMaterial: 'black-acrylic', backplateOpacity: 1.0 })"
                              [class.border-emerald-500]="store.settings().backplateMaterial === 'black-acrylic'"
                              [class.bg-white]="store.settings().backplateMaterial === 'black-acrylic'"
                              [class.dark:bg-slate-800]="store.settings().backplateMaterial === 'black-acrylic'"
                              [class.border-slate-200]="store.settings().backplateMaterial !== 'black-acrylic'"
                              [class.dark:border-slate-700]="store.settings().backplateMaterial !== 'black-acrylic'"
                              class="p-2 border rounded-xl flex items-center gap-2 text-left transition-all">
                        <div class="w-4 h-4 rounded-full bg-black border border-slate-700 shadow-inner"></div>
                        <span class="text-xs font-semibold text-slate-800 dark:text-slate-100">Gloss Black</span>
                      </button>

                      <button (click)="store.updateSettings({ backplateMaterial: 'white-matte', backplateOpacity: 1.0 })"
                              [class.border-emerald-500]="store.settings().backplateMaterial === 'white-matte'"
                              [class.bg-white]="store.settings().backplateMaterial === 'white-matte'"
                              [class.dark:bg-slate-800]="store.settings().backplateMaterial === 'white-matte'"
                              [class.border-slate-200]="store.settings().backplateMaterial !== 'white-matte'"
                              [class.dark:border-slate-700]="store.settings().backplateMaterial !== 'white-matte'"
                              class="p-2 border rounded-xl flex items-center gap-2 text-left transition-all">
                        <div class="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-inner"></div>
                        <span class="text-xs font-semibold text-slate-800 dark:text-slate-100">Matte White</span>
                      </button>

                      <button (click)="store.updateSettings({ backplateMaterial: 'brushed-aluminum', backplateOpacity: 1.0 })"
                              [class.border-emerald-500]="store.settings().backplateMaterial === 'brushed-aluminum'"
                              [class.bg-white]="store.settings().backplateMaterial === 'brushed-aluminum'"
                              [class.dark:bg-slate-800]="store.settings().backplateMaterial === 'brushed-aluminum'"
                              [class.border-slate-200]="store.settings().backplateMaterial !== 'brushed-aluminum'"
                              [class.dark:border-slate-700]="store.settings().backplateMaterial !== 'brushed-aluminum'"
                              class="p-2 border rounded-xl flex items-center gap-2 text-left transition-all">
                        <div class="w-4 h-4 rounded-full bg-gradient-to-tr from-slate-400 via-slate-200 to-slate-500 border border-slate-400"></div>
                        <span class="text-xs font-semibold text-slate-800 dark:text-slate-100">Brushed Metal</span>
                      </button>

                      <button (click)="store.updateSettings({ backplateMaterial: 'wood', backplateOpacity: 1.0 })"
                              [class.border-emerald-500]="store.settings().backplateMaterial === 'wood'"
                              [class.bg-white]="store.settings().backplateMaterial === 'wood'"
                              [class.dark:bg-slate-800]="store.settings().backplateMaterial === 'wood'"
                              [class.border-slate-200]="store.settings().backplateMaterial !== 'wood'"
                              [class.dark:border-slate-700]="store.settings().backplateMaterial !== 'wood'"
                              class="p-2 border rounded-xl flex items-center gap-2 text-left transition-all">
                        <div class="w-4 h-4 rounded-full bg-amber-700 border border-amber-900"></div>
                        <span class="text-xs font-semibold text-slate-800 dark:text-slate-100">Natural Wood</span>
                      </button>
                    </div>
                  </div>

                  <!-- Sliders: Dimensions & Spacers -->
                  <div class="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Border Margin / Padding', key: 'backplatePadding', value: store.settings().backplatePadding, min: 5, max: 80, step: 1, unit: 'mm' }"></ng-container>
                    <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Backplate Thickness', key: 'backplateThickness', value: store.settings().backplateThickness, min: 2, max: 20, step: 0.5, unit: 'mm' }"></ng-container>
                    
                    @if (store.settings().backplateShape === 'rounded-rect' || store.settings().backplateShape === 'rectangle') {
                      <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Corner Fillet Radius', key: 'backplateCornerRadius', value: store.settings().backplateCornerRadius, min: 0, max: 60, step: 1, unit: 'mm' }"></ng-container>
                    }

                    <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Letter Standoff Spacer Gap', key: 'backplateStandoffGap', value: store.settings().backplateStandoffGap, min: 0, max: 30, step: 1, unit: 'mm' }"></ng-container>
                  </div>

                  <!-- Hardware & Fasteners Sub-Panel -->
                  <div class="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="block text-xs font-bold text-slate-800 dark:text-slate-100">3D Standoff Fasteners</span>
                        <span class="text-[10px] text-slate-400">Pre-drilled holes & decorative metal caps</span>
                      </div>
                      <input type="checkbox" 
                             [checked]="store.settings().backplateHangingHoles"
                             (change)="store.updateSettings({ backplateHangingHoles: !store.settings().backplateHangingHoles })"
                             class="w-4 h-4 text-emerald-600 rounded cursor-pointer">
                    </div>

                    @if (store.settings().backplateHangingHoles) {
                      <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <div class="grid grid-cols-2 gap-2">
                          <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Hole Size', key: 'backplateHoleDiameter', value: store.settings().backplateHoleDiameter, min: 3, max: 12, step: 1, unit: 'mm' }"></ng-container>
                          <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Edge Inset', key: 'backplateHoleInset', value: store.settings().backplateHoleInset, min: 8, max: 40, step: 1, unit: 'mm' }"></ng-container>
                        </div>

                        <div class="space-y-1.5 pt-1">
                          <span class="text-[10px] font-bold text-slate-600 dark:text-slate-400 block uppercase">Standoff Metal Finish</span>
                          <div class="grid grid-cols-4 gap-1">
                            <button (click)="store.updateSettings({ backplateStandoffFinish: 'chrome' })"
                                    [class.border-emerald-500]="store.settings().backplateStandoffFinish === 'chrome'"
                                    [class.bg-slate-100]="store.settings().backplateStandoffFinish === 'chrome'"
                                    [class.dark:bg-slate-700]="store.settings().backplateStandoffFinish === 'chrome'"
                                    class="py-1 px-1.5 border rounded-lg text-[10px] font-semibold text-center truncate">
                              Chrome
                            </button>
                            <button (click)="store.updateSettings({ backplateStandoffFinish: 'black' })"
                                    [class.border-emerald-500]="store.settings().backplateStandoffFinish === 'black'"
                                    [class.bg-slate-100]="store.settings().backplateStandoffFinish === 'black'"
                                    [class.dark:bg-slate-700]="store.settings().backplateStandoffFinish === 'black'"
                                    class="py-1 px-1.5 border rounded-lg text-[10px] font-semibold text-center truncate">
                              Black
                            </button>
                            <button (click)="store.updateSettings({ backplateStandoffFinish: 'brass' })"
                                    [class.border-emerald-500]="store.settings().backplateStandoffFinish === 'brass'"
                                    [class.bg-slate-100]="store.settings().backplateStandoffFinish === 'brass'"
                                    [class.dark:bg-slate-700]="store.settings().backplateStandoffFinish === 'brass'"
                                    class="py-1 px-1.5 border rounded-lg text-[10px] font-semibold text-center truncate">
                              Brass
                            </button>
                            <button (click)="store.updateSettings({ backplateStandoffFinish: 'matte-silver' })"
                                    [class.border-emerald-500]="store.settings().backplateStandoffFinish === 'matte-silver'"
                                    [class.bg-slate-100]="store.settings().backplateStandoffFinish === 'matte-silver'"
                                    [class.dark:bg-slate-700]="store.settings().backplateStandoffFinish === 'matte-silver'"
                                    class="py-1 px-1.5 border rounded-lg text-[10px] font-semibold text-center truncate">
                              Silver
                            </button>
                          </div>
                        </div>

                        <div class="flex items-center justify-between pt-2">
                          <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Ceiling Suspension Loops</span>
                          <input type="checkbox" 
                                 [checked]="store.settings().backplateTopSuspensionLoops"
                                 (change)="store.updateSettings({ backplateTopSuspensionLoops: !store.settings().backplateTopSuspensionLoops })"
                                 class="w-4 h-4 text-emerald-600 rounded cursor-pointer">
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- BAR / RAIL SYSTEM CONFIGURATION SECTION -->
              @if (store.settings().mountingType === 'bar-system') {
                <div class="p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-100">Structural Rail Count</span>
                    <div class="flex gap-1">
                      <button (click)="store.updateSettings({ barCount: 1 })"
                              [class.bg-amber-600]="store.settings().barCount === 1"
                              [class.text-white]="store.settings().barCount === 1"
                              class="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700">1</button>
                      <button (click)="store.updateSettings({ barCount: 2 })"
                              [class.bg-amber-600]="store.settings().barCount === 2"
                              [class.text-white]="store.settings().barCount === 2"
                              class="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700">2</button>
                      <button (click)="store.updateSettings({ barCount: 3 })"
                              [class.bg-amber-600]="store.settings().barCount === 3"
                              [class.text-white]="store.settings().barCount === 3"
                              class="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700">3</button>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Bar Cross-Section Profile</span>
                    <div class="grid grid-cols-3 gap-1.5">
                      <button (click)="store.updateSettings({ barProfile: 'rect-tube' })"
                              [class.bg-amber-600]="store.settings().barProfile === 'rect-tube'"
                              [class.text-white]="store.settings().barProfile === 'rect-tube'"
                              class="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-center">
                        Rect Box
                      </button>
                      <button (click)="store.updateSettings({ barProfile: 'u-channel' })"
                              [class.bg-amber-600]="store.settings().barProfile === 'u-channel'"
                              [class.text-white]="store.settings().barProfile === 'u-channel'"
                              class="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-center">
                        U-Strut
                      </button>
                      <button (click)="store.updateSettings({ barProfile: 'round-pipe' })"
                              [class.bg-amber-600]="store.settings().barProfile === 'round-pipe'"
                              [class.text-white]="store.settings().barProfile === 'round-pipe'"
                              class="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-center">
                        Round Pipe
                      </button>
                    </div>
                  </div>

                  <div class="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Bar Face Height', key: 'barWidth', value: store.settings().barWidth, min: 12, max: 60, step: 1, unit: 'mm' }"></ng-container>
                    <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Bar Depth', key: 'barThickness', value: store.settings().barThickness, min: 8, max: 40, step: 1, unit: 'mm' }"></ng-container>
                    <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Side Extension Overhang', key: 'barOverhang', value: store.settings().barOverhang, min: 0, max: 80, step: 1, unit: 'mm' }"></ng-container>
                    <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Wall Clearance Standoff', key: 'barStandoffGap', value: store.settings().barStandoffGap, min: 0, max: 40, step: 1, unit: 'mm' }"></ng-container>
                  </div>

                  <div class="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Letter Attachment Clamps</span>
                      <input type="checkbox" 
                             [checked]="store.settings().barIncludeClamps"
                             (change)="store.updateSettings({ barIncludeClamps: !store.settings().barIncludeClamps })"
                             class="w-4 h-4 text-amber-600 rounded cursor-pointer">
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Wall End Mounting Flanges</span>
                      <input type="checkbox" 
                             [checked]="store.settings().barWallBrackets"
                             (change)="store.updateSettings({ barWallBrackets: !store.settings().barWallBrackets })"
                             class="w-4 h-4 text-amber-600 rounded cursor-pointer">
                    </div>
                  </div>
                </div>
              }

              <!-- RACEWAY SECTION -->
              @if (store.settings().mountingType === 'raceway') {
                <div class="p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Raceway Box Height', key: 'racewayHeight', value: store.settings().racewayHeight, min: 40, max: 150, step: 5, unit: 'mm' }"></ng-container>
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Raceway Box Depth', key: 'racewayDepth', value: store.settings().racewayDepth, min: 30, max: 120, step: 5, unit: 'mm' }"></ng-container>
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Side Extension Overhang', key: 'racewayOverhang', value: store.settings().racewayOverhang, min: 0, max: 60, step: 5, unit: 'mm' }"></ng-container>
                </div>
              }

              <!-- DESK STAND SECTION -->
              @if (store.settings().mountingType === 'desk-stand') {
                <div class="p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Stand Base Depth', key: 'deskStandDepth', value: store.settings().deskStandDepth, min: 50, max: 150, step: 5, unit: 'mm' }"></ng-container>
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Pedestal Height', key: 'deskStandHeight', value: store.settings().deskStandHeight, min: 10, max: 40, step: 2, unit: 'mm' }"></ng-container>
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Front Retaining Lip', key: 'deskStandLip', value: store.settings().deskStandLip, min: 4, max: 18, step: 1, unit: 'mm' }"></ng-container>
                </div>
              }

              <!-- Live Mounting Telemetry & BOM Card -->
              @if (store.getMountingSummary(); as ms) {
                <div class="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <mat-icon class="scale-75">analytics</mat-icon>
                      Mounting Telemetry
                    </span>
                    <span class="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold uppercase">{{ ms.mountingType }}</span>
                  </div>

                  @if (ms.mountingType === 'backplate') {
                    <div class="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                      <div class="p-2 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-slate-700">
                        <span class="text-[9px] text-slate-400 block">Outer Size</span>
                        <span class="text-xs font-bold text-slate-800 dark:text-slate-100">{{ ms.backplateWidthMm }}×{{ ms.backplateHeightMm }}</span>
                      </div>
                      <div class="p-2 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-slate-700">
                        <span class="text-[9px] text-slate-400 block">Cut Area</span>
                        <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">{{ ms.backplateAreaCm2 }}cm²</span>
                      </div>
                      <div class="p-2 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-slate-700">
                        <span class="text-[9px] text-slate-400 block">Standoffs</span>
                        <span class="text-xs font-bold text-blue-600 dark:text-blue-400">{{ ms.standoffCount }}x ({{ ms.standoffFinish }})</span>
                      </div>
                    </div>
                  } @else if (ms.mountingType === 'bar-system') {
                    <div class="grid grid-cols-2 gap-2 pt-1 text-center font-mono">
                      <div class="p-2 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-slate-700">
                        <span class="text-[9px] text-slate-400 block">Rail Length</span>
                        <span class="text-xs font-bold text-slate-800 dark:text-slate-100">{{ ms.railLengthMm }} mm</span>
                      </div>
                      <div class="p-2 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-slate-700">
                        <span class="text-[9px] text-slate-400 block">Total Rails</span>
                        <span class="text-xs font-bold text-amber-600 dark:text-amber-400">{{ ms.railCount }}x ({{ ms.totalRailLengthMm }}mm total)</span>
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Direct Export Actions -->
              <div class="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                <button (click)="exportSTLBackplate()" 
                        class="w-full flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-3 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-98 text-left cursor-pointer">
                  <div class="flex items-center gap-2.5">
                    <mat-icon class="scale-90">grid_view</mat-icon>
                    <div>
                      <span class="block font-bold text-xs">Export Backplate 3D STL</span>
                      <span class="text-[10px] opacity-90">For 3D printing or CNC milling</span>
                    </div>
                  </div>
                  <mat-icon class="scale-75">download</mat-icon>
                </button>

                <button (click)="exportSVGBackplate()" 
                        class="w-full flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 p-3 rounded-xl transition-all text-left cursor-pointer">
                  <div class="flex items-center gap-2.5">
                    <mat-icon class="scale-90 text-emerald-600 dark:text-emerald-400">content_cut</mat-icon>
                    <div>
                      <span class="block font-bold text-xs">Export 1:1 Laser Vector SVG</span>
                      <span class="text-[10px] text-slate-400">Precision cut outline + pre-drilled holes</span>
                    </div>
                  </div>
                  <mat-icon class="scale-75 text-slate-400">download</mat-icon>
                </button>
              </div>
           </div>
        }

        <!-- Tab 6: Mounting Holes -->
        @if (store.activeTab() === 'holes') {
           <div class="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold bg-slate-50/90 dark:bg-[#0b0f17]/90 sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
             <div class="flex items-center gap-2">
               <mat-icon class="scale-75 text-blue-500">radio_button_unchecked</mat-icon>
               <span>MOUNTING & STAND-OFF HOLES</span>
             </div>
             <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
               {{ store.settings().mountingHoleType === 'keyhole' ? 'Keyhole Slot' : store.settings().mountingHoleType === 'oval' ? 'Oval Slot' : 'Round Hole' }}
             </span>
           </div>
           <div class="p-5 space-y-5">
              <!-- Mounting Hole Profile Type Selection -->
              <div class="space-y-2">
                <div class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <mat-icon class="scale-75 text-blue-600">hardware</mat-icon>
                  <span>Mounting Hole Profile</span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <button (click)="setMountingHoleType('keyhole')"
                          [class.bg-blue-600]="store.settings().mountingHoleType === 'keyhole'"
                          [class.text-white]="store.settings().mountingHoleType === 'keyhole'"
                          [class.border-blue-600]="store.settings().mountingHoleType === 'keyhole'"
                          [class.shadow-md]="store.settings().mountingHoleType === 'keyhole'"
                          [class.shadow-blue-500-20]="store.settings().mountingHoleType === 'keyhole'"
                          [class.bg-white]="store.settings().mountingHoleType !== 'keyhole'"
                          [class.dark:bg-slate-800]="store.settings().mountingHoleType !== 'keyhole'"
                          [class.text-slate-700]="store.settings().mountingHoleType !== 'keyhole'"
                          [class.dark:text-slate-300]="store.settings().mountingHoleType !== 'keyhole'"
                          [class.border-slate-200]="store.settings().mountingHoleType !== 'keyhole'"
                          [class.dark:border-slate-700]="store.settings().mountingHoleType !== 'keyhole'"
                          class="p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-1">
                    <div class="flex items-center gap-1 font-bold text-[11px]">
                      <mat-icon class="scale-75">vpn_key</mat-icon>
                      <span>Keyhole</span>
                    </div>
                    <span class="text-[9px] opacity-80 leading-tight">Flush hanging</span>
                  </button>

                  <button (click)="setMountingHoleType('round')"
                          [class.bg-blue-600]="store.settings().mountingHoleType === 'round'"
                          [class.text-white]="store.settings().mountingHoleType === 'round'"
                          [class.border-blue-600]="store.settings().mountingHoleType === 'round'"
                          [class.shadow-md]="store.settings().mountingHoleType === 'round'"
                          [class.shadow-blue-500-20]="store.settings().mountingHoleType === 'round'"
                          [class.bg-white]="store.settings().mountingHoleType !== 'round'"
                          [class.dark:bg-slate-800]="store.settings().mountingHoleType !== 'round'"
                          [class.text-slate-700]="store.settings().mountingHoleType !== 'round'"
                          [class.dark:text-slate-300]="store.settings().mountingHoleType !== 'round'"
                          [class.border-slate-200]="store.settings().mountingHoleType !== 'round'"
                          [class.dark:border-slate-700]="store.settings().mountingHoleType !== 'round'"
                          class="p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-1">
                    <div class="flex items-center gap-1 font-bold text-[11px]">
                      <mat-icon class="scale-75">radio_button_unchecked</mat-icon>
                      <span>Round</span>
                    </div>
                    <span class="text-[9px] opacity-80 leading-tight">Studs & screws</span>
                  </button>

                  <button (click)="setMountingHoleType('oval')"
                          [class.bg-blue-600]="store.settings().mountingHoleType === 'oval'"
                          [class.text-white]="store.settings().mountingHoleType === 'oval'"
                          [class.border-blue-600]="store.settings().mountingHoleType === 'oval'"
                          [class.shadow-md]="store.settings().mountingHoleType === 'oval'"
                          [class.shadow-blue-500-20]="store.settings().mountingHoleType === 'oval'"
                          [class.bg-white]="store.settings().mountingHoleType !== 'oval'"
                          [class.dark:bg-slate-800]="store.settings().mountingHoleType !== 'oval'"
                          [class.text-slate-700]="store.settings().mountingHoleType !== 'oval'"
                          [class.dark:text-slate-300]="store.settings().mountingHoleType !== 'oval'"
                          [class.border-slate-200]="store.settings().mountingHoleType !== 'oval'"
                          [class.dark:border-slate-700]="store.settings().mountingHoleType !== 'oval'"
                          class="p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-1">
                    <div class="flex items-center gap-1 font-bold text-[11px]">
                      <mat-icon class="scale-75">crop_7_5</mat-icon>
                      <span>Oval Slot</span>
                    </div>
                    <span class="text-[9px] opacity-80 leading-tight">Adjustable slot</span>
                  </button>
                </div>
              </div>

              <!-- Keyhole Parameter Card (when Keyhole is selected) -->
              @if (store.settings().mountingHoleType === 'keyhole') {
                <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
                        <mat-icon class="scale-75">vpn_key</mat-icon>
                      </div>
                      <div>
                        <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100">Keyhole Dimensions</h4>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400">Head entry & locking slot geometry</p>
                      </div>
                    </div>
                  </div>

                  <!-- Live Interactive SVG Preview of Keyhole -->
                  <div class="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-4">
                    <svg width="70" height="90" viewBox="-25 -45 50 70" class="overflow-visible drop-shadow-sm">
                      <!-- Grid / centerlines -->
                      <line x1="-20" y1="0" x2="20" y2="0" stroke="#94a3b8" stroke-width="0.75" stroke-dasharray="2 2" opacity="0.6"/>
                      <line x1="0" y1="-38" x2="0" y2="20" stroke="#94a3b8" stroke-width="0.75" stroke-dasharray="2 2" opacity="0.6"/>
                      
                      <!-- Transformed Keyhole Silhouette -->
                      <g [attr.transform]="'rotate(' + (store.settings().keyholeDirection || 0) + ')'">
                        @let r = store.settings().holeRadius;
                        @let w = store.settings().keyholeSlotWidth / 2;
                        @let h = store.settings().keyholeSlotHeight;
                        <path [attr.d]="'M ' + w + ' ' + Math.sqrt(Math.max(0.1, r*r - w*w)) + ' L ' + w + ' ' + (h - w) + ' A ' + w + ' ' + w + ' 0 0 0 ' + (-w) + ' ' + (h - w) + ' L ' + (-w) + ' ' + Math.sqrt(Math.max(0.1, r*r - w*w)) + ' A ' + r + ' ' + r + ' 0 1 0 ' + w + ' ' + Math.sqrt(Math.max(0.1, r*r - w*w)) + ' Z'"
                              fill="rgba(59, 130, 246, 0.25)" stroke="#3b82f6" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" />
                        <circle cx="0" cy="0" r="1.5" fill="#3b82f6" />
                        <circle [attr.cx]="0" [attr.cy]="h - w" r="1.5" fill="#2563eb" />
                      </g>
                    </svg>

                    <div class="flex-1 text-[11px] space-y-1 font-mono">
                      <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Entry (Ø):</span>
                        <span class="font-bold text-blue-600 dark:text-blue-400">{{ (store.settings().holeRadius * 2).toFixed(1) }} mm</span>
                      </div>
                      <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Neck (W):</span>
                        <span class="font-bold text-blue-600 dark:text-blue-400">{{ store.settings().keyholeSlotWidth.toFixed(1) }} mm</span>
                      </div>
                      <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Travel (H):</span>
                        <span class="font-bold text-blue-600 dark:text-blue-400">{{ store.settings().keyholeSlotHeight.toFixed(1) }} mm</span>
                      </div>
                      <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Angle (θ):</span>
                        <span class="font-bold text-blue-600 dark:text-blue-400">{{ store.settings().keyholeDirection }}°</span>
                      </div>
                    </div>
                  </div>

                  <!-- 1. Entry Hole Diameter (Radius x 2) -->
                  <div>
                    <div class="flex justify-between items-center text-xs mb-1">
                      <span class="font-semibold text-slate-700 dark:text-slate-300">Screw Entry Hole (Ø)</span>
                      <span class="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold text-[11px]">
                        {{ (store.settings().holeRadius * 2).toFixed(1) }} mm
                      </span>
                    </div>
                    <input type="range" min="3" max="18" step="0.5" 
                           [value]="store.settings().holeRadius * 2"
                           (input)="updateHoleDiameter($event)"
                           class="w-full h-1.5 bg-blue-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    <p class="text-[10px] text-slate-400 mt-0.5">Allows screw head to enter freely (e.g. 9mm for M4/M5 head)</p>
                  </div>

                  <!-- 2. Slot Neck Width -->
                  <div>
                    <div class="flex justify-between items-center text-xs mb-1">
                      <span class="font-semibold text-slate-700 dark:text-slate-300">Neck Slot Width (W)</span>
                      <span class="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold text-[11px]">
                        {{ store.settings().keyholeSlotWidth.toFixed(1) }} mm
                      </span>
                    </div>
                    <input type="range" min="1.5" max="10" step="0.25" 
                           [value]="store.settings().keyholeSlotWidth"
                           (input)="updateParam('keyholeSlotWidth', $event)"
                           class="w-full h-1.5 bg-blue-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    <p class="text-[10px] text-slate-400 mt-0.5">Captures the screw shank (e.g. 4mm for M3.5/M4 screws)</p>
                  </div>

                  <!-- 3. Slot Height / Travel Length -->
                  <div>
                    <div class="flex justify-between items-center text-xs mb-1">
                      <span class="font-semibold text-slate-700 dark:text-slate-300">Slot Length / Height (H)</span>
                      <span class="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold text-[11px]">
                        {{ store.settings().keyholeSlotHeight.toFixed(1) }} mm
                      </span>
                    </div>
                    <input type="range" min="6" max="30" step="0.5" 
                           [value]="store.settings().keyholeSlotHeight"
                           (input)="updateParam('keyholeSlotHeight', $event)"
                           class="w-full h-1.5 bg-blue-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    <p class="text-[10px] text-slate-400 mt-0.5">Vertical slide engagement distance</p>
                  </div>

                  <!-- 4. Slot Hanging Direction & Angle -->
                  <div class="space-y-2">
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Slot Orientation (Hang Angle)</span>
                    <div class="grid grid-cols-4 gap-1.5">
                      <button (click)="setKeyholeDirection(0)"
                              [class.bg-blue-600]="store.settings().keyholeDirection === 0"
                              [class.text-white]="store.settings().keyholeDirection === 0"
                              [class.bg-white]="store.settings().keyholeDirection !== 0"
                              [class.dark:bg-slate-800]="store.settings().keyholeDirection !== 0"
                              [class.text-slate-700]="store.settings().keyholeDirection !== 0"
                              [class.dark:text-slate-300]="store.settings().keyholeDirection !== 0"
                              class="py-1.5 px-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center transition-all">
                        <span>⬆️ Up</span>
                        <span class="text-[9px] opacity-75 font-mono">0°</span>
                      </button>
                      <button (click)="setKeyholeDirection(180)"
                              [class.bg-blue-600]="store.settings().keyholeDirection === 180"
                              [class.text-white]="store.settings().keyholeDirection === 180"
                              [class.bg-white]="store.settings().keyholeDirection !== 180"
                              [class.dark:bg-slate-800]="store.settings().keyholeDirection !== 180"
                              [class.text-slate-700]="store.settings().keyholeDirection !== 180"
                              [class.dark:text-slate-300]="store.settings().keyholeDirection !== 180"
                              class="py-1.5 px-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center transition-all">
                        <span>⬇️ Down</span>
                        <span class="text-[9px] opacity-75 font-mono">180°</span>
                      </button>
                      <button (click)="setKeyholeDirection(90)"
                              [class.bg-blue-600]="store.settings().keyholeDirection === 90"
                              [class.text-white]="store.settings().keyholeDirection === 90"
                              [class.bg-white]="store.settings().keyholeDirection !== 90"
                              [class.dark:bg-slate-800]="store.settings().keyholeDirection !== 90"
                              [class.text-slate-700]="store.settings().keyholeDirection !== 90"
                              [class.dark:text-slate-300]="store.settings().keyholeDirection !== 90"
                              class="py-1.5 px-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center transition-all">
                        <span>➡️ Right</span>
                        <span class="text-[9px] opacity-75 font-mono">90°</span>
                      </button>
                      <button (click)="setKeyholeDirection(270)"
                              [class.bg-blue-600]="store.settings().keyholeDirection === 270"
                              [class.text-white]="store.settings().keyholeDirection === 270"
                              [class.bg-white]="store.settings().keyholeDirection !== 270"
                              [class.dark:bg-slate-800]="store.settings().keyholeDirection !== 270"
                              [class.text-slate-700]="store.settings().keyholeDirection !== 270"
                              [class.dark:text-slate-300]="store.settings().keyholeDirection !== 270"
                              class="py-1.5 px-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center transition-all">
                        <span>⬅️ Left</span>
                        <span class="text-[9px] opacity-75 font-mono">270°</span>
                      </button>
                    </div>

                    <div class="pt-1">
                      <div class="flex justify-between items-center text-xs mb-1">
                        <span class="text-[11px] text-slate-500 dark:text-slate-400">Custom Rotation Angle</span>
                        <span class="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                          {{ store.settings().keyholeDirection }}°
                        </span>
                      </div>
                      <input type="range" min="0" max="360" step="5" 
                             [value]="store.settings().keyholeDirection"
                             (input)="updateParam('keyholeDirection', $event)"
                             class="w-full h-1.5 bg-blue-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                  </div>
                </div>
              }

              <!-- Round Hole Parameter Card (when Round is selected) -->
              @if (store.settings().mountingHoleType === 'round') {
                <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <mat-icon class="scale-75">radio_button_unchecked</mat-icon>
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100">Round Drill Hole Size</h4>
                      <p class="text-[10px] text-slate-500 dark:text-slate-400">For threaded studs, screws & standoffs</p>
                    </div>
                  </div>

                  <div>
                    <div class="flex justify-between items-center text-xs mb-1">
                      <span class="font-semibold text-slate-700 dark:text-slate-300">Drill Hole Diameter (Ø)</span>
                      <span class="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold text-[11px]">
                        {{ (store.settings().holeRadius * 2).toFixed(1) }} mm
                      </span>
                    </div>
                    <input type="range" min="2" max="30" step="0.5" 
                           [value]="store.settings().holeRadius * 2"
                           (input)="updateHoleDiameter($event)"
                           class="w-full h-1.5 bg-blue-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  </div>
                </div>
              }

              <!-- Oval / Slot Hole Parameter Card (when Oval is selected) -->
              @if (store.settings().mountingHoleType === 'oval') {
                <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                        <mat-icon class="scale-75">crop_7_5</mat-icon>
                      </div>
                      <div>
                        <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100">Oval & Slot Dimensions</h4>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400">Adjustable sliding slot & rounded cutouts</p>
                      </div>
                    </div>
                    <span class="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[10px]">
                      {{ store.settings().ovalHoleWidth }}×{{ store.settings().ovalHoleHeight }}mm
                    </span>
                  </div>

                  <!-- Live Interactive SVG Visualizer of the Oval Hole -->
                  <div class="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                    <!-- Subtle background grid pattern -->
                    <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none"></div>

                    <svg viewBox="-50 -50 100 100" class="w-40 h-36 relative z-10">
                      <!-- Center Axes -->
                      <line x1="-45" y1="0" x2="45" y2="0" stroke="#94a3b8" stroke-width="0.75" stroke-dasharray="2 2" />
                      <line x1="0" y1="-45" x2="0" y2="45" stroke="#94a3b8" stroke-width="0.75" stroke-dasharray="2 2" />

                      <!-- The Oval / Slot Shape with dynamic dimensions, corner fillet and rotation -->
                      <g [attr.transform]="'rotate(' + store.settings().ovalRotation + ')'">
                        @let maxDim = Math.max(store.settings().ovalHoleWidth, store.settings().ovalHoleHeight, 1);
                        @let previewScale = 60 / Math.max(maxDim, 20);
                        @let sw = store.settings().ovalHoleWidth * previewScale;
                        @let sh = store.settings().ovalHoleHeight * previewScale;
                        @let scr = Math.min(sw / 2, sh / 2, store.settings().ovalCornerRadius * previewScale);
                        
                        <rect [attr.x]="-sw / 2" [attr.y]="-sh / 2"
                              [attr.width]="sw" [attr.height]="sh"
                              [attr.rx]="scr" [attr.ry]="scr"
                              fill="rgba(99, 102, 241, 0.22)"
                              stroke="#6366f1"
                              stroke-width="2" />

                        <!-- Center dot -->
                        <circle cx="0" cy="0" r="1.5" fill="#4f46e5" />
                      </g>

                      <!-- Dimension annotations -->
                      <text x="0" y="44" text-anchor="middle" font-size="6.5" font-family="monospace" font-weight="bold" fill="#6366f1">
                        {{ store.settings().ovalHoleWidth }}mm W × {{ store.settings().ovalHoleHeight }}mm H (R: {{ store.settings().ovalCornerRadius }}mm)
                      </text>
                    </svg>

                    <div class="w-full flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 font-mono">
                      <span>Rotation: <strong class="text-indigo-600 dark:text-indigo-400">{{ store.settings().ovalRotation }}°</strong></span>
                      <span>Radius: <strong class="text-indigo-600 dark:text-indigo-400">{{ store.settings().ovalCornerRadius }}mm</strong></span>
                    </div>
                  </div>

                  <!-- Hole Width Control -->
                  <div>
                    <div class="flex justify-between items-center text-xs mb-1">
                      <span class="font-semibold text-slate-700 dark:text-slate-300">Hole Width (W)</span>
                      <span class="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[11px]">
                        {{ store.settings().ovalHoleWidth.toFixed(1) }} mm
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <input type="range" min="2" max="60" step="0.5" 
                             [value]="store.settings().ovalHoleWidth"
                             (input)="updateParam('ovalHoleWidth', $event)"
                             class="w-full h-1.5 bg-indigo-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                      <input type="number" min="2" max="100" step="0.5"
                             [value]="store.settings().ovalHoleWidth"
                             (change)="updateParam('ovalHoleWidth', $event)"
                             class="w-16 px-1.5 py-0.5 text-xs text-center font-mono font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg" />
                    </div>
                  </div>

                  <!-- Hole Height Control -->
                  <div>
                    <div class="flex justify-between items-center text-xs mb-1">
                      <span class="font-semibold text-slate-700 dark:text-slate-300">Hole Height (H)</span>
                      <span class="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[11px]">
                        {{ store.settings().ovalHoleHeight.toFixed(1) }} mm
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <input type="range" min="2" max="100" step="0.5" 
                             [value]="store.settings().ovalHoleHeight"
                             (input)="updateParam('ovalHoleHeight', $event)"
                             class="w-full h-1.5 bg-indigo-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                      <input type="number" min="2" max="150" step="0.5"
                             [value]="store.settings().ovalHoleHeight"
                             (change)="updateParam('ovalHoleHeight', $event)"
                             class="w-16 px-1.5 py-0.5 text-xs text-center font-mono font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg" />
                    </div>
                  </div>

                  <!-- Corner Radius Fillet Control -->
                  <div class="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div class="flex justify-between items-center text-xs">
                      <div>
                        <span class="font-semibold text-slate-700 dark:text-slate-300">Corner Radius (Fillet)</span>
                        <p class="text-[9px] text-slate-400">0 = Rectangle, Max = Capsule/Pill</p>
                      </div>
                      <span class="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[11px]">
                        {{ store.settings().ovalCornerRadius.toFixed(1) }} mm
                      </span>
                    </div>

                    <!-- Quick Corner Fillet Presets -->
                    <div class="grid grid-cols-3 gap-1.5">
                      <button (click)="setOvalCornerPreset('sharp')"
                              [class.bg-indigo-600]="store.settings().ovalCornerRadius === 0"
                              [class.text-white]="store.settings().ovalCornerRadius === 0"
                              [class.bg-white]="store.settings().ovalCornerRadius !== 0"
                              [class.dark:bg-slate-800]="store.settings().ovalCornerRadius !== 0"
                              [class.text-slate-700]="store.settings().ovalCornerRadius !== 0"
                              [class.dark:text-slate-300]="store.settings().ovalCornerRadius !== 0"
                              class="py-1 px-1.5 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-700 transition-all text-center">
                        Sharp (0 mm)
                      </button>
                      <button (click)="setOvalCornerPreset('soft')"
                              class="py-1 px-1.5 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-700 transition-all text-center bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Soft Fillet
                      </button>
                      <button (click)="setOvalCornerPreset('full')"
                              [class.bg-indigo-600]="store.settings().ovalCornerRadius >= (Math.min(store.settings().ovalHoleWidth, store.settings().ovalHoleHeight) / 2) - 0.1"
                              [class.text-white]="store.settings().ovalCornerRadius >= (Math.min(store.settings().ovalHoleWidth, store.settings().ovalHoleHeight) / 2) - 0.1"
                              [class.bg-white]="store.settings().ovalCornerRadius < (Math.min(store.settings().ovalHoleWidth, store.settings().ovalHoleHeight) / 2) - 0.1"
                              [class.dark:bg-slate-800]="store.settings().ovalCornerRadius < (Math.min(store.settings().ovalHoleWidth, store.settings().ovalHoleHeight) / 2) - 0.1"
                              [class.text-slate-700]="store.settings().ovalCornerRadius < (Math.min(store.settings().ovalHoleWidth, store.settings().ovalHoleHeight) / 2) - 0.1"
                              [class.dark:text-slate-300]="store.settings().ovalCornerRadius < (Math.min(store.settings().ovalHoleWidth, store.settings().ovalHoleHeight) / 2) - 0.1"
                              class="py-1 px-1.5 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-700 transition-all text-center">
                        Full Capsule
                      </button>
                    </div>

                    <div class="flex items-center gap-2">
                      <input type="range" min="0" 
                             [max]="Math.min(store.settings().ovalHoleWidth, store.settings().ovalHoleHeight) / 2" 
                             step="0.25" 
                             [value]="store.settings().ovalCornerRadius"
                             (input)="updateParam('ovalCornerRadius', $event)"
                             class="w-full h-1.5 bg-indigo-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                      <input type="number" min="0" 
                             [max]="Math.min(store.settings().ovalHoleWidth, store.settings().ovalHoleHeight) / 2" 
                             step="0.25"
                             [value]="store.settings().ovalCornerRadius"
                             (change)="updateParam('ovalCornerRadius', $event)"
                             class="w-16 px-1.5 py-0.5 text-xs text-center font-mono font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg" />
                    </div>
                  </div>

                  <!-- Hole Orientation & Rotation -->
                  <div class="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div class="flex justify-between items-center text-xs">
                      <span class="font-semibold text-slate-700 dark:text-slate-300">Orientation Angle (θ°)</span>
                      <span class="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[11px]">
                        {{ store.settings().ovalRotation }}°
                      </span>
                    </div>

                    <div class="grid grid-cols-4 gap-1.5">
                      <button (click)="setOvalRotation(0)"
                              [class.bg-indigo-600]="store.settings().ovalRotation === 0"
                              [class.text-white]="store.settings().ovalRotation === 0"
                              [class.bg-white]="store.settings().ovalRotation !== 0"
                              [class.dark:bg-slate-800]="store.settings().ovalRotation !== 0"
                              [class.text-slate-700]="store.settings().ovalRotation !== 0"
                              [class.dark:text-slate-300]="store.settings().ovalRotation !== 0"
                              class="py-1.5 px-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center transition-all">
                        <span>⬆️ Vert</span>
                        <span class="text-[9px] opacity-75 font-mono">0°</span>
                      </button>
                      <button (click)="setOvalRotation(90)"
                              [class.bg-indigo-600]="store.settings().ovalRotation === 90"
                              [class.text-white]="store.settings().ovalRotation === 90"
                              [class.bg-white]="store.settings().ovalRotation !== 90"
                              [class.dark:bg-slate-800]="store.settings().ovalRotation !== 90"
                              [class.text-slate-700]="store.settings().ovalRotation !== 90"
                              [class.dark:text-slate-300]="store.settings().ovalRotation !== 90"
                              class="py-1.5 px-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center transition-all">
                        <span>➡️ Horiz</span>
                        <span class="text-[9px] opacity-75 font-mono">90°</span>
                      </button>
                      <button (click)="setOvalRotation(45)"
                              [class.bg-indigo-600]="store.settings().ovalRotation === 45"
                              [class.text-white]="store.settings().ovalRotation === 45"
                              [class.bg-white]="store.settings().ovalRotation !== 45"
                              [class.dark:bg-slate-800]="store.settings().ovalRotation !== 45"
                              [class.text-slate-700]="store.settings().ovalRotation !== 45"
                              [class.dark:text-slate-300]="store.settings().ovalRotation !== 45"
                              class="py-1.5 px-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center transition-all">
                        <span>↗️ Diag</span>
                        <span class="text-[9px] opacity-75 font-mono">45°</span>
                      </button>
                      <button (click)="setOvalRotation(180)"
                              [class.bg-indigo-600]="store.settings().ovalRotation === 180"
                              [class.text-white]="store.settings().ovalRotation === 180"
                              [class.bg-white]="store.settings().ovalRotation !== 180"
                              [class.dark:bg-slate-800]="store.settings().ovalRotation !== 180"
                              [class.text-slate-700]="store.settings().ovalRotation !== 180"
                              [class.dark:text-slate-300]="store.settings().ovalRotation !== 180"
                              class="py-1.5 px-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center transition-all">
                        <span>⬇️ Down</span>
                        <span class="text-[9px] opacity-75 font-mono">180°</span>
                      </button>
                    </div>

                    <div class="pt-1">
                      <div class="flex justify-between items-center text-xs mb-1">
                        <span class="text-[11px] text-slate-500 dark:text-slate-400">Custom Angle Slider</span>
                        <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                          {{ store.settings().ovalRotation }}°
                        </span>
                      </div>
                      <input type="range" min="0" max="360" step="5" 
                             [value]="store.settings().ovalRotation"
                             (input)="updateParam('ovalRotation', $event)"
                             class="w-full h-1.5 bg-indigo-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    </div>
                  </div>
                </div>
              }

              <!-- Auto Holes Generator Section -->
              <div class="p-4 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <mat-icon class="scale-75">auto_fix_high</mat-icon>
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100">Auto-Align Hole Engine</h4>
                      <p class="text-[10px] text-slate-500 dark:text-slate-400">Calculates balanced hole positions</p>
                    </div>
                  </div>
                </div>

                <!-- Primary Action Button -->
                <button (click)="triggerAutoHoles()" 
                        class="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <mat-icon class="scale-90">auto_fix_high</mat-icon>
                  Auto-Generate {{ store.settings().mountingHoleType === 'keyhole' ? 'Keyholes' : 'Holes' }} Now
                </button>

                <!-- Parameter Controls -->
                <div class="space-y-3 pt-2 border-t border-blue-200/60 dark:border-blue-900/40">
                  <!-- Max Holes per Letter -->
                  <div>
                    <div class="flex justify-between items-center text-xs mb-1">
                      <span class="font-semibold text-slate-700 dark:text-slate-300">Max Holes Per Letter</span>
                      <span class="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold text-[11px]">
                        {{ store.settings().autoHolesMaxPerLetter }}
                      </span>
                    </div>
                    <input type="range" min="1" max="8" step="1" 
                           [value]="store.settings().autoHolesMaxPerLetter"
                           (input)="updateAndTriggerHoles('autoHolesMaxPerLetter', $event)"
                           class="w-full h-1.5 bg-blue-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  </div>

                  <!-- Edge Safety Margin -->
                  <div>
                    <div class="flex justify-between items-center text-xs mb-1">
                      <span class="font-semibold text-slate-700 dark:text-slate-300">Edge Safety Margin</span>
                      <span class="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold text-[11px]">
                        {{ store.settings().autoHolesEdgeMargin }} mm
                      </span>
                    </div>
                    <input type="range" min="2" max="25" step="1" 
                           [value]="store.settings().autoHolesEdgeMargin"
                           (input)="updateAndTriggerHoles('autoHolesEdgeMargin', $event)"
                           class="w-full h-1.5 bg-blue-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  </div>

                  <!-- Min Distance Between Holes -->
                  <div>
                    <div class="flex justify-between items-center text-xs mb-1">
                      <span class="font-semibold text-slate-700 dark:text-slate-300">Min Hole Spacing</span>
                      <span class="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold text-[11px]">
                        {{ store.settings().autoHolesMinDistance }} mm
                      </span>
                    </div>
                    <input type="range" min="10" max="80" step="2" 
                           [value]="store.settings().autoHolesMinDistance"
                           (input)="updateAndTriggerHoles('autoHolesMinDistance', $event)"
                           class="w-full h-1.5 bg-blue-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  </div>

                  <!-- Pattern Selector -->
                  <div class="space-y-1.5">
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Alignment Pattern</span>
                    <div class="grid grid-cols-2 gap-1.5">
                      <button (click)="setPattern('corners-center')"
                              [class.bg-blue-600]="store.settings().autoHolesPattern === 'corners-center'"
                              [class.text-white]="store.settings().autoHolesPattern === 'corners-center'"
                              [class.bg-white]="store.settings().autoHolesPattern !== 'corners-center'"
                              [class.dark:bg-slate-800]="store.settings().autoHolesPattern !== 'corners-center'"
                              [class.text-slate-700]="store.settings().autoHolesPattern !== 'corners-center'"
                              [class.dark:text-slate-300]="store.settings().autoHolesPattern !== 'corners-center'"
                              class="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 transition-all">
                        🎯 Corners & Center
                      </button>
                      <button (click)="setPattern('top-bottom')"
                              [class.bg-blue-600]="store.settings().autoHolesPattern === 'top-bottom'"
                              [class.text-white]="store.settings().autoHolesPattern === 'top-bottom'"
                              [class.bg-white]="store.settings().autoHolesPattern !== 'top-bottom'"
                              [class.dark:bg-slate-800]="store.settings().autoHolesPattern !== 'top-bottom'"
                              [class.text-slate-700]="store.settings().autoHolesPattern !== 'top-bottom'"
                              [class.dark:text-slate-300]="store.settings().autoHolesPattern !== 'top-bottom'"
                              class="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 transition-all">
                        ↕️ Top & Bottom
                      </button>
                      <button (click)="setPattern('corners')"
                              [class.bg-blue-600]="store.settings().autoHolesPattern === 'corners'"
                              [class.text-white]="store.settings().autoHolesPattern === 'corners'"
                              [class.bg-white]="store.settings().autoHolesPattern !== 'corners'"
                              [class.dark:bg-slate-800]="store.settings().autoHolesPattern !== 'corners'"
                              [class.text-slate-700]="store.settings().autoHolesPattern !== 'corners'"
                              [class.dark:text-slate-300]="store.settings().autoHolesPattern !== 'corners'"
                              class="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 transition-all">
                        📐 4 Corners
                      </button>
                      <button (click)="setPattern('grid-balanced')"
                              [class.bg-blue-600]="store.settings().autoHolesPattern === 'grid-balanced'"
                              [class.text-white]="store.settings().autoHolesPattern === 'grid-balanced'"
                              [class.bg-white]="store.settings().autoHolesPattern !== 'grid-balanced'"
                              [class.dark:bg-slate-800]="store.settings().autoHolesPattern !== 'grid-balanced'"
                              [class.text-slate-700]="store.settings().autoHolesPattern !== 'grid-balanced'"
                              [class.dark:text-slate-300]="store.settings().autoHolesPattern !== 'grid-balanced'"
                              class="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 transition-all">
                        🌐 Balanced Grid
                      </button>
                    </div>
                  </div>

                  <!-- Power Cable Hole Toggle -->
                  <div class="flex items-center justify-between pt-1">
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Central Cable Wire Hole</span>
                    <button (click)="toggleWireHole()" 
                            class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                            [class.bg-blue-600]="store.settings().autoHolesAddWireHole"
                            [class.bg-slate-300]="!store.settings().autoHolesAddWireHole"
                            [class.dark:bg-slate-700]="!store.settings().autoHolesAddWireHole">
                      <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                            [class.translate-x-4.5]="store.settings().autoHolesAddWireHole"
                            [class.translate-x-1]="!store.settings().autoHolesAddWireHole"></span>
                    </button>
                  </div>

                  @if (store.settings().autoHolesAddWireHole) {
                    <div>
                      <div class="flex justify-between items-center text-xs mb-1">
                        <span class="text-[11px] text-slate-600 dark:text-slate-400">Wire Hole Diameter</span>
                        <span class="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                          {{ (store.settings().autoHolesWireRadius * 2).toFixed(1) }} mm
                        </span>
                      </div>
                      <input type="range" min="2" max="15" step="0.5" 
                             [value]="store.settings().autoHolesWireRadius"
                             (input)="updateAndTriggerHoles('autoHolesWireRadius', $event)"
                             class="w-full h-1.5 bg-blue-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                  }
                </div>
              </div>

              <!-- Manual / View Mode Selection & Interactive Controls -->
              <div class="space-y-3 pt-2">
                 <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                   <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">Mirror Path Geometry</span>
                   <button (click)="store.updateSettings({ mirror: !store.settings().mirror })" 
                           class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                           [class.bg-blue-600]="store.settings().mirror"
                           [class.bg-slate-300]="!store.settings().mirror"
                           [class.dark:bg-slate-700]="!store.settings().mirror">
                     <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                           [class.translate-x-4.5]="store.settings().mirror"
                           [class.translate-x-1]="!store.settings().mirror"></span>
                   </button>
                 </div>

                 <div class="grid grid-cols-2 gap-2">
                   <button class="py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5"
                           [class.bg-white]="store.settings().interactionMode === 'view'"
                           [class.dark:bg-slate-800]="store.settings().interactionMode === 'view'"
                           [class.border-blue-500]="store.settings().interactionMode === 'view'"
                           [class.text-blue-600]="store.settings().interactionMode === 'view'"
                           [class.dark:text-blue-400]="store.settings().interactionMode === 'view'"
                           [class.border-slate-200]="store.settings().interactionMode !== 'view'"
                           [class.dark:border-slate-700]="store.settings().interactionMode !== 'view'"
                           (click)="store.updateSettings({ interactionMode: 'view' })">
                     <mat-icon class="scale-75">pan_tool</mat-icon> Orbit Camera
                   </button>

                   <button class="py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                           [class.bg-blue-600]="store.settings().interactionMode === 'add-hole'"
                           [class.text-white]="store.settings().interactionMode === 'add-hole'"
                           [class.border-blue-600]="store.settings().interactionMode === 'add-hole'"
                           [class.shadow-md]="store.settings().interactionMode === 'add-hole'"
                           [class.shadow-blue-500/30]="store.settings().interactionMode === 'add-hole'"
                           (click)="activateManualHoleMode()">
                     <mat-icon class="scale-75">add_circle</mat-icon> Manual Hole
                   </button>
                 </div>

                 @if (store.settings().interactionMode === 'add-hole') {
                   <div class="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs p-3 rounded-xl font-medium flex gap-2 border border-blue-200 dark:border-blue-800/60">
                     <mat-icon class="scale-75 shrink-0 text-blue-500">touch_app</mat-icon>
                     <span>Click directly on the backplate of the letters in the 3D viewport to place custom {{ store.settings().mountingHoleType === 'keyhole' ? 'keyholes' : 'holes' }}.</span>
                   </div>
                 }

                 <!-- Active Holes List -->
                 @if (store.settings().customHoles.length > 0) {
                   <div class="space-y-2 pt-2">
                     <div class="flex justify-between items-center">
                       <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                         Active Holes ({{ store.settings().customHoles.length }})
                       </span>
                     </div>
                     @for (hole of store.settings().customHoles; track $index) {
                       @let hType = hole.type ?? store.settings().mountingHoleType;
                       @let isKey = hType === "keyhole";
                       @let isOval = hType === "oval";
                       @let isRound = hType === "round";
                       <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                         <div class="flex items-center justify-between">
                           <div class="flex items-center gap-2">
                             <div class="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">#{{$index + 1}}</div>
                             <button (click)="toggleHoleType($index)"
                                     class="px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                     [class.bg-amber-100]="isKey"
                                     [class.text-amber-800]="isKey"
                                     [class.dark:bg-amber-900/60]="isKey"
                                     [class.dark:text-amber-300]="isKey"
                                     [class.bg-indigo-100]="isOval"
                                     [class.text-indigo-800]="isOval"
                                     [class.dark:bg-indigo-900/60]="isOval"
                                     [class.dark:text-indigo-300]="isOval"
                                     [class.bg-blue-100]="isRound"
                                     [class.text-blue-800]="isRound"
                                     [class.dark:bg-blue-900/60]="isRound"
                                     [class.dark:text-blue-300]="isRound">
                               <mat-icon class="scale-50 -ml-1">{{ isKey ? "vpn_key" : isOval ? "crop_7_5" : "radio_button_unchecked" }}</mat-icon>
                               <span>{{ isKey ? "Keyhole" : isOval ? "Oval" : "Round" }}</span>
                             </button>
                           </div>

                           <button (click)="removeHole($index)" class="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer" title="Remove Hole">
                             <mat-icon class="scale-75">delete</mat-icon>
                           </button>
                         </div>

                         <!-- Position and Dimensions Grid -->
                         @if (isOval) {
                           <div class="grid grid-cols-3 gap-1.5 text-[11px]">
                             <div class="flex items-center gap-1">
                               <span class="text-[9px] text-slate-400 uppercase font-mono font-bold">X:</span> 
                               <input type="number" [value]="hole.x" (change)="updateHole($index, 'x', $event)" step="0.5" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                             </div>
                             <div class="flex items-center gap-1">
                               <span class="text-[9px] text-slate-400 uppercase font-mono font-bold">Y:</span> 
                               <input type="number" [value]="hole.y" (change)="updateHole($index, 'y', $event)" step="0.5" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                             </div>
                             <div class="flex items-center gap-1">
                               <span class="text-[9px] text-slate-400 uppercase font-mono font-bold">θ°:</span> 
                               <input type="number" [value]="hole.rotation ?? store.settings().ovalRotation" (change)="updateHole($index, 'rotation', $event)" step="15" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                             </div>
                           </div>
                           <div class="grid grid-cols-3 gap-1.5 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                             <div class="flex items-center gap-1">
                               <span class="text-[9px] text-slate-400 uppercase font-mono font-bold">W:</span> 
                               <input type="number" [value]="hole.width ?? store.settings().ovalHoleWidth" (change)="updateHole($index, 'width', $event)" step="0.5" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                             </div>
                             <div class="flex items-center gap-1">
                               <span class="text-[9px] text-slate-400 uppercase font-mono font-bold">H:</span> 
                               <input type="number" [value]="hole.height ?? store.settings().ovalHoleHeight" (change)="updateHole($index, 'height', $event)" step="0.5" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                             </div>
                             <div class="flex items-center gap-1">
                               <span class="text-[9px] text-slate-400 uppercase font-mono font-bold">CR:</span> 
                               <input type="number" [value]="hole.cornerRadius ?? store.settings().ovalCornerRadius" (change)="updateHole($index, 'cornerRadius', $event)" step="0.25" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                             </div>
                           </div>
                         } @else {
                           <div class="grid grid-cols-3 gap-1.5 text-[11px]">
                             <div class="flex items-center gap-1">
                               <span class="text-[9px] text-slate-400 uppercase font-mono font-bold">X:</span> 
                               <input type="number" [value]="hole.x" (change)="updateHole($index, 'x', $event)" step="0.5" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                             </div>
                             <div class="flex items-center gap-1">
                               <span class="text-[9px] text-slate-400 uppercase font-mono font-bold">Y:</span> 
                               <input type="number" [value]="hole.y" (change)="updateHole($index, 'y', $event)" step="0.5" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                             </div>
                             <div class="flex items-center gap-1">
                               <span class="text-[9px] text-slate-400 uppercase font-mono font-bold">Ø:</span> 
                               <input type="number" [value]="(hole.r * 2)" (change)="updateHoleDiameterItem($index, $event)" step="0.5" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                             </div>
                           </div>

                           @if (isKey) {
                             <div class="grid grid-cols-3 gap-1.5 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                               <div class="flex items-center gap-1">
                                 <span class="text-[9px] text-slate-400 uppercase font-mono font-bold">W:</span> 
                                 <input type="number" [value]="hole.slotWidth ?? store.settings().keyholeSlotWidth" (change)="updateHole($index, 'slotWidth', $event)" step="0.25" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                               </div>
                               <div class="flex items-center gap-1">
                                 <span class="text-[9px] text-slate-400 uppercase font-mono font-bold">H:</span> 
                                 <input type="number" [value]="hole.slotHeight ?? store.settings().keyholeSlotHeight" (change)="updateHole($index, 'slotHeight', $event)" step="0.5" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                               </div>
                               <div class="flex items-center gap-1">
                                 <span class="text-[9px] text-slate-400 uppercase font-mono font-bold">θ°:</span> 
                                 <input type="number" [value]="hole.rotation ?? store.settings().keyholeDirection" (change)="updateHole($index, 'rotation', $event)" step="15" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                               </div>
                             </div>
                           }
                         }
                       </div>
                     }
                   </div>
                   <button class="w-full text-rose-600 dark:text-rose-400 text-xs py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/60 transition-colors font-bold mt-2 cursor-pointer"
                           (click)="store.updateSettings({ customHoles: [] })">
                       Clear All Holes
                   </button>
                 }
              </div>
           </div>
        }

        <!-- Tab 6: LED Lighting & Optical Engineering Simulation -->
        @if (store.activeTab() === 'simulation') {
           <div class="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold bg-slate-50/90 dark:bg-[#0b0f17]/90 sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
             <div class="flex items-center gap-2">
               <mat-icon class="scale-75 text-amber-500">lightbulb</mat-icon>
               <span>LED & LIGHTING ENGINEERING</span>
             </div>
             <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
               Optics & Power
             </span>
           </div>
           <div class="p-5 space-y-5">
              <div class="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span class="block text-xs font-bold text-slate-800 dark:text-slate-100">Sign Backlight LEDs</span>
                  <span class="text-[10px] text-slate-400 dark:text-slate-500">Simulates real wall halo glow</span>
                </div>
                <button (click)="store.updateSettings({ ledEnabled: !store.settings().ledEnabled })" 
                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                        [class.bg-amber-500]="store.settings().ledEnabled"
                        [class.bg-slate-300]="!store.settings().ledEnabled"
                        [class.dark:bg-slate-700]="!store.settings().ledEnabled">
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md"
                        [class.translate-x-6]="store.settings().ledEnabled"
                        [class.translate-x-1]="!store.settings().ledEnabled"></span>
                </button>
              </div>

              @if (store.settings().ledEnabled) {
                <div class="space-y-4 pt-1">
                  <!-- 1. CCT Color Temperature & Kelvin Spectrum Engine -->
                  <div class="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
                        <mat-icon class="scale-75 text-amber-500">wb_sunny</mat-icon>
                        <span>Color Temperature & Spectrum</span>
                      </div>
                      <span class="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                        {{ store.settings().cctPreset === 'rgb' ? store.settings().ledColor : (store.settings().cctKelvin || 6500) + 'K' }}
                      </span>
                    </div>

                    <!-- CCT Quick Presets -->
                    <div class="grid grid-cols-5 gap-1">
                      <button (click)="store.setCCTPreset('3000K')"
                              [class.bg-amber-500]="store.settings().cctPreset === '3000K'"
                              [class.text-slate-950]="store.settings().cctPreset === '3000K'"
                              [class.bg-white]="store.settings().cctPreset !== '3000K'"
                              [class.dark:bg-slate-700]="store.settings().cctPreset !== '3000K'"
                              [class.text-slate-700]="store.settings().cctPreset !== '3000K'"
                              [class.dark:text-slate-200]="store.settings().cctPreset !== '3000K'"
                              class="py-1.5 px-1 rounded-xl text-[10px] font-bold border border-slate-200 dark:border-slate-600 transition-all text-center cursor-pointer shadow-sm">
                        3000K
                        <span class="block text-[8px] font-normal text-slate-400">Warm</span>
                      </button>
                      <button (click)="store.setCCTPreset('4000K')"
                              [class.bg-amber-500]="store.settings().cctPreset === '4000K'"
                              [class.text-slate-950]="store.settings().cctPreset === '4000K'"
                              [class.bg-white]="store.settings().cctPreset !== '4000K'"
                              [class.dark:bg-slate-700]="store.settings().cctPreset !== '4000K'"
                              [class.text-slate-700]="store.settings().cctPreset !== '4000K'"
                              [class.dark:text-slate-200]="store.settings().cctPreset !== '4000K'"
                              class="py-1.5 px-1 rounded-xl text-[10px] font-bold border border-slate-200 dark:border-slate-600 transition-all text-center cursor-pointer shadow-sm">
                        4000K
                        <span class="block text-[8px] font-normal text-slate-400">Neutral</span>
                      </button>
                      <button (click)="store.setCCTPreset('6500K')"
                              [class.bg-amber-500]="store.settings().cctPreset === '6500K' || !store.settings().cctPreset"
                              [class.text-slate-950]="store.settings().cctPreset === '6500K' || !store.settings().cctPreset"
                              [class.bg-white]="store.settings().cctPreset !== '6500K' && store.settings().cctPreset"
                              [class.dark:bg-slate-700]="store.settings().cctPreset !== '6500K' && store.settings().cctPreset"
                              [class.text-slate-700]="store.settings().cctPreset !== '6500K' && store.settings().cctPreset"
                              [class.dark:text-slate-200]="store.settings().cctPreset !== '6500K' && store.settings().cctPreset"
                              class="py-1.5 px-1 rounded-xl text-[10px] font-bold border border-slate-200 dark:border-slate-600 transition-all text-center cursor-pointer shadow-sm">
                        6500K
                        <span class="block text-[8px] font-normal text-slate-400">Sign Day</span>
                      </button>
                      <button (click)="store.setCCTPreset('8000K')"
                              [class.bg-amber-500]="store.settings().cctPreset === '8000K'"
                              [class.text-slate-950]="store.settings().cctPreset === '8000K'"
                              [class.bg-white]="store.settings().cctPreset !== '8000K'"
                              [class.dark:bg-slate-700]="store.settings().cctPreset !== '8000K'"
                              [class.text-slate-700]="store.settings().cctPreset !== '8000K'"
                              [class.dark:text-slate-200]="store.settings().cctPreset !== '8000K'"
                              class="py-1.5 px-1 rounded-xl text-[10px] font-bold border border-slate-200 dark:border-slate-600 transition-all text-center cursor-pointer shadow-sm">
                        8000K
                        <span class="block text-[8px] font-normal text-slate-400">Ice Cool</span>
                      </button>
                      <button (click)="store.setCCTPreset('rgb')"
                              [class.bg-amber-500]="store.settings().cctPreset === 'rgb'"
                              [class.text-slate-950]="store.settings().cctPreset === 'rgb'"
                              [class.bg-white]="store.settings().cctPreset !== 'rgb'"
                              [class.dark:bg-slate-700]="store.settings().cctPreset !== 'rgb'"
                              [class.text-slate-700]="store.settings().cctPreset !== 'rgb'"
                              [class.dark:text-slate-200]="store.settings().cctPreset !== 'rgb'"
                              class="py-1.5 px-1 rounded-xl text-[10px] font-bold border border-slate-200 dark:border-slate-600 transition-all text-center cursor-pointer shadow-sm">
                        🎨 RGB
                        <span class="block text-[8px] font-normal text-slate-400">Custom</span>
                      </button>
                    </div>

                    @if (store.settings().cctPreset !== 'rgb') {
                      <!-- Dynamic Kelvin Slider -->
                      <div class="space-y-1 pt-1">
                        <div class="flex justify-between items-center text-[11px]">
                          <span class="text-slate-500 dark:text-slate-400">Kelvin Spectrum Slider</span>
                          <span class="font-mono font-bold text-amber-600 dark:text-amber-400">{{ store.settings().cctKelvin || 6500 }} K</span>
                        </div>
                        <input type="range" min="2700" max="10000" step="100" 
                               [value]="store.settings().cctKelvin || 6500" 
                               (input)="onKelvinSlider($event)"
                               class="w-full accent-amber-500 cursor-pointer">
                      </div>
                    } @else {
                      <!-- RGB Color Picker & Swatches -->
                      <div class="flex items-center gap-3 pt-1">
                        <input id="ledColorPicker" type="color" [value]="store.settings().ledColor" (input)="updateColor('ledColor', $event)" 
                               class="w-9 h-9 p-0 border-0 rounded-xl cursor-pointer shrink-0 shadow-md">
                        <div class="flex flex-wrap gap-1.5 flex-1">
                          @for (color of ['#ffffff', '#ffaa00', '#ff0055', '#00e5ff', '#00ff66', '#aa00ff']; track color) {
                            <button (click)="store.updateSettings({ ledColor: color })" 
                                    [title]="'Select LED color ' + color"
                                    class="w-6 h-6 rounded-full border border-white/20 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                    [style.backgroundColor]="color"></button>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <!-- 2. Optical Diffusion & Hotspot Diagnostic Engine -->
                  @let diff = store.getDiffusionAnalysis();
                  <div class="p-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/10 rounded-2xl border border-indigo-500/20 space-y-3.5">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                          <mat-icon class="scale-75">lens_blur</mat-icon>
                        </div>
                        <div>
                          <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100">Optical Diffusion Diagnostics</h4>
                          <p class="text-[10px] text-slate-500 dark:text-slate-400">Beam spread & face hotspot analysis</p>
                        </div>
                      </div>
                      <!-- 3D Heatmap Toggle -->
                      <button (click)="store.updateSettings({ showDiffusionHeatmap: !store.settings().showDiffusionHeatmap })"
                              [class.bg-indigo-600]="store.settings().showDiffusionHeatmap"
                              [class.text-white]="store.settings().showDiffusionHeatmap"
                              [class.bg-slate-100]="!store.settings().showDiffusionHeatmap"
                              [class.dark:bg-slate-800]="!store.settings().showDiffusionHeatmap"
                              [class.text-slate-700]="!store.settings().showDiffusionHeatmap"
                              [class.dark:text-slate-300]="!store.settings().showDiffusionHeatmap"
                              class="py-1 px-2.5 rounded-lg text-[10px] font-bold border border-indigo-500/30 flex items-center gap-1 transition-all cursor-pointer shadow-sm">
                        <mat-icon class="scale-75">blur_on</mat-icon>
                        <span>{{ store.settings().showDiffusionHeatmap ? 'Heatmap ON' : '3D Heatmap' }}</span>
                      </button>
                    </div>

                    <!-- Lens Beam Angle Selector -->
                    <div class="space-y-1">
                      <span class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">Lens Beam Angle</span>
                      <div class="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                        <button (click)="setLensBeamAngle(120)"
                                [class.bg-white]="store.settings().lensBeamAngle === 120"
                                [class.dark:bg-slate-700]="store.settings().lensBeamAngle === 120"
                                [class.text-indigo-600]="store.settings().lensBeamAngle === 120"
                                [class.dark:text-indigo-400]="store.settings().lensBeamAngle === 120"
                                [class.shadow-sm]="store.settings().lensBeamAngle === 120"
                                class="py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 transition-all cursor-pointer">
                          120° Narrow
                        </button>
                        <button (click)="setLensBeamAngle(160)"
                                [class.bg-white]="store.settings().lensBeamAngle === 160 || !store.settings().lensBeamAngle"
                                [class.dark:bg-slate-700]="store.settings().lensBeamAngle === 160 || !store.settings().lensBeamAngle"
                                [class.text-indigo-600]="store.settings().lensBeamAngle === 160 || !store.settings().lensBeamAngle"
                                [class.dark:text-indigo-400]="store.settings().lensBeamAngle === 160 || !store.settings().lensBeamAngle"
                                [class.shadow-sm]="store.settings().lensBeamAngle === 160 || !store.settings().lensBeamAngle"
                                class="py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 transition-all cursor-pointer">
                          160° Batwing
                        </button>
                        <button (click)="setLensBeamAngle(175)"
                                [class.bg-white]="store.settings().lensBeamAngle === 175"
                                [class.dark:bg-slate-700]="store.settings().lensBeamAngle === 175"
                                [class.text-indigo-600]="store.settings().lensBeamAngle === 175"
                                [class.dark:text-indigo-400]="store.settings().lensBeamAngle === 175"
                                [class.shadow-sm]="store.settings().lensBeamAngle === 175"
                                class="py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 transition-all cursor-pointer">
                          175° Ultra
                        </button>
                      </div>
                    </div>

                    <!-- Live Diagnostic Metrics -->
                    <div class="grid grid-cols-3 gap-2">
                      <div class="p-2 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                        <span class="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Beam Overlap</span>
                        <span class="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">{{ diff.overlapRatio }}x</span>
                      </div>
                      <div class="p-2 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                        <span class="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Uniformity</span>
                        <span class="text-sm font-extrabold font-mono"
                              [class.text-emerald-500]="diff.uniformityPercent >= 85"
                              [class.text-amber-500]="diff.uniformityPercent < 85 && diff.uniformityPercent >= 70"
                              [class.text-rose-500]="diff.uniformityPercent < 70">
                          {{ diff.uniformityPercent }}%
                        </span>
                      </div>
                      <div class="p-2 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                        <span class="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Cavity Depth</span>
                        <span class="text-sm font-extrabold text-slate-700 dark:text-slate-200 font-mono">{{ diff.cavityDepthMm }} mm</span>
                      </div>
                    </div>

                    <!-- Status Advisory Banner -->
                    <div class="p-2.5 rounded-xl text-[11px] font-medium flex items-start gap-2"
                         [class.bg-emerald-500/15]="diff.hotspotStatus === 'optimal'"
                         [class.border]="true"
                         [class.border-emerald-500/30]="diff.hotspotStatus === 'optimal'"
                         [class.text-emerald-800]="diff.hotspotStatus === 'optimal'"
                         [class.dark:text-emerald-300]="diff.hotspotStatus === 'optimal'"
                         [class.bg-amber-500/15]="diff.hotspotStatus === 'good' || diff.hotspotStatus === 'warning'"
                         [class.border-amber-500/30]="diff.hotspotStatus === 'good' || diff.hotspotStatus === 'warning'"
                         [class.text-amber-800]="diff.hotspotStatus === 'good' || diff.hotspotStatus === 'warning'"
                         [class.dark:text-amber-300]="diff.hotspotStatus === 'good' || diff.hotspotStatus === 'warning'"
                         [class.bg-rose-500/15]="diff.hotspotStatus === 'critical'"
                         [class.border-rose-500/30]="diff.hotspotStatus === 'critical'"
                         [class.text-rose-800]="diff.hotspotStatus === 'critical'"
                         [class.dark:text-rose-300]="diff.hotspotStatus === 'critical'">
                      <mat-icon class="scale-75 shrink-0 mt-0.5"
                                [class.text-emerald-500]="diff.hotspotStatus === 'optimal'"
                                [class.text-amber-500]="diff.hotspotStatus === 'good' || diff.hotspotStatus === 'warning'"
                                [class.text-rose-500]="diff.hotspotStatus === 'critical'">
                        {{ diff.hotspotStatus === 'optimal' ? 'check_circle' : (diff.hotspotStatus === 'critical' ? 'error' : 'info') }}
                      </mat-icon>
                      <div>
                        <span class="font-bold block">{{ diff.hotspotStatus.toUpperCase() }}:</span>
                        <span>{{ diff.statusMessage }} (Rec. Min Depth: ≥ {{ diff.recommendedMinDepthMm }} mm)</span>
                      </div>
                    </div>
                  </div>

                  <!-- 3. Photometric & Visual Sliders -->
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Light Brightness Intensity', key: 'ledIntensity', value: store.settings().ledIntensity, min: 1, max: 60, step: 1, unit: 'x' }"></ng-container>
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Acrylic Face Emissive Glow', key: 'emissiveIntensity', value: store.settings().emissiveIntensity, min: 0, max: 15, step: 0.5, unit: 'x' }"></ng-container>
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Diffusion Spread Radius', key: 'ledSpread', value: store.settings().ledSpread, min: 1000, max: 8000, step: 200, unit: 'mm' }"></ng-container>
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Wall Stand-off Gap', key: 'wallGap', value: store.settings().wallGap, min: 5, max: 120, step: 5, unit: 'mm' }"></ng-container>
                  <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Environment Ambient Light Level', key: 'roomAmbient', value: store.settings().roomAmbient, min: 0, max: 1, step: 0.01, unit: '' }"></ng-container>

                  <!-- LED Electrical, Wiring & Driver Calculator Section -->
                  <div class="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
                          <mat-icon class="scale-75">electrical_services</mat-icon>
                        </div>
                        <div>
                          <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100">Electrical & Driver Calculation</h4>
                          <p class="text-[10px] text-slate-500 dark:text-slate-400">Power load, driver sizing & wiring</p>
                        </div>
                      </div>
                    </div>

                    <!-- Electrical Metrics Grid -->
                    @let elec = store.getElectricalSummary();
                    <div class="grid grid-cols-2 gap-2 p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                      <div class="p-2 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span class="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                          {{ elec.ledType === 'strip' ? 'Tape Length' : 'LED Modules' }}
                        </span>
                        <span class="text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                          {{ elec.ledType === 'strip' ? elec.totalMeters + ' m' : elec.totalModules + ' mods' }}
                        </span>
                        <span class="text-[9px] text-slate-400 block">~{{ elec.totalLumens.toLocaleString() }} lm flux</span>
                      </div>
                      <div class="p-2 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span class="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Power & Current</span>
                        <span class="text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono">{{ elec.totalWatts }} W</span>
                        <span class="text-[9px] text-slate-400 block">{{ elec.totalAmps }}A @ {{ elec.voltage }}V</span>
                      </div>
                      <div class="p-2 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span class="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Recommended Driver</span>
                        <span class="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{{ elec.recommendedPsuWatts }}W PSU</span>
                        <span class="text-[9px] text-slate-400 block">85% continuous load rating</span>
                      </div>
                      <div class="p-2 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span class="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Voltage Drop</span>
                        <span class="text-xs font-extrabold font-mono"
                              [class.text-emerald-500]="elec.isVoltageDropSafe"
                              [class.text-rose-500]="!elec.isVoltageDropSafe">
                          {{ elec.voltageDropV }}V ({{ elec.voltageDropPercent }}%)
                        </span>
                        <span class="text-[9px] block" [class.text-emerald-500]="elec.isVoltageDropSafe" [class.text-rose-500]="!elec.isVoltageDropSafe">
                          {{ elec.isVoltageDropSafe ? '✓ Standard Compliant' : '⚠ High Drop' }}
                        </span>
                      </div>
                    </div>

                    <!-- Cable Lead Distance & Wire Gauge Selection -->
                    <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-semibold text-slate-700 dark:text-slate-300">Lead Wire to Driver ({{ store.settings().wireRunLengthMeters || 3 }} m)</span>
                        <span class="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          Gauge: {{ elec.wireGauge }}
                        </span>
                      </div>
                      <input type="range" min="1" max="25" step="1"
                             [value]="store.settings().wireRunLengthMeters || 3"
                             (input)="updateNumber('wireRunLengthMeters', $event)"
                             class="w-full accent-amber-500 cursor-pointer">

                      <div class="grid grid-cols-5 gap-1 pt-1">
                        @for (gauge of ['auto', '18 AWG', '16 AWG', '14 AWG', '12 AWG']; track gauge) {
                          <button (click)="setWireGauge(gauge)"
                                  [class.bg-amber-500]="(store.settings().wireGaugeSelected || 'auto') === gauge"
                                  [class.text-slate-950]="(store.settings().wireGaugeSelected || 'auto') === gauge"
                                  [class.bg-white]="(store.settings().wireGaugeSelected || 'auto') !== gauge"
                                  [class.dark:bg-slate-700]="(store.settings().wireGaugeSelected || 'auto') !== gauge"
                                  [class.text-slate-700]="(store.settings().wireGaugeSelected || 'auto') !== gauge"
                                  [class.dark:text-slate-200]="(store.settings().wireGaugeSelected || 'auto') !== gauge"
                                  class="py-1 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-600 transition-all text-center cursor-pointer shadow-sm">
                            {{ gauge === 'auto' ? 'Auto' : gauge }}
                          </button>
                        }
                      </div>
                    </div>

                    @if (elec.requiresParallelFeeds) {
                      <div class="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 font-medium flex items-center gap-2">
                        <mat-icon class="scale-75 text-amber-600 shrink-0">warning</mat-icon>
                        <span>Exceeds single run limit ({{ elec.maxChainCapacity }} {{ elec.ledType === 'strip' ? 'm' : 'modules' }}). Use <strong>{{ elec.chainCount }} parallel feeds</strong> to avoid voltage drop.</span>
                      </div>
                    }

                    <!-- LED Light Source Type Selector -->
                    <div class="space-y-3 pt-2">
                      <div class="space-y-1">
                        <span class="font-semibold text-xs text-slate-700 dark:text-slate-300 block">LED Light Source Type</span>
                        <div class="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                          <button (click)="store.updateSettings({ ledType: 'modules' })"
                                  [class.bg-white]="store.settings().ledType === 'modules'"
                                  [class.dark:bg-slate-700]="store.settings().ledType === 'modules'"
                                  [class.text-amber-600]="store.settings().ledType === 'modules'"
                                  [class.dark:text-amber-400]="store.settings().ledType === 'modules'"
                                  [class.shadow-sm]="store.settings().ledType === 'modules'"
                                  [class.text-slate-500]="store.settings().ledType !== 'modules'"
                                  class="py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                            <span>📦</span> Modules
                          </button>
                          <button (click)="store.updateSettings({ ledType: 'strip' })"
                                  [class.bg-white]="store.settings().ledType === 'strip'"
                                  [class.dark:bg-slate-700]="store.settings().ledType === 'strip'"
                                  [class.text-amber-600]="store.settings().ledType === 'strip'"
                                  [class.dark:text-amber-400]="store.settings().ledType === 'strip'"
                                  [class.shadow-sm]="store.settings().ledType === 'strip'"
                                  [class.text-slate-500]="store.settings().ledType !== 'strip'"
                                  class="py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                            <span>🎗️</span> Flexible Strip
                          </button>
                        </div>
                      </div>

                      <div class="flex justify-between items-center text-xs pt-1">
                        <span class="font-semibold text-slate-700 dark:text-slate-300">System Voltage</span>
                        <div class="flex gap-1">
                          <button (click)="store.updateSettings({ voltageSystem: '12V' })"
                                  [class.bg-amber-500]="store.settings().voltageSystem === '12V'"
                                  [class.text-white]="store.settings().voltageSystem === '12V'"
                                  [class.bg-slate-100]="store.settings().voltageSystem !== '12V'"
                                  [class.dark:bg-slate-800]="store.settings().voltageSystem !== '12V'"
                                  class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer">12V DC</button>
                          <button (click)="store.updateSettings({ voltageSystem: '24V' })"
                                  [class.bg-amber-500]="store.settings().voltageSystem === '24V'"
                                  [class.text-white]="store.settings().voltageSystem === '24V'"
                                  [class.bg-slate-100]="store.settings().voltageSystem !== '24V'"
                                  [class.dark:bg-slate-800]="store.settings().voltageSystem !== '24V'"
                                  class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer">24V DC</button>
                        </div>
                      </div>

                      @if (store.settings().ledType === 'modules') {
                        <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Module Power Rating', key: 'moduleWattage', value: store.settings().moduleWattage, min: 0.3, max: 2.0, step: 0.05, unit: 'W' }"></ng-container>
                        <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Module Pitch / Spacing', key: 'modulePitchMm', value: store.settings().modulePitchMm, min: 20, max: 90, step: 5, unit: 'mm' }"></ng-container>

                        <!-- Interactive Individual LED Module Drag Placement -->
                        <div class="p-3.5 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl space-y-2.5">
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 text-xs">
                              <mat-icon class="scale-75 text-amber-500">open_with</mat-icon>
                              <span>Manual LED Module Dragging</span>
                            </div>
                            @if (store.settings().customLeds) {
                              <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">Custom</span>
                            } @else {
                              <span class="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Auto Stroke</span>
                            }
                          </div>

                          <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                            Click & drag individual yellow LED modules in 3D for exact custom placement. Right-click / Alt-click to delete.
                          </p>

                          <div class="grid grid-cols-2 gap-2 pt-1">
                            <button (click)="toggleMoveLedMode()" 
                                    [class.bg-amber-500]="store.settings().interactionMode === 'move-led'"
                                    [class.text-slate-950]="store.settings().interactionMode === 'move-led'"
                                    [class.bg-slate-100]="store.settings().interactionMode !== 'move-led'"
                                    [class.dark:bg-slate-800]="store.settings().interactionMode !== 'move-led'"
                                    [class.text-slate-700]="store.settings().interactionMode !== 'move-led'"
                                    [class.dark:text-slate-200]="store.settings().interactionMode !== 'move-led'"
                                    class="py-2 px-2.5 rounded-xl text-xs font-bold border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm">
                              <mat-icon class="scale-75">open_with</mat-icon>
                              <span>{{ store.settings().interactionMode === 'move-led' ? 'Active Drag' : 'Move LEDs' }}</span>
                            </button>

                            <button (click)="store.resetLedsToAuto()" 
                                    class="py-2 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                              <mat-icon class="scale-75">restart_alt</mat-icon>
                              <span>Reset Auto</span>
                            </button>
                          </div>
                        </div>
                      } @else {
                        <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Strip Rating (W/m)', key: 'stripWattagePerMeter', value: store.settings().stripWattagePerMeter, min: 4.8, max: 28.8, step: 1.2, unit: 'W/m' }"></ng-container>
                        <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Strip PCB Width', key: 'stripWidthMm', value: store.settings().stripWidthMm, min: 5, max: 12, step: 1, unit: 'mm' }"></ng-container>
                      }
                    </div>

                    <!-- 3D Wiring Circuit Diagram Overlay Toggle -->
                    <div class="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <span class="block text-xs font-bold text-slate-800 dark:text-slate-100">3D Wire Paths & Driver</span>
                        <span class="text-[10px] text-slate-400 dark:text-slate-500">Render wiring harness & PSU box</span>
                      </div>
                      <button (click)="store.updateSettings({ showWiringDiagram: !store.settings().showWiringDiagram })" 
                              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer"
                              [class.bg-blue-600]="store.settings().showWiringDiagram"
                              [class.bg-slate-300]="!store.settings().showWiringDiagram"
                              [class.dark:bg-slate-700]="!store.settings().showWiringDiagram">
                        <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md"
                              [class.translate-x-6]="store.settings().showWiringDiagram"
                              [class.translate-x-1]="!store.settings().showWiringDiagram"></span>
                      </button>
                    </div>

                    <!-- Dynamic Lighting Animations -->
                    <div class="space-y-2 pt-2">
                      <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Dynamic Lighting Effects</span>
                      <div class="grid grid-cols-2 gap-1.5">
                        <button (click)="store.updateSettings({ animationMode: 'static' })"
                                [class.bg-amber-500]="store.settings().animationMode === 'static'"
                                [class.text-white]="store.settings().animationMode === 'static'"
                                [class.bg-slate-100]="store.settings().animationMode !== 'static'"
                                [class.dark:bg-slate-800]="store.settings().animationMode !== 'static'"
                                class="py-2 px-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                          💡 Static Glow
                        </button>
                        <button (click)="store.updateSettings({ animationMode: 'pulse' })"
                                [class.bg-amber-500]="store.settings().animationMode === 'pulse'"
                                [class.text-white]="store.settings().animationMode === 'pulse'"
                                [class.bg-slate-100]="store.settings().animationMode !== 'pulse'"
                                [class.dark:bg-slate-800]="store.settings().animationMode !== 'pulse'"
                                class="py-2 px-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                          🫀 Pulse
                        </button>
                        <button (click)="store.updateSettings({ animationMode: 'rainbow' })"
                                [class.bg-amber-500]="store.settings().animationMode === 'rainbow'"
                                [class.text-white]="store.settings().animationMode === 'rainbow'"
                                [class.bg-slate-100]="store.settings().animationMode !== 'rainbow'"
                                [class.dark:bg-slate-800]="store.settings().animationMode !== 'rainbow'"
                                class="py-2 px-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                          🌈 RGB Cycle
                        </button>
                        <button (click)="store.updateSettings({ animationMode: 'chase' })"
                                [class.bg-amber-500]="store.settings().animationMode === 'chase'"
                                [class.text-white]="store.settings().animationMode === 'chase'"
                                [class.bg-slate-100]="store.settings().animationMode !== 'chase'"
                                [class.dark:bg-slate-800]="store.settings().animationMode !== 'chase'"
                                class="py-2 px-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                          ⚡ Wave Chase
                        </button>
                      </div>

                      @if (store.settings().animationMode !== 'static') {
                        <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Animation Speed', key: 'animationSpeed', value: store.settings().animationSpeed, min: 1, max: 5, step: 0.5, unit: 'x' }"></ng-container>
                      }
                    </div>

                    <!-- Export Electrical Specification Sheet Action -->
                    <div class="pt-2">
                      <button (click)="exportElectricalSpecSheet()"
                              class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer">
                        <mat-icon class="scale-90">description</mat-icon>
                        <span>Download Electrical & Wiring Spec Sheet</span>
                      </button>
                      <p class="text-[10px] text-slate-400 text-center mt-1.5">
                        Generates a comprehensive workshop PDF/text document with PSU specs, wiring diagrams & BOM.
                      </p>
                    </div>
                  </div>
                </div>
              }
           </div>
        }

        <!-- Tab 7: Export CAD Files & 3D Printing Fabrication -->
        @if (store.activeTab() === 'export') {
           <div class="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold bg-slate-50/90 dark:bg-[#0b0f17]/90 sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2">
             <mat-icon class="scale-75 text-blue-500">download</mat-icon>
             <span>EXPORT CAD & PRINTABLE FILES</span>
           </div>
           <div class="p-5 space-y-4">
             <!-- Template & Snapshot Buttons -->
             <button (click)="openTemplateModal()" 
                     class="w-full flex items-center justify-between bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white p-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-98 text-left group cursor-pointer">
               <div class="flex items-center gap-3">
                 <div class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                   <mat-icon class="scale-90">grid_on</mat-icon>
                 </div>
                 <div>
                   <span class="block font-extrabold text-sm">Printable 1:1 Installation Template</span>
                   <span class="text-[11px] opacity-90">1:1 Scale tiled paper template with drill & wire holes</span>
                 </div>
               </div>
               <mat-icon class="group-hover:translate-x-1 transition-transform">print</mat-icon>
             </button>

             <button (click)="exportSnapshot()" 
                     class="w-full flex items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white p-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-98 text-left group cursor-pointer">
               <div class="flex items-center gap-3">
                 <div class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                   <mat-icon class="scale-90">photo_camera</mat-icon>
                 </div>
                 <div>
                   <span class="block font-extrabold text-sm">Download High-Res 3D Snapshot</span>
                   <span class="text-[11px] opacity-90">Captures 4K PNG preview of current project angle</span>
                 </div>
               </div>
               <mat-icon class="group-hover:translate-x-1 transition-transform">download</mat-icon>
             </button>

             <!-- 3D Print STL Exports Section -->
             <div class="space-y-2 pt-1">
               <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                 3D Printing (STL & 3MF Exports)
                </span>

                <!-- Object Separation Format Selector -->
                <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2 my-2">
                  <div class="flex items-center gap-2">
                    <mat-icon class="scale-75 text-blue-500">category</mat-icon>
                    <div>
                      <span class="block text-xs font-bold text-slate-800 dark:text-slate-200">Export Format</span>
                      <span class="text-[10px] text-slate-400 dark:text-slate-500">Output structure for 3D printing</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 gap-1.5 pt-1">
                    <button (click)="exportFormat.set('zip-letters')"
                            [class.bg-blue-600]="exportFormat() === 'zip-letters'"
                            [class.text-white]="exportFormat() === 'zip-letters'"
                            [class.bg-white]="exportFormat() !== 'zip-letters'"
                            [class.dark:bg-slate-900]="exportFormat() !== 'zip-letters'"
                            [class.text-slate-700]="exportFormat() !== 'zip-letters'"
                            [class.dark:text-slate-300]="exportFormat() !== 'zip-letters'"
                            class="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer text-left">
                      <div class="flex items-center gap-2">
                        <mat-icon class="scale-75">folder_zip</mat-icon>
                        <div>
                          <span class="block text-[11px] font-bold">1 Solid Object per Letter (.ZIP)</span>
                          <span class="block text-[9px] font-normal opacity-80">Each letter fully merged into a single printable solid (Recommended)</span>
                        </div>
                      </div>
                      <span class="text-[10px] font-mono opacity-90">.ZIP</span>
                    </button>

                    <button (click)="exportFormat.set('3mf')"
                            [class.bg-blue-600]="exportFormat() === '3mf'"
                            [class.text-white]="exportFormat() === '3mf'"
                            [class.bg-white]="exportFormat() !== '3mf'"
                            [class.dark:bg-slate-900]="exportFormat() !== '3mf'"
                            [class.text-slate-700]="exportFormat() !== '3mf'"
                            [class.dark:text-slate-300]="exportFormat() !== '3mf'"
                            class="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer text-left">
                      <div class="flex items-center gap-2">
                        <mat-icon class="scale-75">view_in_ar</mat-icon>
                        <div>
                          <span class="block text-[11px] font-bold">3MF Multi-Object Project</span>
                          <span class="block text-[9px] font-normal opacity-80">Bambu Studio, OrcaSlicer & Prusa multi-object assembly</span>
                        </div>
                      </div>
                      <span class="text-[10px] font-mono opacity-90">.3MF</span>
                    </button>

                    <button (click)="exportFormat.set('combined-stl')"
                            [class.bg-blue-600]="exportFormat() === 'combined-stl'"
                            [class.text-white]="exportFormat() === 'combined-stl'"
                            [class.bg-white]="exportFormat() !== 'combined-stl'"
                            [class.dark:bg-slate-900]="exportFormat() !== 'combined-stl'"
                            [class.text-slate-700]="exportFormat() !== 'combined-stl'"
                            [class.dark:text-slate-300]="exportFormat() !== 'combined-stl'"
                            class="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer text-left">
                      <div class="flex items-center gap-2">
                        <mat-icon class="scale-75">tab_unselected</mat-icon>
                        <div>
                          <span class="block text-[11px] font-bold">All Letters in 1 STL</span>
                          <span class="block text-[9px] font-normal opacity-80">All letters merged into a single printable scene</span>
                        </div>
                      </div>
                      <span class="text-[10px] font-mono opacity-90">.STL</span>
                    </button>
                  </div>
                </div>

                <!-- Export Letter Bodies -->
                <button (click)="exportSTLBody()" 
                        class="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-400 p-3 rounded-xl transition-all text-left group cursor-pointer">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <mat-icon class="scale-75">view_in_ar</mat-icon>
                    </div>
                    <div>
                      <span class="block font-bold text-xs text-slate-800 dark:text-slate-100">Export Letter Bodies (STL / 3MF)</span>
                      <span class="text-[10px] text-slate-400 dark:text-slate-500">Hollow channel letter housings with mounting & wire holes</span>
                    </div>
                  </div>
                  <mat-icon class="text-slate-400 group-hover:text-blue-500 transition-colors scale-75">download</mat-icon>
                </button>

                <!-- Export Acrylic / Diffuser Faces in STL -->
                <button (click)="exportSTLAcrylic()" 
                        class="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-cyan-500 dark:hover:border-cyan-400 p-3 rounded-xl transition-all text-left group cursor-pointer">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <mat-icon class="scale-75">layers</mat-icon>
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="block font-bold text-xs text-slate-800 dark:text-slate-100">Export Acrylic / Face (STL / 3MF)</span>
                        <span class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 font-mono">{{ store.settings().acrylicThickness }}mm</span>
                      </div>
                      <span class="text-[10px] text-slate-400 dark:text-slate-500">Hollow 3D diffuser cap (1 wall, 1 bottom layer, placed face-down on bed at Z=0 for zero-support printing)</span>
                    </div>
                  </div>
                  <mat-icon class="text-slate-400 group-hover:text-cyan-500 transition-colors scale-75">download</mat-icon>
                </button>

                <!-- Export Complete Assembly (Bodies + Acrylic + Backplate) -->
                <button (click)="exportSTL()" 
                        class="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-500 dark:hover:border-indigo-400 p-3 rounded-xl transition-all text-left group cursor-pointer">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <mat-icon class="scale-75">widgets</mat-icon>
                    </div>
                    <div>
                      <span class="block font-bold text-xs text-slate-800 dark:text-slate-100">Export Complete Assembly (STL / 3MF)</span>
                      <span class="text-[10px] text-slate-400 dark:text-slate-500">Full 3D project with housings, acrylic diffusers & mounting</span>
                    </div>
                  </div>
                  <mat-icon class="text-slate-400 group-hover:text-indigo-500 transition-colors scale-75">download</mat-icon>
                </button>
             </div>

             <!-- 2D Laser & CNC Section -->
             <div class="space-y-3 pt-2">
               <div class="flex items-center justify-between">
                 <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                   2D Laser & CNC Cutting Files
                 </span>
                 <span class="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">1:1 mm Scale</span>
               </div>

               <!-- 2D Vector Format Selector -->
               <div class="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                 <button (click)="exportVectorFormat.set('combined')"
                         [class.bg-white]="exportVectorFormat() === 'combined'"
                         [class.dark:bg-slate-700]="exportVectorFormat() === 'combined'"
                         [class.text-emerald-600]="exportVectorFormat() === 'combined'"
                         [class.dark:text-emerald-400]="exportVectorFormat() === 'combined'"
                         [class.shadow-sm]="exportVectorFormat() === 'combined'"
                         [class.text-slate-600]="exportVectorFormat() !== 'combined'"
                         [class.dark:text-slate-400]="exportVectorFormat() !== 'combined'"
                         class="py-1 px-1.5 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer">
                   Combined SVG
                 </button>
                 <button (click)="exportVectorFormat.set('zip-letters')"
                         [class.bg-white]="exportVectorFormat() === 'zip-letters'"
                         [class.dark:bg-slate-700]="exportVectorFormat() === 'zip-letters'"
                         [class.text-emerald-600]="exportVectorFormat() === 'zip-letters'"
                         [class.dark:text-emerald-400]="exportVectorFormat() === 'zip-letters'"
                         [class.shadow-sm]="exportVectorFormat() === 'zip-letters'"
                         [class.text-slate-600]="exportVectorFormat() !== 'zip-letters'"
                         [class.dark:text-slate-400]="exportVectorFormat() !== 'zip-letters'"
                         class="py-1 px-1.5 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer">
                   Letters ZIP
                 </button>
                 <button (click)="exportVectorFormat.set('dxf')"
                         [class.bg-white]="exportVectorFormat() === 'dxf'"
                         [class.dark:bg-slate-700]="exportVectorFormat() === 'dxf'"
                         [class.text-emerald-600]="exportVectorFormat() === 'dxf'"
                         [class.dark:text-emerald-400]="exportVectorFormat() === 'dxf'"
                         [class.shadow-sm]="exportVectorFormat() === 'dxf'"
                         [class.text-slate-600]="exportVectorFormat() !== 'dxf'"
                         [class.dark:text-slate-400]="exportVectorFormat() !== 'dxf'"
                         class="py-1 px-1.5 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer">
                   AutoCAD DXF
                 </button>
               </div>

               <div class="space-y-2">
                 <button (click)="exportSVGAcrylic()" 
                         class="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-400 p-3 rounded-xl transition-all text-left group cursor-pointer">
                   <div class="flex items-center gap-2.5">
                     <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                       <mat-icon class="scale-75">content_cut</mat-icon>
                     </div>
                     <div>
                       <span class="block font-bold text-xs text-slate-800 dark:text-slate-100">
                         Export Acrylic Face ({{ exportVectorFormat() === 'dxf' ? '1:1 DXF' : (exportVectorFormat() === 'zip-letters' ? 'Individual SVGs' : 'Layout SVG') }})
                       </span>
                       <span class="text-[10px] text-slate-400 dark:text-slate-500">
                         Exact laser kerf & clearance ({{ (store.settings().acrylicClearance ?? 0) === 0 ? 'Nominal fit' : ((store.settings().acrylicClearance ?? 0) + 'mm') }})
                       </span>
                     </div>
                   </div>
                   <mat-icon class="text-slate-400 group-hover:text-emerald-500 transition-colors scale-75">download</mat-icon>
                 </button>
                 
                 <button (click)="exportSVGBase()" 
                         class="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-purple-500 dark:hover:border-purple-400 p-3 rounded-xl transition-all text-left group cursor-pointer">
                   <div class="flex items-center gap-2.5">
                     <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                       <mat-icon class="scale-75">flip_to_back</mat-icon>
                     </div>
                     <div>
                       <span class="block font-bold text-xs text-slate-800 dark:text-slate-100">
                         Export Base Backplate ({{ exportVectorFormat() === 'dxf' ? '1:1 DXF' : (exportVectorFormat() === 'zip-letters' ? 'Individual SVGs' : 'Layout SVG') }})
                       </span>
                       <span class="text-[10px] text-slate-400 dark:text-slate-500">Includes mounting & wiring holes</span>
                     </div>
                   </div>
                   <mat-icon class="text-slate-400 group-hover:text-purple-500 transition-colors scale-75">download</mat-icon>
                 </button>

                 @if (store.settings().mountingType !== 'none') {
                   <button (click)="exportSVGBackplate()" 
                           class="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-400 p-3 rounded-xl transition-all text-left group cursor-pointer">
                     <div class="flex items-center gap-2.5">
                       <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                         <mat-icon class="scale-75">dashboard_customize</mat-icon>
                       </div>
                       <div>
                         <span class="block font-bold text-xs text-slate-800 dark:text-slate-100">
                           Export Mounting Panel ({{ exportVectorFormat() === 'dxf' ? '1:1 DXF' : '1:1 SVG' }})
                         </span>
                         <span class="text-[10px] text-slate-400 dark:text-slate-500">Pre-drilled mounting backplate for laser/CNC</span>
                       </div>
                     </div>
                     <mat-icon class="text-slate-400 group-hover:text-blue-500 transition-colors scale-75">download</mat-icon>
                   </button>
                 }
               </div>
             </div>
           </div>
        }
        </div>
      </div>
    </div>
    
    <!-- Reusable Slider Template -->
    <ng-template #sliderParam let-label="label" let-key="key" let-value="value" let-min="min" let-max="max" let-step="step" let-unit="unit" let-desc="desc">
      <div class="space-y-1.5">
        <div class="flex justify-between items-center text-xs">
          <span class="font-semibold text-slate-700 dark:text-slate-300">{{ label }}</span>
          <div class="flex items-center gap-1 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <span>{{ value }}</span>
            <span class="text-[10px] font-normal text-slate-400">{{ unit }}</span>
          </div>
        </div>
        <input type="range" [min]="min" [max]="max" [step]="step"
               [value]="value"
               (input)="updateNumber(key, $event)"
               class="w-full cursor-pointer">
        @if (desc) {
          <p class="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{{ desc }}</p>
        }
      </div>
    </ng-template>
  `
})
export class LeftSidebarComponent {
  store = inject(AppStore);
  isCollapsed = this.store.inspectorCollapsed;
  signageFonts = SIGNAGE_FONTS;

  toggleCollapse() {
    this.isCollapsed.update(c => !c);
    this.triggerResizeEvents();
  }

  selectTab(tab: AppTab) {
    if (this.store.activeTab() === tab && !this.isCollapsed()) {
      this.isCollapsed.set(true);
    } else {
      this.store.setActiveTab(tab);
      this.isCollapsed.set(false);
    }
    this.triggerResizeEvents();
  }

  private triggerResizeEvents() {
    window.dispatchEvent(new Event('resize'));
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 320);
  }

  selectedFontInfo() {
    const fontId = this.store.settings().font;
    const allFonts = [...SIGNAGE_FONTS, ...this.store.customFonts()];
    return allFonts.find(f => f.id === fontId || f.id.toLowerCase() === fontId.toLowerCase()) || SIGNAGE_FONTS[0];
  }

  updateFont(event: Event) {
    const el = event.target as HTMLSelectElement;
    this.store.updateSettings({ font: el.value });
  }

  styles: { id: LetterStyle, name: string, description: string, badge?: string }[] = [
    { 
      id: 'acrylic-printed-back', 
      name: 'ACRYLIC FACE - PRINTED BACK', 
      description: 'Standard straight channel letter with printed backing' 
    },
    { 
      id: 'acrylic-double-step', 
      name: 'ACRYLIC FACE - DOUBLE STEP BUMPS', 
      description: 'Two identical offset architectural bumps with adjustable gap and 45° overhangs', 
      badge: 'Double Step' 
    }
  ];

  setWallProfileTemplate(template: WallProfileTemplate) {
    if (template === 'double-step') {
      this.store.updateSettings({ 
        wallProfileTemplate: 'double-step',
        style: 'acrylic-double-step',
        footOffset: this.store.settings().footOffset ?? 3.5,
        footHeight: this.store.settings().footHeight ?? 4,
        stepsGap: this.store.settings().stepsGap ?? 5,
        footStartHeight: this.store.settings().footStartHeight ?? 4,
        footCloseAtBase: true,
        footRampAngle: this.store.settings().footRampAngle ?? 45
      });
    } else if (template === 'tapered') {
      this.store.updateSettings({ 
        wallProfileTemplate: 'tapered',
        style: 'acrylic-printed-back',
        bodyTaper: this.store.settings().bodyTaper ?? 3
      });
    } else {
      this.store.updateSettings({ 
        wallProfileTemplate: 'straight',
        style: 'acrylic-printed-back',
        bodyTaper: 0
      });
    }
  }

  toggleFootCloseAtBase() {
    const cur = this.store.settings().footCloseAtBase !== false;
    this.store.updateSettings({ footCloseAtBase: !cur });
  }

  // Double Step Bump Presets UI State & Management
  showSavePresetDialog = signal<boolean>(false);
  newPresetName = signal<string>('');
  newPresetDesc = signal<string>('');
  presetSaveToast = signal<string | null>(null);
  showImportPresetDialog = signal<boolean>(false);
  importPresetJson = signal<string>('');
  importPresetError = signal<string | null>(null);

  isDoubleStepPresetActive(preset: DoubleStepBumpPreset): boolean {
    const s = this.store.settings();
    const isDs = s.wallProfileTemplate === 'double-step' || s.style === 'acrylic-double-step';
    if (!isDs) return false;
    return (
      Math.abs((s.footOffset ?? 3.5) - preset.footOffset) < 0.05 &&
      Math.abs((s.footHeight ?? 4.0) - preset.footHeight) < 0.05 &&
      Math.abs((s.stepsGap ?? 5.0) - preset.stepsGap) < 0.05 &&
      Math.abs((s.footStartHeight ?? 4.0) - preset.footStartHeight) < 0.05 &&
      Math.abs((s.footRampAngle ?? 45) - preset.footRampAngle) < 0.5 &&
      Math.abs((s.wallHeight || 35) - preset.wallHeight) < 0.5
    );
  }

  openSavePresetDialog() {
    const s = this.store.settings();
    const wallH = s.wallHeight || 35;
    this.newPresetName.set(`Custom Double Step (${wallH}mm)`);
    this.newPresetDesc.set(`Bump: ${s.footOffset ?? 3.5}mm × ${s.footHeight ?? 4}mm, Gap: ${s.stepsGap ?? 5}mm, Base: ${s.footStartHeight ?? 4}mm`);
    this.showSavePresetDialog.set(true);
  }

  cancelSavePresetDialog() {
    this.showSavePresetDialog.set(false);
    this.newPresetName.set('');
    this.newPresetDesc.set('');
  }

  submitSavePreset() {
    const name = this.newPresetName();
    if (!name.trim()) return;
    this.store.saveCustomDoubleStepPreset(name, this.newPresetDesc());
    this.showSavePresetDialog.set(false);
    this.presetSaveToast.set(`Preset "${name}" saved!`);
    setTimeout(() => this.presetSaveToast.set(null), 3000);
  }

  deletePreset(presetId: string, event: Event) {
    event.stopPropagation();
    this.store.deleteCustomDoubleStepPreset(presetId);
    this.presetSaveToast.set('Preset deleted');
    setTimeout(() => this.presetSaveToast.set(null), 2500);
  }

  applyDoubleStepPreset(preset: DoubleStepBumpPreset) {
    this.store.applyDoubleStepPreset(preset);
    this.presetSaveToast.set(`Applied "${preset.name}"`);
    setTimeout(() => this.presetSaveToast.set(null), 2500);
  }

  exportDoubleStepPresets() {
    const json = this.store.exportDoubleStepPresetsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `double_step_bump_presets_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.presetSaveToast.set('Presets exported to JSON');
    setTimeout(() => this.presetSaveToast.set(null), 2500);
  }

  openImportDialog() {
    this.importPresetJson.set('');
    this.importPresetError.set(null);
    this.showImportPresetDialog.set(true);
  }

  closeImportDialog() {
    this.showImportPresetDialog.set(false);
    this.importPresetJson.set('');
    this.importPresetError.set(null);
  }

  submitImportPresets() {
    const json = this.importPresetJson();
    if (!json.trim()) {
      this.importPresetError.set('Please paste preset JSON content.');
      return;
    }
    const res = this.store.importDoubleStepPresets(json);
    if (res.success) {
      this.showImportPresetDialog.set(false);
      this.presetSaveToast.set(`Imported ${res.count} preset(s) successfully!`);
      setTimeout(() => this.presetSaveToast.set(null), 3000);
    } else {
      this.importPresetError.set(res.error || 'Failed to import presets.');
    }
  }

  onPresetFileImport(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        this.importPresetJson.set(text);
        this.submitImportPresets();
      }
    };
    reader.readAsText(file);
  }

  getProfileSvgPath(): string {
    const s = this.store.settings();
    const isDoubleStep = s.wallProfileTemplate === 'double-step' || s.style === 'acrylic-double-step';
    const isTapered = s.wallProfileTemplate === 'tapered' || (!isDoubleStep && (s.bodyTaper && s.bodyTaper > 0));

    const xLeft = 50;
    const xNominalOuter = 160;
    const yTop = 24;
    const yBottom = 140;
    const totalH = yBottom - yTop;

    const wallH = s.wallHeight || 35;
    const scale = totalH / wallH;

    const baseThick = Math.max(6, (s.baseThickness || 2) * scale);
    const extWallThick = Math.max(6, (s.externalWallThickness || 2) * scale * 1.5);
    const intLipThick = Math.max(6, (s.internalWallThickness || 2) * scale * 1.5);
    const acrylicThick = Math.max(8, (s.acrylicThickness || 3.1) * scale);

    const yAcrylicLedge = yTop + acrylicThick;
    const yFloor = yBottom - baseThick;

    if (!isDoubleStep) {
      const taperOffset = isTapered ? Math.min(25, (s.bodyTaper || 3) * scale * 2) : 0;
      const xBotOuter = xNominalOuter + taperOffset;
      const xBotInner = xBotOuter - extWallThick - intLipThick;

      return `M ${xLeft} ${yBottom} 
              L ${xBotOuter} ${yBottom} 
              L ${xNominalOuter} ${yTop} 
              L ${xNominalOuter - extWallThick} ${yTop} 
              L ${xNominalOuter - extWallThick} ${yAcrylicLedge} 
              L ${xNominalOuter - extWallThick - intLipThick} ${yAcrylicLedge} 
              L ${xBotInner} ${yFloor} 
              L ${xLeft} ${yFloor} Z`;
    }

    const bumpOff = Math.max(3, Math.min(22, (s.footOffset ?? 3.5) * scale * 1.5));
    const bumpH = Math.max(3, Math.min(18, (s.footHeight ?? 4) * scale * 1.0));
    const gapH = Math.max(3, Math.min(22, (s.stepsGap ?? 5) * scale * 1.0));
    const startH = Math.max(3, Math.min(20, (s.footStartHeight ?? 4) * scale * 1.0));

    const angleDeg = Math.max(25, Math.min(65, s.footRampAngle ?? 45));
    const rad = (angleDeg * Math.PI) / 180;
    const rampH = Math.max(3, Math.min(14, bumpOff / Math.tan(rad)));

    const xBump = xNominalOuter + bumpOff;
    const wallThick = extWallThick + intLipThick;

    const y1 = yBottom - startH;
    const y2 = y1 - rampH;
    const y3 = y2 - bumpH;
    const y4 = y3 - rampH;
    const y5 = y4 - gapH;
    const y6 = y5 - rampH;
    const y7 = y6 - bumpH;
    const y8 = y7 - rampH;

    const topBevel = Math.min(5, extWallThick * 0.7);
    const yTopChamf = yTop + topBevel;

    return `M ${xLeft} ${yBottom} 
            L ${xNominalOuter} ${yBottom} 
            L ${xNominalOuter} ${y1} 
            L ${xBump} ${y2} 
            L ${xBump} ${y3} 
            L ${xNominalOuter} ${y4} 
            L ${xNominalOuter} ${y5} 
            L ${xBump} ${y6} 
            L ${xBump} ${y7} 
            L ${xNominalOuter} ${y8} 
            L ${xNominalOuter} ${yTopChamf} 
            L ${xNominalOuter - topBevel} ${yTop} 
            L ${xNominalOuter - extWallThick} ${yTop} 
            L ${xNominalOuter - extWallThick} ${yAcrylicLedge} 
            L ${xNominalOuter - wallThick} ${yAcrylicLedge} 
            L ${xNominalOuter - wallThick} ${y8} 
            L ${xBump - wallThick} ${y7} 
            L ${xBump - wallThick} ${y6} 
            L ${xNominalOuter - wallThick} ${y5} 
            L ${xNominalOuter - wallThick} ${y4} 
            L ${xBump - wallThick} ${y3} 
            L ${xBump - wallThick} ${y2} 
            L ${xNominalOuter - wallThick} ${y1} 
            L ${xNominalOuter - wallThick} ${yFloor + 3} 
            L ${xNominalOuter - wallThick - 3} ${yFloor} 
            L ${xLeft} ${yFloor} Z`;
  }

  getAcrylicSvgPath(): string {
    const s = this.store.settings();
    const xLeft = 50;
    const xNominalOuter = 160;
    const yTop = 24;
    const yBottom = 140;
    const totalH = yBottom - yTop;
    const wallH = s.wallHeight || 35;
    const scale = totalH / wallH;

    const extWallThick = Math.max(6, (s.externalWallThickness || 2) * scale * 1.5);
    const acrylicThick = Math.max(8, (s.acrylicThickness || 3.1) * scale);
    const protrusionH = Math.max(0, (s.diffuserHeightOffset || 0) * scale);
    const yFaceTop = yTop - protrusionH;

    const bevelEnabled = s.diffuserBevelEnabled ?? false;
    const bevelSegments = s.diffuserBevelSegments ?? 3;
    const bevelSize = bevelEnabled ? Math.min(8, (s.diffuserBevelSize || 1.5) * scale) : 0;
    const bevelThick = bevelEnabled ? Math.min(8, (s.diffuserBevelThickness || 1.5) * scale) : 0;

    const xRightEdge = xNominalOuter - extWallThick;
    const yBottomSeat = yTop + acrylicThick;

    if (bevelEnabled && bevelSize > 0 && bevelThick > 0) {
      if (bevelSegments === 1) {
        // 45° Chamfer bevel
        return `M ${xLeft} ${yFaceTop} 
                L ${xRightEdge - bevelSize} ${yFaceTop} 
                L ${xRightEdge} ${yFaceTop + bevelThick} 
                L ${xRightEdge} ${yBottomSeat} 
                L ${xLeft} ${yBottomSeat} Z`;
      } else {
        // Rounded fillet / dome curve bevel
        return `M ${xLeft} ${yFaceTop} 
                L ${xRightEdge - bevelSize} ${yFaceTop} 
                Q ${xRightEdge} ${yFaceTop} ${xRightEdge} ${yFaceTop + bevelThick} 
                L ${xRightEdge} ${yBottomSeat} 
                L ${xLeft} ${yBottomSeat} Z`;
      }
    }

    return `M ${xLeft} ${yFaceTop} 
            L ${xRightEdge} ${yFaceTop} 
            L ${xRightEdge} ${yBottomSeat} 
            L ${xLeft} ${yBottomSeat} Z`;
  }

  toggleDiffuserBevel() {
    const current = this.store.settings().diffuserBevelEnabled ?? false;
    this.store.updateSettings({ diffuserBevelEnabled: !current });
  }

  setDiffuserBevelSegments(segments: number) {
    this.store.updateSettings({ diffuserBevelSegments: segments });
  }

  setSampleText(str: string) {
    this.store.updateSettings({ text: str, customHoles: [] });
  }

  setTextTransform(transform: 'none' | 'uppercase' | 'capitalize') {
    let text = this.store.settings().text;
    if (transform === 'uppercase') {
      text = text.toUpperCase();
    } else if (transform === 'capitalize') {
      text = text.replace(/\b\w/g, l => l.toUpperCase());
    }
    this.store.updateSettings({ textTransform: transform, text });
  }

  setTextAlign(textAlign: 'left' | 'center' | 'right') {
    this.store.updateSettings({ textAlign });
  }

  toggleArc() {
    const current = this.store.settings().arcEnabled;
    this.store.updateSettings({ arcEnabled: !current });
  }

  filamentMaterials = ['PLA', 'PETG', 'ABS', 'ASA'] as const;

  setFilamentMaterial(mat: string) {
    let density = 1.24;
    if (mat === 'PLA') density = 1.24;
    else if (mat === 'PETG') density = 1.27;
    else if (mat === 'ABS') density = 1.04;
    else if (mat === 'ASA') density = 1.07;
    this.store.updateSettings({ filamentType: mat as 'PLA' | 'PETG' | 'ABS' | 'ASA', filamentDensity: density });
  }

  updateText(event: Event) {
    const el = event.target as HTMLTextAreaElement | HTMLInputElement;
    let val = el.value;
    const transform = this.store.settings().textTransform;
    if (transform === 'uppercase') {
      val = val.toUpperCase();
    } else if (transform === 'capitalize') {
      val = val.replace(/\b\w/g, l => l.toUpperCase());
    }
    this.store.updateSettings({ text: val, customHoles: [] });
  }

  updateNumber(key: string, event: Event) {
    const el = event.target as HTMLInputElement;
    const value = Number(el.value);
    this.store.updateSettings({ [key]: value });
  }

  updateFaceMaterial(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.store.updateSettings({ faceMaterial: select.value as 'acrylic' | '3d-printed' });
  }

  updateColor(key: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.store.updateSettings({ [key]: input.value });
  }

  updateHiddenText(event: Event) {
    const input = event.target as HTMLInputElement;
    this.store.updateSettings({ curvedSignHiddenText: input.value });
  }

  setCurvedSignBaseStyle(styleId: string) {
    this.store.updateSettings({
      curvedSignBaseStyle: styleId as 'rounded-rect' | 'chamfered-rect' | 'pedestal' | 'minimal' | 'arc-curved'
    });
  }

  activateManualHoleMode() {
    this.store.updateSettings({
      interactionMode: 'add-hole',
      cameraType: 'orthographic'
    });
    this.store.updateLayer('acrylic', false);
    window.dispatchEvent(new CustomEvent('set-top-view'));
  }

  triggerAutoHoles() {
    this.store.updateSettings({
      cameraType: 'orthographic'
    });
    this.store.updateLayer('acrylic', false);
    window.dispatchEvent(new CustomEvent('generate-auto-holes'));
    window.dispatchEvent(new CustomEvent('set-top-view'));
  }

  updateAndTriggerHoles(key: keyof ProjectSettings, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      this.store.updateSettings({ [key]: value } as Partial<ProjectSettings>);
      this.triggerAutoHoles();
    }
  }

  setPattern(pattern: 'corners-center' | 'top-bottom' | 'corners' | 'grid-balanced') {
    this.store.updateSettings({ autoHolesPattern: pattern });
    this.triggerAutoHoles();
  }

  toggleWireHole() {
    const current = this.store.settings().autoHolesAddWireHole;
    this.store.updateSettings({ autoHolesAddWireHole: !current });
    this.triggerAutoHoles();
  }

  Math = Math;

  setMountingHoleType(type: 'keyhole' | 'round' | 'oval') {
    this.store.updateSettings({ mountingHoleType: type });
  }

  setKeyholeDirection(dir: number) {
    this.store.updateSettings({ keyholeDirection: dir });
  }

  setOvalRotation(dir: number) {
    this.store.updateSettings({ ovalRotation: dir });
  }

  setOvalCornerPreset(preset: 'sharp' | 'soft' | 'full') {
    const s = this.store.settings();
    const minDim = Math.min(s.ovalHoleWidth, s.ovalHoleHeight);
    let cr = 0;
    if (preset === 'sharp') cr = 0;
    else if (preset === 'soft') cr = parseFloat((minDim / 4).toFixed(2));
    else if (preset === 'full') cr = parseFloat((minDim / 2).toFixed(2));
    this.store.updateSettings({ ovalCornerRadius: cr });
  }

  updateHoleDiameter(event: Event) {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    if (!isNaN(val) && val > 0) {
      this.store.updateSettings({ holeRadius: val / 2 });
    }
  }

  updateParam(key: string, event: Event) {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    if (!isNaN(val)) {
      this.store.updateSettings({ [key]: val });
    }
  }

  updateHoleDiameterItem(index: number, event: Event) {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    if (!isNaN(val) && val > 0) {
      const holes = [...this.store.settings().customHoles];
      holes[index] = { ...holes[index], r: val / 2 };
      this.store.updateSettings({ customHoles: holes });
    }
  }

  updateHole(index: number, field: string, event: Event) {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    if (isNaN(val)) return;
    const holes = [...this.store.settings().customHoles];
    holes[index] = { ...holes[index], [field]: val };
    this.store.updateSettings({ customHoles: holes });
  }

  toggleHoleType(index: number) {
    const holes = [...this.store.settings().customHoles];
    const current = holes[index].type || this.store.settings().mountingHoleType || 'keyhole';
    const nextType: 'keyhole' | 'round' | 'oval' = 
      current === 'keyhole' ? 'round' : current === 'round' ? 'oval' : 'keyhole';
    holes[index] = { ...holes[index], type: nextType };
    this.store.updateSettings({ customHoles: holes });
  }

  removeHole(index: number) {
    const holes = [...this.store.settings().customHoles];
    holes.splice(index, 1);
    this.store.updateSettings({ customHoles: holes });
  }

  toggleBuildPlateFromButton() {
    this.store.updateSettings({ showBuildPlate: !this.store.settings().showBuildPlate });
  }

  toggleMoveLedMode() {
    const current = this.store.settings().interactionMode;
    this.store.updateSettings({
      interactionMode: current === 'move-led' ? 'view' : 'move-led',
      showWiringDiagram: true
    });
  }

  sampleSvgPresets = SAMPLE_SVG_PRESETS;

  selectSvgSource() {
    if (!this.store.settings().vectorData) {
      this.store.updateSettings({
        inputSource: 'svg',
        vectorData: DEFAULT_SIGN_SVG,
        customHoles: []
      });
    } else {
      this.store.updateSettings({ inputSource: 'svg' });
    }
  }

  loadSvgPreset(svg: string) {
    this.store.updateSettings({
      inputSource: 'svg',
      vectorData: svg,
      customHoles: []
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    const isDxf = file.name.toLowerCase().endsWith('.dxf');
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        let svgData = result;
        if (isDxf) {
          try {
            const helper = new Helper(result);
            svgData = helper.toSVG();
          } catch (err) {
            console.error('Error parsing DXF', err);
            return;
          }
        }
        this.store.updateSettings({ 
          vectorData: svgData,
          inputSource: 'svg',
          customHoles: []
        });
      }
    };
    
    reader.readAsText(file);
  }

  openTemplateModal() {
    this.store.openTemplateModal();
  }

  openFontModal() {
    this.store.openFontModal();
  }

  exportSnapshot() {
    window.dispatchEvent(new CustomEvent('export-snapshot'));
  }

  exportFormat = signal<'zip-letters' | 'zip-parts' | '3mf' | 'ascii-multisolid' | 'combined-stl'>('zip-letters');
  exportVectorFormat = signal<'combined' | 'zip-letters' | 'dxf'>('combined');

  exportSTL(format?: 'zip-letters' | 'zip-parts' | '3mf' | 'ascii-multisolid' | 'combined-stl') {
    const fmt = format || this.exportFormat();
    window.dispatchEvent(new CustomEvent('export-stl', { detail: { mode: 'all', format: fmt } }));
  }

  exportSTLBody(format?: 'zip-letters' | 'zip-parts' | '3mf' | 'ascii-multisolid' | 'combined-stl') {
    const fmt = format || this.exportFormat();
    window.dispatchEvent(new CustomEvent('export-stl', { detail: { mode: 'body', format: fmt } }));
  }

  exportSTLAcrylic(format?: 'zip-letters' | 'zip-parts' | '3mf' | 'ascii-multisolid' | 'combined-stl') {
    const fmt = format || this.exportFormat();
    window.dispatchEvent(new CustomEvent('export-stl', { detail: { mode: 'acrylic', format: fmt } }));
  }

  exportSTLBackplate(format?: 'zip-letters' | 'zip-parts' | '3mf' | 'ascii-multisolid' | 'combined-stl') {
    const fmt = format || this.exportFormat();
    window.dispatchEvent(new CustomEvent('export-stl', { detail: { mode: 'backplate', format: fmt } }));
  }
  
  exportSVGAcrylic(format?: 'combined' | 'zip-letters' | 'dxf') {
    const fmt = format || this.exportVectorFormat();
    window.dispatchEvent(new CustomEvent('export-svg-acrylic', { detail: { format: fmt } }));
  }
  
  exportSVGBase(format?: 'combined' | 'zip-letters' | 'dxf') {
    const fmt = format || this.exportVectorFormat();
    window.dispatchEvent(new CustomEvent('export-svg-base', { detail: { format: fmt } }));
  }

  exportSVGBackplate(format?: 'combined' | 'zip-letters' | 'dxf') {
    const fmt = format || this.exportVectorFormat();
    window.dispatchEvent(new CustomEvent('export-svg-backplate', { detail: { format: fmt } }));
  }

  isPreset(presetId: string): boolean {
    const w = this.store.settings().buildPlateWidth;
    const h = this.store.settings().buildPlateHeight;
    switch (presetId) {
      case 'bambu-h2d': return w === 350 && h === 320;
      case 'bambu-x1': return w === 256 && h === 256;
      case 'bambu-mini': return w === 180 && h === 180;
      case 'prusa-mk4': return w === 250 && h === 210;
      case 'standard-200': return w === 200 && h === 200;
      default: return false;
    }
  }

  isCustomPrinter(): boolean {
    return !['bambu-h2d', 'bambu-x1', 'bambu-mini', 'prusa-mk4', 'standard-200'].some(p => this.isPreset(p));
  }

  applyPrinterPreset(event: Event) {
    const select = event.target as HTMLSelectElement;
    switch (select.value) {
      case 'bambu-h2d': this.store.updateSettings({ buildPlateWidth: 350, buildPlateHeight: 320 }); break;
      case 'bambu-x1': this.store.updateSettings({ buildPlateWidth: 256, buildPlateHeight: 256 }); break;
      case 'bambu-mini': this.store.updateSettings({ buildPlateWidth: 180, buildPlateHeight: 180 }); break;
      case 'prusa-mk4': this.store.updateSettings({ buildPlateWidth: 250, buildPlateHeight: 210 }); break;
      case 'standard-200': this.store.updateSettings({ buildPlateWidth: 200, buildPlateHeight: 200 }); break;
    }
  }

  onKelvinSlider(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.store.setCCTKelvin(val);
  }

  setLensBeamAngle(angle: number) {
    this.store.updateSettings({ lensBeamAngle: angle });
  }

  setWireGauge(gauge: string) {
    this.store.updateSettings({ wireGaugeSelected: gauge as 'auto' | '18 AWG' | '16 AWG' | '14 AWG' | '12 AWG' });
  }

  exportElectricalSpecSheet() {
    const s = this.store.settings();
    const markdown = this.store.getElectricalSpecSheetMarkdown();

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${s.text.replace(/[^a-zA-Z0-9_-]/g, '_')}_LED_Electrical_Spec_Sheet.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  selectMountingPreset(type: MountingType, shape?: BackplateShape) {
    this.store.applyMountingPreset(type, shape);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('set-mounting-view', { detail: { angle: 'standoff-3d' } }));
    }
  }

  textCharacters = computed(() => {
    const text = this.store.settings().text || '';
    const result: { char: string; index: number }[] = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char !== ' ' && char !== '\n') {
        result.push({ char, index: i });
      }
    }
    return result;
  });

  hasCustomKerning = computed(() => {
    const map = this.store.settings().customKerning || {};
    return Object.values(map).some(v => v !== 0);
  });

  neonColorPresets = [
    { name: 'Electric Pink', hex: '#ff2d87' },
    { name: 'Neon Cyan', hex: '#00f0ff' },
    { name: 'Warm Gold', hex: '#ffbe0b' },
    { name: 'Acid Lime', hex: '#39ff14' },
    { name: 'Neon Purple', hex: '#bd00ff' },
    { name: 'Fire Red', hex: '#ff073a' },
    { name: 'Ice White', hex: '#f0f8ff' },
    { name: 'Sunset Orange', hex: '#ff5400' },
    { name: 'Mint Green', hex: '#05ffa1' },
    { name: 'Deep Blue', hex: '#0055ff' },
  ];

  }