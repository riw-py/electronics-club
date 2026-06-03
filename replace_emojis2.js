const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\ASUS ROG ZEPHYRUS\\OneDrive\\Desktop\\electronics-club\\frontend';

const replacements = {
  '📂': '<i class="fa-regular fa-folder-open"></i>',
  '📖': '<i class="fa-solid fa-book-open"></i>',
  '☰': '<i class="fa-solid fa-bars"></i>',
  '✕': '<i class="fa-solid fa-xmark"></i>',
  '❌': '<i class="fa-solid fa-circle-xmark"></i>',
  '🔑': '<i class="fa-solid fa-key"></i>',
  '✉': '<i class="fa-regular fa-envelope"></i>',
  '🔒': '<i class="fa-solid fa-lock"></i>',
  '🙈': '<i class="fa-regular fa-eye-slash"></i>',
  '🎓': '<i class="fa-solid fa-graduation-cap"></i>',
  '🏫': '<i class="fa-solid fa-school"></i>',
  '📱': '<i class="fa-solid fa-mobile-screen"></i>',
  '🏠': '<i class="fa-solid fa-house"></i>',
  '🗑️': '<i class="fa-solid fa-trash-can"></i>'
};

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const [emoji, icon] of Object.entries(replacements)) {
        if (content.includes(emoji)) {
          content = content.split(emoji).join(icon);
          changed = true;
        }
      }
      
      if (fullPath.endsWith('.html') && !content.includes('font-awesome')) {
        const cdn = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">\n  <link rel="stylesheet" href="css/main.css">';
        content = content.replace('<link rel="stylesheet" href="css/main.css">', cdn);
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

processDir(dir);
console.log('Done replacing all remaining emojis');
