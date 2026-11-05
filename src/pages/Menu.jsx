import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { supabase, MENU_BUCKET } from '../lib/supabase'
import './Menu.css'

const PdfViewer = lazy(() => import('../components/PdfViewer'))

const formatDate = (iso) => {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(iso))
  } catch {
    return null
  }
}

function Menu() {
  const [menuUrl, setMenuUrl] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewerFailed, setViewerFailed] = useState(false)
  const onViewerFailed = useCallback(() => setViewerFailed(true), [])

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setViewerFailed(false)

      const { data, error: listError } = await supabase
        .storage
        .from(MENU_BUCKET)
        .list('', {
          limit: 1,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (listError) {
        const msg = listError.message || ''
        if (msg.includes('not found') || msg.includes('does not exist')) {
          setError('empty')
        } else {
          throw listError
        }
        return
      }

      if (data && data.length > 0) {
        const file = data[0]
        const { data: urlData } = supabase
          .storage
          .from(MENU_BUCKET)
          .getPublicUrl(file.name)

        if (urlData?.publicUrl) {
          setMenuUrl(urlData.publicUrl)
          setUpdatedAt(file.updated_at || file.created_at || null)
        } else {
          setError('empty')
        }
      } else {
        setError('empty')
      }
    } catch (err) {
      console.error('Error loading menu:', err)
      setError('failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMenu()
  }, [loadMenu])

  // ESC لإغلاق ملء الشاشة + منع تمرير الصفحة خلفه
  useEffect(() => {
    if (!isFullscreen) return undefined
    const onKey = (e) => e.key === 'Escape' && setIsFullscreen(false)
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [isFullscreen])

  const dateText = formatDate(updatedAt)

  if (loading) {
    return (
      <div className="menu-page">
        <div className="container">
          <div className="menu-hero">
            <div className="menu-skeleton skeleton-line w-40" />
            <div className="menu-skeleton skeleton-line w-60" />
          </div>
          <div className="menu-card">
            <div className="menu-skeleton skeleton-block" />
          </div>
          <p className="menu-loading-text" role="status">جاري تحميل القائمة...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="menu-page">
      <div className="container">
        <header className="menu-hero">
          <span className="menu-eyebrow">
            <i className="fas fa-utensils" aria-hidden="true"></i>
            مطعم العقدة
          </span>
          <h1 className="menu-title">قائمة الطعام</h1>
          <div className="menu-divider" aria-hidden="true">
            <span></span>
            <i className="fas fa-star"></i>
            <span></span>
          </div>
          <p className="menu-subtitle">
            تصفح قائمتنا المميزة من الأطباق الشهية، واختر ما يناسب ذوقك
          </p>
          {dateText && (
            <p className="menu-updated">
              <i className="far fa-clock" aria-hidden="true"></i>
              آخر تحديث: {dateText}
            </p>
          )}
        </header>

        {error && !menuUrl ? (
          <div className="menu-state" role="alert">
            <div className="state-icon">
              <i className={`fas ${error === 'failed' ? 'fa-triangle-exclamation' : 'fa-book-open'}`}></i>
            </div>
            <h3>
              {error === 'failed' ? 'تعذر تحميل القائمة' : 'القائمة غير متوفرة حالياً'}
            </h3>
            <p>
              {error === 'failed'
                ? 'حدثت مشكلة في الاتصال، تأكد من الإنترنت وحاول مرة أخرى'
                : 'نعمل على تحديث القائمة، يرجى المحاولة لاحقاً'}
            </p>
            <button type="button" className="menu-btn menu-btn-primary" onClick={loadMenu}>
              <i className="fas fa-rotate-right" aria-hidden="true"></i>
              إعادة المحاولة
            </button>
          </div>
        ) : menuUrl ? (
          <>
            {isFullscreen && (
              <div className="menu-backdrop" onClick={() => setIsFullscreen(false)} />
            )}
            <section className={`menu-card ${isFullscreen ? 'fullscreen' : ''}`}>
              <div className="menu-toolbar">
                <div className="toolbar-title">
                  <span className="toolbar-dot" aria-hidden="true"></span>
                  <span>قائمة الطعام</span>
                  <span className="toolbar-badge">PDF</span>
                </div>
                <div className="toolbar-actions">
                  <button
                    type="button"
                    onClick={() => setIsFullscreen((v) => !v)}
                    className="btn-control"
                    title={isFullscreen ? 'تصغير (Esc)' : 'ملء الشاشة'}
                    aria-label={isFullscreen ? 'تصغير' : 'ملء الشاشة'}
                  >
                    <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`}></i>
                  </button>
                  <a
                    href={menuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-control"
                    title="فتح في نافذة جديدة"
                    aria-label="فتح في نافذة جديدة"
                  >
                    <i className="fas fa-arrow-up-right-from-square"></i>
                  </a>
                  <a
                    href={menuUrl}
                    download
                    className="btn-control"
                    title="تحميل القائمة"
                    aria-label="تحميل القائمة"
                  >
                    <i className="fas fa-download"></i>
                  </a>
                </div>
              </div>

              {!viewerFailed ? (
                <Suspense
                  fallback={
                    <div className="pdfv-suspense">
                      <div className="spinner"></div>
                    </div>
                  }
                >
                  <PdfViewer
                    url={menuUrl}
                    fullscreen={isFullscreen}
                    onFailed={onViewerFailed}
                  />
                </Suspense>
              ) : (
                <div className="menu-mobile">
                  <div className="mobile-cover">
                    <img src="/logo.png" alt="شعار العقدة" />
                  </div>
                  <h3>قائمة الطعام جاهزة</h3>
                  <p>افتح القائمة لعرضها بشكل كامل وتكبير الأطباق والأسعار بسهولة</p>
                  <a
                    href={menuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="menu-btn menu-btn-primary menu-btn-lg"
                  >
                    <i className="fas fa-book-open" aria-hidden="true"></i>
                    عرض القائمة
                  </a>
                </div>
              )}

              <div className="menu-footer">
                <a
                  href={menuUrl}
                  download
                  className="menu-btn menu-btn-primary"
                >
                  <i className="fas fa-download" aria-hidden="true"></i>
                  تحميل القائمة PDF
                </a>
                <a
                  href={menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu-btn menu-btn-ghost"
                >
                  <i className="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
                  فتح في صفحة مستقلة
                </a>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default Menu
