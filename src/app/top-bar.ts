import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-top-bar',
  imports: [MatIconModule],
  template: `
    <header class="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-20 relative">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 text-blue-600 font-bold tracking-wider text-sm">
          <mat-icon class="scale-75">view_in_ar</mat-icon>
          <span>LETRA MAKER</span>
        </div>
        <div class="h-4 w-px bg-gray-300 mx-2"></div>
        <button class="hover:bg-gray-100 text-gray-600 px-2 py-1 rounded transition-colors flex items-center gap-1 text-xs font-medium">
          <mat-icon class="scale-75">add</mat-icon> New
        </button>
        <button class="hover:bg-gray-100 text-gray-600 px-2 py-1 rounded transition-colors flex items-center gap-1 text-xs font-medium">
          <mat-icon class="scale-75">folder_open</mat-icon> Open
        </button>
        <button class="hover:bg-gray-100 text-gray-600 px-2 py-1 rounded transition-colors flex items-center gap-1 text-xs font-medium">
          <mat-icon class="scale-75">save</mat-icon> Save
        </button>
      </div>
      <div class="flex items-center gap-2">
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1 text-xs font-medium shadow-sm">
          <mat-icon class="scale-75">precision_manufacturing</mat-icon> Production
        </button>
      </div>
    </header>
  `
})
export class TopBarComponent {}
