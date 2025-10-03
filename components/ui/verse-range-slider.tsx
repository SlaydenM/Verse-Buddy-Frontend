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

  const handleMouseDown = useCallback(
    (type: "start" | "end") => (e: React.MouseEvent) => {
      if (disabled) return
      e.preventDefault()
      setIsDragging(type)
    },
    [disabled],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || disabled) return

      const newValue = getValueFromPosition(e.clientX)

      if (isDragging === "start") {
        if (newValue > endValue) {
          // Start handle moved past end handle - swap them
          onStartChange(endValue)
          onEndChange(newValue)
          setIsDragging("end") // Continue dragging as the end handle
        } else {
          onStartChange(newValue)
        }
      } else if (isDragging === "end") {
        if (newValue < startValue) {
          // End handle moved past start handle - swap them
          onEndChange(startValue)
          onStartChange(newValue)
          setIsDragging("start") // Continue dragging as the start handle
        } else {
          onEndChange(newValue)
        }
      }
    },
    [isDragging, disabled, getValueFromPosition, startValue, endValue, onStartChange, onEndChange],
  )

  const handleMouseUp = useCallback(() => {
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
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const startPercentage = getPercentage(startValue)
  const endPercentage = getPercentage(endValue)
  const transitionClass = isDragging ? "" : "transition-all duration-200 ease-out"

  return (
    <div className="space-y-3">
      <div
        ref={sliderRef}
        className={`relative h-2 bg-muted rounded-full cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
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

        {/* Start handle */}
        <div
          className={`absolute top-1/2 w-5 h-5 bg-background border-2 border-primary rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 hover:scale-110 ${transitionClass} ${disabled ? "cursor-not-allowed" : ""}`}
          style={{ left: `${startPercentage}%` }}
          onMouseDown={handleMouseDown("start")}
        />

        {/* End handle */}
        <div
          className={`absolute top-1/2 w-5 h-5 bg-background border-2 border-primary rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 hover:scale-110 ${transitionClass} ${disabled ? "cursor-not-allowed" : ""}`}
          style={{ left: `${endPercentage}%` }}
          onMouseDown={handleMouseDown("end")}
        />
      </div>

      {/* Value display with button in center */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Verse {startValue}</span>
        <div>
          <button
            onClick={handleSelectStart}
            disabled={disabled}
            className="mx-3 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select Verse {startValue}
          </button>
          <button
            onClick={handleSelectFullChapter}
            disabled={disabled}
            className="mx-3 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select Full Chapter
          </button>
        </div>
        <span>Verse {endValue}</span>
      </div>
    </div>
  )
}
