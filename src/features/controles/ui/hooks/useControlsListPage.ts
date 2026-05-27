'use client'

import { useState } from 'react'
import type { ControlSummary } from '../../domain/types'

const PAGE_SIZE = 20

export function useControlsListPage(controls: ControlSummary[]) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(controls.length / PAGE_SIZE))
  const start = (currentPage - 1) * PAGE_SIZE
  const paginatedControls = controls.slice(start, start + PAGE_SIZE)

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(1, page), totalPages))
  }

  return { paginatedControls, currentPage, totalPages, goToPage }
}
