'use client'

import { useRatingScreen } from './hooks/useRatingScreen'

interface RatingScreenProps {
  controlId: string
  onDone: () => void
}

export function RatingScreen({ controlId, onDone }: RatingScreenProps) {
  const { rating, setRating, comment, handleCommentChange, commentError, isSubmitting, error, handleSubmit } = useRatingScreen(controlId, onDone)

  return (
    <div className="flex flex-col min-h-dvh bg-white px-5 pt-14 pb-10">
      <h1 className="text-2xl font-bold text-slate-900">Comment s'est passé le contrôle ?</h1>
      <p className="text-slate-400 text-sm mt-1 mb-8">Votre avis nous aide à améliorer l'outil.</p>

      <div className="flex gap-4 mb-6" role="group" aria-label="Note de 1 à 5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
            className="text-4xl transition-transform active:scale-90"
          >
            {rating !== null && n <= rating ? '★' : '☆'}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <textarea
          value={comment}
          onChange={(e) => handleCommentChange(e.target.value)}
          placeholder="Qu'est-ce qui pourrait être amélioré ?"
          rows={4}
          className={`w-full rounded-xl border-2 px-3 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors resize-none ${commentError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
        />
        {commentError && (
          <p role="alert" className="mt-1.5 text-sm text-red-600">{commentError}</p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!rating || isSubmitting}
        className="w-full h-14 rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-md shadow-blue-100 disabled:opacity-50 active:scale-95 transition-transform mb-4"
      >
        {isSubmitting ? 'Envoi en cours…' : error ? 'Réessayer' : 'Envoyer'}
      </button>

      <button
        onClick={onDone}
        disabled={isSubmitting}
        className="text-slate-400 text-sm text-center hover:underline underline-offset-2"
      >
        Passer
      </button>
    </div>
  )
}
