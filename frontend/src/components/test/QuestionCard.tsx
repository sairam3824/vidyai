'use client'

import { cn } from '@/lib/utils'
import type { MCQQuestion } from '@/types'

interface QuestionCardProps {
  question: MCQQuestion
  index: number
  selectedAnswer?: string
  onAnswer: (questionId: number, key: string) => void
  showResult?: boolean
  userAnswer?: string | null
  disabled?: boolean
}

export function QuestionCard({
  question,
  index,
  selectedAnswer,
  onAnswer,
  showResult,
  userAnswer,
  disabled,
}: QuestionCardProps) {
  const resolvedUserAnswer = userAnswer ?? selectedAnswer
  const selectedOption = question.options.find((opt) => opt.key === resolvedUserAnswer)
  const correctOption = question.options.find((opt) => opt.key === question.correct_answer)

  const selectedAnswerLabel = selectedOption
    ? `${selectedOption.key}. ${selectedOption.text}`
    : resolvedUserAnswer
      ? resolvedUserAnswer
      : 'Not answered'
  const correctAnswerLabel = correctOption
    ? `${correctOption.key}. ${correctOption.text}`
    : question.correct_answer
  const explanationText = question.explanation?.trim() || 'No explanation available.'

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-950/5 overflow-hidden">
      {/* Question header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-start gap-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0 mt-0.5">
          {index + 1}
        </span>
        <p className="text-sm font-medium text-gray-900 leading-relaxed">{question.question}</p>
      </div>

      {/* Options */}
      <div className="px-4 sm:px-6 py-4 space-y-2.5">
        {question.options.map((opt) => {
          const isSelected = resolvedUserAnswer === opt.key
          const isCorrect = opt.key === question.correct_answer
          const isWrong = showResult && isSelected && !isCorrect

          let optionClass =
            'flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm text-left transition-all duration-150 ring-1 ring-inset cursor-pointer'

          if (!showResult) {
            optionClass += isSelected
              ? ' bg-indigo-50 ring-indigo-400 text-indigo-800 font-medium'
              : ' bg-gray-50 ring-gray-200 text-gray-700 hover:bg-indigo-50 hover:ring-indigo-300 hover:text-indigo-700'
          } else {
            if (isCorrect) {
              optionClass += ' bg-emerald-50 ring-emerald-400 text-emerald-800 font-medium'
            } else if (isWrong) {
              optionClass += ' bg-red-50 ring-red-400 text-red-800'
            } else {
              optionClass += ' bg-gray-50 ring-gray-200 text-gray-600'
            }
          }

          return (
            <button
              key={opt.key}
              type="button"
              disabled={disabled || showResult}
              className={optionClass}
              onClick={() => onAnswer(question.id, opt.key)}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0',
                  !showResult && isSelected ? 'bg-indigo-600 text-white' : '',
                  showResult && isCorrect ? 'bg-emerald-600 text-white' : '',
                  showResult && isWrong ? 'bg-red-500 text-white' : '',
                  !isSelected && !showResult ? 'bg-gray-200 text-gray-600' : '',
                  showResult && !isCorrect && !isWrong ? 'bg-gray-200 text-gray-500' : '',
                )}
              >
                {opt.key}
              </span>
              <span className="flex-1">{opt.text}</span>
            </button>
          )
        })}
      </div>

      {/* Explanation (after submit) */}
      {showResult && (
        <div className="px-4 sm:px-6 py-3 bg-blue-50 border-t border-blue-100 space-y-1.5">
          <p className="text-xs text-gray-700">
            <span className="font-semibold">Your answer:</span> {selectedAnswerLabel}
          </p>
          <p className="text-xs text-emerald-800">
            <span className="font-semibold">Correct answer:</span> {correctAnswerLabel}
          </p>
          <p className="text-xs font-semibold text-blue-700 mb-0.5">Explanation</p>
          <p className="text-xs text-blue-800 leading-relaxed overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
            {explanationText}
          </p>
        </div>
      )}
    </div>
  )
}
