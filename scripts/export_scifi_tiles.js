import fs from 'fs';
import path from 'path';

const html = fs.readFileSync('pixellab-assets/UI/UI_components/code.html', 'utf8');
const svgs = html.match(/<svg[\s\S]*?<\/svg>/g);

const mapping = {
  'floor_main.svg': svgs[1],
  'floor_alt.svg': svgs[2],
  'floor_energy.svg': svgs[3],
  'wall_solid.svg': svgs[4],
  'wall_corner.svg': svgs[5],
  'wall_edge.svg': svgs[6],
  'wall_pillar.svg': svgs[7],
  'gate_locked.svg': svgs[8],
  'gate_unlocked.svg': svgs[9],
  'gate_open.svg': svgs[10],
  'plate_inactive.svg': svgs[11],
  'plate_active.svg': svgs[12],
  'key.svg': svgs[13],
  'exit_portal.svg': svgs[14],
  'deco_terminal.svg': svgs[15],
  'deco_cables.svg': svgs[16],
};

const outDir = path.resolve('public/tiles/scifi');
fs.mkdirSync(outDir, { recursive: true });

for (const [name, rawSvg] of Object.entries(mapping)) {
  let clean = rawSvg;
  if (!clean.includes('xmlns=')) {
    clean = clean.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  clean = clean.replace(/class="[^"]*"/g, '');
  if (!clean.includes('width=')) {
    clean = clean.replace('<svg', '<svg width="32" height="32"');
  }
  fs.writeFileSync(path.join(outDir, name), clean.trim(), 'utf8');
}

console.log('Saved', Object.keys(mapping).length, 'SVGs to public/tiles/scifi/');
