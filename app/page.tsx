"use client"

import { useEffect } from "react"
import Image from "next/image"

export default function Home() {
  useEffect(() => {
    // Mobile menu functionality
    const mobileMenuToggle = document.getElementById("mobile-menu-toggle")
    const mobileMenu = document.getElementById("mobile-menu")

    if (mobileMenuToggle && mobileMenu) {
      const toggleMenu = () => {
        mobileMenu.classList.toggle("hidden")
      }

      mobileMenuToggle.addEventListener("click", toggleMenu)

      // Close mobile menu when clicking on a link
      const mobileMenuLinks = mobileMenu.querySelectorAll("a")
      mobileMenuLinks.forEach((link) => {
        link.addEventListener("click", () => {
          mobileMenu.classList.add("hidden")
        })
      })

      // Close mobile menu when clicking outside
      const closeOnClickOutside = (e: MouseEvent) => {
        if (!mobileMenuToggle.contains(e.target as Node) && !mobileMenu.contains(e.target as Node)) {
          mobileMenu.classList.add("hidden")
        }
      }

      document.addEventListener("click", closeOnClickOutside)

      return () => {
        mobileMenuToggle.removeEventListener("click", toggleMenu)
        document.removeEventListener("click", closeOnClickOutside)
      }
    }
  }, [])

  useEffect(() => {
    // Scroll animations for boxes
    const observerOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible")
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
      firstSection.classList.add("visible")
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // Card stack functionality
    const stackContainer = document.getElementById("card-stack-container")
    if (!stackContainer) return

    const cards = Array.from(stackContainer.querySelectorAll(".card-stack-item")) as HTMLElement[]
    let isDragging = false
    let startX = 0,
      startY = 0
    let diffX = 0,
      diffY = 0
    let activeCard: HTMLElement | null = null

    function updateDeck() {
      cards.forEach((card, index) => {
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
      if (isDragging || !cards.length) return

      activeCard = cards[0]
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
      if (!isDragging || !activeCard) return

      e.preventDefault()

      const currentX = "pageX" in e ? e.pageX : e.touches[0].pageX
      const currentY = "pageY" in e ? e.pageY : e.touches[0].pageY

      diffX = currentX - startX
      diffY = currentY - startY

      const rotate = diffX / 20

      activeCard.style.transform = `translate(${diffX}px, ${diffY}px) rotate(${rotate}deg)`

      const opacity = 1 - Math.abs(diffX) / (stackContainer.clientWidth / 2)
      activeCard.style.opacity = Math.max(0, opacity).toString()

      const nextCard = cards[1]
      if (nextCard) {
        const scale = 0.95 + (Math.abs(diffX) / (stackContainer.clientWidth / 2)) * 0.05
        const translateY = 10 - (Math.abs(diffX) / (stackContainer.clientWidth / 2)) * 10
        nextCard.style.transform = `translateY(${translateY}px) scale(${Math.min(scale, 1)})`
      }
    }

    function endDrag() {
      if (!isDragging || !activeCard) return

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

        const swipedCard = cards.shift()!
        cards.push(swipedCard)

        setTimeout(() => {
          swipedCard.classList.remove("swiping-out")
          swipedCard.style.transition = ""
          updateDeck()
        }, 600)
      } else {
        activeCard.classList.add("returning")
        activeCard.style.transform = "translate(0, 0) rotate(0deg) scale(1)"
        activeCard.style.opacity = "1"

        const nextCard = cards[1]
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

    stackContainer.addEventListener("mousedown", startDrag as EventListener)
    stackContainer.addEventListener("touchstart", startDrag as EventListener)

    updateDeck()

    return () => {
      stackContainer.removeEventListener("mousedown", startDrag as EventListener)
      stackContainer.removeEventListener("touchstart", startDrag as EventListener)
    }
  }, [])

  useEffect(() => {
    // Energy Grid Dot Animation
    const gridBg = document.querySelector(".energy-grid-bg") as HTMLElement
    if (!gridBg) return

    const gridSize = 80
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
      const rect = gridBg.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
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
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 sm:px-8 lg:px-12 py-6">
          <a href="#" className="flex items-center space-x-3 text-lg font-bold text-black font-serif flex-shrink-0">
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
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>WIKIPEDIA</span>
          </a>

          <nav className="hidden md:flex space-x-8 font-serif items-center ml-auto">
            <a
              href="#features"
              className="text-gray-700 hover:text-black transition duration-150 px-3 py-2 rounded-lg font-medium text-base"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-gray-700 hover:text-black transition duration-150 px-3 py-2 rounded-lg font-medium text-base"
            >
              Support
            </a>
            <a
              href="#box-2"
              className="text-gray-700 hover:text-black transition duration-150 px-3 py-2 rounded-lg font-medium text-base"
            >
              About
            </a>
          </nav>

          <button id="mobile-menu-toggle" className="md:hidden p-2 text-gray-700 hover:text-black rounded-lg ml-auto">
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

        <div id="mobile-menu" className="md:hidden hidden bg-white/95 backdrop-blur-sm border-t border-gray-200">
          <nav className="px-4 py-2 space-y-1 font-serif">
            <a
              href="#features"
              className="block text-gray-600 hover:text-black transition duration-150 p-3 rounded-lg font-medium"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="block text-gray-600 hover:text-black transition duration-150 p-3 rounded-lg font-medium"
            >
              Support
            </a>
            <a
              href="#box-2"
              className="block text-gray-600 hover:text-black transition duration-150 p-3 rounded-lg font-medium"
            >
              About
            </a>
          </nav>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section
          id="box-1"
          className="gradient-bg min-h-[100vh] flex flex-col items-center justify-center pt-20 sm:pt-24 pb-40 sm:pb-48 text-black relative z-10 rounded-3xl overflow-hidden shadow-2xl mt-8 w-11/12 mx-auto"
        >
          <div className="energy-grid-bg"></div>

          <div className="w-full max-w-5xl mx-auto text-center px-6 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-10 md:py-12 relative z-10">
            <div className="mb-4 sm:mb-5">
              <p className="text-xs sm:text-sm uppercase tracking-widest font-semibold text-gray-600 font-serif text-glass-panel">
                The Free Encyclopedia
              </p>
            </div>
            <div className="mb-5 sm:mb-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight drop-shadow-sm font-serif px-2 text-glass-panel">
                Imagine a world in which every single person on the planet is given free access to the sum of all human knowledge.
              </h1>
            </div>
            <div className="mb-8 sm:mb-10 flex justify-center">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-light text-gray-700 max-w-3xl px-2 text-glass-panel">
                Wikipedia is a free online encyclopedia, created and edited by volunteers around the world.
              </p>
            </div>

            {/* Logo Carousel */}
            <div className="w-full overflow-hidden py-6 sm:py-8 mt-8 sm:mt-10 mb-8 sm:mb-10 z-20">
              <p className="text-xs uppercase tracking-wider text-gray-600 text-center mb-4 sm:mb-5 font-serif">
                Trusted partners
              </p>
              <div className="logo-carousel overflow-hidden">
                <div className="logo-carousel-inner">
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
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center font-bold text-white/80 flex-shrink-0 font-serif">
                      <span className="text-xl sm:text-2xl">Amazon</span>
                    </div>
                    {/* Meta */}
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center font-bold text-white/80 flex-shrink-0 font-serif">
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
                  {/* Duplicate set for seamless loop */}
                  <div className="flex space-x-12 sm:space-x-20 items-center">
                    {/* Same logos repeated */}
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
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-7 sm:h-9 w-auto">
                        <path fill="#f35022" d="M2 2h9v9H2z" />
                        <path fill="#81bc06" d="M13 2h9v9h-9z" />
                        <path fill="#05a6f0" d="M2 13h9v9H2z" />
                        <path fill="#ffba08" d="M13 13h9v9h-9z" />
                      </svg>
                    </div>
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
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center font-bold text-white/80 flex-shrink-0 font-serif">
                      <span className="text-xl sm:text-2xl">Amazon</span>
                    </div>
                    <div className="logo-carousel-item w-24 sm:w-32 h-8 sm:h-10 flex items-center justify-center font-bold text-white/80 flex-shrink-0 font-serif">
                      <span className="text-xl sm:text-2xl">Meta</span>
                    </div>
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

            <div className="flex flex-col sm:flex-row justify-center gap-5 sm:gap-6 font-serif mt-6 sm:mt-8 px-4">
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
          className="relative z-30 -mt-32 sm:-mt-40 w-11/12 mx-auto px-4 sm:px-6 lg:px-8"
          style={{ perspective: "2000px", perspectiveOrigin: "center center" }}
        >
          <div className="glass-screenshot-panel p-6 sm:p-8 rounded-3xl shadow-2xl">
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg bg-black/20">
              <Image
                src="/screenshot.png"
                alt="Wikipedia Article Example"
                width={1280}
                height={720}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center text-white/90 text-xs sm:text-sm mt-5 font-serif font-medium">
              Featured Article
            </p>
          </div>
        </div>

        {/* About Section */}
        <section
          id="box-2"
          className="bg-black text-white pt-40 sm:pt-48 pb-20 sm:pb-24 relative -mt-16 sm:-mt-20 z-20 rounded-3xl shadow-2xl min-h-[100vh] flex flex-col justify-center w-11/12 mx-auto"
        >
          <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="glass-panel p-8 sm:p-10 md:p-14 rounded-2xl shadow-2xl">
              <div className="inline-block bg-white/25 backdrop-filter backdrop-blur-lg border border-white/30 text-white text-sm font-medium uppercase tracking-wide px-6 py-3 rounded-full mb-4 shadow-lg font-serif" style={{ boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.2), inset 0 8px 16px -4px rgba(211, 211, 211, 0.4)" }}>
                ABOUT WIKIPEDIA
              </div>
              <p className="text-base sm:text-lg font-light leading-relaxed">
                Wikipedia is a multilingual free online encyclopedia written and maintained by a community of volunteers through a model of open collaboration. Individual contributors, also called editors, are known as Wikipedians.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="bg-white py-16 sm:py-20 relative -mt-32 sm:-mt-40 z-30 rounded-3xl shadow-2xl min-h-[100vh] flex flex-col justify-center overflow-hidden w-11/12 mx-auto"
        >
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center w-full">
            <button className="bg-transparent border border-gray-900 text-gray-900 text-xs sm:text-sm font-medium uppercase tracking-wide px-8 py-4 rounded-full mb-6 hover:bg-gray-100 transition duration-300 font-serif">
              LOREM IPSUM
            </button>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-8 sm:mb-10 font-serif">
              Ut enim ad minim veniam quis.
            </h2>

            <div id="card-stack-container" className="relative h-[400px] sm:h-[500px] w-full max-w-lg mx-auto">
              <div
                className="card-stack-item absolute inset-0 bg-gray-50 border border-gray-200 rounded-2xl shadow-lg p-8 sm:p-10 text-left"
                data-index="3"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-code flex-shrink-0"
                  >
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 font-serif">Excepteur Sint</h3>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                </p>
              </div>

              <div
                className="card-stack-item absolute inset-0 bg-gray-50 border border-gray-200 rounded-2xl shadow-lg p-8 sm:p-10 text-left"
                data-index="2"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-cloud flex-shrink-0"
                  >
                    <path d="M17.5 17.5c-1.5 0-3-.5-4.5-1.5s-3-2-4.5-3c-1.5-1-3-1.5-4.5-1.5s-3 .5-4.5 1.5s-3 2-4.5 3c-1.5 1-3 1.5-4.5 1.5" />
                  </svg>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 font-serif">Consectetur Adipiscing</h3>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua quis nostrud exercitation ullamco.
                </p>
              </div>

              <div
                className="card-stack-item absolute inset-0 bg-gray-50 border border-gray-200 rounded-2xl shadow-lg p-8 sm:p-10 text-left"
                data-index="1"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-battery-full flex-shrink-0"
                  >
                    <rect width="16" height="10" x="2" y="7" rx="2" ry="2" />
                    <line x1="22" x2="22" y1="11" y2="13" />
                    <line x1="6" x2="6" y1="11" y2="13" />
                    <line x1="10" x2="10" y1="11" y2="13" />
                    <line x1="14" x2="14" y1="11" y2="13" />
                  </svg>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 font-serif">Ut Labore Magna</h3>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.
                </p>
              </div>

              <div
                className="card-stack-item absolute inset-0 bg-gray-50 border border-gray-200 rounded-2xl shadow-lg p-8 sm:p-10 text-left"
                data-index="0"
              >
                <div className="flex items-center space-x-4 mb-5">
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
                    className="lucide lucide-trello flex-shrink-0"
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
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 font-serif">Lorem Ipsum Dolor</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                  dolore.
                </p>
              </div>
            </div>

            <p className="mt-8 text-gray-500 text-xs sm:text-sm font-serif">(Swipe to explore)</p>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="pricing"
          className="bg-transparent text-gray-900 py-16 sm:py-20 relative z-40 rounded-3xl min-h-[100vh] flex flex-col justify-center w-11/12 mx-auto mt-12 sm:mt-16"
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 text-center w-full">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-6 font-serif">
              Quis Nostrud Exercitation
            </h2>
            <p className="text-sm sm:text-base text-gray-700 mb-10 max-w-4xl mx-auto leading-relaxed">
              Ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 mb-14">
              <div className="glass-screenshot-panel p-8 sm:p-10 rounded-2xl text-left hover:scale-105 transition-transform duration-300">
                <h3 className="text-lg font-bold mb-5 font-serif text-gray-900">Lorem</h3>
                <p className="text-gray-700 mb-7 text-sm">Sed do eiusmod tempor incididunt ut labore.</p>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-800 text-sm">Lorem ipsum dolor</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-800 text-sm">Sit amet consectetur</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-800 text-sm">Adipiscing elit</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-800 text-sm">Eiusmod tempor</span>
                  </li>
                </ul>
              </div>

              <div className="glass-screenshot-panel p-8 sm:p-10 rounded-2xl text-left hover:scale-105 transition-transform duration-300 border-2 border-gray-400">
                <div className="bg-gray-900 text-white text-xs font-bold uppercase px-3 py-1 rounded-full inline-block mb-4 font-serif">
                  Popularis
                </div>
                <h3 className="text-lg font-bold mb-4 font-serif text-gray-900">Ipsum</h3>
                <p className="text-gray-700 mb-6 text-sm">Ut labore et dolore magna aliqua.</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-800 text-sm">Ut enim ad minim</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-800 text-sm">Veniam quis nostrud</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-800 text-sm">Exercitation ullamco</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-800 text-sm">Laboris nisi</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-800 text-sm">Aliquip commodo</span>
                  </li>
                </ul>
              </div>

              <div className="glass-screenshot-panel p-8 sm:p-10 rounded-2xl text-left hover:scale-105 transition-transform duration-300">
                <h3 className="text-lg font-bold mb-4 font-serif text-gray-900">Dolor</h3>
                <p className="text-gray-700 mb-6 text-sm">Excepteur sint occaecat cupidatat non proident.</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-800 text-sm">Sunt in culpa qui</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-800 text-sm">Officia deserunt</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-800 text-sm">Mollit anim id</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-800 text-sm">Est laborum sed</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-800 text-sm">Cillum dolore</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="glass-screenshot-panel p-8 sm:p-10 rounded-2xl max-w-4xl mx-auto">
              <h3 className="text-lg sm:text-xl font-bold mb-4 font-serif text-gray-900">Duis Aute Irure Dolor?</h3>
              <p className="text-sm sm:text-base text-gray-700 mb-8 leading-relaxed">
                In reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <button className="bg-gray-900 text-white px-10 py-5 text-sm font-medium rounded-xl hover:bg-gray-800 transition duration-300 transform hover:scale-[1.02] font-serif">
                  LOREM IPSUM
                </button>
                <button className="bg-transparent text-gray-900 border-2 border-gray-900 px-10 py-5 text-sm font-medium rounded-xl hover:bg-gray-100 transition duration-300 font-serif">
                  DOLOR SIT
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-transparent text-black py-20 relative z-40 mt-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12">
            <div className="col-span-2 md:col-span-1">
              <a href="#" className="flex items-center space-x-2 text-lg font-bold text-black mb-5 font-serif">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-zap"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Lorem</span>
              </a>
              <p className="text-xs mt-3 text-gray-600">The future management.</p>
            </div>

            <div>
              <h4 className="text-black text-sm font-semibold mb-5 pb-2 font-serif">Product</h4>
              <ul className="space-y-4 text-xs leading-relaxed">
                <li>
                  <a href="#features" className="text-gray-700 hover:text-black transition duration-200">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-700 hover:text-black transition duration-200">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#api" className="text-gray-700 hover:text-black transition duration-200">
                    API Documentation
                  </a>
                </li>
                <li>
                  <a href="#support" className="text-gray-700 hover:text-black transition duration-200">
                    System Status
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-black text-sm font-semibold mb-5 pb-2 font-serif">Company</h4>
              <ul className="space-y-4 text-xs leading-relaxed">
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Careers (Hiring!)
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Contact Sales
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-black text-sm font-semibold mb-5 pb-2 font-serif">Resources</h4>
              <ul className="space-y-4 text-xs leading-relaxed">
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Partners
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-black text-sm font-semibold mb-5 pb-2 font-serif">Legal</h4>
              <ul className="space-y-4 text-xs leading-relaxed">
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-700 hover:text-black transition duration-200">
                    Imprint
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-10 text-center text-xs text-gray-600 font-serif">
            &copy; 2025 XXX Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
