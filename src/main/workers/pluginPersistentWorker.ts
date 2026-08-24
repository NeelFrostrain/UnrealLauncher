// Lightweight persistent worker helper for reusing a Worker thread
import { Worker } from 'worker_threads'
import { spawnWorker } from './workers'

export type PersistentWorker = {
  run: (payload: Record<string, unknown>) => Promise<unknown>
  terminate: () => void
}

export function createPersistentWorker(code: string): PersistentWorker {
  const w: Worker = spawnWorker(code, {})
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>()
  let nextId = 1

  type WorkerMsg = { reqId?: number; error?: unknown; plugins?: unknown; result?: unknown }

  w.on('message', (msg: unknown) => {
    if (!msg || typeof msg !== 'object') return
    const m = msg as WorkerMsg
    const id = m.reqId
    if (typeof id !== 'number') return
    const p = pending.get(id)
    if (!p) return
    pending.delete(id)
    if (m.error) p.reject(new Error(String(m.error)))
    else p.resolve(m.plugins ?? m.result ?? null)
  })

  w.on('error', (err) => {
    for (const p of pending.values()) p.reject(err)
    pending.clear()
  })

  return {
    run(payload: Record<string, unknown>) {
      return new Promise<unknown>((resolve, reject) => {
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
