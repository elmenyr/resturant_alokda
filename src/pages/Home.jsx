import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Array of images from the image folder
  const slides = [
    '/1.jpeg',
    '/2.jpeg',
    '/3.jpeg',
    '/4.jpeg'
  ]

  // Auto-change slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [slides.length])

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <div className="home">
      {/* Hero Section with Carousel */}
      <section className="hero">
        {/* Carousel Images */}
        <div className="hero-carousel">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide})` }}
            >
              <div className="carousel-overlay"></div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button className="carousel-arrow carousel-arrow-left" onClick={prevSlide}>
          <i className="fas fa-chevron-right"></i>
        </button>
        <button className="carousel-arrow carousel-arrow-right" onClick={nextSlide}>
          <i className="fas fa-chevron-left"></i>
        </button>

        {/* Hero Content */}
        <div className="hero-content">
          <h1>مرحباً بكم في مطعم العقدة</h1>
          <p>لأرقى الأكلات الشرقيه و الغربيه</p>
          <div className="hero-buttons">
            <Link to="/menu" className="btn btn-primary">عرض القائمة</Link>
            <Link to="/offers" className="btn btn-secondary">العروض الخاصة</Link>
          </div>
        </div>

        {/* Carousel Dots */}
        <div className="carousel-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            ></button>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home

