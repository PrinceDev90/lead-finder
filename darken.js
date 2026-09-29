const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src/app/features');
files.push('src/app/app.component.css');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Backgrounds & Surfaces
  content = content.replace(/background:\s*(#fff|white|#ffffff)/gi, 'background: #1e1f20');
  content = content.replace(/background:\s*rgba\(255,\s*255,\s*255,\s*\.92\)/gi, 'background: rgba(30, 31, 32, .92)');
  content = content.replace(/background:\s*#(f[0-9a-f]{5}|e[0-9a-f]{5})/gi, 'background: #282a2c');
  
  // Borders
  content = content.replace(/border(-[a-z]+)?:\s*1px solid #(e[0-9a-f]{5}|f[0-9a-f]{5}|d[0-9a-f]{5})/gi, 'border$1: 1px solid #333538');
  content = content.replace(/border-color:\s*#(e[0-9a-f]{5}|f[0-9a-f]{5}|d[0-9a-f]{5})/gi, 'border-color: #333538');
  
  // Text Colors (Dark text -> Light text)
  content = content.replace(/color:\s*#([1-5][0-9a-f]{5}|[0-5]{3})(?!\w)/gi, 'color: #e3e3e3');
  // Secondary text (Medium dark -> Medium light)
  content = content.replace(/color:\s*#([6-9][0-9a-f]{5}|[6-9a-b]{3})(?!\w)/gi, 'color: #c4c7c5');
  
  // Primary Buttons & Brands (greenish -> Google AI Studio blue #a8c7fa)
  content = content.replace(/background:\s*#294535/gi, 'background: #a8c7fa');
  content = content.replace(/color:\s*#fff(?!;)/gi, 'color: #041e49'); // text on primary buttons
  content = content.replace(/background:\s*#203b2d/gi, 'background: #82a3d7'); // primary button hover
  
  // Tab lines
  content = content.replace(/background:\s*#547b5d/gi, 'background: #a8c7fa');
  
  fs.writeFileSync(file, content);
  console.log('Darkened', file);
});
