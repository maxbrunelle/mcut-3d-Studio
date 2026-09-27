const fs = require('fs');
let content = fs.readFileSync('src/app/left-sidebar.ts', 'utf8');

const containerOld = 'class="flex h-full w-full bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100"';
const containerNew = 'class="flex flex-col md:flex-row h-full w-full bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100"';
content = content.replace(containerOld, containerNew);

const tabsOld = 'class="w-16 bg-[#f8fafc] border-r border-gray-200 dark:border-slate-700 flex flex-col items-center py-4 space-y-4 shrink-0 shadow-sm z-10"';
const tabsNew = 'class="w-full h-14 md:w-16 md:h-full bg-[#f8fafc] dark:bg-slate-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-700 flex flex-row md:flex-col items-center justify-around md:justify-start px-2 md:px-0 py-2 md:py-4 md:space-y-4 shrink-0 shadow-sm z-10 overflow-x-auto"';
content = content.replace(tabsOld, tabsNew);

fs.writeFileSync('src/app/left-sidebar.ts', content, 'utf8');
