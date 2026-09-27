const fs = require('fs');
let content = fs.readFileSync('src/app/app.ts', 'utf8');

const desktopStatsClasses = 'absolute bottom-6 left-6 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 dark:border-slate-800 w-64 transition-colors duration-300';
const mobileStatsClasses = 'hidden md:block absolute bottom-6 left-6 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 dark:border-slate-800 w-64 transition-colors duration-300';
content = content.replace(desktopStatsClasses, mobileStatsClasses);

const desktopRightPanelClasses = 'absolute right-6 top-20 bottom-6 z-20 flex bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden w-[420px] transition-colors duration-300';
const mobileRightPanelClasses = 'absolute inset-x-0 bottom-0 md:inset-auto md:right-6 md:top-20 md:bottom-6 z-20 flex bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl md:backdrop-blur-md rounded-t-2xl md:rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] md:shadow-2xl border-t md:border border-gray-200 dark:border-slate-800 overflow-hidden w-full md:w-[420px] h-[55vh] md:h-auto transition-colors duration-300';
content = content.replace(desktopRightPanelClasses, mobileRightPanelClasses);

const headerClasses = 'absolute top-0 left-0 w-full h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm z-20 flex items-center px-6 justify-between border-b border-gray-200 dark:border-slate-800 transition-colors duration-300';
const newHeaderClasses = 'absolute top-0 left-0 w-full h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm z-20 flex items-center px-4 md:px-6 justify-between border-b border-gray-200 dark:border-slate-800 transition-colors duration-300';
content = content.replace(headerClasses, newHeaderClasses);

const logoClasses = 'font-black tracking-widest text-blue-900 dark:text-blue-400 flex items-center gap-2 text-lg transition-colors duration-300';
const newLogoClasses = 'font-black tracking-widest text-blue-900 dark:text-blue-400 flex items-center gap-2 text-base md:text-lg transition-colors duration-300';
content = content.replace(logoClasses, newLogoClasses);

fs.writeFileSync('src/app/app.ts', content, 'utf8');
