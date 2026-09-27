import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AppStore, CustomHole } from './store';

export type PaperSizeKey = 'A4' | 'A3' | 'LETTER' | 'TABLOID' | 'PLOTTER';
export type OrientationKey = 'landscape' | 'portrait';

export interface PaperFormat {
  key: PaperSizeKey;
  name: string;
  widthMm: number;
  heightMm: number;
  unitLabel: string;
}

const PAPER_FORMATS: Record<PaperSizeKey, PaperFormat> = {
  A4: { key: 'A4', name: 'A4 Standard Paper', widthMm: 297, heightMm: 210, unitLabel: '210 × 297 mm' },
  A3: { key: 'A3', name: 'A3 Large Paper', widthMm: 420, heightMm: 297, unitLabel: '297 × 420 mm' },
  LETTER: { key: 'LETTER', name: 'US Letter Paper', widthMm: 279.4, heightMm: 215.9, unitLabel: '8.5 × 11 in' },
  TABLOID: { key: 'TABLOID', name: 'US Tabloid (11×17)', widthMm: 431.8, heightMm: 279.4, unitLabel: '11 × 17 in' },
  PLOTTER: { key: 'PLOTTER', name: 'Continuous Plotter Roll (1:1 Single Sheet)', widthMm: 1200, heightMm: 800, unitLabel: 'Full Scale 1:1' }
};

