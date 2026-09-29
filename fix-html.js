const fs = require('fs');
let html = fs.readFileSync('src/app/features/paste-lead/paste-lead.component.html', 'utf8');
html = html.replace('<th>NOTES / OPPORTUNITY</th>', '<th>AI SUGGESTION</th>');
html = html.replace('<textarea class="preview-input preview-textarea" [(ngModel)]="row.lead.notes" [ngModelOptions]="{standalone:true}" placeholder="Opportunity / notes"></textarea>', '<textarea class="preview-input preview-textarea" [(ngModel)]="row.lead.aiSuggestion" [ngModelOptions]="{standalone:true}" placeholder="AI Suggestions"></textarea>');
fs.writeFileSync('src/app/features/paste-lead/paste-lead.component.html', html);
