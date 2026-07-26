const fs = require('fs')
const path = require('path')

const mdPath = path.join(__dirname, '..', 'CHANGELOG.md')
let md = fs.readFileSync(mdPath, 'utf8')
md = md.replace(/### ⚙️ /g, '### ')
       .replace(/### ✨ /g, '### ')
       .replace(/### 🐛 /g, '### ')
fs.writeFileSync(mdPath, md)
console.log('Cleaned emojis from CHANGELOG.md')

const jsonPath = path.join(__dirname, '..', 'CHANGELOG.json')
let jsonObj = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
for (const v of jsonObj.versions) {
  if (Array.isArray(v.sections)) {
    for (const s of v.sections) {
      delete s.emoji
    }
  }
}
fs.writeFileSync(jsonPath, JSON.stringify(jsonObj, null, 2) + '\n')
console.log('Cleaned emojis from CHANGELOG.json')
