import React, { useState, useEffect } from 'react'
import { supabase, MENU_BUCKET } from '../lib/supabase'
import './Menu.css'

function Menu() {
  const [menuUrl, setMenuUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    loadMenu()
  }, [])

  const loadMenu = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get public URL of menu PDF
      const { data, error: downloadError } = await supabase
        .storage
        .from(MENU_BUCKET)
        .list('', {
          limit: 1,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (downloadError) {
        // If no file exists, that's okay - just show message
        if (downloadError.message.includes('not found') || downloadError.message.includes('does not exist')) {
          setError('القائمة غير متوفرة حالياً')
        } else {
          throw downloadError
        }
        return
      }

      if (data && data.length > 0) {
        const fileName = data[0].name

        // Get public URL
        const { data: urlData } = supabase
          .storage
          .from(MENU_BUCKET)
          .getPublicUrl(fileName)

        if (urlData?.publicUrl) {
          setMenuUrl(urlData.publicUrl)
        }
      } else {
        setError('القائمة غير متوفرة حالياً')
      }
    } catch (err) {
      console.error('Error loading menu:', err)
      setError('حدث خطأ أثناء تحميل القائمة')
    } finally {
      setLoading(false)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (loading) {
    return (
      <div className="section">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>جاري تحميل القائمة...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section menu-page">
      <div className="container">
        <div className="menu-header">
          <h2 className="section-title">قائمة الطعام</h2>
          <p className="menu-subtitle">تصفح قائمتنا المميزة من الأطباق الشهية</p>
        </div>

        {error && !menuUrl ? (
          <div className="menu-error">
            <div className="error-icon">📋</div>
            <h3>{error}</h3>
            <p>نعمل على تحديث القائمة، يرجى المحاولة لاحقاً</p>
          </div>
        ) : menuUrl ? (
          <div className={`menu-container ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="menu-controls">
              <button
                onClick={toggleFullscreen}
                className="btn-control"
                title={isFullscreen ? 'تصغير' : 'ملء الشاشة'}
              >
                <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`}></i>
              </button>
              <a
                href={menuUrl}
                download
                className="btn-control"
                target="_blank"
                rel="noopener noreferrer"
                title="تحميل القائمة"
              >
                <i className="fas fa-download"></i>
              </a>
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-control"
                title="فتح في نافذة جديدة"
              >
                <i className="fas fa-external-link-alt"></i>
              </a>
            </div>

            <div className="pdf-viewer-wrapper">
              <iframe
                src={`${menuUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                className="menu-pdf"
                title="قائمة الطعام"
              />
            </div>

            <div className="menu-actions">
              <a
                href={menuUrl}
                download
                className="btn btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fas fa-download"></i>
                تحميل القائمة PDF
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Menu



