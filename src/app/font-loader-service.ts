import { Injectable, signal } from '@angular/core';
import { Font } from 'three/addons/loaders/FontLoader.js';
import * as opentype from 'opentype.js';
import { SIGNAGE_FONTS, SignageFont } from './fonts';

export interface FontLoadResult {
  font: Font;
  fontId: string;
  fontName: string;
}

@Injectable({ providedIn: 'root' })
export class FontLoaderService {
  private fontCache = new Map<string, Font>();
  private pendingRequests = new Map<string, Promise<Font>>();

  isFontLoading = signal<boolean>(false);
  fontLoadError = signal<string | null>(null);
  currentLoadedFontId = signal<string>('Helvetiker-Bold');

  /**
   * Convert an opentype.js Font instance into a Three.js Font instance (Typeface format).
   */
  convertOpenTypeToThreeFont(openTypeFont: opentype.Font, customName?: string): Font {
    const round = Math.round;
    const glyphs: Record<string, { ha: number; x_min: number; x_max: number; o: string }> = {};
    const unitsPerEm = openTypeFont.unitsPerEm || 2048;
    const scale = 100000 / (unitsPerEm * 72);

    const glyphCount = openTypeFont.glyphs ? openTypeFont.glyphs.length : 0;

    for (let i = 0; i < glyphCount; i++) {
      const glyph = openTypeFont.glyphs.get(i);
      const unicodes: number[] = [];

      if (Array.isArray(glyph.unicodes) && glyph.unicodes.length > 0) {
        unicodes.push(...glyph.unicodes);
      } else if (glyph.unicode !== undefined && glyph.unicode !== null) {
        unicodes.push(glyph.unicode);
      }

      if (unicodes.length === 0 && !glyph.name) continue;

      let outline = '';
      const commands = glyph.path ? glyph.path.commands : [];

      for (const rawCmd of commands) {
        const cmd = rawCmd as { type: string; x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number };
        const type = (cmd.type || '').toLowerCase();
        if (type === 'm' && cmd.x !== undefined && cmd.y !== undefined) {
          outline += `m ${round(cmd.x * scale)} ${round(cmd.y * scale)} `;
        } else if (type === 'l' && cmd.x !== undefined && cmd.y !== undefined) {
          outline += `l ${round(cmd.x * scale)} ${round(cmd.y * scale)} `;
        } else if (type === 'q' && cmd.x !== undefined && cmd.y !== undefined && cmd.x1 !== undefined && cmd.y1 !== undefined) {
          outline += `q ${round(cmd.x * scale)} ${round(cmd.y * scale)} ${round(cmd.x1 * scale)} ${round(cmd.y1 * scale)} `;
        } else if (type === 'c' && cmd.x !== undefined && cmd.y !== undefined && cmd.x1 !== undefined && cmd.y1 !== undefined && cmd.x2 !== undefined && cmd.y2 !== undefined) {
          outline += `b ${round(cmd.x * scale)} ${round(cmd.y * scale)} ${round(cmd.x1 * scale)} ${round(cmd.y1 * scale)} ${round(cmd.x2 * scale)} ${round(cmd.y2 * scale)} `;
        }
      }

      const advWidth = typeof glyph.advanceWidth === 'number' ? glyph.advanceWidth : (unitsPerEm * 0.5);
      const xMin = typeof glyph.xMin === 'number' ? glyph.xMin : 0;
      const xMax = typeof glyph.xMax === 'number' ? glyph.xMax : advWidth;

      const token = {
        ha: round(advWidth * scale),
        x_min: round(xMin * scale),
        x_max: round(xMax * scale),
        o: outline.trim()
      };

      for (const u of unicodes) {
        try {
          glyphs[String.fromCodePoint(u)] = token;
        } catch {
          // ignore invalid code point
        }
      }

      if (glyph.name) {
        glyphs[glyph.name] = token;
      }
    }

    // Ensure common space fallback exists
    if (!glyphs[' ']) {
      glyphs[' '] = {
        ha: round(unitsPerEm * 0.35 * scale),
        x_min: 0,
        x_max: 0,
        o: ''
      };
    }

    const head = (openTypeFont.tables?.['head'] || {}) as Record<string, number>;
    const post = (openTypeFont.tables?.['post'] || {}) as Record<string, number>;
    const names = openTypeFont.names as unknown as Record<string, Record<string, string> | undefined>;

    const fontName = customName || 
      names?.['fullName']?.['en'] || 
      names?.['fontFamily']?.['en'] || 
      'SignageFont';

    const typefaceData = {
      glyphs,
      familyName: fontName,
      ascender: round((openTypeFont.ascender || 800) * scale),
      descender: round((openTypeFont.descender || -200) * scale),
      underlinePosition: post['underlinePosition'] || -100,
      underlineThickness: post['underlineThickness'] || 50,
      boundingBox: {
        xMin: head['xMin'] || 0,
        xMax: head['xMax'] || unitsPerEm,
        yMin: head['yMin'] || 0,
        yMax: head['yMax'] || unitsPerEm
      },
      resolution: 1000,
      original_font_information: (openTypeFont.names || {}) as unknown as Record<string, string>
    };

    return new Font(typefaceData);
  }

