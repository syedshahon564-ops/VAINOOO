const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const filesToUpdate = [
  'mobile-app/android/app/src/main/java/com/ffrivalstour/app/PayBotKeepAliveService.java',
  'mobile-app/capacitor.config.json',
  'mobile-app/www/index.html',
  'mobile-app/www/offline.html',
  'run.bat'
];

const targetPattern = /https:\/\/hospitable-perception-production-d721\.up\.railway\.app/g;
const replacement = 'https://ffrivalstourbd.com';

filesToUpdate.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('hospitable-perception-production-d721.up.railway.app')) {
      content = content.replace(targetPattern, replacement);
      // Also in capacitor.config.json, server.allowNavigation has the host without https://
      content = content.replace(/hospitable-perception-production-d721\.up\.railway\.app/g, 'ffrivalstourbd.com');
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log('Updated: ' + relPath);
    } else {
      console.log('No match in: ' + relPath);
    }
  } else {
    console.log('Not found: ' + relPath);
  }
});
