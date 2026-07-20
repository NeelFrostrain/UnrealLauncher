// Copyright (c) 2026 NeelFrostrain. All rights reserved.
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('Building native Rust modules...')
try {
  execSync('npx napi build --platform --release --manifest-path native/Cargo.toml', {
    stdio: 'inherit'
  })
} catch (err) {
  console.error('Cargo compilation failed:', err)
  process.exit(1)
}

const distDir = path.join('native', 'dist')
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

const files = ['index.d.ts', 'index.win32-x64-msvc.node']

files.forEach((f) => {
  const src = path.join('native', f)
  const dst = path.join(distDir, f)

  if (fs.existsSync(src)) {
    if (fs.existsSync(dst)) {
      try {
        // Windows file locking trick: rename locked target file first, then write the new one
        const tempOld = dst + '.' + Date.now() + '.old'
        fs.renameSync(dst, tempOld)
        console.log(`Renamed active binary to temp backup: ${tempOld}`)

        // Clean up older temp files if possible
        const parent = path.dirname(dst)
        fs.readdirSync(parent).forEach((oldFile) => {
          if (oldFile.endsWith('.old') && oldFile !== path.basename(tempOld)) {
            try {
              fs.unlinkSync(path.join(parent, oldFile))
            } catch {
              // ignore locked backups
            }
          }
        })
      } catch (err) {
        console.warn(`Could not rename old destination ${dst}:`, err.message)
      }
    }

    try {
      fs.renameSync(src, dst)
      console.log(`Moved ${src} -> ${dst}`)
    } catch (err) {
      console.error(`Failed to move ${src} -> ${dst}:`, err)
      process.exit(1)
    }
  }
})

// Write index.js wrapper
const indexJs = `const { platform, arch } = process;
const path = require("path");
let nativeModule;
if (platform === "win32") {
  if (arch === "x64") {
    nativeModule = require(path.join(__dirname, "index.win32-x64-msvc.node"));
  } else if (arch === "ia32") {
    nativeModule = require(path.join(__dirname, "index.win32-ia32-msvc.node"));
  } else if (arch === "arm64") {
    nativeModule = require(path.join(__dirname, "index.win32-arm64-msvc.node"));
  }
} else if (platform === "linux") {
  if (arch === "x64") {
    nativeModule = require(path.join(__dirname, "index.linux-x64-gnu.node"));
  }
} else if (platform === "darwin") {
  if (arch === "x64") {
    nativeModule = require(path.join(__dirname, "index.darwin-x64.node"));
  } else if (arch === "arm64") {
    nativeModule = require(path.join(__dirname, "index.darwin-arm64.node"));
  }
}
if (!nativeModule) {
  throw new Error(\`No native module found for \${platform} \${arch}\`);
}
module.exports = nativeModule;`

fs.writeFileSync(path.join(distDir, 'index.js'), indexJs, 'utf8')
console.log('Native build completed successfully!')
