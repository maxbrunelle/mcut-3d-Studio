import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AppStore } from './store';

@Component({
  selector: 'app-bottom-bar',
  imports: [MatIconModule],
  template: `
    <footer class="h-8 bg-white border-t border-gray-200 text-gray-600 flex items-center justify-between px-4 shrink-0 text-xs font-medium z-20 relative">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1 text-emerald-600">
          <mat-icon class="scale-50">check_circle</mat-icon> Ready
        </div>
        <div class="flex items-center gap-1 text-gray-500">
          <mat-icon class="scale-50">straighten</mat-icon> Units: mm
        </div>
      </div>
      <div class="flex items-center gap-4 text-gray-500">
        <div>{{ store.settings().text.length }} Characters</div>
      </div>
    </footer>
  `
})
export class BottomBarComponent {
  store = inject(AppStore);
}

