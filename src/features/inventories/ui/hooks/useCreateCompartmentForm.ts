'use client'
import { useState } from 'react'

export function useCreateCompartmentForm(onSubmit: (name: string) => void) {
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setNameError(true); return }
    onSubmit(name.trim())
  }

  function handleNameChange(value: string) {
    setName(value)
    if (nameError) setNameError(false)
  }

  return { name, nameError, handleNameChange, handleSubmit }
}
