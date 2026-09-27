const fs = require('fs');

let content = fs.readFileSync('src/app/left-sidebar.ts', 'utf8');

// I'll see where updateSettings is defined, probably it's just this.store.updateSettings()
// Actually, let's just add updateColor method to the component class.
const methodToAdd = `
  updateColor(key: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.store.updateSettings({ [key]: input.value });
  }
`;

content = content.replace(/export class LeftSidebarComponent \{/, "export class LeftSidebarComponent {" + methodToAdd);

fs.writeFileSync('src/app/left-sidebar.ts', content, 'utf8');
