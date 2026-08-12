const fs = require('fs')
const path = require('path')

const dist = path.join(__dirname, '..', 'native', 'dist')
if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist, { recursive: true })
}

const filesToCopy = ['index.win32-x64-msvc.node', 'index.d.ts', 'index.node']
for (const file of filesToCopy) {
  const src = path.join(__dirname, '..', 'native', file)
  const dst = path.join(dist, file)
  if (fs.existsSync(src)) {
    try {
      if (fs.existsSync(dst)) {
        try {
          fs.unlinkSync(dst)
        } catch {}
      }
      fs.copyFileSync(src, dst)
      console.log(`Copied ${file} to native/dist/`)
    } catch (err) {
      if (err.code === 'EBUSY') {
        console.log(`Note: ${file} is currently locked by running process in native/dist/ (using live native module in resources/)`)
      } else {
        console.warn(`Could not copy ${file} to native/dist/ (${err.message})`)
      }
    }
  }
}

const indexJs = `const { platform, arch } = process;
const path = require('path');
let nativeModule;
if (platform === 'win32') {
  if (arch === 'x64') {
    nativeModule = require(path.join(__dirname, 'index.win32-x64-msvc.node'));
  } else if (arch === 'ia32') {
    nativeModule = require(path.join(__dirname, 'index.win32-ia32-msvc.node'));
  } else if (arch === 'arm64') {
    nativeModule = require(path.join(__dirname, 'index.win32-arm64-msvc.node'));
  }
} else if (platform === 'linux') {
  if (arch === 'x64') {
    nativeModule = require(path.join(__dirname, 'index.linux-x64-gnu.node'));
  }
} else if (platform === 'darwin') {
  if (arch === 'x64') {
    nativeModule = require(path.join(__dirname, 'index.darwin-x64.node'));
  } else if (arch === 'arm64') {
    nativeModule = require(path.join(__dirname, 'index.darwin-arm64.node'));
  }
}
if (!nativeModule) {
  try {
    nativeModule = require(path.join(__dirname, 'index.node'));
  } catch {}
}
if (!nativeModule) {
  throw new Error(\`No native module found for \${platform} \${arch}\`);
}
module.exports = nativeModule;
`

fs.writeFileSync(path.join(dist, 'index.js'), indexJs)
console.log('Created native/dist/index.js')
