"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // 3D tilt hover for interactive elements on hover-capable devices
    const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches
    if (!canHover) return

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>('button, [role="button"], .btn-3d, .text-glass-panel, .tilt-card')
    ).filter((el) => {
      // Exclude card arrows which rely on a base transform for vertical centering
      if (el.closest('#card-stack-container') && el.classList.contains('card-arrow')) return false
      return true
    })

    const maxTilt = 12 // degrees
    const zLift = 6 // px translateZ when hovered

    const handleMove = (e: MouseEvent) => {
      const el = e.currentTarget as HTMLElement
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const px = (x / rect.width) * 2 - 1 // -1 to 1
      const py = (y / rect.height) * 2 - 1 // -1 to 1
      const rx = -py * maxTilt
      const ry = px * maxTilt
      el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${zLift}px)`
    }

    const handleEnter = (e: MouseEvent) => {
      const el = e.currentTarget as HTMLElement
  el.style.transition = 'transform 120ms ease, box-shadow 180ms ease'
    }

    const handleLeave = (e: MouseEvent) => {
      const el = e.currentTarget as HTMLElement
      el.style.transition = 'transform 200ms ease, box-shadow 180ms ease'
      el.style.transform = ''
    }

    const handleDown = (e: MouseEvent) => {
      const el = e.currentTarget as HTMLElement
      // Slight press feedback while preserving tilt
      el.style.transform += ' scale(0.985)'
    }

    const handleUp = (e: MouseEvent) => {
      const el = e.currentTarget as HTMLElement
      // Remove press feedback, keep current tilt from move
      el.style.transform = el.style.transform.replace(/\s?scale\([^)]*\)/, '')
    }

    targets.forEach((el) => {
      // Mark as JS-tilt controlled so CSS hover doesn't fight transforms
      el.classList.add('btn-3d')
      el.addEventListener('mouseenter', handleEnter)
      el.addEventListener('mousemove', handleMove)
      el.addEventListener('mouseleave', handleLeave)
      el.addEventListener('mousedown', handleDown)
      el.addEventListener('mouseup', handleUp)
      el.addEventListener('blur', handleLeave as any)
    })

    return () => {
      targets.forEach((el) => {
        el.removeEventListener('mouseenter', handleEnter)
        el.removeEventListener('mousemove', handleMove)
        el.removeEventListener('mouseleave', handleLeave)
        el.removeEventListener('mousedown', handleDown)
        el.removeEventListener('mouseup', handleUp)
        el.removeEventListener('blur', handleLeave as any)
      })
    }
  }, [])

  useEffect(() => {
    // Count-up animation for hero tag numbers
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const format = new Intl.NumberFormat('en-US')

    const animateCount = (el: HTMLElement, target: number, duration = 1800) => {
      if (prefersReduced) {
        el.textContent = format.format(target)
        el.classList.remove('counting')
        return
      }
      const start = performance.now()
      const startVal = 0
      const endVal = target
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

      el.classList.add('counting')

      const tick = (now: number) => {
        const elapsed = now - start
        const t = Math.min(1, elapsed / duration)
        const eased = easeOutCubic(t)
        const current = Math.floor(startVal + (endVal - startVal) * eased)
        el.textContent = format.format(current)
        if (t < 1) {
          requestAnimationFrame(tick)
        } else {
          el.textContent = format.format(endVal)
          el.classList.remove('counting')
          el.setAttribute('data-counted', 'true')
        }
      }

      requestAnimationFrame(tick)
    }

    const values = Array.from(document.querySelectorAll<HTMLElement>('.hero-tag-value'))
    if (!values.length) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            if (el.getAttribute('data-counted') === 'true') return
            const targetStr = el.getAttribute('data-target') || '0'
            const target = parseInt(targetStr, 10) || 0
            animateCount(el, target)
          }
        })
      },
      { threshold: 0.6 }
    )

    values.forEach((el) => io.observe(el))

    return () => io.disconnect()
  }, [])

  useEffect(() => {
    // Prevent auto-scrolling to an in-page anchor on initial hard load/reload.
    // If the URL already contains a hash (e.g., #box-2) at load time, the browser might jump there.
    // Clear it once on mount so the page starts at the top; in-page anchor clicks will still work later.
    if (typeof window !== "undefined" && window.location.hash) {
      const nav = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type
      const isHardLoad = nav === "reload" || nav === "navigate" || !nav
      if (isHardLoad) {
        // Remove the hash without adding a new history entry and reset scroll to top
        history.replaceState(null, "", window.location.pathname + window.location.search)
        // Use rAF to ensure we run after the browser's default hash scroll
        requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }))
      }
    }
  }, [])

  useEffect(() => {
    // Mobile menu toggle handler
    const mobileMenuToggle = document.getElementById("mobile-menu-toggle")
    const mobileMenu = document.getElementById("mobile-menu")

    const handleToggle = () => setMobileMenuOpen(!mobileMenuOpen)

    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener("click", handleToggle)
    }

    return () => {
      if (mobileMenuToggle) {
        mobileMenuToggle.removeEventListener("click", handleToggle)
      }
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    // Scroll animations
    const observerOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Reveal element
          entry.target.classList.add("visible")

          // Add a brief jump-like attention animation for sections
          // We toggle a CSS class that runs a keyframed animation and remove it after it ends
          if ((entry.target as HTMLElement).tagName === "SECTION") {
            entry.target.classList.add("anchor-jump")
            const handleAnimationEnd = () => entry.target.classList.remove("anchor-jump")
            entry.target.addEventListener("animationend", handleAnimationEnd, { once: true })
          }

          // Extra behavior for the 3D screenshot panel
          if (entry.target.classList.contains("glass-screenshot-panel")) {
            entry.target.classList.add("in-view")
          }
        }
      })
    }, observerOptions)

    const sections = document.querySelectorAll("section, .glass-screenshot-panel")
    sections.forEach((section) => {
      section.classList.add("scroll-fade-in")
      observer.observe(section)
    })

    const firstSection = document.querySelector("#box-1")
    if (firstSection) {
      // Reveal hero but avoid jump animation on initial page load
      firstSection.classList.add("visible")
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // Keyboard navigation for card stack
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        ;(window as any).navigateCards?.("prev")
      } else if (e.key === "ArrowRight") {
        ;(window as any).navigateCards?.("next")
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [])

  useEffect(() => {
    // Card stack functionality
    const stackContainer = document.getElementById("card-stack-container")
    if (!stackContainer) return

    let cardOrder = Array.from(stackContainer.querySelectorAll(".card-stack-item")) as HTMLElement[]
    let isDragging = false
    let startX = 0,
      startY = 0
    let diffX = 0,
      diffY = 0
    let activeCard: HTMLElement | null = null

    function updateDeck() {
      cardOrder.forEach((card, index) => {
        card.style.opacity = "1"
        card.style.transform = ""

        if (index === 0) {
          card.style.zIndex = "30"
          card.style.transform = "translateY(0) scale(1)"
          card.style.opacity = "1"
          card.style.pointerEvents = "auto"
        } else if (index === 1) {
          card.style.zIndex = "20"
          card.style.transform = "translateY(10px) scale(0.95)"
          card.style.opacity = "1"
          card.style.pointerEvents = "none"
        } else {
          card.style.zIndex = "10"
          card.style.transform = `translateY(20px) scale(0.9)`
          card.style.opacity = "0"
          card.style.pointerEvents = "none"
        }
      })
    }

    function startDrag(e: MouseEvent | TouchEvent) {
      if (isDragging || !cardOrder.length) return

      activeCard = cardOrder[0]
      if (!activeCard) return

      isDragging = true
      activeCard.classList.add("is-dragging")

      startX = "pageX" in e ? e.pageX : e.touches[0].pageX
      startY = "pageY" in e ? e.pageY : e.touches[0].pageY

      document.addEventListener("mousemove", onDrag)
      document.addEventListener("mouseup", endDrag)
      document.addEventListener("touchmove", onDrag)
      document.addEventListener("touchend", endDrag)
    }

    function onDrag(e: MouseEvent | TouchEvent) {
      if (!isDragging || !activeCard || !stackContainer) return

      e.preventDefault()

      const currentX = "pageX" in e ? e.pageX : e.touches[0].pageX
      const currentY = "pageY" in e ? e.pageY : e.touches[0].pageY

      diffX = currentX - startX
      diffY = currentY - startY

      const rotate = diffX / 20
      activeCard.style.transform = `translate(${diffX}px, ${diffY}px) rotate(${rotate}deg)`

      const opacity = 1 - Math.abs(diffX) / (stackContainer.clientWidth / 2)
      activeCard.style.opacity = Math.max(0, opacity).toString()

      const nextCard = cardOrder[1]
      if (nextCard) {
        const scale = 0.95 + (Math.abs(diffX) / (stackContainer.clientWidth / 2)) * 0.05
        const translateY = 10 - (Math.abs(diffX) / (stackContainer.clientWidth / 2)) * 10
        nextCard.style.transform = `translateY(${translateY}px) scale(${Math.min(scale, 1)})`
      }
    }

    function endDrag() {
      if (!isDragging || !activeCard || !stackContainer) return

      isDragging = false
      activeCard.classList.remove("is-dragging")

      document.removeEventListener("mousemove", onDrag)
      document.removeEventListener("mouseup", endDrag)
      document.removeEventListener("touchmove", onDrag)
      document.removeEventListener("touchend", endDrag)

      const swipeThreshold = stackContainer.clientWidth * 0.25
      const swipeVelocity = Math.abs(diffX)

      if (Math.abs(diffX) > swipeThreshold || swipeVelocity > 200) {
        const flyDirection = diffX > 0 ? 1 : -1
        activeCard.classList.add("swiping-out")
        activeCard.style.transform = `translate(${flyDirection * 1200}px, ${diffY * 1.5}px) rotate(${flyDirection * 60}deg) scale(0.8)`
        activeCard.style.opacity = "0"

        const swipedCard = cardOrder.shift()!
        cardOrder.push(swipedCard)

        setTimeout(() => {
          swipedCard.classList.remove("swiping-out")
          swipedCard.style.transition = ""
          updateDeck()
        }, 600)
      } else {
        activeCard.classList.add("returning")
        activeCard.style.transform = "translate(0, 0) rotate(0deg) scale(1)"
        activeCard.style.opacity = "1"

        const nextCard = cardOrder[1]
        if (nextCard) {
          nextCard.style.transition = "transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)"
          nextCard.style.transform = "translateY(10px) scale(0.95)"
        }

        setTimeout(() => {
          activeCard?.classList.remove("returning")
          if (activeCard) activeCard.style.transition = ""
          if (nextCard) nextCard.style.transition = ""
        }, 500)
      }

      diffX = 0
      diffY = 0
      activeCard = null
    }

    // Global card navigation function
    ;(window as any).navigateCards = (direction: "next" | "prev") => {
      if (!cardOrder.length) return

      const topCard = cardOrder[0]
      if (direction === "next") {
        topCard.style.transition = "transform 0.3s ease, opacity 0.3s ease"
        topCard.style.transform = "translateX(500px) rotate(20deg)"
        topCard.style.opacity = "0"
        setTimeout(() => {
          cardOrder.push(cardOrder.shift()!)
          updateDeck()
        }, 300)
      } else if (direction === "prev") {
        // Swipe the current top card to the left for a symmetric animation
        const topCard = cardOrder[0]
        topCard.style.transition = "transform 0.3s ease, opacity 0.3s ease"
        topCard.style.transform = "translateX(-500px) rotate(-20deg)"
        topCard.style.opacity = "0"
        setTimeout(() => {
          // Bring the previous card (last) to the front
          cardOrder.unshift(cardOrder.pop()!)
          updateDeck()
        }, 300)
      }
    }

    stackContainer.addEventListener("mousedown", startDrag as EventListener)
    stackContainer.addEventListener("touchstart", startDrag as EventListener, { passive: true })

    updateDeck()

    return () => {
      stackContainer.removeEventListener("mousedown", startDrag as EventListener)
      stackContainer.removeEventListener("touchstart", startDrag as EventListener)
      delete (window as any).navigateCards
    }
  }, [])

  useEffect(() => {
    // Energy Grid Dot Animation
    const gridBg = document.querySelector(".energy-grid-bg") as HTMLElement
    if (!gridBg) return

    let mouseX: number | null = null
    let mouseY: number | null = null
    const activeDots: Array<{
      dot: HTMLElement
      x: number
      y: number
      vx: number
      vy: number
      life: number
      created: number
    }> = []

    const handleMouseMove = (e: MouseEvent) => {
      const rect = gridBg.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }

    const handleMouseLeave = () => {
      mouseX = null
      mouseY = null
    }

    gridBg.addEventListener("mousemove", handleMouseMove)
    gridBg.addEventListener("mouseleave", handleMouseLeave)

    function createDot() {
      const rect = gridBg.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const dot = document.createElement("div")
      dot.style.position = "absolute"
      dot.style.width = "6px"
      dot.style.height = "6px"
      dot.style.borderRadius = "50%"
      dot.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
      dot.style.zIndex = "10"
      dot.style.pointerEvents = "none"
      dot.style.transform = "translate(-50%, -50%)"

      const angle = Math.random() * Math.PI * 2
      const speed = 2

      const dotObj = {
        dot: dot,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 3000,
        created: Date.now(),
      }

      gridBg.appendChild(dot)
      activeDots.push(dotObj)
    }

    function animate() {
      const now = Date.now()

      activeDots.forEach((dotObj, index) => {
        const age = now - dotObj.created

        if (age > dotObj.life) {
          dotObj.dot.remove()
          activeDots.splice(index, 1)
          return
        }

        if (mouseX !== null && mouseY !== null) {
          const dx = mouseX - dotObj.x
          const dy = mouseY - dotObj.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance > 1) {
            const speed = 3
            dotObj.vx = (dx / distance) * speed
            dotObj.vy = (dy / distance) * speed
          }
        }

        dotObj.x += dotObj.vx
        dotObj.y += dotObj.vy

        dotObj.dot.style.left = dotObj.x + "px"
        dotObj.dot.style.top = dotObj.y + "px"

        const opacity = Math.max(0, 1 - age / dotObj.life)
        dotObj.dot.style.opacity = opacity.toString()
      })

      requestAnimationFrame(animate)
    }

    animate()

    const dotInterval = setInterval(createDot, 400)

    return () => {
      gridBg.removeEventListener("mousemove", handleMouseMove)
      gridBg.removeEventListener("mouseleave", handleMouseLeave)
      clearInterval(dotInterval)
      activeDots.forEach((dotObj) => dotObj.dot.remove())
    }
  }, [])

  useEffect(() => {
    // Interactive Tilt for Screenshot Panel
    const screenshotPanel = document.querySelector(".glass-screenshot-panel") as HTMLElement
    if (!screenshotPanel) return

    const baseTiltX = 10
    const maxTilt = 25

    const handleMouseMove = (e: MouseEvent) => {
      const rect = screenshotPanel.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const tiltX = baseTiltX + ((y - centerY) / centerY) * maxTilt
      const tiltY = ((centerX - x) / centerX) * maxTilt

      screenshotPanel.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
    }

    const handleMouseLeave = () => {
      screenshotPanel.style.transform = `rotateX(${baseTiltX}deg) rotateY(0deg)`
    }

    screenshotPanel.addEventListener("mousemove", handleMouseMove)
    screenshotPanel.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      screenshotPanel.removeEventListener("mousemove", handleMouseMove)
      screenshotPanel.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-header rounded-b-3xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 sm:px-8 lg:px-12 py-5">
          <a href="#" className="flex items-center space-x-3 text-2xl font-bold text-black font-sans flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="lucide lucide-book-open"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 10 10 10s10-4.45 10-10V7L12 2z" />
            </svg>
            <span>WIKIPEDIA</span>
          </a>

          <nav className="hidden md:flex space-x-3 font-sans items-center ml-auto">
            {/* About */}
            <a
              href="#box-2"
              className="btn-3d inline-flex items-center justify-center text-gray-700 hover:text-black transition duration-150 p-2 rounded-lg"
              aria-label="About"
              title="About"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z" />
                <path d="M12 7a4 4 0 0 1 4 4c0 2.3-1.9 3-2.6 3.5c-.5.3-.9.7-.9 1.5V17h-2v-.2c0-1.4.6-2.2 1.5-2.8c.9-.6 2-1.1 2-2a2 2 0 0 0-4 0H8a4 4 0 0 1 4-5z" />
                <rect x="11" y="17" width="2" height="2" rx="1" />
              </svg>
              <span className="sr-only">About</span>
            </a>

            {/* How It Works */}
            <a
              href="#features"
              className="btn-3d inline-flex items-center justify-center text-gray-700 hover:text-black transition duration-150 p-2 rounded-lg"
              aria-label="How It Works"
              title="How It Works"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M19.14 12.94a7.994 7.994 0 00.06-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a8.06 8.06 0 00-1.63-.94l-.36-2.53A.5.5 0 0012.06 1h-3.12a.5.5 0 00-.5.42l-.36 2.53c-.58.23-1.12.53-1.63.94l-2.39-.96a.5.5 0 00-.6.22L.54 7.99a.5.5 0 00.12.64l2.03 1.58c-.05.62-.05 1.25 0 1.88l-2.03 1.58a.5.5 0 00-.12.64l1.92 3.32c.14.23.42.32.67.22l2.39-.96c.5.41 1.05.74 1.63.97l.36 2.53c.05.24.26.42.5.42h3.12c.24 0 .45-.18.5-.42l.36-2.53c.58-.23 1.12-.56 1.63-.97l2.39.96c.25.1.53 0 .67-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM10.5 15a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
              </svg>
              <span className="sr-only">How It Works</span>
            </a>

            {/* Support */}
            <a
              href="#pricing"
              className="btn-3d inline-flex items-center justify-center text-gray-700 hover:text-black transition duration-150 p-2 rounded-lg"
              aria-label="Support"
              title="Support"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <rect x="3" y="8" width="18" height="3" />
                <rect x="6" y="14" width="5" height="2" rx="1" />
              </svg>
              <span className="sr-only">Support</span>
            </a>
          </nav>

          <button
            id="mobile-menu-toggle"
            className="md:hidden p-2 text-gray-700 hover:text-black rounded-lg ml-auto"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
        </div>

        <div
          id="mobile-menu"
          className={`md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-200 ${mobileMenuOpen ? "" : "hidden"}`}
        >
          <nav className="px-4 py-2 space-y-1 font-sans">
            {/* About */}
            <a
              href="#box-2"
              className="flex items-center gap-3 text-gray-700 hover:text-black transition duration-150 p-3 rounded-lg font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z" />
                <path d="M12 7a4 4 0 0 1 4 4c0 2.3-1.9 3-2.6 3.5c-.5.3-.9.7-.9 1.5V17h-2v-.2c0-1.4.6-2.2 1.5-2.8c.9-.6 2-1.1 2-2a2 2 0 0 0-4 0H8a4 4 0 0 1 4-5z" />
                <rect x="11" y="17" width="2" height="2" rx="1" />
              </svg>
              <span>About</span>
            </a>

            {/* How It Works */}
            <a
              href="#features"
              className="flex items-center gap-3 text-gray-700 hover:text-black transition duration-150 p-3 rounded-lg font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M19.14 12.94a7.994 7.994 0 00.06-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a8.06 8.06 0 00-1.63-.94l-.36-2.53A.5.5 0 0012.06 1h-3.12a.5.5 0 00-.5.42l-.36 2.53c-.58.23-1.12.53-1.63.94l-2.39-.96a.5.5 0 00-.6.22L.54 7.99a.5.5 0 00.12.64l2.03 1.58c-.05.62-.05 1.25 0 1.88l-2.03 1.58a.5.5 0 00-.12.64l1.92 3.32c.14.23.42.32.67.22l2.39-.96c.5.41 1.05.74 1.63.97l.36 2.53c.05.24.26.42.5.42h3.12c.24 0 .45-.18.5-.42l.36-2.53c.58-.23 1.12-.56 1.63-.97l2.39.96c.25.1.53 0 .67-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM10.5 15a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
              </svg>
              <span>How It Works</span>
            </a>

            {/* Support */}
            <a
              href="#pricing"
              className="flex items-center gap-3 text-gray-700 hover:text-black transition duration-150 p-3 rounded-lg font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <rect x="3" y="8" width="18" height="3" />
                <rect x="6" y="14" width="5" height="2" rx="1" />
              </svg>
              <span>Support</span>
            </a>
          </nav>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section
          id="box-1"
          className="gradient-bg min-h-[100vh] sm:min-h-[120vh] flex flex-col items-center justify-center pt-16 sm:pt-20 pb-40 sm:pb-60 text-black relative z-10 rounded-3xl overflow-hidden shadow-2xl mt-8 w-11/12 mx-auto"
        >
          <div className="energy-grid-bg"></div>

          {/* Hero overlay tilted tags */}
          <div className="pointer-events-none absolute inset-0 z-40">
            {/* Left tag (slightly inset from edge) */}
            <div className="absolute top-8 left-6 sm:top-12 sm:left-16 md:top-14 md:left-24 hero-tag-float-left">
              <div className="pointer-events-auto hero-tag hero-tag-bw hero-tag-big hero-tag-left">
                <span className="hero-tag-plus">+</span>
                <span className="hero-tag-value" data-target="65805121">0</span>
                <span className="hero-tag-label">articles</span>
              </div>
            </div>
            {/* Right tag (slightly inset from edge) */}
            <div className="absolute top-24 right-6 sm:top-16 sm:right-16 md:top-20 md:right-24 hero-tag-float-right">
              <div className="pointer-events-auto hero-tag hero-tag-bw hero-tag-small hero-tag-right">
                <span className="hero-tag-plus">+</span>
                <span className="hero-tag-value" data-target="455546">0</span>
                <span className="hero-tag-label">users</span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-4xl mx-auto text-center px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-12 md:py-16 relative z-10">
            <div className="mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm uppercase tracking-widest font-semibold text-gray-600 font-sans text-glass-panel">
                The Free Encyclopedia
              </p>
            </div>
            <div className="mb-4 sm:mb-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight drop-shadow-sm font-sans px-2 text-glass-panel">
                Wikipedia
              </h1>
            </div>
            <div className="mb-8 sm:mb-10 flex justify-center">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-light text-gray-700 max-w-3xl px-2 text-glass-panel">
                The world&apos;s largest free online encyclopedia.
              </p>
            </div>

            {/* Logo Carousel */}
            <div className="w-full overflow-hidden py-6 sm:py-8 mt-8 sm:mt-12 mb-8 sm:mb-12 z-20">
              <p className="text-xs uppercase tracking-wider text-gray-600 text-center mb-3 sm:mb-4 font-sans">
                Trusted partners
              </p>
              <div className="logo-carousel overflow-hidden">
                <div className="logo-carousel-inner">
                  {/* Duplicated sets for infinite scroll effect */}
                  <div className="flex space-x-12 sm:space-x-20 items-center">
                    {/* Apple */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="black"
                        className="h-8 sm:h-10 w-auto"
                      >
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                    </div>
                    {/* Microsoft */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-7 sm:h-9 w-auto">
                        <path fill="#f35022" d="M2 2h9v9H2z" />
                        <path fill="#81bc06" d="M13 2h9v9h-9z" />
                        <path fill="#05a6f0" d="M2 13h9v9H2z" />
                        <path fill="#ffba08" d="M13 13h9v9h-9z" />
                      </svg>
                    </div>
                    {/* Google */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-6 sm:h-8 w-auto">
                        <path
                          fill="#FFC107"
                          d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.84-6.237 8.546-11.303 8.546-6.663 0-12.115-5.385-12.115-12s5.452-12 12.115-12c3.125 0 5.918 1.114 8.169 2.908l6.097-6.097C37.55 5.309 31.97 2 24 2 13.516 2 5.291 9.354 5.291 19.967c0 10.613 8.225 19.167 18.709 19.167 10.931 0 18.349-7.989 18.349-18.795 0-1.151-.12-2.316-.339-3.468z"
                        />
                        <path
                          fill="#FF3D00"
                          d="M6.306 28.016v-8.038H0v14.167c1.373 0 2.658-.337 3.829-.982A12.001 12.001 0 0 0 5.29 39.133L10.985 34.42c-.896-1.558-1.529-3.111-1.848-4.706z"
                        />
                        <path
                          fill="#4CAF50"
                          d="M38.118 29.837c-.777 2.37-2.308 4.708-4.307 6.646L30.134 40.54a18.997 18.997 0 0 0 12.096-17.795h-6.112c-.08 1.155-.308 2.279-.684 3.332z"
                        />
                        <path
                          fill="#1976D2"
                          d="M43.611 20.083h-2.071l-6.097 6.097A12.052 12.052 0 0 1 24 31.967c-1.077 0-2.146-.178-3.15-.526L14.4 36.31l1.737 1.737C18.423 39.421 21.056 40 24 40c9.412 0 16.48-6.529 18.709-17.147l-6.097-6.097z"
                        />
                      </svg>
                    </div>
                    {/* Amazon */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 30"
                        fill="black"
                        className="h-6 sm:h-8 w-auto"
                      >
                        <path d="M59.5 20.5c-6.5 4.8-16 7.4-24.1 7.4-11.4 0-21.7-4.2-29.5-11.2-.6-.5-.1-1.3.7-.9 8.5 5 19 8 29.8 8 7.3 0 15.4-1.5 22.8-4.7 1.1-.5 2 .7.9 1.6M62.5 17c-.8-1.1-5.5-.5-7.6-.3-.6.1-.7-.5-.2-.9 3.7-2.6 9.8-1.8 10.5-.9.7.8-.2 7-3.7 9.9-.5.5-1 .2-.8-.4.8-1.9 2.6-6.2 1.8-7.4" />
                        <path d="M56 3.6v-2c0-.3.2-.5.5-.5h9.3c.3 0 .5.2.5.5v1.7c0 .3-.2.7-.6 1.3l-4.8 6.9c1.8-.1 3.7.2 5.3 1.1.4.2.5.5.5.8v2.1c0 .3-.3.7-.7.5-3.2-1.7-7.4-1.8-10.9.1-.4.2-.7-.2-.7-.5v-2c0-.4 0-1 .4-1.6l5.6-8h-4.9c-.3 0-.5-.2-.5-.5M20.4 17.5h-2.7c-.3 0-.5-.2-.5-.5V1.6c0-.3.2-.5.6-.5h2.5c.3 0 .5.2.5.5v2h.1c.7-1.9 2-2.8 3.8-2.8 1.8 0 2.9.9 3.7 2.8.7-1.9 2.4-2.8 4-2.8 1.2 0 2.5.5 3.3 1.6.9 1.2.7 3 .7 4.5v10.6c0 .3-.2.5-.6.5h-2.7c-.3 0-.5-.2-.5-.5V7.2c0-.6.1-2.1-.1-2.7-.3-1-.9-1.3-1.8-1.3-.7 0-1.5.5-1.8 1.3-.3.8-.3 2.1-.3 2.7v9.8c0 .3-.2.5-.6.5h-2.7c-.3 0-.5-.2-.5-.5V7.2c0-2.1.3-5.1-1.9-5.1-2.3 0-2.2 2.6-2.2 5.1v9.8c0 .3-.2.5-.6.5M75.8 1c4 0 6.2 3.5 6.2 7.9 0 4.3-2.4 7.6-6.2 7.6-3.9 0-6.1-3.5-6.1-7.8 0-4.4 2.2-7.7 6.1-7.7m0 2.8c-2 0-2.1 2.7-2.1 4.4 0 1.7 0 5.3 2.1 5.3 2 0 2.2-2.8 2.2-4.6 0-1.1-.1-2.6-.4-3.7-.3-1-.9-1.4-1.8-1.4m11.3 13.7h-2.7c-.3 0-.5-.2-.5-.5V1.6c0-.3.2-.5.6-.5h2.5c.3 0 .5.2.5.5v2.4h.1c.8-2.1 1.9-3.2 4-3.2 1.3 0 2.6.5 3.4 1.7.8 1.1.8 3 .8 4.4v10.7c0 .3-.2.5-.6.5h-2.7c-.3 0-.5-.2-.5-.5V7.4c0-2.1.2-5.2-2.3-5.2-.9 0-1.7.6-2.1 1.5-.5 1.1-.6 2.3-.6 3.6v9.7c0 .3-.2.5-.6.5M38.8 17.5c-.2 0-.4-.1-.5-.3l-6.2-15.6c-.1-.2 0-.5.3-.5h2.8c.2 0 .4.1.4.3l4.4 11.9h.1l4.4-11.9c.1-.2.3-.3.5-.3h2.8c.3 0 .4.3.3.5L41.3 17.2c-.1.2-.3.3-.5.3h-2z" />
                      </svg>
                    </div>
                    {/* Meta */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 24"
                        fill="black"
                        className="h-7 sm:h-9 w-auto"
                      >
                        <path d="M9.464 23.68V13.28l5.76 10.4h1.728l5.76-10.368V23.68h4.864V.32h-4.608L17.152 12.32 11.328.32H6.72V23.68h2.744zm29.472 0V13.28h7.296V9.92h-7.296V3.68h8.064V.32H36.192V23.68h12.928v-3.36h-10.184zm21.696 0V3.68h6.016V.32H53.888v3.36h6.016V23.68h2.728zm18.24 0h2.816l8.896-23.36h-3.136l-7.232 19.36-7.2-19.36h-3.168L79.744 23.68z" />
                      </svg>
                    </div>
                    {/* Tesla */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 342 35"
                        fill="black"
                        className="h-6 sm:h-8 w-auto"
                      >
                        <path d="M0 0.5h342v34H0z" fill="none" />
                        <path d="M238.1 14.4v21.1h7V21.3h25.6v14.2h7V14.4h-39.6zm-107.5.1v21h7v-8.8h10.7l9.1 8.8h8.9l-10.7-10.1c5.1-1.3 8.6-5.6 8.6-10.9 0-6.4-4.5-11-11.4-11h-22.2zm7 6.1h13.4c3.9 0 6.4 2.1 6.4 5.4 0 3.2-2.5 5.4-6.4 5.4h-13.4v-10.8zM42.7.2v6.1h46.6V.2H42.7zm94.3 0v6.1h46.6V.2h-46.6zM177.1.4h-38.7v5.8H160l-.2.5C149 12.7 139.5 24 134 35h3.1v.5h43.8v-5.8h-28.2l.5-.6C166.4 21.9 176.6 11.3 182 0l-4.9.4zM42.7 21.5c0 7.8 6.4 14.2 14.2 14.2h30.1v-7H59.7c-4.5 0-8.2-3.6-8.2-8.2h-8.8v1zm83.6-7c0-7.8-6.4-14.2-14.2-14.2H84.4v7h26.3c4.5 0 8.2 3.6 8.2 8.2h8.8v-1z" />
                      </svg>
                    </div>
                    {/* NVIDIA */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 24"
                        fill="#76b900"
                        className="h-6 sm:h-8 w-auto"
                      >
                        <path d="M8.5 4.5v15h3.2V9.8l6.1 9.7h3.4V4.5h-3.2v9.6L11.9 4.5H8.5zm23.7 0l-5.8 15h3.4l1.2-3.3h6.3l1.2 3.3h3.5l-5.8-15h-4zm2 3.8l2.1 5.7h-4.2l2.1-5.7zm13.3-3.8v15h3.2V4.5h-3.2zm17 0h-8.3v15h8.3c3.8 0 6.9-3.1 6.9-7.5S69.3 4.5 65.5 4.5zm-.1 12h-5v-9h5c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5zm14.1-12v15h3.2V4.5h-3.2zm15.8 0l-5.1 8.2-5.1-8.2h-3.7v15h3.2V9.8l4.6 7.4h1.9l4.6-7.4v9.7h3.2v-15h-3.6z" />
                      </svg>
                    </div>
                    {/* Samsung */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 120 24"
                        fill="black"
                        className="h-6 sm:h-8 w-auto"
                      >
                        <path d="M6 8c-.8 0-1.5.2-2.1.5L3 9V8H0v11h3v-6.5c0-1.1.7-1.9 1.8-1.9.9 0 1.5.6 1.5 1.6V19h3v-7.2c0-2.3-1.5-3.8-3.8-3.8h.5zm12.8 0c-.8 0-1.5.2-2.1.5L16 9V8h-3v11h3v-6.5c0-1.1.7-1.9 1.8-1.9.9 0 1.5.6 1.5 1.6V19h3v-7.2c0-2.3-1.5-3.8-3.8-3.8h.3zm8.7 0c-1.5 0-2.7.5-3.5 1.4-.7.8-1.1 1.9-1.1 3.3v1.6c0 1.4.4 2.5 1.1 3.3.8.9 2 1.4 3.5 1.4s2.7-.5 3.5-1.4c.7-.8 1.1-1.9 1.1-3.3v-1.6c0-1.4-.4-2.5-1.1-3.3-.8-.9-2-1.4-3.5-1.4zm1.7 6.3c0 1.2-.7 2-1.7 2s-1.7-.8-1.7-2v-1.6c0-1.2.7-2 1.7-2s1.7.8 1.7 2v1.6zm6.8-6.3c-1.5 0-2.7.5-3.5 1.4-.7.8-1.1 1.9-1.1 3.3v1.6c0 1.4.4 2.5 1.1 3.3.8.9 2 1.4 3.5 1.4s2.7-.5 3.5-1.4c.7-.8 1.1-1.9 1.1-3.3v-1.6c0-1.4-.4-2.5-1.1-3.3-.8-.9-2-1.4-3.5-1.4zm1.7 6.3c0 1.2-.7 2-1.7 2s-1.7-.8-1.7-2v-1.6c0-1.2.7-2 1.7-2s1.7.8 1.7 2v1.6zM52 19v-7.4c0-2.3 1.3-3.6 3.7-3.6.8 0 1.5.1 2.2.4l.8-2.5c-.9-.3-1.9-.5-3-.5-1.3 0-2.4.5-3.2 1.4l-.5.6V8h-3v11h3zm19.3-11c-1.5 0-2.7.5-3.5 1.4-.7.8-1.1 1.9-1.1 3.3v1.6c0 1.4.4 2.5 1.1 3.3.8.9 2 1.4 3.5 1.4 1.8 0 3.2-.7 4.1-2.2l.3-.5-2.4-1.4-.3.4c-.5.6-1.1.9-1.8.9-1 0-1.7-.6-1.8-1.6h6.6v-2c0-1.4-.4-2.5-1.1-3.3-.8-.9-2-1.3-3.6-1.3zm-1.7 4c.1-1 .8-1.6 1.7-1.6s1.6.6 1.7 1.6h-3.4zm13.9-4c-1.5 0-2.7.5-3.5 1.4-.7.8-1.1 1.9-1.1 3.3v1.6c0 1.4.4 2.5 1.1 3.3.8.9 2 1.4 3.5 1.4s2.7-.5 3.5-1.4c.7-.8 1.1-1.9 1.1-3.3v-1.6c0-1.4-.4-2.5-1.1-3.3-.8-.9-2-1.4-3.5-1.4zm1.7 6.3c0 1.2-.7 2-1.7 2s-1.7-.8-1.7-2v-1.6c0-1.2.7-2 1.7-2s1.7.8 1.7 2v1.6zM94 8v7.4c0 2.3-1.3 3.6-3.7 3.6-.8 0-1.5-.1-2.2-.4l-.8 2.5c.9.3 1.9.5 3 .5 1.3 0 2.4-.5 3.2-1.4l.5-.6V19h3V8h-3zm11.7 0c-.8 0-1.5.2-2.1.5l-.9.5V8h-3v15h3v-4.1l.9.5c.6.3 1.3.5 2.1.5 1.3 0 2.4-.5 3.2-1.4.7-.8 1.1-1.9 1.1-3.3v-1.5c0-1.4-.4-2.5-1.1-3.3-.8-.9-1.9-1.4-3.2-1.4zm1.4 6.2c0 1.2-.7 2-1.7 2s-1.7-.8-1.7-2v-1.5c0-1.2.7-2 1.7-2s1.7.8 1.7 2v1.5z" />
                      </svg>
                    </div>
                    {/* Oracle */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 24"
                        fill="#f80000"
                        className="h-6 sm:h-8 w-auto"
                      >
                        <path d="M16.2 6C9.8 6 4.6 9.3 4.6 13.5S9.8 21 16.2 21s11.6-3.3 11.6-7.5S22.6 6 16.2 6zm0 12c-4.4 0-8-2-8-4.5s3.6-4.5 8-4.5 8 2 8 4.5-3.6 4.5-8 4.5zm26.4-6.5c0 2.5-1.3 4.5-3.8 4.5s-3.8-2-3.8-4.5V6h-3.5v5.5c0 4.2 2.5 7.5 7.3 7.5s7.3-3.3 7.3-7.5V6h-3.5v5.5zM55.8 6c-1.6 0-2.9.6-3.8 1.7V6h-3.5v13h3.5v-6.8c0-1.3.9-2.2 2.2-2.2 1.2 0 2.1.9 2.1 2.2V19h3.5v-7.5c0-3-2-5.5-4-5.5zm20.8 0c-5.2 0-9.4 3.3-9.4 7.5s4.2 7.5 9.4 7.5c3.2 0 6-1.3 7.6-3.4l-2.7-1.6c-1 1.3-2.6 2-4.9 2-2.5 0-4.6-1.3-5.4-3.5h13.7v-1c0-4.2-3.1-7.5-8.3-7.5zm-5.4 6c.8-2.1 2.8-3.5 5.4-3.5s4.6 1.4 5.4 3.5h-10.8zM93.1 6c-1.6 0-2.9.6-3.8 1.7V6h-3.5v13h3.5v-6.8c0-1.3.9-2.2 2.2-2.2 1.2 0 2.1.9 2.1 2.2V19h3.5v-7.5c0-3-2-5.5-4-5.5z" />
                      </svg>
                    </div>
                    {/* IBM */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 24"
                        fill="black"
                        className="h-6 sm:h-8 w-auto"
                      >
                        <path d="M0 4h28v3H0V4zm0 5h28v3H0V9zm0 5h28v3H0v-3zm0 5h28v3H0v-3zM32 4h14v3H32V4zm0 5h14v3H32V9zm0 5h14v3H32v-3zm0 5h14v3H32v-3zM50 4h28v3H50V4zm5.6 5H78v3H55.6V9zm0 5H78v3H55.6v-3zM50 19h28v3H50v-3z" />
                        <path d="M55.6 9h5.7v3h-5.7V9zm0 5h5.7v3h-5.7v-3zM67 9h5.3v3H67V9zm0 5h5.3v3H67v-3z" />
                      </svg>
                    </div>
                  </div>
                  {/* Logos Set 2 (Duplicated for seamless loop) */}
                  <div className="flex space-x-12 sm:space-x-20 items-center">
                    {/* Apple */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="black"
                        className="h-8 sm:h-10 w-auto"
                      >
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                    </div>
                    {/* Microsoft */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-7 sm:h-9 w-auto">
                        <path fill="#f35022" d="M2 2h9v9H2z" />
                        <path fill="#81bc06" d="M13 2h9v9h-9z" />
                        <path fill="#05a6f0" d="M2 13h9v9H2z" />
                        <path fill="#ffba08" d="M13 13h9v9h-9z" />
                      </svg>
                    </div>
                    {/* Google */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-6 sm:h-8 w-auto">
                        <path
                          fill="#FFC107"
                          d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.84-6.237 8.546-11.303 8.546-6.663 0-12.115-5.385-12.115-12s5.452-12 12.115-12c3.125 0 5.918 1.114 8.169 2.908l6.097-6.097C37.55 5.309 31.97 2 24 2 13.516 2 5.291 9.354 5.291 19.967c0 10.613 8.225 19.167 18.709 19.167 10.931 0 18.349-7.989 18.349-18.795 0-1.151-.12-2.316-.339-3.468z"
                        />
                        <path
                          fill="#FF3D00"
                          d="M6.306 28.016v-8.038H0v14.167c1.373 0 2.658-.337 3.829-.982A12.001 12.001 0 0 0 5.29 39.133L10.985 34.42c-.896-1.558-1.529-3.111-1.848-4.706z"
                        />
                        <path
                          fill="#4CAF50"
                          d="M38.118 29.837c-.777 2.37-2.308 4.708-4.307 6.646L30.134 40.54a18.997 18.997 0 0 0 12.096-17.795h-6.112c-.08 1.155-.308 2.279-.684 3.332z"
                        />
                        <path
                          fill="#1976D2"
                          d="M43.611 20.083h-2.071l-6.097 6.097A12.052 12.052 0 0 1 24 31.967c-1.077 0-2.146-.178-3.15-.526L14.4 36.31l1.737 1.737C18.423 39.421 21.056 40 24 40c9.412 0 16.48-6.529 18.709-17.147l-6.097-6.097z"
                        />
                      </svg>
                    </div>
                    {/* Amazon */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center font-bold text-white/80 flex-shrink-0 font-sans">
                      <span className="text-xl sm:text-2xl">Amazon</span>
                    </div>
                    {/* Meta */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center font-bold text-white/80 flex-shrink-0 font-sans">
                      <span className="text-xl sm:text-2xl">Meta</span>
                    </div>
                    {/* Tesla */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 342 35"
                        fill="black"
                        className="h-6 sm:h-8 w-auto"
                      >
                        <path d="M0 0.5h342v34H0z" fill="none" />
                        <path d="M238.1 14.4v21.1h7V21.3h25.6v14.2h7V14.4h-39.6zm-107.5.1v21h7v-8.8h10.7l9.1 8.8h8.9l-10.7-10.1c5.1-1.3 8.6-5.6 8.6-10.9 0-6.4-4.5-11-11.4-11h-22.2zm7 6.1h13.4c3.9 0 6.4 2.1 6.4 5.4 0 3.2-2.5 5.4-6.4 5.4h-13.4v-10.8zM42.7.2v6.1h46.6V.2H42.7zm94.3 0v6.1h46.6V.2h-46.6zM177.1.4h-38.7v5.8H160l-.2.5C149 12.7 139.5 24 134 35h3.1v.5h43.8v-5.8h-28.2l.5-.6C166.4 21.9 176.6 11.3 182 0l-4.9.4zM42.7 21.5c0 7.8 6.4 14.2 14.2 14.2h30.1v-7H59.7c-4.5 0-8.2-3.6-8.2-8.2h-8.8v1zm83.6-7c0-7.8-6.4-14.2-14.2-14.2H84.4v7h26.3c4.5 0 8.2 3.6 8.2 8.2h8.8v-1z" />
                      </svg>
                    </div>
                    {/* NVIDIA */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 24"
                        fill="#76b900"
                        className="h-6 sm:h-8 w-auto"
                      >
                        <path d="M8.5 4.5v15h3.2V9.8l6.1 9.7h3.4V4.5h-3.2v9.6L11.9 4.5H8.5zm23.7 0l-5.8 15h3.4l1.2-3.3h6.3l1.2 3.3h3.5l-5.8-15h-4zm2 3.8l2.1 5.7h-4.2l2.1-5.7zm13.3-3.8v15h3.2V4.5h-3.2zm17 0h-8.3v15h8.3c3.8 0 6.9-3.1 6.9-7.5S69.3 4.5 65.5 4.5zm-.1 12h-5v-9h5c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5zm14.1-12v15h3.2V4.5h-3.2zm15.8 0l-5.1 8.2-5.1-8.2h-3.7v15h3.2V9.8l4.6 7.4h1.9l4.6-7.4v9.7h3.2v-15h-3.6z" />
                      </svg>
                    </div>
                    {/* Samsung */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 120 24"
                        fill="black"
                        className="h-6 sm:h-8 w-auto"
                      >
                        <path d="M6 8c-.8 0-1.5.2-2.1.5L3 9V8H0v11h3v-6.5c0-1.1.7-1.9 1.8-1.9.9 0 1.5.6 1.5 1.6V19h3v-7.2c0-2.3-1.5-3.8-3.8-3.8h.5zm12.8 0c-.8 0-1.5.2-2.1.5L16 9V8h-3v11h3v-6.5c0-1.1.7-1.9 1.8-1.9.9 0 1.5.6 1.5 1.6V19h3v-7.2c0-2.3-1.5-3.8-3.8-3.8h.3zm8.7 0c-1.5 0-2.7.5-3.5 1.4-.7.8-1.1 1.9-1.1 3.3v1.6c0 1.4.4 2.5 1.1 3.3.8.9 2 1.4 3.5 1.4s2.7-.5 3.5-1.4c.7-.8 1.1-1.9 1.1-3.3v-1.6c0-1.4-.4-2.5-1.1-3.3-.8-.9-2-1.4-3.5-1.4zm1.7 6.3c0 1.2-.7 2-1.7 2s-1.7-.8-1.7-2v-1.6c0-1.2.7-2 1.7-2s1.7.8 1.7 2v1.6zm6.8-6.3c-1.5 0-2.7.5-3.5 1.4-.7.8-1.1 1.9-1.1 3.3v1.6c0 1.4.4 2.5 1.1 3.3.8.9 2 1.4 3.5 1.4s2.7-.5 3.5-1.4c.7-.8 1.1-1.9 1.1-3.3v-1.6c0-1.4-.4-2.5-1.1-3.3-.8-.9-2-1.4-3.5-1.4zm1.7 6.3c0 1.2-.7 2-1.7 2s-1.7-.8-1.7-2v-1.6c0-1.2.7-2 1.7-2s1.7.8 1.7 2v1.6zM52 19v-7.4c0-2.3 1.3-3.6 3.7-3.6.8 0 1.5.1 2.2.4l.8-2.5c-.9-.3-1.9-.5-3-.5-1.3 0-2.4.5-3.2 1.4l-.5.6V8h-3v11h3zm19.3-11c-1.5 0-2.7.5-3.5 1.4-.7.8-1.1 1.9-1.1 3.3v1.6c0 1.4.4 2.5 1.1 3.3.8.9 2 1.4 3.5 1.4 1.8 0 3.2-.7 4.1-2.2l.3-.5-2.4-1.4-.3.4c-.5.6-1.1.9-1.8.9-1 0-1.7-.6-1.8-1.6h6.6v-2c0-1.4-.4-2.5-1.1-3.3-.8-.9-2-1.3-3.6-1.3zm-1.7 4c.1-1 .8-1.6 1.7-1.6s1.6.6 1.7 1.6h-3.4zm13.9-4c-1.5 0-2.7.5-3.5 1.4-.7.8-1.1 1.9-1.1 3.3v1.6c0 1.4.4 2.5 1.1 3.3.8.9 2 1.4 3.5 1.4s2.7-.5 3.5-1.4c.7-.8 1.1-1.9 1.1-3.3v-1.6c0-1.4-.4-2.5-1.1-3.3-.8-.9-2-1.4-3.5-1.4zm1.7 6.3c0 1.2-.7 2-1.7 2s-1.7-.8-1.7-2v-1.6c0-1.2.7-2 1.7-2s1.7.8 1.7 2v1.6zM94 8v7.4c0 2.3-1.3 3.6-3.7 3.6-.8 0-1.5-.1-2.2-.4l-.8 2.5c.9.3 1.9.5 3 .5 1.3 0 2.4-.5 3.2-1.4l.5-.6V19h3V8h-3zm11.7 0c-.8 0-1.5.2-2.1.5l-.9.5V8h-3v15h3v-4.1l.9.5c.6.3 1.3.5 2.1.5 1.3 0 2.4-.5 3.2-1.4.7-.8 1.1-1.9 1.1-3.3v-1.5c0-1.4-.4-2.5-1.1-3.3-.8-.9-1.9-1.4-3.2-1.4zm1.4 6.2c0 1.2-.7 2-1.7 2s-1.7-.8-1.7-2v-1.5c0-1.2.7-2 1.7-2s1.7.8 1.7 2v1.5z" />
                      </svg>
                    </div>
                    {/* Oracle */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 24"
                        fill="#f80000"
                        className="h-6 sm:h-8 w-auto"
                      >
                        <path d="M16.2 6C9.8 6 4.6 9.3 4.6 13.5S9.8 21 16.2 21s11.6-3.3 11.6-7.5S22.6 6 16.2 6zm0 12c-4.4 0-8-2-8-4.5s3.6-4.5 8-4.5 8 2 8 4.5-3.6 4.5-8 4.5zm26.4-6.5c0 2.5-1.3 4.5-3.8 4.5s-3.8-2-3.8-4.5V6h-3.5v5.5c0 4.2 2.5 7.5 7.3 7.5s7.3-3.3 7.3-7.5V6h-3.5v5.5zM55.8 6c-1.6 0-2.9.6-3.8 1.7V6h-3.5v13h3.5v-6.8c0-1.3.9-2.2 2.2-2.2 1.2 0 2.1.9 2.1 2.2V19h3.5v-7.5c0-3-2-5.5-4-5.5zm20.8 0c-5.2 0-9.4 3.3-9.4 7.5s4.2 7.5 9.4 7.5c3.2 0 6-1.3 7.6-3.4l-2.7-1.6c-1 1.3-2.6 2-4.9 2-2.5 0-4.6-1.3-5.4-3.5h13.7v-1c0-4.2-3.1-7.5-8.3-7.5zm-5.4 6c.8-2.1 2.8-3.5 5.4-3.5s4.6 1.4 5.4 3.5h-10.8zM93.1 6c-1.6 0-2.9.6-3.8 1.7V6h-3.5v13h3.5v-6.8c0-1.3.9-2.2 2.2-2.2 1.2 0 2.1.9 2.1 2.2V19h3.5v-7.5c0-3-2-5.5-4-5.5z" />
                      </svg>
                    </div>
                    {/* IBM */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 24"
                        fill="black"
                        className="h-6 sm:h-8 w-auto"
                      >
                        <path d="M0 4h28v3H0V4zm0 5h28v3H0V9zm0 5h28v3H0v-3zm0 5h28v3H0v-3zM32 4h14v3H32V4zm0 5h14v3H32V9zm0 5h14v3H32v-3zm0 5h14v3H32v-3zM50 4h28v3H50V4zm5.6 5H78v3H55.6V9zm0 5H78v3H55.6v-3zM50 19h28v3H50v-3z" />
                        <path d="M55.6 9h5.7v3h-5.7V9zm0 5h5.7v3h-5.7v-3zM67 9h5.3v3H67V9zm0 5h5.3v3H67v-3z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-4 font-sans mt-6 sm:mt-8 px-4">
              <div className="text-glass-panel px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium cursor-pointer w-full sm:w-auto text-center">
                <span className="text-black">EXPLORE ARTICLES</span>
              </div>
              <div className="text-glass-panel px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium cursor-pointer w-full sm:w-auto text-center">
                <span className="text-black">DONATE</span>
              </div>
            </div>
          </div>
        </section>

        {/* Screenshot Panel */}
        <div
          className="relative z-30 -mt-32 sm:-mt-48 w-11/12 mx-auto px-4 sm:px-6 lg:px-8"
          style={{ perspective: "2000px", perspectiveOrigin: "center center" }}
        >
          <div className="glass-screenshot-panel p-4 sm:p-6 rounded-3xl shadow-2xl">
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg bg-black/20">
              <Image
                src="/screenshot.png"
                alt="Wikipedia Screenshot"
                width={1200}
                height={675}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center text-white/90 text-sm mt-4 font-sans font-medium">Explore Knowledge</p>
          </div>
        </div>

        {/* About Section */}
        <section
          id="box-2"
          className="bg-black text-white pt-24 sm:pt-28 md:pt-32 pb-24 sm:pb-28 md:pb-32 relative -mt-6 sm:-mt-10 md:-mt-12 z-20 rounded-3xl shadow-2xl min-h-[80vh] flex flex-col justify-center w-11/12 mx-auto"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-panel p-5 sm:p-8 md:p-10 rounded-2xl shadow-2xl">
              {/* Intro text restored for clarity */}
              <div className="mb-6 sm:mb-8">
                <div
                  className="inline-block bg-white/25 backdrop-filter backdrop-blur-lg border border-white/30 text-white text-xs font-medium uppercase tracking-wide px-4 py-2 rounded-full mb-4 shadow-lg font-sans"
                  style={{
                    boxShadow:
                      "0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.2), inset 0 8px 16px -4px rgba(255, 255, 255, 0.1)",
                  }}
                >
                  ABOUT WIKIPEDIA
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 font-sans">A public library for the world.</h3>
                <p className="text-base sm:text-lg text-white/90 mb-3 font-serif">
                  Wikipedia is the world’s largest open knowledge project—written by people like you, for everyone. No
                  paywalls. No ads. Just verified information, continuously improved.
                </p>
                <p className="text-base sm:text-lg text-white/85 font-serif">
                  Every edit strengthens a living reference available in hundreds of languages and billions of devices.
                  From quick facts to deep dives, it’s your starting point for understanding almost anything.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
                {/* Left visual: Black & White scatter plot (no text) */}
                <div>
                  <div className="rounded-xl overflow-hidden border border-white/15 bg-white">
                    <div className="p-3">
                      <svg viewBox="0 0 400 280" className="w-full h-[220px] sm:h-[240px] md:h-[260px]" aria-hidden>
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
                          </pattern>
                        </defs>
                        <rect width="400" height="280" fill="#ffffff" />
                        <rect width="400" height="280" fill="url(#grid)" />
                        <g>
                          <circle cx="85" cy="60" r="4" fill="#111" />
                          <circle cx="105" cy="75" r="3" fill="#111" />
                          <circle cx="95" cy="95" r="2.5" fill="#111" />
                          <circle cx="125" cy="90" r="2" fill="#111" />
                          <circle cx="70" cy="88" r="2" fill="#111" />
                        </g>
                        <g>
                          <circle cx="290" cy="80" r="4" fill="#111" />
                          <circle cx="305" cy="95" r="3" fill="#111" />
                          <circle cx="275" cy="100" r="2.5" fill="#111" />
                          <circle cx="315" cy="115" r="2" fill="#111" />
                          <circle cx="300" cy="70" r="2" fill="#111" />
                        </g>
                        <g>
                          <circle cx="180" cy="180" r="5" fill="#111" />
                          <circle cx="200" cy="195" r="3" fill="#111" />
                          <circle cx="165" cy="200" r="2.5" fill="#111" />
                          <circle cx="210" cy="170" r="2.2" fill="#111" />
                          <circle cx="195" cy="215" r="2" fill="#111" />
                        </g>
                        <g>
                          <circle cx="40" cy="150" r="2" fill="#111" />
                          <circle cx="360" cy="160" r="2" fill="#111" />
                          <circle cx="330" cy="210" r="2" fill="#111" />
                          <circle cx="55" cy="200" r="2" fill="#111" />
                          <circle cx="250" cy="50" r="2" fill="#111" />
                          <circle cx="140" cy="140" r="2" fill="#111" />
                          <circle cx="220" cy="120" r="2" fill="#111" />
                          <circle cx="360" cy="230" r="2" fill="#111" />
                          <circle cx="280" cy="150" r="2" fill="#111" />
                          <circle cx="120" cy="230" r="2" fill="#111" />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Right visual: Monochrome network graph (no text) */}
                <div>
                  <div className="rounded-xl overflow-hidden border border-white/15 bg-white">
                    <div className="p-3">
                      <svg viewBox="0 0 400 280" className="w-full h-[220px] sm:h-[240px] md:h-[260px]" aria-hidden>
                        <rect width="400" height="280" fill="#ffffff" />
                        {/* connections */}
                        <g stroke="#111" strokeWidth="1.2" opacity="0.9">
                          <line x1="60" y1="200" x2="150" y2="120" />
                          <line x1="150" y1="120" x2="240" y2="150" />
                          <line x1="240" y1="150" x2="320" y2="80" />
                          <line x1="150" y1="120" x2="100" y2="60" />
                          <line x1="240" y1="150" x2="300" y2="220" />
                          <line x1="60" y1="200" x2="120" y2="240" />
                        </g>
                        {/* nodes */}
                        <g fill="#111">
                          <circle cx="60" cy="200" r="5" />
                          <circle cx="150" cy="120" r="6" />
                          <circle cx="240" cy="150" r="5" />
                          <circle cx="320" cy="80" r="4" />
                          <circle cx="100" cy="60" r="4" />
                          <circle cx="300" cy="220" r="5" />
                          <circle cx="120" cy="240" r="4" />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with Card Stack */}
        <section
          id="features"
          className="bg-white py-16 sm:py-20 relative -mt-8 sm:-mt-10 md:-mt-12 z-30 rounded-3xl shadow-2xl min-h-[80vh] flex flex-col justify-center overflow-hidden w-11/12 mx-auto"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
            <div
              className="inline-block bg-black/25 backdrop-filter backdrop-blur-lg border border-black/30 text-black text-sm font-medium uppercase tracking-wide px-6 py-3 rounded-full mb-4 shadow-lg font-sans"
              style={{
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.2), inset 0 8px 16px -4px rgba(211, 211, 211, 0.4)",
              }}
            >
              HOW IT WORKS
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 sm:mb-12 font-sans">
              Built by millions of contributors worldwide.
            </h2>

            <div id="card-stack-container" className="relative h-[350px] sm:h-[450px] w-full max-w-md mx-auto">
              {/* Left Arrow */}
              <button
                className="card-arrow card-arrow-left"
                onClick={(e) => {
                  e.stopPropagation()
                  ;(window as any).navigateCards?.("prev")
                }}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Previous card"
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
              </button>
              {/* Right Arrow */}
              <button
                className="card-arrow card-arrow-right"
                onClick={(e) => {
                  e.stopPropagation()
                  ;(window as any).navigateCards?.("next")
                }}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Next card"
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                </svg>
              </button>

              {/* Card 4 */}
              <div
                className="card-stack-item absolute inset-0 bg-gray-50 border border-gray-200 rounded-2xl shadow-lg p-8 sm:p-10 flex flex-col justify-center text-center"
                data-index="3"
              >
                <div className="flex flex-col items-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-code mb-4"
                  >
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 font-sans mb-4">Excepteur Sint</h3>
                </div>
                <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                </p>
              </div>

              {/* Card 3 */}
              <div
                className="card-stack-item absolute inset-0 bg-gray-50 border border-gray-200 rounded-2xl shadow-lg p-8 sm:p-10 flex flex-col justify-center text-center"
                data-index="2"
              >
                <div className="flex flex-col items-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-cloud mb-4"
                  >
                    <path d="M17.5 17.5c-1.5 0-3-.5-4.5-1.5s-3-2-4.5-3c-1.5-1-3-1.5-4.5-1.5s-3 .5-4.5 1.5s-3 2-4.5 3c-1.5 1-3 1.5-4.5 1.5s-3-.5-4.5-1.5s-3-2-4.5-3c-1.5-1-3-1.5-4.5-1.5s-3 .5-4.5 1.5s-3 2-4.5 3c-1.5 1-3 1.5-4.5 1.5" />
                  </svg>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 font-sans mb-4">
                    Consectetur Adipiscing
                  </h3>
                </div>
                <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
                  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua quis nostrud exercitation ullamco.
                </p>
              </div>

              {/* Card 2 */}
              <div
                className="card-stack-item absolute inset-0 bg-gray-50 border border-gray-200 rounded-2xl shadow-lg p-8 sm:p-10 flex flex-col justify-center text-center"
                data-index="1"
              >
                <div className="flex flex-col items-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-battery-full mb-4"
                  >
                    <rect width="16" height="10" x="2" y="7" rx="2" ry="2" />
                    <line x1="22" x2="22" y1="11" y2="13" />
                    <line x1="6" x2="6" y1="11" y2="13" />
                    <line x1="10" x2="10" y1="11" y2="13" />
                    <line x1="14" x2="14" y1="11" y2="13" />
                  </svg>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 font-sans mb-4">Ut Labore Magna</h3>
                </div>
                <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.
                </p>
              </div>

              {/* Card 1 - Top Card */}
              <div
                className="card-stack-item absolute inset-0 bg-gray-50 border border-gray-200 rounded-2xl shadow-lg p-8 sm:p-10 flex flex-col justify-center text-center"
                data-index="0"
              >
                <div className="flex flex-col items-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-trello mb-4"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <path d="M7 7h.01" />
                    <path d="M11 7h.01" />
                    <path d="M15 7h.01" />
                    <path d="M7 11h.01" />
                    <path d="M11 11h.01" />
                    <path d="M15 11h.01" />
                    <path d="M7 15h.01" />
                    <path d="M11 15h.01" />
                    <path d="M15 15h.01" />
                  </svg>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 font-sans mb-4">Collaborative Editing</h3>
                </div>
                <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
                  Anyone can contribute to Wikipedia. Millions of volunteers worldwide work together to create and improve
                  articles.
                </p>
              </div>
            </div>

            <p className="mt-8 text-gray-500 text-sm font-sans">(Swipe to explore)</p>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="pricing"
          className="bg-transparent text-gray-900 py-16 sm:py-20 relative z-40 rounded-3xl min-h-[80vh] flex flex-col justify-center w-11/12 mx-auto mt-8 sm:mt-12"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 font-sans">Support Wikipedia</h2>
              <p className="text-lg sm:text-xl text-gray-700 mt-4 max-w-3xl mx-auto">
                Keep knowledge free and accessible to everyone.
              </p>
            </div>

            {/* Bento grid (same content as previous pricing, darker UI) */}
            <div className="bento-grid">
              {/* Reader (large) */}
              <div className="bento-card tilt-card row-span-3 col-span-6 lg:col-span-4 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400">Free</div>
                  <h3 className="text-3xl sm:text-4xl font-extrabold mt-1">Reader</h3>
                  <p className="text-gray-300 mt-2">Access all knowledge completely free.</p>
                </div>
                <ul className="mt-6 space-y-3 text-gray-200">
                  <li className="flex items-start"><svg className="w-5 h-5 text-emerald-400 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>60+ million articles</li>
                  <li className="flex items-start"><svg className="w-5 h-5 text-emerald-400 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>300+ languages</li>
                  <li className="flex items-start"><svg className="w-5 h-5 text-emerald-400 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>No advertisements</li>
                </ul>
              </div>

              {/* Contributor (tall) */}
              <div className="bento-card tilt-card row-span-3 col-span-6 lg:col-span-2 p-6 sm:p-8 flex flex-col">
                <div className="self-start bg-white/10 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full mb-3 tracking-wider">Popular</div>
                <h3 className="text-2xl sm:text-3xl font-extrabold">Contributor</h3>
                <p className="text-gray-300 mt-2">Help create and edit articles.</p>
                <ul className="mt-6 space-y-3 text-gray-200">
                  <li className="flex items-start"><svg className="w-5 h-5 text-emerald-400 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>All Reader features</li>
                  <li className="flex items-start"><svg className="w-5 h-5 text-emerald-400 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Create & edit articles</li>
                  <li className="flex items-start"><svg className="w-5 h-5 text-emerald-400 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Community support</li>
                  <li className="flex items-start"><svg className="w-5 h-5 text-emerald-400 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Discussion pages</li>
                </ul>
              </div>

              {/* Donor (wide) */}
              <div className="bento-card tilt-card row-span-2 col-span-6 lg:col-span-2 p-6 sm:p-8 flex flex-col">
                <div className="self-start bg-white/10 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full mb-3 tracking-wider">Donate</div>
                <h3 className="text-2xl sm:text-3xl font-extrabold">Donor</h3>
                <p className="text-gray-300 mt-2">Support Wikipedia financially.</p>

                {/* Quick amounts */}
                <div className="donate-amounts mt-5">
                  <button className="donate-amount">$5</button>
                  <button className="donate-amount selected">$10</button>
                  <button className="donate-amount">$25</button>
                  <button className="donate-amount">$50</button>
                  <button className="donate-amount">$100</button>
                  <button className="donate-amount">Other</button>
                </div>

                <ul className="mt-6 space-y-3 text-gray-200">
                  <li className="flex items-start"><svg className="w-5 h-5 text-emerald-400 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Help keep Wikipedia free</li>
                  <li className="flex items-start"><svg className="w-5 h-5 text-emerald-400 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Tax-deductible donation</li>
                  <li className="flex items-start"><svg className="w-5 h-5 text-emerald-400 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Support infrastructure</li>
                </ul>

                {/* Secure + CTA */}
                <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center text-xs text-gray-400 gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3H9z"/></svg>
                    <span>Secure payment</span>
                  </div>
                  <a href="#" className="text-glass-panel px-4 py-2 font-semibold cursor-pointer"><span className="text-black">Donate Now</span></a>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Contribute Section */}
        <section
          id="contribute"
          className="bg-transparent text-gray-900 py-16 sm:py-20 relative z-40 rounded-3xl min-h-[80vh] flex flex-col justify-center w-11/12 mx-auto mt-8 sm:mt-12"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
            <div
              className="p-8 sm:p-12 rounded-2xl max-w-3xl mx-auto backdrop-filter backdrop-blur-lg border shadow-lg"
              style={{
                background: "rgba(255, 255, 255, 0.25)",
                borderColor: "rgba(255, 255, 255, 0.3)",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.2), inset 0 8px 16px -4px rgba(211, 211, 211, 0.4)",
              }}
            >
              <h3 className="text-3xl sm:text-4xl font-extrabold mb-4 font-sans text-gray-900">Ready to Contribute?</h3>
              <p className="text-lg text-gray-700 mb-8 font-serif">
                Join millions of editors worldwide and help make knowledge accessible to everyone. Every contribution
                matters.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#" className="text-glass-panel px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium cursor-pointer w-full sm:w-auto text-center">
                  <span className="text-black">START EDITING</span>
                </a>
                <a href="#" className="text-glass-panel px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium cursor-pointer w-full sm:w-auto text-center">
                  <span className="text-black">LEARN MORE</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-transparent text-black py-16 relative z-40 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            <div className="col-span-2 md:col-span-1">
              <a href="#" className="flex items-center space-x-2 text-2xl font-bold text-black mb-4 font-sans">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="black"
                  className="lucide lucide-book-open"
                >
                  <path d="M12 2L2 7v10c0 5.55 3.84 10 10 10s10-4.45 10-10V7L12 2z" />
                </svg>
                <span>Wikipedia</span>
              </a>
              <p className="text-sm mt-2 text-gray-600 font-serif">The free encyclopedia that anyone can edit.</p>
            </div>

            <div>
              <h4 className="text-black text-lg font-semibold mb-4 pb-2 font-sans">Read</h4>
              <ul className="space-y-4 text-sm leading-relaxed font-serif">
                <li>
                  <a href="#features" className="text-gray-700 hover:text-black transition duration-200">
                    Featured Articles
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-700 hover:text-black transition duration-200">
                    Random Article
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Current Events
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Categories
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-black text-lg font-semibold mb-4 pb-2 font-sans">Contribute</h4>
              <ul className="space-y-4 text-sm leading-relaxed font-serif">
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Create Account
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Start Editing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Upload Files
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Community Portal
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-black text-lg font-semibold mb-4 pb-2 font-sans">Support</h4>
              <ul className="space-y-4 text-sm leading-relaxed font-serif">
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Donate
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-black text-lg font-semibold mb-4 pb-2 font-sans">About</h4>
              <ul className="space-y-4 text-sm leading-relaxed font-serif">
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    About Wikipedia
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Wikimedia Foundation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-8 text-center text-sm text-gray-600 font-serif">
            &copy; 2024 Wikimedia Foundation. All text is available under Creative Commons License.
          </div>
        </div>
      </footer>
    </div>
  )
}
