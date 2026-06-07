'use client'

import { useRef, useState } from 'react'

const SWIPE_THRESHOLD = 40

export function useCompartmentCard(onEnter: () => void) {
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    setDragX(e.touches[0].clientX - touchStartX.current)
    setDragY(e.touches[0].clientY - touchStartY.current)
  }

  function resetDrag() {
    touchStartX.current = null
    touchStartY.current = null
    setIsDragging(false)
    setDragX(0)
    setDragY(0)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    resetDrag()
    if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
      onEnter()
    }
  }

  function handleTouchCancel() {
    resetDrag()
  }

  return {
    dragX, dragY, isDragging,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  }
}
