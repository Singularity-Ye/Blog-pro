import fs from 'fs';
import path from 'path';

const VAULT_ROOT = 'C:\\Users\\Yhx06\\Documents\\Obsidian Vault';

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      if (file.name !== '.git' && file.name !== '.obsidian') {
        walkDir(fullPath, callback);
      }
    } else if (file.isFile() && file.name.endsWith('.md')) {
      callback(fullPath);
    }
  }
}

let fixedCount = 0;

console.log('Scanning vault for frontmatter issues...');

walkDir(VAULT_ROOT, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex to match ```yaml ... ``` at the very beginning of the file (optionally after whitespace)
  const yamlBlockRegex = /^\s*```yaml\n([\s\S]*?)\n```/;
  const match = content.match(yamlBlockRegex);
  
  if (match) {
    const frontmatterContent = match[1];
    const newContent = content.replace(yamlBlockRegex, `---\n${frontmatterContent}\n---`);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✅ Fixed frontmatter format in: ${path.relative(VAULT_ROOT, filePath)}`);
    fixedCount++;
  }
});

console.log(`\nFrontmatter fix complete. Fixed ${fixedCount} files.`);
