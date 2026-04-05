import { create } from 'zustand'
import type { PageType } from '../types'

const PAGES: PageType[] = ['Engines', 'Projects', 'Settings', 'About']
const KEY = 'lastOpenPage'

const savedPage = localStorage.getItem(KEY) as PageType | null
const initialPage: PageType = savedPage && PAGES.includes(savedPage) ? savedPage : 'Engines'

interface PagesStore {
  currentPage: PageType
  setCurrentPage: (page: PageType) => void
}

const usePagesStore = create<PagesStore>()((set) => ({
  currentPage: initialPage,
  setCurrentPage: (page) => {
    localStorage.setItem(KEY, page)
    set({ currentPage: page })
  }
}))

export default usePagesStore
