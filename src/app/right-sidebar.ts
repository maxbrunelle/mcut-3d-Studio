import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AppStore } from './store';

@Component({
  selector: 'app-right-sidebar',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 shadow-xl text-xs select-none transition-all space-y-4">
      
      <!-- CAD Telemetry Panel -->
      <div>
        <div class="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/40 dark:border-slate-800/40">
          <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[10px]">
            <mat-icon class="scale-75 text-blue-600 dark:text-blue-500">analytics</mat-icon>
            <span>CAD TELEMETRY</span>
          </div>
          <span class="font-mono text-[10px] bg-slate-100/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50">1:1 SCALE</span>
        </div>

        <!-- Dimensions Axis Cards -->
        <div class="grid grid-cols-3 gap-2 mb-3">
          <!-- Width (X) -->
          <div class="bg-white/50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/30 shadow-sm backdrop-blur-sm">
            <div class="flex items-center gap-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 mb-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm"></span>
              <span>WIDTH (X)</span>
            </div>
            <div class="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
              {{ store.estimatedWidth() | number:'1.0-1' }}<span class="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-0.5">mm</span>
            </div>
          </div>

          <!-- Height (Y) -->
          <div class="bg-white/50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/30 shadow-sm backdrop-blur-sm">
            <div class="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm"></span>
              <span>HEIGHT (Y)</span>
            </div>
            <div class="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
              {{ store.estimatedHeight() | number:'1.0-1' }}<span class="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-0.5">mm</span>
            </div>
          </div>

          <!-- Depth (Z) -->
          <div class="bg-white/50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/30 shadow-sm backdrop-blur-sm">
            <div class="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm"></span>
              <span>DEPTH (Z)</span>
            </div>
            <div class="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
              {{ store.settings().wallHeight + store.settings().acrylicThickness + store.settings().baseThickness | number:'1.0-1' }}<span class="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-0.5">mm</span>
            </div>
          </div>
        </div>

        <!-- Detail Specs -->
        <div class="space-y-1.5 pt-2 border-t border-slate-200/40 dark:border-slate-800/40 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
          <div class="flex justify-between items-center">
            <span>Target Height Scaling:</span>
            <span class="font-mono text-slate-800 dark:text-slate-200 font-semibold">{{ store.settings().targetHeight }} mm</span>
          </div>
          <div class="flex justify-between items-center">
            <span>Active Preset:</span>
            <span class="font-semibold text-blue-600 dark:text-blue-400 capitalize">{{ store.settings().style.replace('-', ' ') }}</span>
          </div>
          @if (store.settings().customHoles.length > 0) {
            <div class="flex justify-between items-center text-amber-600 dark:text-amber-400">
              <span>Mounting Holes:</span>
              <span class="font-mono font-bold">{{ store.settings().customHoles.length }} placement(s)</span>
            </div>
          }
        </div>
      </div>

      <!-- Environment Lighting Control Panel -->
      <div class="pt-3 border-t border-slate-200/40 dark:border-slate-800/40">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[10px]">
            <mat-icon class="scale-75 text-amber-500">wb_sunny</mat-icon>
            <span>ENVIRONMENT LIGHTING</span>
          </div>
          <span class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            {{ (store.settings().roomAmbient * 100) | number:'1.0-0' }}%
          </span>
        </div>

        <!-- Ambient Lighting Slider -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <mat-icon class="scale-75 text-slate-400 dark:text-slate-500">brightness_3</mat-icon>
            <input type="range" 
                   min="0" 
                   max="1" 
                   step="0.01" 
                   [value]="store.settings().roomAmbient" 
                   (input)="updateRoomAmbient($event)"
                   class="w-full h-1.5 bg-slate-200/60 dark:bg-slate-700/60 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none">
            <mat-icon class="scale-75 text-amber-500">light_mode</mat-icon>
          </div>

          <!-- Quick Lighting Presets -->
          <div class="grid grid-cols-4 gap-1 pt-1">
            <button (click)="setAmbient(0.0)" 
                    [class.ring-2]="store.settings().roomAmbient === 0"
                    [class.ring-amber-500]="store.settings().roomAmbient === 0"
                    class="px-1.5 py-1.5 bg-slate-100/60 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/80 rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center">
              Dark
            </button>
            <button (click)="setAmbient(0.15)" 
                    [class.ring-2]="Math.abs(store.settings().roomAmbient - 0.15) < 0.02"
                    [class.ring-amber-500]="Math.abs(store.settings().roomAmbient - 0.15) < 0.02"
                    class="px-1.5 py-1.5 bg-slate-100/60 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/80 rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center">
              Dim
            </button>
            <button (click)="setAmbient(0.5)" 
                    [class.ring-2]="Math.abs(store.settings().roomAmbient - 0.5) < 0.02"
                    [class.ring-amber-500]="Math.abs(store.settings().roomAmbient - 0.5) < 0.02"
                    class="px-1.5 py-1.5 bg-slate-100/60 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/80 rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center">
              Indoor
            </button>
            <button (click)="setAmbient(1.0)" 
                    [class.ring-2]="store.settings().roomAmbient === 1.0"
                    [class.ring-amber-500]="store.settings().roomAmbient === 1.0"
                    class="px-1.5 py-1.5 bg-slate-100/60 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/80 rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center">
              Bright
            </button>
          </div>

          <!-- Lighting Feedback Info -->
          <div class="mt-2.5 p-2.5 bg-white/40 dark:bg-slate-800/30 rounded-xl border border-slate-200/40 dark:border-slate-700/30 text-[10px] flex items-center gap-2">
            <mat-icon class="scale-75 text-amber-500 shrink-0">
              {{ store.settings().roomAmbient < 0.25 ? 'nightlight' : (store.settings().roomAmbient > 0.75 ? 'wb_sunny' : 'wb_twilight') }}
            </mat-icon>
            <span class="text-slate-600 dark:text-slate-400 font-medium leading-tight">
              @if (store.settings().roomAmbient < 0.25) {
                High glow contrast for LED halo & backlighting.
              } @else if (store.settings().roomAmbient > 0.75) {
                Full daylight room illumination.
              } @else {
                Balanced ambient room lighting.
              }
            </span>
          </div>
        </div>
      </div>

    </div>
  `
})
export class RightSidebarComponent {
  store = inject(AppStore);
  Math = Math;

  updateRoomAmbient(event: Event) {
    const input = event.target as HTMLInputElement;
    this.store.updateSettings({ roomAmbient: parseFloat(input.value) });
  }

  setAmbient(val: number) {
    this.store.updateSettings({ roomAmbient: val });
  }
}


