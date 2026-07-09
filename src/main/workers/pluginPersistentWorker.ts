// Lightweight persistent worker helper for reusing a Worker thread
import { Worker } from 'worker_threads'
import { spawnWorker } from './workers'

export type PersistentWorker = {
  run: (payload: Record<string, unknown>) => Promise<any>
  terminate: () => void
}

export function createPersistentWorker(code: string): PersistentWorker {
  const w: Worker = spawnWorker(code, {})
  const pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>()
  let nextId = 1

  w.on('message', (msg: any) => {
    if (!msg || typeof msg !== 'object') return
    const id = msg.reqId
    if (typeof id !== 'number') return
    const p = pending.get(id)
    if (!p) return
    pending.delete(id)
    if (msg.error) p.reject(new Error(String(msg.error)))
    else p.resolve(msg.plugins ?? msg.result ?? null)
  })

  w.on('error', (err) => {
    for (const p of pending.values()) p.reject(err)
    pending.clear()
  })

  return {
    run(payload: Record<string, unknown>) {
      return new Promise((resolve, reject) => {
        const id = nextId++
        pending.set(id, { resolve, reject })
        try {
          w.postMessage({ reqId: id, ...payload })
        } catch (err) {
          pending.delete(id)
          reject(err)
        }
      })
    },
    terminate() {
      try {
        w.terminate()
      } catch {
        /* ignore */
      }
    }
  }
}
