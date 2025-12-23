import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Offers.css'

function Offers() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadOffers()
    // Refresh offers every minute to check for expired ones
    const interval = setInterval(loadOffers, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadOffers = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Filter out expired offers
      const now = new Date()
      const activeOffers = (data || []).filter(offer => {
        if (!offer.expiry_date) return true
        return new Date(offer.expiry_date) > now
      })

      setOffers(activeOffers)
    } catch (err) {
      console.error('Error loading offers:', err)
      setError('حدث خطأ أثناء تحميل العروض')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTimeRemaining = (expiryDate) => {
    if (!expiryDate) return null

    const now = new Date()
    const expiry = new Date(expiryDate)
    const diff = expiry - now

    if (diff <= 0) return null

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return { days, hours, minutes, total: diff }
  }

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false
    const remaining = getTimeRemaining(expiryDate)
    if (!remaining) return false
    // Consider "expiring soon" if less than 3 days remaining
    return remaining.total < (3 * 24 * 60 * 60 * 1000)
  }

  if (loading) {
    return (
      <div className="section">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section offers-page">
      <div className="container">
        <h2 className="section-title">العروض الخاصة</h2>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {offers.length === 0 ? (
          <div className="no-offers">
            <p>لا توجد عروض متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid">
            {offers.map((offer) => {
              const timeRemaining = getTimeRemaining(offer.expiry_date)
              const expiringSoon = isExpiringSoon(offer.expiry_date)

              return (
                <div
                  key={offer.id}
                  className={`offer-card ${expiringSoon ? 'expiring-soon' : ''}`}
                >
                  {offer.image_url && (
                    <div className="offer-image">
                      <img src={offer.image_url} alt={offer.title} />
                    </div>
                  )}
                  <div className="offer-content">
                    <h3>{offer.title}</h3>
                    <p className="offer-description">{offer.description}</p>

                    {offer.price && (
                      <div className="offer-price">
                        <span className="price-label">السعر:</span>
                        <span className="price-value">{offer.price} جنيه</span>
                      </div>
                    )}

                    {timeRemaining && (
                      <div className={`offer-countdown ${expiringSoon ? 'urgent' : ''}`}>
                        <div className="countdown-label">⏰ ينتهي العرض خلال:</div>
                        <div className="countdown-timer">
                          {timeRemaining.days > 0 && (
                            <div className="countdown-item">
                              <span className="countdown-value">{timeRemaining.days}</span>
                              <span className="countdown-unit">يوم</span>
                            </div>
                          )}
                          <div className="countdown-item">
                            <span className="countdown-value">{timeRemaining.hours}</span>
                            <span className="countdown-unit">ساعة</span>
                          </div>
                          <div className="countdown-item">
                            <span className="countdown-value">{timeRemaining.minutes}</span>
                            <span className="countdown-unit">دقيقة</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="offer-date">
                      {formatDate(offer.created_at)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Offers

