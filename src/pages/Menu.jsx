import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { supabase, MENU_BUCKET } from '../lib/supabase'
import './Menu.css'

// نبدأ تحميل العارض فوراً بالتوازي مع جلب رابط القائمة
const loadViewer = () => import('../components/PdfViewer')
const PdfViewer = lazy(loadViewer)

const CACHE_KEY = 'alokda_menu_v1'
const PHONE_DISPLAY = '01069700299'
const PHONE_TEL = 'tel:01069700299'
const PHONE_WA = 'https://wa.me/201069700299'

const readCache = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY)) || null
  } catch {
    return null
  }
}

const writeCache = (value) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(value))
  } catch {
    /* التخزين غير متاح: لا مشكلة */
  }
}

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
  // الكاش يجعل الفتح فورياً عند العودة للصفحة، ثم نتحقق من التحديثات بصمت
  const cached = readCache()
  const [menuUrl, setMenuUrl] = useState(cached?.url || null)
  const [updatedAt, setUpdatedAt] = useState(cached?.updatedAt || null)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewerFailed, setViewerFailed] = useState(false)
  const [copied, setCopied] = useState(false)
  const onViewerFailed = useCallback(() => setViewerFailed(true), [])

  const loadMenu = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
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
          setMenuUrl(null)
          setError('empty')
        } else {
          throw listError
        }
        return
      }

      if (data && data.length > 0) {
        const file = data[0]
        const stamp = file.updated_at || file.created_at || null
        const { data: urlData } = supabase
          .storage
          .from(MENU_BUCKET)
          .getPublicUrl(file.name)

        if (urlData?.publicUrl) {
          // إضافة وقت التحديث تضمن ظهور آخر نسخة بعد رفع قائمة جديدة
          const url = stamp
            ? `${urlData.publicUrl}${urlData.publicUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(stamp)}`
            : urlData.publicUrl
          setMenuUrl(url)
          setUpdatedAt(stamp)
          writeCache({ url, updatedAt: stamp })
        } else {
          setMenuUrl(null)
          setError('empty')
        }
      } else {
        setMenuUrl(null)
        setError('empty')
      }
    } catch (err) {
      console.error('Error loading menu:', err)
      // عند الفشل أثناء التحديث الصامت نكمل بالنسخة المخزنة
      if (!silent) setError('failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadViewer()
    loadMenu({ silent: Boolean(readCache()) })
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

  const share = async () => {
    const data = {
      title: 'قائمة طعام العقدة',
      text: 'تصفح قائمة طعام مطعم العقدة',
      url: window.location.href
    }
    try {
      if (navigator.share) {
        await navigator.share(data)
        return
      }
      await navigator.clipboard.writeText(data.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      /* المستخدم ألغى المشاركة */
    }
  }

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
      <span className="menu-orb orb-a" aria-hidden="true"></span>
      <span className="menu-orb orb-b" aria-hidden="true"></span>

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

          <div className="menu-chips">
            {dateText && (
              <span className="menu-chip">
                <i className="far fa-clock" aria-hidden="true"></i>
                آخر تحديث: {dateText}
              </span>
            )}
            <button type="button" className="menu-chip menu-chip-btn" onClick={share}>
              <i className={`fas ${copied ? 'fa-check' : 'fa-share-nodes'}`} aria-hidden="true"></i>
              {copied ? 'تم نسخ الرابط' : 'مشاركة القائمة'}
            </button>
          </div>
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
                : 'نعمل على تحديث القائمة، يمكنك التواصل معنا مباشرة'}
            </p>
            <div className="menu-state-actions">
              <button type="button" className="menu-btn menu-btn-primary" onClick={() => loadMenu()}>
                <i className="fas fa-rotate-right" aria-hidden="true"></i>
                إعادة المحاولة
              </button>
              <a href={PHONE_TEL} className="menu-btn menu-btn-ghost">
                <i className="fas fa-phone" aria-hidden="true"></i>
                {PHONE_DISPLAY}
              </a>
            </div>
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
                <a href={menuUrl} download className="menu-btn menu-btn-ghost">
                  <i className="fas fa-download" aria-hidden="true"></i>
                  تحميل PDF
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

            <aside className="order-bar" aria-label="تواصل معنا">
              <div className="order-text">
                <strong>جاهز تطلب؟</strong>
                <span>كلمنا وهنجهز لك طلبك</span>
              </div>
              <div className="order-actions">
                <a href={PHONE_TEL} className="order-btn order-call">
                  <i className="fas fa-phone" aria-hidden="true"></i>
                  اتصل الآن
                </a>
                <a
                  href={PHONE_WA}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="order-btn order-wa"
                >
                  <i className="fab fa-whatsapp" aria-hidden="true"></i>
                  واتساب
                </a>
              </div>
            </aside>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default Menu