  /**
   * Load and parse font from an ArrayBuffer directly (for file uploads).
   */
  async loadFromArrayBuffer(buffer: ArrayBuffer, name?: string): Promise<Font> {
    const otFont = opentype.parse(buffer);
    return this.convertOpenTypeToThreeFont(otFont, name);
  }

  /**
   * Load a font by its ID or definition, with multi-mirror resilient fallback.
   */
  async loadFont(fontId: string, customFonts: SignageFont[] = []): Promise<Font> {
    const allFonts = [...SIGNAGE_FONTS, ...customFonts];
    const matched = allFonts.find(
      f => f.id === fontId || f.id.toLowerCase() === fontId.toLowerCase() || f.name.toLowerCase() === fontId.toLowerCase()
    ) || SIGNAGE_FONTS[0];

    const targetId = matched.id;

    if (this.fontCache.has(targetId)) {
      this.currentLoadedFontId.set(targetId);
      return this.fontCache.get(targetId)!;
    }

    if (this.pendingRequests.has(targetId)) {
      return this.pendingRequests.get(targetId)!;
    }

    this.isFontLoading.set(true);
    this.fontLoadError.set(null);

    const loadPromise = this.fetchAndParseFont(matched)
      .then(font => {
        this.fontCache.set(targetId, font);
        this.currentLoadedFontId.set(targetId);
        this.isFontLoading.set(false);
        this.pendingRequests.delete(targetId);
        return font;
      })
      .catch(async err => {
        console.warn(`[FontLoader] Failed to load font "${targetId}":`, err);
        this.fontLoadError.set(`Could not load "${matched.name}". Reverting to default font.`);
        this.pendingRequests.delete(targetId);
        this.isFontLoading.set(false);

        // Fallback to primary default font if not already trying default
        if (targetId !== 'Helvetiker-Bold' && targetId !== 'Helvetiker-Regular') {
          return this.loadFont('Helvetiker-Bold');
        }
        throw err;
      });

    this.pendingRequests.set(targetId, loadPromise);
    return loadPromise;
  }

  private async fetchAndParseFont(fontDef: SignageFont): Promise<Font> {
    const candidateUrls = this.getUrlsForFont(fontDef);
    let lastError: Error | null = null;

    for (const url of candidateUrls) {
      try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
          throw new Error(`HTTP status ${response.status} from ${url}`);
        }

        const urlLower = url.toLowerCase();
        if (urlLower.endsWith('.typeface.json') || urlLower.endsWith('.json')) {
          const json = await response.json();
          return new Font(json);
        } else {
          // TTF, OTF, WOFF, or binary blob
          const buffer = await response.arrayBuffer();
          const otFont = opentype.parse(buffer);
          return this.convertOpenTypeToThreeFont(otFont, fontDef.name);
        }
      } catch (e: unknown) {
        lastError = e instanceof Error ? e : new Error(String(e));
        console.warn(`[FontLoader] Candidate mirror failed (${url}):`, lastError.message);
      }
    }

    throw lastError || new Error(`No working mirror for font ${fontDef.id}`);
  }

  private getUrlsForFont(fontDef: SignageFont): string[] {
    const urls: string[] = [];
    if (fontDef.url) {
      urls.push(fontDef.url);
    }

    // Add fallback mirrors depending on font type
    if (fontDef.url.includes('githubusercontent.com') || fontDef.url.includes('cdn.jsdelivr.net/gh/google/fonts')) {
      const match = fontDef.url.match(/(?:ofl|apache|ufl)\/([^/]+)\/([^/]+)$/);
      if (match) {
        const [, folder, filename] = match;
        const mirrorJsdelivr = `https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/${folder}/${filename}`;
        const mirrorApache = `https://cdn.jsdelivr.net/gh/google/fonts@main/apache/${folder}/${filename}`;
        const mirrorRaw = `https://raw.githubusercontent.com/google/fonts/main/ofl/${folder}/${filename}`;
        const mirrorRawApache = `https://raw.githubusercontent.com/google/fonts/main/apache/${folder}/${filename}`;

        [mirrorJsdelivr, mirrorApache, mirrorRaw, mirrorRawApache].forEach(u => {
          if (!urls.includes(u)) urls.push(u);
        });
      }
    } else if (fontDef.url.includes('three@') || fontDef.url.endsWith('.typeface.json')) {
      const filename = fontDef.url.substring(fontDef.url.lastIndexOf('/') + 1);
      const isDroid = fontDef.url.includes('/droid/');
      const basePath = isDroid ? `droid/${filename}` : filename;

      const jsdelivr = `https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/${basePath}`;
      const unpkg = `https://unpkg.com/three@0.160.0/examples/fonts/${basePath}`;

      if (!urls.includes(jsdelivr)) urls.push(jsdelivr);
      if (!urls.includes(unpkg)) urls.push(unpkg);
    }

    return urls;
  }
}
