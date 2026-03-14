import { create } from 'zustand'
import type { PageType } from '../types'

interface PagesStore {
  currentPage: PageType
  setCurrentPage: (page: PageType) => void
}

const usePagesStore = create<PagesStore>()((set) => ({
  currentPage: 'Engines',
  setCurrentPage: (page) => set({ currentPage: page })
}))

export default usePagesStore
