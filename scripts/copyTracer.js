/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/explicit-function-return-type */
const fs = require('fs')
const path = require('path')

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function copyWithRetries(src, dst, attempts = 6, delay = 500) {
  for (let i = 0; i < attempts; i++) {
    try {
      if (!fs.existsSync(src)) {
        console.warn('tracer binary not found:', src)
        return
      }
      fs.mkdirSync(path.dirname(dst), { recursive: true })
      fs.copyFileSync(src, dst)
      console.log('Copied tracer to', dst)
      return
    } catch (err) {
      if (err && err.code === 'EBUSY') {
        console.warn(`EBUSY when copying tracer (attempt ${i + 1}/${attempts})`)
        // Try to kill running tracer process on Windows/Linux and retry
        try {
          if (process.platform === 'win32') {
            // taskkill may require elevation; still attempt
            const { execFileSync } = require('child_process')
            const name = path.basename(src)
            const out = execFileSync('tasklist', ['/FI', `IMAGENAME eq ${name}`, '/NH'], {
              encoding: 'utf8'
            })
            if (!out.includes('No tasks')) {
              try {
                execFileSync('taskkill', ['/F', '/IM', name])
                console.log('Terminated running tracer process')
              } catch (killErr) {
                console.warn('Failed to terminate tracer process:', killErr && killErr.message)
              }
            }
          } else {
            // Unix: pgrep + kill
            const { execFileSync } = require('child_process')
            try {
              const pidOut = execFileSync('pgrep', ['-f', path.basename(src)], {
                encoding: 'utf8'
              }).trim()
              if (pidOut) {
                execFileSync('pkill', ['-f', path.basename(src)])
                console.log('Terminated running tracer process')
              }
            } catch {
              /* ignore: no pids or failure */
            }
          }
        } catch {
          /* ignore */
        }
        if (i < attempts - 1) {
          await sleep(delay)
          continue
        }
      }
      console.warn('Failed to copy tracer:', err && err.message ? err.message : err)
      return
    }
  }
}

const src = path.join(
  __dirname,
  '..',
  'tracer',
  'target',
  'release',
  process.platform === 'win32' ? 'unreal_launcher_tracer.exe' : 'unreal_launcher_tracer'
)
const dst = path.join(__dirname, '..', 'resources', path.basename(src))

copyWithRetries(src, dst).catch((e) => console.error(e))
