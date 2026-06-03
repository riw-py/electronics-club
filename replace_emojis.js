const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\ASUS ROG ZEPHYRUS\\.gemini\\antigravity-ide\\scratch\\electronics-club\\frontend';

const replacements = {
  '⚡': '<i class="fa-solid fa-bolt"></i>',
  '🏠': '<i class="fa-solid fa-house"></i>',
  '📰': '<i class="fa-solid fa-newspaper"></i>',
  '📅': '<i class="fa-regular fa-calendar-days"></i>',
  '📁': '<i class="fa-regular fa-folder-open"></i>',
  '📊': '<i class="fa-solid fa-chart-line"></i>',
  '👥': '<i class="fa-solid fa-users"></i>',
  '👤': '<i class="fa-regular fa-user"></i>',
  '🚪': '<i class="fa-solid fa-right-from-bracket"></i>',
  '🔔': '<i class="fa-regular fa-bell"></i>',
  '🏆': '<i class="fa-solid fa-trophy"></i>',
  '⚙️': '<i class="fa-solid fa-gear"></i>',
  '📞': '<i class="fa-solid fa-phone"></i>',
  '📧': '<i class="fa-solid fa-envelope"></i>',
  '📘': '<i class="fa-brands fa-facebook"></i>',
  '🚮': '<i class="fa-solid fa-trash-can"></i>',
  '🗑️': '<i class="fa-solid fa-trash-can"></i>',
  '✏️': '<i class="fa-solid fa-pen"></i>',
  '👁️': '<i class="fa-regular fa-eye"></i>',
  '➕': '<i class="fa-solid fa-plus"></i>',
  '🔍': '<i class="fa-solid fa-magnifying-glass"></i>',
  '💾': '<i class="fa-solid fa-floppy-disk"></i>',
  '🖼️': '<i class="fa-regular fa-image"></i>',
  '📍': '<i class="fa-solid fa-location-dot"></i>',
  '🏷️': '<i class="fa-solid fa-tag"></i>',
  '📕': '<i class="fa-solid fa-file-pdf"></i>',
  '📗': '<i class="fa-solid fa-file-excel"></i>',
  '📙': '<i class="fa-solid fa-file-powerpoint"></i>',
  '📘': '<i class="fa-solid fa-file-word"></i>',
  '📄': '<i class="fa-solid fa-file-lines"></i>',
  '📎': '<i class="fa-solid fa-paperclip"></i>',
  '⬇️': '<i class="fa-solid fa-download"></i>',
  '📤': '<i class="fa-solid fa-file-arrow-up"></i>',
  '✅': '<i class="fa-solid fa-check"></i>',
  '⚠️': '<i class="fa-solid fa-triangle-exclamation"></i>',
  '📝': '<i class="fa-solid fa-pen-to-square"></i>',
  '🔐': '<i class="fa-solid fa-lock"></i>',
  'ℹ️': '<i class="fa-solid fa-circle-info"></i>',
  '✍️': '<i class="fa-solid fa-pen-nib"></i>',
  '🗒️': '<i class="fa-solid fa-clipboard-list"></i>',
  '🔬': '<i class="fa-solid fa-flask"></i>',
  '📦': '<i class="fa-solid fa-box-archive"></i>'
};

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace emojis
      for (const [emoji, icon] of Object.entries(replacements)) {
        content = content.split(emoji).join(icon);
      }
      
      // Inject CDN to HTML if not present
      if (fullPath.endsWith('.html') && !content.includes('font-awesome')) {
        const cdn = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">\n  <link rel="stylesheet" href="css/main.css">';
        content = content.replace('<link rel="stylesheet" href="css/main.css">', cdn);
      }
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir(dir);
console.log('Replaced emojis with Font Awesome icons successfully!');