@Component({
  selector: 'app-installation-template-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-3 md:p-6 overflow-hidden animate-fade-in no-print">
      <!-- Modal Window Shell -->
      <div class="relative w-full max-w-7xl h-[92vh] bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        <!-- Top Header Bar -->
        <div class="px-6 py-4 bg-slate-50 dark:bg-[#0b0f17] border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <mat-icon class="scale-110">grid_on</mat-icon>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Printable 1:1 Scale Installation Template</h2>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  Exact 1:1 Size
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                1:1 Scale mounting pattern for drill holes, wire feeds, and letter alignment
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button (click)="printTemplate()" 
                    class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer">
              <mat-icon class="scale-90">print</mat-icon>
              <span>Print 1:1 Scale Pages</span>
            </button>

            <button (click)="downloadFullSVG()" 
                    class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer">
              <mat-icon class="scale-90 text-emerald-500">download</mat-icon>
              <span>Download 1:1 Vector SVG</span>
            </button>

            <div class="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

            <button (click)="closeModal()" 
                    class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        <!-- Main Content Area: Sidebar Controls + Interactive Tiling Layout -->
        <div class="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100/70 dark:bg-[#070a0f]">
          
          <!-- Left Control Panel -->
          <div class="w-full lg:w-80 p-5 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 overflow-y-auto space-y-5 shrink-0">
            
            <!-- Paper Size Selection -->
            <div class="space-y-2">
              <span class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Paper Size
              </span>
              <div class="grid grid-cols-2 gap-2">
                @for (fmt of paperFormatList; track fmt.key) {
                  <button (click)="selectedPaperKey.set(fmt.key)"
                          [class.bg-blue-600]="selectedPaperKey() === fmt.key"
                          [class.text-white]="selectedPaperKey() === fmt.key"
                          [class.bg-slate-50]="selectedPaperKey() !== fmt.key"
                          [class.dark:bg-slate-800]="selectedPaperKey() !== fmt.key"
                          [class.text-slate-700]="selectedPaperKey() !== fmt.key"
                          [class.dark:text-slate-300]="selectedPaperKey() !== fmt.key"
                          class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-left transition-all cursor-pointer hover:border-blue-500">
                    <span class="block text-xs font-bold">{{ fmt.key }}</span>
                    <span class="text-[10px] opacity-80 block truncate">{{ fmt.unitLabel }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Page Orientation -->
            @if (selectedPaperKey() !== 'PLOTTER') {
              <div class="space-y-2">
                <span class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Page Orientation
                </span>
                <div class="grid grid-cols-2 gap-2">
                  <button (click)="orientation.set('landscape')"
                          [class.bg-blue-600]="orientation() === 'landscape'"
                          [class.text-white]="orientation() === 'landscape'"
                          [class.bg-slate-50]="orientation() !== 'landscape'"
                          [class.dark:bg-slate-800]="orientation() !== 'landscape'"
                          class="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                    <mat-icon class="scale-75">crop_landscape</mat-icon>
                    <span>Landscape</span>
                  </button>
                  <button (click)="orientation.set('portrait')"
                          [class.bg-blue-600]="orientation() === 'portrait'"
                          [class.text-white]="orientation() === 'portrait'"
                          [class.bg-slate-50]="orientation() !== 'portrait'"
                          [class.dark:bg-slate-800]="orientation() !== 'portrait'"
                          class="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                    <mat-icon class="scale-75">crop_portrait</mat-icon>
                    <span>Portrait</span>
                  </button>
                </div>
              </div>
            }

            <!-- Tiling Calculator Summary Box -->
            <div class="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-blue-900 dark:text-blue-300">Total Printable Tiled Pages</span>
                <span class="px-2 py-0.5 rounded-lg bg-blue-600 text-white text-xs font-black">
                  {{ gridCalculation().totalPages }} {{ gridCalculation().totalPages === 1 ? 'Sheet' : 'Sheets' }}
                </span>
              </div>
              <div class="text-[11px] text-blue-800/80 dark:text-blue-300/80 space-y-1">
                <p>Grid Layout: <strong class="font-bold">{{ gridCalculation().cols }} Cols × {{ gridCalculation().rows }} Rows</strong></p>
                <p>Sign Dimensions: <strong class="font-bold">{{ signWidthMm() }}mm × {{ signHeightMm() }}mm</strong></p>
                <p>Tiling Overlap Margin: <strong class="font-bold">15mm (for seamless taping)</strong></p>
              </div>
            </div>

            <!-- Layer & Guide Visibility Toggles -->
            <div class="space-y-3 pt-2">
              <span class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Template Layers & Guides
              </span>

              <div class="space-y-2 text-xs">
                <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 cursor-pointer">
                  <span class="font-medium text-slate-700 dark:text-slate-200">Letter Cut Outlines</span>
                  <input type="checkbox" [checked]="showOutlines()" (change)="showOutlines.set(!showOutlines())" class="rounded accent-blue-600 w-4 h-4">
                </label>

                <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 cursor-pointer">
                  <span class="font-medium text-slate-700 dark:text-slate-200">Mounting Screw Holes (⊕)</span>
                  <input type="checkbox" [checked]="showHoles()" (change)="showHoles.set(!showHoles())" class="rounded accent-blue-600 w-4 h-4">
                </label>

                <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 cursor-pointer">
                  <span class="font-medium text-slate-700 dark:text-slate-200">Wire Feed Holes (⚡)</span>
                  <input type="checkbox" [checked]="showWireHoles()" (change)="showWireHoles.set(!showWireHoles())" class="rounded accent-blue-600 w-4 h-4">
                </label>

                <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 cursor-pointer">
                  <span class="font-medium text-slate-700 dark:text-slate-200">LED Layout Centerline Guides</span>
                  <input type="checkbox" [checked]="showLEDGuides()" (change)="showLEDGuides.set(!showLEDGuides())" class="rounded accent-blue-600 w-4 h-4">
                </label>

                <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 cursor-pointer">
                  <span class="font-medium text-slate-700 dark:text-slate-200">LED Module Placements</span>
                  <input type="checkbox" [checked]="showLEDModules()" (change)="showLEDModules.set(!showLEDModules())" class="rounded accent-blue-600 w-4 h-4">
                </label>

                <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 cursor-pointer">
                  <span class="font-medium text-slate-700 dark:text-slate-200">Spirit Level Horizon Line</span>
                  <input type="checkbox" [checked]="showHorizonLine()" (change)="showHorizonLine.set(!showHorizonLine())" class="rounded accent-blue-600 w-4 h-4">
                </label>

                <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 cursor-pointer">
                  <span class="font-medium text-slate-700 dark:text-slate-200">Dimension Callouts (Width/Height)</span>
                  <input type="checkbox" [checked]="showDimensions()" (change)="showDimensions.set(!showDimensions())" class="rounded accent-blue-600 w-4 h-4">
                </label>

                <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 cursor-pointer">
                  <span class="font-medium text-slate-700 dark:text-slate-200">100mm Scale Verification Ruler</span>
                  <input type="checkbox" [checked]="showCheckRuler()" (change)="showCheckRuler.set(!showCheckRuler())" class="rounded accent-blue-600 w-4 h-4">
                </label>
              </div>
            </div>

            <!-- Print Scale Notice -->
            <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <div class="flex items-center gap-1.5 font-bold">
                <mat-icon class="scale-75 text-amber-600">warning</mat-icon>
                <span>Important Printer Setting</span>
              </div>
              <p>When printing, set your printer dialog to <strong>Scale: 100%</strong> or <strong>Actual Size</strong>. Do NOT select "Fit to Printable Area".</p>
            </div>
          </div>

          <!-- Right Interactive Preview & Canvas Canvas -->
          <div class="flex-1 p-6 overflow-auto flex flex-col items-center justify-start bg-slate-200/60 dark:bg-[#070a0f]">
            
            <!-- Tiled Pages Container Preview -->
            <div class="w-full max-w-5xl space-y-6">
              
              <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold bg-white/60 dark:bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div class="flex items-center gap-2">
                  <mat-icon class="scale-75 text-blue-500">aspect_ratio</mat-icon>
                  <span>1:1 Installation Layout Visualizer</span>
                </div>
                <span>Showing {{ pagesList().length }} Tiled Printable Pages</span>
              </div>

              <!-- Pages Grid Rendering -->
              <div class="grid gap-6 justify-center"
                   [style.grid-template-columns]="'repeat(' + gridCalculation().cols + ', minmax(0, 1fr))'">
                
                @for (page of pagesList(); track page.id) {
                  <div class="bg-white text-slate-900 p-4 rounded-xl shadow-xl border-2 border-slate-300 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden transition-transform hover:scale-[1.01]"
                       [style.aspect-ratio]="effectivePageWidthMm() + ' / ' + effectivePageHeightMm()">
                    
                    <!-- Tile Page Identifier Tag -->
                    <div class="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-slate-900 text-white text-[9px] font-mono font-bold tracking-tight shadow">
                      ROW {{ page.row + 1 }}, COL {{ page.col + 1 }} (PAGE {{ page.pageIndex + 1 }} OF {{ pagesList().length }})
                    </div>

                    <!-- Alignment Registration Crosshairs at Corners -->
                    <div class="absolute top-1 left-1 text-[10px] text-slate-400 font-bold">+</div>
                    <div class="absolute top-1 right-1 text-[10px] text-slate-400 font-bold">+</div>
                    <div class="absolute bottom-1 left-1 text-[10px] text-slate-400 font-bold">+</div>
                    <div class="absolute bottom-1 right-1 text-[10px] text-slate-400 font-bold">+</div>

                    <!-- SVG Render for this Page Tile -->
                    <div class="w-full h-full flex items-center justify-center relative">
                      <svg [attr.viewBox]="page.viewBox" 
                           class="w-full h-full overflow-visible" 
                           xmlns="http://www.w3.org/2000/svg">
                        
                        <!-- Grid Background Guide -->
                        <defs>
                          <pattern id="grid-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" stroke-width="0.5" />
                          </pattern>
                        </defs>
                        <rect [attr.x]="page.bounds.minX" [attr.y]="page.bounds.minY" [attr.width]="page.bounds.width" [attr.height]="page.bounds.height" fill="url(#grid-pattern)" opacity="0.3" />

                        <!-- Horizon Spirit Level Line -->
                        @if (showHorizonLine()) {
                          <line [attr.x1]="signMinX() - 40" [attr.y1]="horizonY()" [attr.x2]="signMaxX() + 40" [attr.y2]="horizonY()"
                                stroke="#3b82f6" stroke-width="0.8" stroke-dasharray="4,3" />
                          <text [attr.x]="(signMinX() + signMaxX()) / 2" [attr.y]="horizonY() - 4" 
                                text-anchor="middle" font-size="6" font-family="sans-serif" font-weight="bold" fill="#2563eb">
                            ▲ MOUNTING SPIRIT LEVEL HORIZON LINE ▲
                          </text>
                        }

                        <!-- Letter Outlines -->
                        @if (showOutlines()) {
                          <path [attr.d]="letterPathData()" fill="none" stroke="#0f172a" stroke-width="0.8" />
                        }

                        <!-- LED Centerline Guides -->
                        @if (showLEDGuides()) {
                          <path [attr.d]="ledGuidePathData()" fill="none" stroke="#38bdf8" stroke-width="0.6" stroke-dasharray="2,2" />
                        }

                        <!-- LED Modules -->
                        @if (showLEDModules()) {
                          @for (led of ledModuleCoordinates(); track $index) {
                            <g [attr.transform]="'translate(' + led.x + ',' + led.y + ')'">
                              <!-- standard 8x12mm LED chip roughly translated to visual coords -->
                              <rect x="-4" y="-6" width="8" height="12" fill="none" stroke="#f59e0b" stroke-width="0.6" />
                              <circle r="1.5" fill="#f59e0b" />
                            </g>
                          }
                        }

                        <!-- Mounting Screw Holes -->
                        @if (showHoles()) {
                          @for (hole of holeCoordinates(); track $index) {
                            @let holeType = hole.type ?? store.settings().mountingHoleType;
                            <g [attr.transform]="'translate(' + hole.x + ',' + hole.y + ')'">
                              @if (holeType === 'keyhole') {
                                <path [attr.d]="getKeyholePath(hole)" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" stroke-width="0.8" />
                                <line x1="-3" y1="0" x2="3" y2="0" stroke="#ef4444" stroke-width="0.5" stroke-dasharray="1 1" />
                                <line x1="0" y1="-3" x2="0" y2="3" stroke="#ef4444" stroke-width="0.5" stroke-dasharray="1 1" />
                                <text x="0" [attr.y]="-(hole.r || 4) - 2" text-anchor="middle" font-size="2.6" font-family="sans-serif" font-weight="bold" fill="#dc2626">
                                  🔑 KEYHOLE Ø{{ (hole.r || 4) * 2 }}mm
                                </text>
                              } @else if (holeType === 'oval') {
                                <path [attr.d]="getOvalPath(hole)" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" stroke-width="0.8" />
                                <line x1="-3" y1="0" x2="3" y2="0" stroke="#ef4444" stroke-width="0.5" stroke-dasharray="1 1" />
                                <line x1="0" y1="-3" x2="0" y2="3" stroke="#ef4444" stroke-width="0.5" stroke-dasharray="1 1" />
                                <text x="0" [attr.y]="-((hole.height || store.settings().ovalHoleHeight) / 2) - 2" text-anchor="middle" font-size="2.6" font-family="sans-serif" font-weight="bold" fill="#dc2626">
                                  ⬭ OVAL {{ hole.width || store.settings().ovalHoleWidth }}x{{ hole.height || store.settings().ovalHoleHeight }}mm
                                </text>
                              } @else {
                                <circle [attr.r]="hole.r || 2" fill="none" stroke="#ef4444" stroke-width="0.8" />
                                <line x1="-3" y1="0" x2="3" y2="0" stroke="#ef4444" stroke-width="0.5" />
                                <line x1="0" y1="-3" x2="0" y2="3" stroke="#ef4444" stroke-width="0.5" />
                                <text x="0" [attr.y]="(hole.r || 2) + 3.5" text-anchor="middle" font-size="2.8" font-family="sans-serif" font-weight="bold" fill="#dc2626">
                                  ⊕ Ø{{ (hole.r || 2) * 2 }}mm
                                </text>
                              }
                            </g>
                          }
                        }

                        <!-- Wire Feed Passthrough Holes -->
                        @if (showWireHoles()) {
                          @for (grommet of grommetCoordinates(); track $index) {
                            <g [attr.transform]="'translate(' + grommet.x + ',' + grommet.y + ')'">
                              <circle r="3.5" fill="none" stroke="#0284c7" stroke-width="1.0" />
                              <circle r="1" fill="#0284c7" />
                              <text x="0" y="7" text-anchor="middle" font-size="3" font-family="sans-serif" font-weight="bold" fill="#0369a1">
                                ⚡ Ø8mm Wire
                              </text>
                            </g>
                          }
                        }

                        <!-- Overall Dimension Callouts -->
                        @if (showDimensions()) {
                          <g stroke="#64748b" stroke-width="0.5">
                            <!-- Bottom Width Arrow -->
                            <line [attr.x1]="signMinX()" [attr.y1]="signMaxY() + 15" [attr.x2]="signMaxX()" [attr.y2]="signMaxY() + 15" />
                            <text [attr.x]="(signMinX() + signMaxX()) / 2" [attr.y]="signMaxY() + 20" 
                                  text-anchor="middle" font-size="5" font-family="sans-serif" font-weight="bold" fill="#475569">
                              ↔ TOTAL WIDTH: {{ signWidthMm() }} mm ({{ (signWidthMm() / 25.4).toFixed(1) }} in)
                            </text>
                          </g>
                        }

                        <!-- 100mm Scale Calibration Check Ruler -->
                        @if (showCheckRuler()) {
                          <g [attr.transform]="'translate(' + (page.bounds.minX + 15) + ',' + (page.bounds.maxY - 18) + ')'">
                            <rect x="0" y="0" width="100" height="10" fill="#f8fafc" stroke="#0f172a" stroke-width="0.5" />
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#0f172a" stroke-width="1" />
                            <line x1="25" y1="0" x2="25" y2="6" stroke="#0f172a" stroke-width="0.5" />
                            <line x1="50" y1="0" x2="50" y2="10" stroke="#0f172a" stroke-width="1" />
                            <line x1="75" y1="0" x2="75" y2="6" stroke="#0f172a" stroke-width="0.5" />
                            <line x1="100" y1="0" x2="100" y2="10" stroke="#0f172a" stroke-width="1" />
                            <text x="50" y="15" text-anchor="middle" font-size="3" font-family="sans-serif" font-weight="bold" fill="#0f172a">
                              PHYSICAL CHECK RULER: EXACTLY 100 MM (10.0 CM)
                            </text>
                          </g>
                        }
                      </svg>
                    </div>

                    <!-- Bottom Page Information Bar -->
                    <div class="mt-2 pt-1 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500 font-mono">
                      <span>PROJECT: {{ store.settings().text || 'SIGN' }}</span>
                      <span>SCALE 1:1 ACTUAL SIZE</span>
                      <span>100% NO SCALING</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden Printable Output Layer for Browser Print -->
    <div #printContainer class="printable-template-container hidden print:block">
      @for (page of pagesList(); track page.id) {
        <div class="print-page flex flex-col justify-between p-8 bg-white text-black h-screen w-screen box-border page-break-after-always">
          <!-- Printable Sheet Header -->
          <div class="flex items-center justify-between border-b-2 border-black pb-2 text-xs font-mono font-bold">
            <div>
              <span class="block text-sm">MCUT STUDIO — 1:1 INSTALLATION TEMPLATE</span>
              <span>PROJECT: {{ store.settings().text || 'SIGN' }} | STYLE: {{ store.settings().style.toUpperCase() }}</span>
            </div>
            <div class="text-right">
              <span class="block text-sm">TILE PAGE {{ page.pageIndex + 1 }} OF {{ pagesList().length }}</span>
              <span>ROW {{ page.row + 1 }}, COL {{ page.col + 1 }} | SCALE: 1:1 (100% ACTUAL SIZE)</span>
            </div>
          </div>

          <!-- Exact 1:1 Scale Vector Graphic -->
          <div class="flex-1 my-4 flex items-center justify-center overflow-hidden">
            <svg [attr.viewBox]="page.viewBox" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              @if (showHorizonLine()) {
                <line [attr.x1]="signMinX() - 40" [attr.y1]="horizonY()" [attr.x2]="signMaxX() + 40" [attr.y2]="horizonY()" stroke="black" stroke-width="0.8" stroke-dasharray="4,3" />
              }
              @if (showOutlines()) {
                <path [attr.d]="letterPathData()" fill="none" stroke="black" stroke-width="0.8" />
              }
              @if (showLEDGuides()) {
                <path [attr.d]="ledGuidePathData()" fill="none" stroke="gray" stroke-width="0.6" stroke-dasharray="2,2" />
              }
              @if (showLEDModules()) {
                @for (led of ledModuleCoordinates(); track $index) {
                  <g [attr.transform]="'translate(' + led.x + ',' + led.y + ')'">
                    <rect x="-4" y="-6" width="8" height="12" fill="none" stroke="black" stroke-width="0.6" stroke-dasharray="1,1" />
                    <circle r="1" fill="black" />
                  </g>
                }
              }
              @if (showHoles()) {
                @for (hole of holeCoordinates(); track $index) {
                  <g [attr.transform]="'translate(' + hole.x + ',' + hole.y + ')'">
                    <circle r="2" fill="none" stroke="black" stroke-width="0.8" />
                    <line x1="-3" y1="0" x2="3" y2="0" stroke="black" stroke-width="0.5" />
                    <line x1="0" y1="-3" x2="0" y2="3" stroke="black" stroke-width="0.5" />
                  </g>
                }
              }
              @if (showWireHoles()) {
                @for (grommet of grommetCoordinates(); track $index) {
                  <g [attr.transform]="'translate(' + grommet.x + ',' + grommet.y + ')'">
                    <circle r="3.5" fill="none" stroke="black" stroke-width="1.0" />
                    <circle r="1" fill="black" />
                  </g>
                }
              }
              @if (showCheckRuler()) {
                <g [attr.transform]="'translate(' + (page.bounds.minX + 15) + ',' + (page.bounds.maxY - 18) + ')'">
                  <rect x="0" y="0" width="100" height="10" fill="none" stroke="black" stroke-width="0.8" />
                  <line x1="0" y1="0" x2="0" y2="10" stroke="black" stroke-width="1" />
                  <line x1="50" y1="0" x2="50" y2="10" stroke="black" stroke-width="1" />
                  <line x1="100" y1="0" x2="100" y2="10" stroke="black" stroke-width="1" />
                  <text x="50" y="15" text-anchor="middle" font-size="3" font-family="sans-serif" font-weight="bold" fill="black">
                    100MM VERIFICATION RULER (MUST EQUAL EXACTLY 10.0 CM)
                  </text>
                </g>
              }
            </svg>
          </div>

          <!-- Printable Sheet Footer -->
          <div class="border-t border-black pt-2 flex items-center justify-between text-[9px] font-mono">
            <span>DO NOT FIT TO PAGE — PRINT AT 100% SCALE</span>
            <span>ELECTRICAL: {{ electricalSummary().recommendedPsuWatts }}W PSU ({{ electricalSummary().voltage }}V {{ store.settings().voltageSystem }})</span>
            <span>MCUT STUDIO AUTOMATIC SIGNAGE TEMPLATE</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @media print {
      body * {
        visibility: hidden;
      }
      .printable-template-container, .printable-template-container * {
        visibility: visible;
      }
      .printable-template-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      .print-page {
        page-break-after: always;
        break-after: page;
        height: 100vh;
      }
    }
  `]
})
export class InstallationTemplateModalComponent implements OnInit, OnDestroy {
  store = inject(AppStore);

  @ViewChild('printContainer') printContainer!: ElementRef<HTMLDivElement>;

  selectedPaperKey = signal<PaperSizeKey>('A4');
  orientation = signal<OrientationKey>('landscape');

  showOutlines = signal<boolean>(true);
  showHoles = signal<boolean>(true);
  showWireHoles = signal<boolean>(true);
  showLEDGuides = signal<boolean>(true);
  showLEDModules = signal<boolean>(true);
  showHorizonLine = signal<boolean>(true);
  showDimensions = signal<boolean>(true);
  showCheckRuler = signal<boolean>(true);

  paperFormatList = Object.values(PAPER_FORMATS);

  // Geometry Signals
  letterPathData = signal<string>('');
  ledGuidePathData = signal<string>('');
  holeCoordinates = signal<CustomHole[]>([]);
  grommetCoordinates = signal<{ x: number; y: number }[]>([]);
  ledModuleCoordinates = signal<{ x: number; y: number }[]>([]);

  signMinX = signal<number>(-200);
  signMaxX = signal<number>(200);
  signMinY = signal<number>(-100);
  signMaxY = signal<number>(100);

  holeRadiusMm = computed(() => this.store.settings().holeRadius || 2);

  electricalSummary = computed(() => this.store.getElectricalSummary());

  signWidthMm = computed(() => Math.round(this.signMaxX() - this.signMinX()));
  signHeightMm = computed(() => Math.round(this.signMaxY() - this.signMinY()));
  horizonY = computed(() => this.signMaxY() + 10);

  paperFormat = computed(() => PAPER_FORMATS[this.selectedPaperKey()]);

  effectivePageWidthMm = computed(() => {
    const fmt = this.paperFormat();
    if (this.selectedPaperKey() === 'PLOTTER') {
      return Math.max(fmt.widthMm, this.signWidthMm() + 60);
    }
    return this.orientation() === 'landscape' ? Math.max(fmt.widthMm, fmt.heightMm) : Math.min(fmt.widthMm, fmt.heightMm);
  });

  effectivePageHeightMm = computed(() => {
    const fmt = this.paperFormat();
    if (this.selectedPaperKey() === 'PLOTTER') {
      return Math.max(fmt.heightMm, this.signHeightMm() + 60);
    }
    return this.orientation() === 'landscape' ? Math.min(fmt.widthMm, fmt.heightMm) : Math.max(fmt.widthMm, fmt.heightMm);
  });

  // Tiling calculation engine
  gridCalculation = computed(() => {
    const pageW = this.effectivePageWidthMm();
    const pageH = this.effectivePageHeightMm();

    const margin = 10;
    const overlap = 15;

    const printableTileW = Math.max(50, pageW - 2 * margin - overlap);
    const printableTileH = Math.max(50, pageH - 2 * margin - overlap);

    const sWidth = Math.max(100, this.signWidthMm() + 30);
    const sHeight = Math.max(50, this.signHeightMm() + 30);

    const cols = Math.max(1, Math.ceil(sWidth / printableTileW));
    const rows = Math.max(1, Math.ceil(sHeight / printableTileH));

    return {
      cols,
      rows,
      totalPages: cols * rows,
      printableTileW,
      printableTileH,
      margin,
      overlap
    };
  });

  pagesList = computed(() => {
    const calc = this.gridCalculation();
    const minX = this.signMinX() - 15;
    const minY = this.signMinY() - 15;

    const pages: {
      id: string;
      pageIndex: number;
      row: number;
      col: number;
      bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
      viewBox: string;
    }[] = [];

    let index = 0;
    for (let r = 0; r < calc.rows; r++) {
      for (let c = 0; c < calc.cols; c++) {
        const tileMinX = minX + c * calc.printableTileW;
        const tileMinY = minY + r * calc.printableTileH;
        const tileW = calc.printableTileW + calc.overlap + 2 * calc.margin;
        const tileH = calc.printableTileH + calc.overlap + 2 * calc.margin;

        pages.push({
          id: `page-${r}-${c}`,
          pageIndex: index++,
          row: r,
          col: c,
          bounds: {
            minX: tileMinX,
            minY: tileMinY,
            maxX: tileMinX + tileW,
            maxY: tileMinY + tileH,
            width: tileW,
            height: tileH
          },
          viewBox: `${tileMinX} ${tileMinY} ${tileW} ${tileH}`
        });
      }
    }

    return pages;
  });

  private templateDataListener = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail) {
      const d = customEvent.detail;
      if (d.letterPath) this.letterPathData.set(d.letterPath);
      if (d.ledGuidePath) this.ledGuidePathData.set(d.ledGuidePath);
      if (d.holes) this.holeCoordinates.set(d.holes);
      if (d.grommets) this.grommetCoordinates.set(d.grommets);
      if (d.ledModules) this.ledModuleCoordinates.set(d.ledModules);
      if (d.bounds) {
        this.signMinX.set(d.bounds.minX);
        this.signMaxX.set(d.bounds.maxX);
        this.signMinY.set(d.bounds.minY);
        this.signMaxY.set(d.bounds.maxY);
      }
    }
  };

  ngOnInit() {
    window.addEventListener('installation-template-data', this.templateDataListener);
    // Request geometry snapshot from Viewport 3D
    window.dispatchEvent(new CustomEvent('request-template-data'));
  }

  ngOnDestroy() {
    window.removeEventListener('installation-template-data', this.templateDataListener);
  }

  closeModal() {
    this.store.closeTemplateModal();
  }

  printTemplate() {
    window.print();
  }

  downloadFullSVG() {
    const minX = this.signMinX() - 30;
    const minY = this.signMinY() - 30;
    const width = this.signWidthMm() + 60;
    const height = this.signHeightMm() + 60;

    let holesSvg = '';
    if (this.showHoles()) {
      this.holeCoordinates().forEach(h => {
        holesSvg += `<circle cx="${h.x}" cy="${h.y}" r="${this.holeRadiusMm()}" fill="none" stroke="red" stroke-width="0.5"/>
        <line x1="${h.x - 3}" y1="${h.y}" x2="${h.x + 3}" y2="${h.y}" stroke="red" stroke-width="0.3"/>
        <line x1="${h.x}" y1="${h.y - 3}" x2="${h.x}" y2="${h.y + 3}" stroke="red" stroke-width="0.3"/>`;
      });
    }

    let ledsSvg = '';
    if (this.showLEDModules()) {
      this.ledModuleCoordinates().forEach(led => {
        ledsSvg += `<rect x="${led.x - 4}" y="${led.y - 6}" width="8" height="12" fill="none" stroke="orange" stroke-width="0.6"/>
        <circle cx="${led.x}" cy="${led.y}" r="1.5" fill="orange"/>`;
      });
    }

    let wireSvg = '';
    if (this.showWireHoles()) {
      this.grommetCoordinates().forEach(g => {
        wireSvg += `<circle cx="${g.x}" cy="${g.y}" r="4" fill="none" stroke="blue" stroke-width="0.8"/>`;
      });
    }

    const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg viewBox="${minX} ${minY} ${width} ${height}" width="${width}mm" height="${height}mm" xmlns="http://www.w3.org/2000/svg">
  <style>
    .outline { fill: none; stroke: #0f172a; stroke-width: 0.8; }
    .led-guide { fill: none; stroke: #0284c7; stroke-width: 0.5; stroke-dasharray: 2,2; }
    .horizon { stroke: #2563eb; stroke-width: 0.8; stroke-dasharray: 4,3; }
    .label { font-family: sans-serif; font-size: 5px; font-weight: bold; fill: #1e293b; }
  </style>

  <!-- Spirit Horizon Line -->
  <line x1="${minX}" y1="${this.horizonY()}" x2="${minX + width}" y2="${this.horizonY()}" class="horizon" />
  <text x="${minX + width / 2}" y="${this.horizonY() - 4}" text-anchor="middle" class="label">▲ MOUNTING SPIRIT LEVEL HORIZON LINE ▲</text>

  <!-- Letter Outlines -->
  <path d="${this.letterPathData()}" class="outline" />

  <!-- LED Guides -->
  <path d="${this.ledGuidePathData()}" class="led-guide" />

  <!-- LED Modules -->
  ${ledsSvg}

  <!-- Mounting Screw Holes -->
  ${holesSvg}

  <!-- Cable Grommets -->
  ${wireSvg}

  <!-- 100mm Scale Calibration Ruler -->
  <g transform="translate(${minX + 15}, ${minY + height - 20})">
    <rect x="0" y="0" width="100" height="10" fill="#f8fafc" stroke="#0f172a" stroke-width="0.5"/>
    <line x1="0" y1="0" x2="0" y2="10" stroke="black" stroke-width="1"/>
    <line x1="50" y1="0" x2="50" y2="10" stroke="black" stroke-width="1"/>
    <line x1="100" y1="0" x2="100" y2="10" stroke="black" stroke-width="1"/>
    <text x="50" y="15" text-anchor="middle" class="label">100MM PHYSICAL CHECK RULER (1:1 SCALE)</text>
  </g>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = `mcut-${this.store.settings().text || 'sign'}-1to1-template.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getKeyholePath(hole: CustomHole): string {
    const R = Math.max(1, hole.r ?? this.store.settings().holeRadius);
    const W = Math.max(1, Math.min(R * 1.9, hole.slotWidth ?? this.store.settings().keyholeSlotWidth ?? 4));
    const w = W / 2;
    const H = Math.max(R + w + 1, hole.slotHeight ?? this.store.settings().keyholeSlotHeight ?? 10);
    const rotDeg = hole.rotation ?? this.store.settings().keyholeDirection ?? 0;
    const rotRad = (rotDeg * Math.PI) / 180;
    const cos = Math.cos(rotRad);
    const sin = Math.sin(rotRad);

    const yIntersect = Math.sqrt(Math.max(0.01, R * R - w * w));
    const alpha1 = Math.atan2(yIntersect, w);
    const alpha2 = Math.PI - alpha1;

    // Local coordinates: In SVG template, +Y is DOWN. So pointing up means negative Y in SVG coords
    const pts: { x: number; y: number }[] = [];
    pts.push({ x: w, y: -yIntersect });
    pts.push({ x: w, y: -(H - w) });

    const numCap = 8;
    for (let i = 1; i < numCap; i++) {
      const a = (i / numCap) * Math.PI;
      pts.push({ x: Math.cos(a) * w, y: -(H - w) - Math.sin(a) * w });
    }
    pts.push({ x: -w, y: -(H - w) });
    pts.push({ x: -w, y: -yIntersect });

    const numCircle = 16;
    const sweepStart = alpha2;
    const sweepEnd = alpha1 + 2 * Math.PI;
    for (let i = 0; i <= numCircle; i++) {
      const a = sweepStart + (i / numCircle) * (sweepEnd - sweepStart);
      pts.push({ x: Math.cos(a) * R, y: -Math.sin(a) * R });
    }

    const transformed = pts.map(p => ({
      x: (p.x * cos - p.y * sin).toFixed(2),
      y: (p.x * sin + p.y * cos).toFixed(2)
    }));

    return `M ${transformed[0].x} ${transformed[0].y} ` +
      transformed.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
  }

  getOvalPath(hole: CustomHole): string {
    const W = Math.max(1, hole.width ?? this.store.settings().ovalHoleWidth ?? 10);
    const H = Math.max(1, hole.height ?? this.store.settings().ovalHoleHeight ?? 20);
    const maxCR = Math.min(W, H) / 2;
    const configuredCR = hole.cornerRadius !== undefined ? hole.cornerRadius : (this.store.settings().ovalCornerRadius ?? maxCR);
    const CR = Math.max(0, Math.min(maxCR, configuredCR));
    const rotDeg = hole.rotation ?? this.store.settings().ovalRotation ?? 0;
    const rotRad = (rotDeg * Math.PI) / 180;
    const cos = Math.cos(rotRad);
    const sin = Math.sin(rotRad);

    const hw = W / 2;
    const hh = H / 2;
    const pts: { x: number; y: number }[] = [];

    if (CR < 0.05) {
      pts.push({ x: hw, y: hh });
      pts.push({ x: -hw, y: hh });
      pts.push({ x: -hw, y: -hh });
      pts.push({ x: hw, y: -hh });
    } else {
      const numSteps = 6;
      // Top-Right
      for (let i = 0; i <= numSteps; i++) {
        const a = (i / numSteps) * (Math.PI / 2);
        pts.push({ x: (hw - CR) + Math.cos(a) * CR, y: (hh - CR) + Math.sin(a) * CR });
      }
      // Top-Left
      for (let i = 0; i <= numSteps; i++) {
        const a = Math.PI / 2 + (i / numSteps) * (Math.PI / 2);
        pts.push({ x: (-hw + CR) + Math.cos(a) * CR, y: (hh - CR) + Math.sin(a) * CR });
      }
      // Bottom-Left
      for (let i = 0; i <= numSteps; i++) {
        const a = Math.PI + (i / numSteps) * (Math.PI / 2);
        pts.push({ x: (-hw + CR) + Math.cos(a) * CR, y: (-hh + CR) + Math.sin(a) * CR });
      }
      // Bottom-Right
      for (let i = 0; i <= numSteps; i++) {
        const a = 3 * Math.PI / 2 + (i / numSteps) * (Math.PI / 2);
        pts.push({ x: (hw - CR) + Math.cos(a) * CR, y: (-hh + CR) + Math.sin(a) * CR });
      }
    }

    const transformed = pts.map(p => ({
      x: (p.x * cos - p.y * sin).toFixed(2),
      y: (p.x * sin + p.y * cos).toFixed(2)
    }));

    return `M ${transformed[0].x} ${transformed[0].y} ` +
      transformed.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
  }
}
