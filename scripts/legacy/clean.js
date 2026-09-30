const fs = require('fs');

let h = fs.readFileSync('src/app/features/leads/leads.component.html', 'utf8');
h = h.split('<div class="modal-backdrop paste-backdrop"')[0];
fs.writeFileSync('src/app/features/leads/leads.component.html', h);

let t = fs.readFileSync('src/app/features/leads/leads.component.ts', 'utf8');
t = t.replace(/import \{ PasteLeadRow \} from '\.\.\/\.\.\/shared\/models\/lead-extraction\.model';/, '');
t = t.replace(/pasteModalOpen = false;[\s\S]*?importing = false;/, '');
t = t.replace(/openPaste\(\): void \{[\s\S]*?closePaste\(\): void \{ if \(!this\.importing\) this\.pasteModalOpen = false; \}/, '');
t = t.replace(/async parsePastedLeads\(\): Promise<void> \{[\s\S]*?finally \{ this\.parsing = false; \}\n  \}/, '');
t = t.replace(/get selectedPasteRows\(\): PasteLeadRow\[\] \{[\s\S]*?row\.confidence !== 'low'\); \}/, '');
t = t.replace(/async savePastedLeads\(\): Promise<void> \{[\s\S]*?finally \{ this\.importing = false; \}\n  \}/, '');
fs.writeFileSync('src/app/features/leads/leads.component.ts', t);
