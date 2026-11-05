import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import './PdfViewer.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const MIN_ZOOM = 0.6
const MAX_ZOOM = 3
const STEP = 0.25

/**
 * عارض PDF مخصص: يرسم كل صفحة كـ canvas بعرض الحاوية،
 * مع تكبير/تصغير وتنقل بين الصفحات ومؤشر للصفحة الحالية.
 */
function PdfViewer({ url, fullscreen, onFailed }) {
  const scrollRef = useRef(null)
  const pagesRef = useRef([])
  const [doc, setDoc] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [current, setCurrent] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [ready, setReady] = useState(false)
  const [width, setWidth] = useState(0)

  // تحميل المستند
  useEffect(() => {
    let cancelled = false
    const task = pdfjsLib.getDocument(url)
    task.promise
      .then((pdf) => {
        if (cancelled) return
        setDoc(pdf)
        setNumPages(pdf.numPages)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('PDF load failed:', err)
        if (onFailed) onFailed()
      })
    return () => {
      cancelled = true
      task.destroy()
    }
  }, [url, onFailed])

  // قياس عرض الحاوية
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return undefined
    const measure = () =>
      setWidth((prev) => (Math.abs(prev - el.clientWidth) < 24 && prev ? prev : el.clientWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // رسم الصفحات عند تغير المستند/العرض/التكبير
  useEffect(() => {
    if (!doc || !width) return undefined
    let cancelled = false
    const tasks = []

    const draw = async () => {
      const pad = width < 560 ? 24 : 48
      const target = Math.max(200, (width - pad) * zoom)
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)

      for (let n = 1; n <= doc.numPages; n += 1) {
        if (cancelled) return
        const page = await doc.getPage(n)
        const base = page.getViewport({ scale: 1 })
        const scale = target / base.width
        const viewport = page.getViewport({ scale: scale * dpr })
        const canvas = pagesRef.current[n - 1]
        if (!canvas) continue

        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = `${Math.floor(viewport.width / dpr)}px`
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`

        const renderTask = page.render({
          canvasContext: canvas.getContext('2d'),
          viewport
        })
        tasks.push(renderTask)
        try {
          await renderTask.promise
        } catch (e) {
          if (e?.name !== 'RenderingCancelledException') console.error(e)
        }
        if (n === 1) setReady(true)
      }
    }
    draw()

    return () => {
      cancelled = true
      tasks.forEach((t) => t.cancel())
    }
  }, [doc, width, zoom])

  // تتبع الصفحة الحالية أثناء التمرير
  useEffect(() => {
    const root = scrollRef.current
    if (!root || !numPages) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && en.intersectionRatio > 0.4) {
            setCurrent(Number(en.target.dataset.page))
          }
        })
      },
      { root, threshold: [0.4, 0.6] }
    )
    pagesRef.current.forEach((c) => c && io.observe(c.parentElement))
    return () => io.disconnect()
  }, [numPages, zoom])

  const goTo = useCallback((n) => {
    const target = Math.min(Math.max(n, 1), numPages)
    const el = pagesRef.current[target - 1]?.parentElement
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' })
    setCurrent(target)
  }, [numPages])

  const changeZoom = (delta) =>
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2))))

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return
      if (e.key === '+' || e.key === '=') changeZoom(STEP)
      else if (e.key === '-') changeZoom(-STEP)
      else if (e.key === 'ArrowRight' && e.altKey) goTo(current - 1)
      else if (e.key === 'ArrowLeft' && e.altKey) goTo(current + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [current, goTo])

  return (
    <div className={`pdfv ${fullscreen ? 'is-full' : ''}`}>
      <div className="pdfv-bar">
        <div className="pdfv-group">
          <button
            type="button"
            className="pdfv-btn"
            onClick={() => goTo(current - 1)}
            disabled={current <= 1}
            aria-label="الصفحة السابقة"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
          <span className="pdfv-count" aria-live="polite">
            <b>{current}</b> / {numPages || '–'}
          </span>
          <button
            type="button"
            className="pdfv-btn"
            onClick={() => goTo(current + 1)}
            disabled={current >= numPages}
            aria-label="الصفحة التالية"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
        </div>

        <div className="pdfv-group">
          <button
            type="button"
            className="pdfv-btn"
            onClick={() => changeZoom(-STEP)}
            disabled={zoom <= MIN_ZOOM}
            aria-label="تصغير"
          >
            <i className="fas fa-minus"></i>
          </button>
          <button
            type="button"
            className="pdfv-zoom"
            onClick={() => setZoom(1)}
            title="إعادة الضبط"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className="pdfv-btn"
            onClick={() => changeZoom(STEP)}
            disabled={zoom >= MAX_ZOOM}
            aria-label="تكبير"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
      </div>

      <div className="pdfv-scroll" ref={scrollRef}>
        {!ready && (
          <div className="pdfv-loading">
            <div className="spinner"></div>
            <span>جاري تجهيز القائمة...</span>
          </div>
        )}
        <div className={`pdfv-pages ${ready ? 'ready' : ''}`}>
          {Array.from({ length: numPages }, (_, i) => (
            <div className="pdfv-page" data-page={i + 1} key={i}>
              <canvas ref={(el) => { pagesRef.current[i] = el }} />
              <span className="pdfv-tag">{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {numPages > 1 && (
        <div className="pdfv-dots" role="tablist" aria-label="صفحات القائمة">
          {Array.from({ length: numPages }, (_, i) => (
            <button
              type="button"
              key={i}
              role="tab"
              aria-selected={current === i + 1}
              aria-label={`صفحة ${i + 1}`}
              className={`pdfv-dot ${current === i + 1 ? 'active' : ''}`}
              onClick={() => goTo(i + 1)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PdfViewer
