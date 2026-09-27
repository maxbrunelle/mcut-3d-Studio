const fs = require('fs');

let content = fs.readFileSync('src/app/app.ts', 'utf8');

const newContent = `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LeftSidebarComponent } from './left-sidebar';
import { RightSidebarComponent } from './right-sidebar';
import { Viewport3DComponent } from './viewport-3d';
import { MatIconModule } from '@angular/material/icon';
import { AppStore } from './store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [LeftSidebarComponent, RightSidebarComponent, Viewport3DComponent, MatIconModule],
  template: \`
    <div [class.dark]="store.isDarkMode()" class="relative h-screen w-screen overflow-hidden bg-[#eef2f5] dark:bg-slate-900 text-gray-800 dark:text-slate-100 font-sans select-none transition-colors duration-300">
      <app-viewport-3d class="absolute inset-0 w-full h-full z-0" />
      
      <!-- Top Bar -->
      <header class="absolute top-0 left-0 w-full h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm z-20 flex items-center px-6 justify-between border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
        <div class="font-black tracking-widest text-blue-900 dark:text-blue-400 flex items-center gap-2 text-lg transition-colors duration-300">
           LETRAMAKER <span class="text-xs text-gray-500 dark:text-slate-400 font-bold tracking-normal mt-1">V4.0</span>
        </div>
        <div class="flex items-center gap-4 text-gray-500 dark:text-slate-400">
           <button (click)="store.toggleDarkMode()" class="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
             <mat-icon class="scale-75 text-gray-600 dark:text-slate-300">{{ store.isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
           </button>
        </div>
      </header>

      <!-- Bottom Left Stats Widget -->
      <div class="absolute bottom-6 left-6 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 dark:border-slate-800 w-64 transition-colors duration-300">
        <app-right-sidebar />
      </div>

      <!-- Right Floating Panel -->
      <div class="absolute right-6 top-20 bottom-6 z-20 flex bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden w-[420px] transition-colors duration-300">
         <app-left-sidebar class="w-full h-full block" />
      </div>
    </div>
  \`
})
export class App {
  store = inject(AppStore);
}
`;

fs.writeFileSync('src/app/app.ts', newContent, 'utf8');
console.log('App updated');
