'use client'

import { useState } from 'react'
import { submitFeedbackAction } from '../../domain/actions'

export function useRatingScreen(controlId: string, onDone: () => void) {
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>()

  async function handleSubmit() {
    if (rating === null) return
    if (rating < 5 && !comment.trim()) {
      setCommentError('Un commentaire est requis pour une note inférieure à 5.')
      return
    }
    setCommentError(undefined)
    setIsSubmitting(true)
    setError(undefined)
    const result = await submitFeedbackAction({ controlId, rating, comment })
    setIsSubmitting(false)
    if (!result.ok) { setError(result.error); return }
    onDone()
  }

  function handleCommentChange(value: string) {
    setComment(value)
    if (commentError) setCommentError(undefined)
  }

  return { rating, setRating, comment, handleCommentChange, commentError, isSubmitting, error, handleSubmit }
}
