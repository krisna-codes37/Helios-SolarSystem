import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type Star = { x: number; y: number; z: number; phase: number; size: number }
type Trace = { x: number; y: number; born: number; hue: number }

/** A light, pointer-aware starfield that drifts at different rates as the page scrolls. */
export function SpaceEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const stars: Star[] = Array.from({ length: 150 }, (_, index) => {
      const random = (seed: number) => {
        const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
        return value - Math.floor(value)
      }
      return { x: random(index + 1), y: random(index + 301), z: .2 + random(index + 601) * .8, phase: random(index + 901) * 6.28, size: .35 + random(index + 1201) * 1.05 }
    })
    const traces: Trace[] = []
    let width = 0
    let height = 0
    let pixelRatio = 1
    let scrollY = window.scrollY
    let frame = 0
    let lastPointer = 0

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || reducedMotion) return
      const now = performance.now()
      if (now - lastPointer < 18) return
      lastPointer = now
      traces.push({ x: event.clientX, y: event.clientY, born: now, hue: (event.clientX / Math.max(width, 1) * 45 + 195) % 360 })
      if (traces.length > 24) traces.shift()
    }
    const onScroll = () => { scrollY = window.scrollY }
    const draw = (now: number) => {
      context.clearRect(0, 0, width, height)
      for (const star of stars) {
        const y = (star.y * (height + 40) - scrollY * star.z * .075 + now * star.z * .003) % (height + 40)
        const wrappedY = y < 0 ? y + height + 40 : y
        const twinkle = .34 + (Math.sin(now * .0007 + star.phase) + 1) * .2
        context.globalAlpha = twinkle * star.z
        context.fillStyle = '#c7d9ef'
        context.beginPath()
        context.arc(star.x * width, wrappedY - 20, star.size * star.z, 0, Math.PI * 2)
        context.fill()
      }
      for (let index = traces.length - 1; index >= 0; index--) {
        const trace = traces[index]
        const age = now - trace.born
        if (age > 700) { traces.splice(index, 1); continue }
        const opacity = (1 - age / 700) * .44
        const radius = Math.max(0, (1 - age / 700) * 2.8)
        const glow = context.createRadialGradient(trace.x, trace.y, 0, trace.x, trace.y, 17)
        glow.addColorStop(0, `hsla(${trace.hue}, 78%, 82%, ${opacity})`)
        glow.addColorStop(1, `hsla(${trace.hue}, 78%, 72%, 0)`)
        context.globalAlpha = 1
        context.fillStyle = glow
        context.beginPath()
        context.arc(trace.x, trace.y, 17, 0, Math.PI * 2)
        context.fill()
        context.fillStyle = `hsla(${trace.hue}, 80%, 90%, ${opacity})`
        context.beginPath()
        context.arc(trace.x, trace.y, radius, 0, Math.PI * 2)
        context.fill()
      }
      context.globalAlpha = 1
      frame = window.requestAnimationFrame(draw)
    }
    resize()
    frame = window.requestAnimationFrame(draw)
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return createPortal(<canvas ref={canvasRef} className="space-effects" aria-hidden="true" />, document.body)
}
