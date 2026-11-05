import { writeFileSync } from 'node:fs';
const out = process.argv[2];
// mark geometry lives in a 64x64 box; `p` prefixes ids so multiple marks can share a page
const mark = (p, top = '#fff', bottom = `url(#${p}-blue)`) => `
  <defs>
    <linearGradient id="${p}-blue" x1="8" y1="58" x2="40" y2="26" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1F4FE0"/><stop offset="1" stop-color="#4C8DFF"/>
    </linearGradient>
    <mask id="${p}-cut" maskUnits="userSpaceOnUse" x="-4" y="-4" width="72" height="72">
      <rect x="-4" y="-4" width="72" height="72" fill="#fff"/>
      <path d="M-4 22H40L24 42H68" stroke="#000" stroke-width="5.5" stroke-linejoin="round"/>
    </mask>
    <clipPath id="${p}-t"><path d="M-4-4H68V42H24L40 22H-4Z"/></clipPath>
    <clipPath id="${p}-b"><path d="M-4 22H40L24 42H68V68H-4Z"/></clipPath>
  </defs>
  <g mask="url(#${p}-cut)">
    <circle cx="32" cy="32" r="28" fill="${top}" clip-path="url(#${p}-t)"/>
    <circle cx="32" cy="32" r="28" fill="${bottom}" clip-path="url(#${p}-b)"/>
  </g>`;
const svg = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none">${body}\n</svg>\n`;
const wordmark = (fill) => `<text x="74" y="44.5" font-family="'Inter Display','Inter',ui-sans-serif,system-ui,sans-serif" font-size="36" font-weight="600" letter-spacing="-1.4" fill="${fill}">byzon</text>`;

const files = {
  'byzon-mark.svg': svg('0 0 64 64', mark('m')),
  'byzon-mark-mono-white.svg': svg('0 0 64 64', mark('w', '#fff', '#fff')),
  'byzon-mark-mono-black.svg': svg('0 0 64 64', mark('k', '#000', '#000')),
  'byzon-logo-dark.svg': svg('0 0 186 64', mark('d') + wordmark('#fff')),
  'byzon-logo-light.svg': svg('0 0 186 64', mark('l', '#0B0B0D') + wordmark('#0B0B0D')),
  'byzon-app-icon.svg': svg('0 0 512 512', `
  <defs>
    <radialGradient id="g" cx="0.25" cy="0.9" r="0.9"><stop offset="0" stop-color="#173A9E" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="e" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="1" stop-color="#fff" stop-opacity="0.03"/></linearGradient>
  </defs>
  <rect width="512" height="512" rx="116" fill="#0B0B0D"/>
  <rect width="512" height="512" rx="116" fill="url(#g)"/>
  <rect x="1" y="1" width="510" height="510" rx="115" stroke="url(#e)" stroke-width="2"/>
  <g transform="translate(96 96) scale(5)">${mark('a')}</g>`),
};
for (const [n, c] of Object.entries(files)) writeFileSync(`${out}/${n}`, c);
// preview page
const tile = (bg, f, w) => `<div style="background:${bg};padding:40px;display:flex;align-items:center;justify-content:center"><img src="${f}" width="${w}"></div>`;
writeFileSync(`${out}/preview.html`, `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" rel="stylesheet"></head><body style="margin:0;display:grid;grid-template-columns:1fr 1fr 1fr;font-family:Inter">
${tile('#000','byzon-mark.svg',160)}${tile('#000','byzon-app-icon.svg',200)}${tile('#9aa1ab','byzon-app-icon.svg',96)}
${tile('#000','byzon-logo-dark.svg',360)}${tile('#F4F4F5','byzon-logo-light.svg',360)}${tile('#141417','byzon-mark.svg',32)}
</body></html>`);
console.log(Object.keys(files).join('\n'));
