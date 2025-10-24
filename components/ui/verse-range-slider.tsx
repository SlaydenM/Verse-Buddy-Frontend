"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"

interface VerseRangeSliderProps {
  min: number
  max: number
  startValue: number
  endValue: number
  onStartChange: (value: number) => void
  onEndChange: (value: number) => void
  disabled?: boolean
}

export function VerseRangeSlider({
  min,
  max,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  disabled = false,
}: VerseRangeSliderProps) {
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  const getPercentage = useCallback(
    (value: number) => {
      return ((value - min) / (max - min)) * 100
    },
    [min, max],
  )

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return min

      const rect = sliderRef.current.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const rawValue = min + percentage * (max - min)
      return Math.round(rawValue)
    },
    [min, max],
  )

  const handlePointerDown = useCallback(
    (type: "start" | "end") => (e: React.PointerEvent) => {
      if (disabled) return
      e.preventDefault()
      setIsDragging(type)
      // Capture pointer for smooth dragging
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [disabled],
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || disabled) return

      const newValue = getValueFromPosition(e.clientX)

      if (isDragging === "start") {
        if (newValue > endValue) {
          onStartChange(endValue)
          onEndChange(newValue)
          setIsDragging("end")
        } else {
          onStartChange(newValue)
        }
      } else if (isDragging === "end") {
        if (newValue < startValue) {
          onEndChange(startValue)
          onStartChange(newValue)
          setIsDragging("start")
        } else {
          onEndChange(newValue)
        }
      }
    },
    [isDragging, disabled, getValueFromPosition, startValue, endValue, onStartChange, onEndChange],
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || isDragging) return

      const newValue = getValueFromPosition(e.clientX)
      const distanceToStart = Math.abs(newValue - startValue)
      const distanceToEnd = Math.abs(newValue - endValue)

      if (distanceToStart <= distanceToEnd) {
        const clampedValue = Math.min(newValue, endValue)
        onStartChange(clampedValue)
      } else {
        const clampedValue = Math.max(newValue, startValue)
        onEndChange(clampedValue)
      }
    },
    [disabled, isDragging, getValueFromPosition, startValue, endValue, onStartChange, onEndChange],
  )

  const handleSelectFullChapter = () => {
    onStartChange(1)
    onEndChange(max)
  }

  const handleSelectStart = () => {
    onEndChange(startValue)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("pointermove", handlePointerMove)
      document.addEventListener("pointerup", handlePointerUp)
      return () => {
        document.removeEventListener("pointermove", handlePointerMove)
        document.removeEventListener("pointerup", handlePointerUp)
      }
    }
  }, [isDragging, handlePointerMove, handlePointerUp])

  const startPercentage = getPercentage(startValue)
  const endPercentage = getPercentage(endValue)
  const transitionClass = isDragging ? "" : "transition-all duration-200 ease-out"

  return (
    <div className="space-y-3 sm:space-y-4">
      <div
        ref={sliderRef}
        className={`relative h-1 sm:h-1.5 bg-muted rounded-full cursor-pointer touch-none ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={handleTrackClick}
      >
        {/* Track */}
        <div className="absolute inset-0 bg-muted rounded-full" />

        {/* Active range */}
        <div
          className={`absolute top-0 bottom-0 bg-primary rounded-full ${transitionClass}`}
          style={{
            left: `${startPercentage}%`,
            width: `${endPercentage - startPercentage}%`,
          }}
        />

        {/* Start handle - larger for touch */}
        <div
          className={`absolute top-1/2 w-7 h-7 sm:w-6 sm:h-6 bg-background border-2 border-primary rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 hover:scale-110 active:scale-125 ${transitionClass} ${disabled ? "cursor-not-allowed" : ""}`}
          style={{ left: `${startPercentage}%` }}
          onPointerDown={handlePointerDown("start")}
        />

        {/* End handle - larger for touch */}
        <div
          className={`absolute top-1/2 w-7 h-7 sm:w-6 sm:h-6 bg-background border-2 border-primary rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 hover:scale-110 active:scale-125 ${transitionClass} ${disabled ? "cursor-not-allowed" : ""}`}
          style={{ left: `${endPercentage}%` }}
          onPointerDown={handlePointerDown("end")}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0 text-sm text-muted-foreground">
        <div className="flex justify-between sm:justify-start items-center sm:flex-1">
          <span className="text-xs sm:text-sm">Verse {startValue}</span>
          <span className="sm:hidden text-xs">Verse {endValue}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleSelectStart}
            disabled={disabled}
            className="px-4 py-2.5 sm:px-3 sm:py-1 text-sm sm:text-xs bg-muted hover:bg-muted/80 active:bg-muted/70 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            Select Verse {startValue}
          </button>
          <button
            onClick={handleSelectFullChapter}
            disabled={disabled}
            className="px-4 py-2.5 sm:px-3 sm:py-1 text-sm sm:text-xs bg-muted hover:bg-muted/80 active:bg-muted/70 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            Select Full Chapter
          </button>
        </div>

        <span className="hidden sm:block text-xs sm:text-sm sm:flex-1 text-right">Verse {endValue}</span>
      </div>
    </div>
  )
}
