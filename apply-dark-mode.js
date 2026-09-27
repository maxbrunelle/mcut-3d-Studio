const fs = require('fs');

const replacements = {
  'bg-white': 'bg-white dark:bg-slate-900',
  'bg-gray-50': 'bg-gray-50 dark:bg-slate-800',
  'bg-[#f8fafc]': 'bg-[#f8fafc] dark:bg-slate-900',
  'bg-gray-200': 'bg-gray-200 dark:bg-slate-700',
  'bg-gray-300': 'bg-gray-300 dark:bg-slate-600',
  'border-gray-100': 'border-gray-100 dark:border-slate-800',
  'border-gray-200': 'border-gray-200 dark:border-slate-700',
  'border-gray-300': 'border-gray-300 dark:border-slate-600',
  'text-gray-800': 'text-gray-800 dark:text-slate-100',
  'text-gray-700': 'text-gray-700 dark:text-slate-200',
  'text-gray-600': 'text-gray-600 dark:text-slate-300',
  'text-gray-500': 'text-gray-500 dark:text-slate-400',
  'text-gray-400': 'text-gray-400 dark:text-slate-500',
  'bg-blue-50': 'bg-blue-50 dark:bg-blue-900/30',
  'bg-blue-100': 'bg-blue-100 dark:bg-blue-900/50',
  'border-blue-300': 'border-blue-300 dark:border-blue-700',
  'border-blue-500': 'border-blue-500 dark:border-blue-400',
  'text-blue-600': 'text-blue-600 dark:text-blue-400',
  'text-blue-700': 'text-blue-700 dark:text-blue-300',
  'text-blue-800': 'text-blue-800 dark:text-blue-200',
  'border-blue-200': 'border-blue-200 dark:border-blue-800',
  'hover:bg-gray-50': 'hover:bg-gray-50 dark:hover:bg-slate-800',
  'hover:text-blue-600': 'hover:text-blue-600 dark:hover:text-blue-400',
  'hover:bg-blue-50': 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
  'bg-red-50': 'bg-red-50 dark:bg-red-900/30',
  'border-red-100': 'border-red-100 dark:border-red-800',
  'border-red-200': 'border-red-200 dark:border-red-800',
  'text-red-700': 'text-red-700 dark:text-red-400',
  'text-red-500': 'text-red-500 dark:text-red-400',
  'hover:bg-red-50': 'hover:bg-red-50 dark:hover:bg-red-900/30',
  'hover:text-red-500': 'hover:text-red-500 dark:hover:text-red-400',
  'bg-green-50': 'bg-green-50 dark:bg-emerald-900/30',
  'border-green-200': 'border-green-200 dark:border-emerald-800',
  'text-green-700': 'text-green-700 dark:text-emerald-400',
  'hover:text-gray-600': 'hover:text-gray-600 dark:hover:text-slate-300',
  'hover:border-blue-500': 'hover:border-blue-500 dark:hover:border-blue-400',
  'hover:border-emerald-500': 'hover:border-emerald-500 dark:hover:border-emerald-400',
  'hover:bg-emerald-50': 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30',
  'text-emerald-500': 'text-emerald-500 dark:text-emerald-400',
  'text-emerald-600': 'text-emerald-600 dark:text-emerald-400',
  'bg-emerald-100': 'bg-emerald-100 dark:bg-emerald-900/50',
  'group-hover:bg-emerald-200': 'group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800',
  'group-hover:text-emerald-500': 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400',
  'hover:border-purple-500': 'hover:border-purple-500 dark:hover:border-purple-400',
  'hover:bg-purple-50': 'hover:bg-purple-50 dark:hover:bg-purple-900/30',
  'text-purple-500': 'text-purple-500 dark:text-purple-400',
  'text-purple-600': 'text-purple-600 dark:text-purple-400',
  'bg-purple-100': 'bg-purple-100 dark:bg-purple-900/50',
  'group-hover:bg-purple-200': 'group-hover:bg-purple-200 dark:group-hover:bg-purple-800',
  'group-hover:text-purple-500': 'group-hover:text-purple-500 dark:group-hover:text-purple-400',
  'group-hover:text-blue-500': 'group-hover:text-blue-500 dark:group-hover:text-blue-400',
  'group-hover:bg-blue-200': 'group-hover:bg-blue-200 dark:group-hover:bg-blue-800'
};

const processFile = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Simple string replace for each class
  // To avoid replacing things inside already replaced things, we will just do a blind replace 
  // and hope it doesn't collide, but to be safer we can use regex with word boundaries
  
  for (const [key, value] of Object.entries(replacements)) {
    // Only replace if it doesn't already have the dark: variant
    const regex = new RegExp(`\\b${key.replace(/\[/g, '\\[').replace(/\]/g, '\\]')}\\b(?! dark:)`, 'g');
    content = content.replace(regex, value);
  }

  // Also manually fix input backgrounds since we set transparent
  content = content.replace(/bg-transparent/g, 'bg-transparent dark:text-slate-100');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
};

processFile('src/app/left-sidebar.ts');
processFile('src/app/right-sidebar.ts');
processFile('src/app/viewport-3d.ts'); // just in case

