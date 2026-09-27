import { ChangeDetectionStrategy, Component, inject, effect } from '@angular/core';
import { LeftSidebarComponent } from './left-sidebar';
import { RightSidebarComponent } from './right-sidebar';
import { Viewport3DComponent } from './viewport-3d';
import { InstallationTemplateModalComponent } from './installation-template-modal';
import { FontModal } from './font-modal';
import { MatIconModule } from '@angular/material/icon';
import { AppStore } from './store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [LeftSidebarComponent, RightSidebarComponent, Viewport3DComponent, InstallationTemplateModalComponent, FontModal, MatIconModule],
  host: {
    '(window:keydown)': 'handleGlobalKeydown($event)'
  },
  template: `
    <div [class.dark]="store.isDarkMode()" class="relative h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-[#0b0f17] text-slate-800 dark:text-slate-100 font-sans select-none transition-colors duration-300">
      <app-viewport-3d class="absolute inset-0 w-full h-full z-0" />
      
      <!-- Top Studio Header -->
      <header class="absolute top-0 left-0 w-full h-14 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl shadow-sm z-20 flex items-center px-4 md:px-6 justify-between border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <!-- Logo & Status -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent font-extrabold text-base md:text-lg tracking-tight">
            <div class="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-black text-xs">
              M
            </div>
            <span>MCUT <span class="font-light text-slate-500 dark:text-slate-400">STUDIO</span></span>
          </div>

          <div class="hidden sm:block h-4 w-px bg-slate-200 dark:border-slate-800"></div>

          <!-- Undo / Redo History Stack Controls -->
          <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <!-- Undo Button -->
            <button (click)="store.undo()"
                    [disabled]="!store.canUndo()"
                    [class.opacity-40]="!store.canUndo()"
                    [class.cursor-not-allowed]="!store.canUndo()"
                    [class.hover:bg-white]="store.canUndo()"
                    [class.dark:hover:bg-slate-700]="store.canUndo()"
                    [class.text-slate-700]="store.canUndo()"
                    [class.dark:text-slate-200]="store.canUndo()"
                    [class.shadow-xs]="store.canUndo()"
                    class="p-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer text-slate-400 dark:text-slate-500"
                    [title]="store.canUndo() ? ('Undo: ' + (store.lastUndoDescription() || 'Last action') + ' (Ctrl+Z / ⌘Z)') : 'Nothing to undo'">
              <mat-icon class="scale-80">undo</mat-icon>
              <span class="text-[11px] font-bold hidden lg:inline">Undo</span>
              @if (store.canUndo()) {
                <span class="text-[9px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1 rounded-full font-bold">
                  {{ store.undoCount() }}
                </span>
              }
            </button>

            <!-- Redo Button -->
            <button (click)="store.redo()"
                    [disabled]="!store.canRedo()"
                    [class.opacity-40]="!store.canRedo()"
                    [class.cursor-not-allowed]="!store.canRedo()"
                    [class.hover:bg-white]="store.canRedo()"
                    [class.dark:hover:bg-slate-700]="store.canRedo()"
                    [class.text-slate-700]="store.canRedo()"
                    [class.dark:text-slate-200]="store.canRedo()"
                    [class.shadow-xs]="store.canRedo()"
                    class="p-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer text-slate-400 dark:text-slate-500"
                    [title]="store.canRedo() ? ('Redo: ' + (store.lastRedoDescription() || 'Next action') + ' (Ctrl+Y / ⌘⇧Z)') : 'Nothing to redo'">
              <mat-icon class="scale-80">redo</mat-icon>
              <span class="text-[11px] font-bold hidden lg:inline">Redo</span>
              @if (store.canRedo()) {
                <span class="text-[9px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1 rounded-full font-bold">
                  {{ store.redoCount() }}
                </span>
              }
            </button>
          </div>
        </div>

        <!-- Right Header Controls -->
        <div class="flex items-center gap-3">
          <!-- 1:1 Installation Template Header Button -->
          <button (click)="store.openTemplateModal()" 
                  class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                  title="Open Printable 1:1 Scale Installation Template">
            <mat-icon class="scale-75">grid_on</mat-icon>
            <span>1:1 Template</span>
          </button>

          <!-- Build Plate Toggle -->
          <button (click)="store.updateSettings({ showBuildPlate: !store.settings().showBuildPlate })" 
                  [class.text-blue-600]="store.settings().showBuildPlate"
                  [class.bg-blue-50]="store.settings().showBuildPlate"
                  [class.dark:bg-blue-900/30]="store.settings().showBuildPlate"
                  [class.dark:text-blue-400]="store.settings().showBuildPlate"
                  class="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Toggle Build Plate Grid">
            <mat-icon class="scale-75">grid_on</mat-icon>
            <span>Grid</span>
          </button>

          <!-- Export Quick Action Button -->
          <button (click)="store.setActiveTab('export')" 
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer">
            <mat-icon class="scale-75">download</mat-icon>
            <span class="hidden sm:inline">Export</span>
          </button>

          <div class="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>

          <!-- Theme Toggle -->
          <button (click)="store.toggleDarkMode()" 
                  class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-90 cursor-pointer"
                  title="Toggle Light/Dark Theme">
            <mat-icon class="scale-90">{{ store.isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
        </div>
      </header>

      <!-- History Notification Toast -->
      @if (store.historyToast(); as toast) {
        <div class="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200">
          <div class="px-4 py-2 rounded-full shadow-lg border backdrop-blur-md flex items-center gap-2 text-xs font-bold tracking-wide"
               [class.bg-slate-900/95]="!store.isDarkMode()"
               [class.text-white]="!store.isDarkMode()"
               [class.border-slate-700]="!store.isDarkMode()"
               [class.bg-white/95]="store.isDarkMode()"
               [class.text-slate-900]="store.isDarkMode()"
               [class.border-slate-200]="store.isDarkMode()">
            <mat-icon class="scale-75" [class.text-blue-400]="toast.type === 'undo'" [class.text-emerald-400]="toast.type === 'redo'">
              {{ toast.type === 'undo' ? 'undo' : 'redo' }}
            </mat-icon>
            <span>{{ toast.message }}</span>
          </div>
        </div>
      }

      <!-- Bottom Left Telemetry & HUD Widget -->
      <div class="hidden md:block absolute bottom-6 left-6 z-20 w-72">
        <app-right-sidebar />
      </div>

      <!-- Right Floating Control Panel Inspector -->
      <div class="fixed right-0 top-14 bottom-0 z-20 flex pointer-events-none">
         <app-left-sidebar class="h-full block pointer-events-auto" />
      </div>

      <!-- 1:1 Scale Installation Template Modal -->
      @if (store.showTemplateModal()) {
        <app-installation-template-modal />
      }

      <!-- Font Preview Modal -->
      @if (store.showFontModal()) {
        <app-font-modal />
      }
    </div>
  `
})
export class App {
  store = inject(AppStore);

  constructor() {
    effect(() => {
      const isDark = this.store.isDarkMode();
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', isDark);
      }
    });
  }

  handleGlobalKeydown(e: KeyboardEvent) {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (!cmdOrCtrl) return;

    const target = e.target as HTMLElement | null;
    const isTextInput = target && (
      (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text') ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    );

    const key = e.key.toLowerCase();

    // Ctrl+Z / Cmd+Z (Undo)
    if (key === 'z') {
      if (e.shiftKey) {
        // Redo: Ctrl+Shift+Z or Cmd+Shift+Z
        if (this.store.canRedo()) {
          e.preventDefault();
          this.store.redo();
        }
      } else {
        // Undo: Ctrl+Z or Cmd+Z
        if (!isTextInput && this.store.canUndo()) {
          e.preventDefault();
          this.store.undo();
        }
      }
    } else if (key === 'y' && !isMac) {
      // Redo: Ctrl+Y
      if (!isTextInput && this.store.canRedo()) {
        e.preventDefault();
        this.store.redo();
      }
    }
  }

  triggerSnapshot() {
    window.dispatchEvent(new CustomEvent('export-snapshot'));
  }
}

