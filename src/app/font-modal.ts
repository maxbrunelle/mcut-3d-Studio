import { Component, inject, OnInit } from '@angular/core';
import { AppStore } from './store';
import { SIGNAGE_FONTS, SignageFont } from './fonts';
import { FontLoaderService } from './font-loader-service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-font-modal',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <!-- eslint-disable @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" (click)="close()">
      <div class="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <div class="flex items-center gap-2.5">
              <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Select Signage Font</h2>
              @if (fontLoader.isFontLoading()) {
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 animate-pulse">
                  <mat-icon class="scale-75 animate-spin">refresh</mat-icon>
                  Generating 3D Glyphs...
                </span>
              }
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select verified signage typography or upload your own TTF/OTF font file
            </p>
          </div>
          <div class="flex items-center gap-3 mt-4 sm:mt-0">
            <input type="file" id="fontUploadInput" accept=".ttf,.otf" class="hidden" (change)="uploadFont($event)">
            <label for="fontUploadInput" class="cursor-pointer px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-500 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm flex items-center gap-2">
              <mat-icon class="scale-90">upload_file</mat-icon>
              Upload Custom Font (.TTF / .OTF)
            </label>
            <button (click)="close()" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer" title="Close Modal">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        @if (fontLoader.fontLoadError(); as err) {
          <div class="px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
            <mat-icon class="scale-75">warning</mat-icon>
            <span>{{ err }}</span>
          </div>
        }

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-[#0b0f17]">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (font of allFonts; track font.id) {
              <button (click)="selectFont(font.id)"
                      [class.ring-2]="store.settings().font === font.id"
                      [class.ring-blue-500]="store.settings().font === font.id"
                      [class.border-blue-500]="store.settings().font === font.id"
                      [class.bg-blue-50]="store.settings().font === font.id"
                      [class.dark:bg-blue-950/40]="store.settings().font === font.id"
                      [class.border-slate-200]="store.settings().font !== font.id"
                      [class.dark:border-slate-700]="store.settings().font !== font.id"
                      [class.bg-white]="store.settings().font !== font.id"
                      [class.dark:bg-slate-800]="store.settings().font !== font.id"
                      class="flex flex-col p-4 rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left relative overflow-hidden group cursor-pointer">

                <div class="flex justify-between items-start mb-3 w-full">
                  <div>
                    <span class="block text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{{ font.name }}</span>
                    <span class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{{ font.category }} • {{ font.style }}</span>
                  </div>
                  @if (store.settings().font === font.id) {
                    <div class="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      @if (fontLoader.isFontLoading()) {
                        <mat-icon class="scale-75 animate-spin">refresh</mat-icon>
                      } @else {
                        <mat-icon class="scale-90 shrink-0">check_circle</mat-icon>
                      }
                    </div>
                  }
                </div>

                <!-- PREVIEW TEXT -->
                <div class="flex-1 flex items-center py-4 w-full overflow-hidden bg-slate-50/80 dark:bg-slate-900/60 rounded-xl px-3 border border-slate-100 dark:border-slate-800">
                  <span class="text-3xl text-slate-900 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis leading-tight"
                        [style.font-family]="getFontFamily(font)"
                        [style.font-weight]="font.id.includes('Bold') ? 'bold' : 'normal'">
                    {{ previewText }}
                  </span>
                </div>
              </button>
            }
          </div>
        </div>
        
        <!-- Footer -->
        <div class="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
           <div class="text-xs text-slate-500 dark:text-slate-400 font-medium">
             Selected: <strong class="text-slate-800 dark:text-slate-200">{{ selectedFontName() }}</strong>
           </div>
           <button (click)="close()" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer">
             <mat-icon class="scale-90">check</mat-icon>
             Apply Font
           </button>
        </div>
      </div>
    </div>
  `
})
export class FontModal implements OnInit {
  store = inject(AppStore);
  fontLoader = inject(FontLoaderService);
  fonts = SIGNAGE_FONTS;

  get allFonts() {
    return [...this.fonts, ...this.store.customFonts()];
  }

  get previewText() {
    const s = this.store.settings();
    const raw = s.inputSource === 'neon-flex' ? (s.neonText || s.text || 'Dreams') : (s.text || 'Signage');
    return raw.split('\n')[0] || 'Signage';
  }

  selectedFontName() {
    const s = this.store.settings();
    const currentId = s.inputSource === 'neon-flex' ? (s.neonFont || s.font) : s.font;
    const found = this.allFonts.find(f => f.id === currentId || f.id.toLowerCase() === currentId.toLowerCase());
    return found ? found.name : currentId;
  }

  ngOnInit() {
    // Inject Google Fonts for DOM preview
    if (!document.getElementById('signage-google-fonts')) {
      const link = document.createElement('link');
      link.id = 'signage-google-fonts';
      link.href = 'https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Anton&family=Audiowide&family=Bangers&family=Bebas+Neue&family=Caveat+Brush&family=Great+Vibes&family=Leckerli+One&family=Lobster&family=Pacifico&family=Righteous&family=Satisfy&family=Yellowtail&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }

  close() {
    this.store.closeFontModal();
  }

  selectFont(id: string) {
    this.store.updateSettings({ font: id, neonFont: id });
  }

  async uploadFont(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const fontName = 'CustomFont_' + Date.now();
    const cleanFileName = file.name.replace(/\.[^/.]+$/, "");

    try {
      const buffer = await file.arrayBuffer();
      // Test parse with fontLoader
      await this.fontLoader.loadFromArrayBuffer(buffer, cleanFileName);

      const url = URL.createObjectURL(file);
      
      // Add font face for DOM preview
      const fontFace = new FontFace(fontName, buffer);
      await fontFace.load();
      document.fonts.add(fontFace);

      const customFont: SignageFont = {
        id: fontName,
        name: cleanFileName,
        style: 'User Uploaded Font',
        category: 'Custom',
        url: url
      };

      this.store.addCustomFont(customFont);
      this.store.updateSettings({ font: fontName });
    } catch (err) {
      console.error('Failed to parse uploaded font:', err);
      alert('Could not parse font file. Please ensure it is a valid, uncorrupted .ttf or .otf font.');
    }

    input.value = '';
  }

  getFontFamily(font: SignageFont): string {
    if (font.category === 'Custom') {
      return `'${font.id}', sans-serif`;
    }
    switch (font.id) {
      case 'Pacifico': return "'Pacifico', cursive";
      case 'Lobster': return "'Lobster', cursive";
      case 'Yellowtail': return "'Yellowtail', cursive";
      case 'CaveatBrush': return "'Caveat Brush', cursive";
      case 'LeckerliOne': return "'Leckerli One', cursive";
      case 'GreatVibes': return "'Great Vibes', cursive";
      case 'Satisfy': return "'Satisfy', cursive";
      case 'Bangers': return "'Bangers', cursive, sans-serif";
      case 'Righteous': return "'Righteous', cursive, sans-serif";
      case 'Anton': return "'Anton', sans-serif";
      case 'BebasNeue': return "'Bebas Neue', sans-serif";
      case 'Audiowide': return "'Audiowide', cursive";
      case 'AlfaSlabOne': return "'Alfa Slab One', serif";
      case 'Helvetiker-Bold':
      case 'Helvetiker-Regular': return "'Helvetica Neue', Helvetica, Arial, sans-serif";
      case 'Optimer-Bold':
      case 'Optimer-Regular': return "'Optima', 'Segoe UI', sans-serif";
      case 'Gentilis-Bold':
      case 'Gentilis-Regular': return "'Georgia', serif";
      case 'DroidSans-Bold':
      case 'DroidSans-Regular': return "'Droid Sans', 'Open Sans', sans-serif";
      case 'DroidSerif-Bold':
      case 'DroidSerif-Regular': return "'Droid Serif', 'Merriweather', serif";
      default: return "sans-serif";
    }
  }
}
