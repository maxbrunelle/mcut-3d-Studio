const fs = require('fs');

function fixFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  
  // Find all [class.XXX]="expr" where XXX contains a space
  // We need to change [class.class1 class2]="expr" to [class.class1]="expr" [class.class2]="expr"
  
  content = content.replace(/\[class\.([^\]=]+)\]="([^"]+)"/g, (match, classesStr, expr) => {
    const classes = classesStr.split(' ');
    if (classes.length > 1) {
      return classes.map(cls => `[class.${cls}]="${expr}"`).join(' ');
    }
    return match;
  });

  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed', path);
}

fixFile('src/app/left-sidebar.ts');
fixFile('src/app/right-sidebar.ts');
