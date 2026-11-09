import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import './PdfViewer.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const MIN_ZOOM = 0.6
const MAX_ZOOM = 3
const STEP = 0.25

/** صورة مصغّرة لصفحة — تُرسم مرة واحدة بحجم صغير جداً */
function Thumb({ doc, n, active, onClick }) {
  const ref = useRef(null)
  useEffect(() => {
    let task
    let dead = false
    doc.getPage(n).then((page) => {
      if (dead || !ref.current) return
      const base = page.getViewport({ scale: 1 })
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = 132
      const vp = page.getViewport({ scale: (w / base.width) * dpr })
      const c = ref.current
      c.width = Math.floor(vp.width)
      c.height = Math.floor(vp.height)
      c.style.aspectRatio = `${base.width} / ${base.height}`
      task = page.render({ canvasContext: c.getContext('2d'), viewport: vp })
      task.promise.catch(() => {})
    })
    return () => {
      dead = true
      task?.cancel()
    }
  }, [doc, n])

  return (
    <button
      type="button"
      className={`pdfv-thumb ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-label={`صفحة ${n}`}
      aria-current={active}
    >
      <canvas ref={ref} />
      <span>{n}</span>
    </button>
  )
}

/**
 * عارض PDF مخصص وسريع:
 * - يرسم الصفحات القريبة من الشاشة فقط (lazy) ويعيد استخدام ما رُسم.
 * - تكبير/تصغير، سحب بالماوس، Ctrl+عجلة، ونقر مزدوج.
 * - شريط صور مصغّرة وتنقل بين الصفحات.
 */
function PdfViewer({ url, fullscreen, onFailed }) {
  const scrollRef = useRef(null)
  const canvasRefs = useRef([])
  const wrapRefs = useRef([])
  const renderedKey = useRef(new Map())
  const tasks = useRef(new Map())
  const visible = useRef(new Set())

  const [doc, setDoc] = useState(null)
  const [sizes, setSizes] = useState([])
  const [current, setCurrent] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [ready, setReady] = useState(false)
  const [width, setWidth] = useState(0)
  const [dragging, setDragging] = useState(false)

  const numPages = sizes.length

  // تحميل المستند وقياس أبعاد كل الصفحات (سريع، لا رسم)
  useEffect(() => {
    let cancelled = false
    setDoc(null)
    setSizes([])
    setReady(false)
    renderedKey.current.clear()
    // disableFontFace: يرسم الحروف كمسارات بدل خطوط المتصفح، وده بيحل تداخل الحروف العربية
    const task = pdfjsLib.getDocument({ url, disableFontFace: true })
    task.promise
      .then(async (pdf) => {
        const pages = await Promise.all(
          Array.from({ length: pdf.numPages }, (_, i) => pdf.getPage(i + 1))
        )
        if (cancelled) return
        setSizes(pages.map((p) => {
          const v = p.getViewport({ scale: 1 })
          return { w: v.width, h: v.height }
        }))
        setDoc(pdf)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('PDF load failed:', err)
        onFailed?.()
      })
    return () => {
      cancelled = true
      task.destroy()
    }
  }, [url, onFailed])

  // قياس عرض الحاوية (مع تجاهل تغيرات صغيرة مثل ظهور scrollbar)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return undefined
    const measure = () =>
      setWidth((prev) => (prev && Math.abs(prev - el.clientWidth) < 24 ? prev : el.clientWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const targetW = useMemo(() => {
    if (!width) return 0
    const pad = width < 560 ? 20 : 48
    return Math.max(200, Math.round((width - pad) * zoom))
  }, [width, zoom])

  const renderPage = useCallback(async (n) => {
    if (!doc || !targetW) return
    const key = `${targetW}`
    if (renderedKey.current.get(n) === key) return
    const canvas = canvasRefs.current[n - 1]
    if (!canvas) return

    tasks.current.get(n)?.cancel()
    renderedKey.current.set(n, key)

    try {
      const page = await doc.getPage(n)
      const base = page.getViewport({ scale: 1 })
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      const viewport = page.getViewport({ scale: (targetW / base.width) * dpr })
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)

      const task = page.render({ canvasContext: canvas.getContext('2d'), viewport })
      tasks.current.set(n, task)
      await task.promise
      setReady(true)
    } catch (e) {
      if (e?.name === 'RenderingCancelledException') {
        if (renderedKey.current.get(n) === key) renderedKey.current.delete(n)
      } else {
        console.error(e)
        renderedKey.current.delete(n)
      }
    }
  }, [doc, targetW])

  // مراقبة الصفحات القريبة من الشاشة فقط
  useEffect(() => {
    const root = scrollRef.current
    if (!root || !numPages) return undefined
    visible.current.clear()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          const n = Number(en.target.dataset.page)
          if (en.isIntersecting) {
            visible.current.add(n)
            renderPage(n)
          } else {
            visible.current.delete(n)
          }
        })
      },
      { root, rootMargin: '120% 0px 120% 0px' }
    )
    wrapRefs.current.forEach((w) => w && io.observe(w))
    return () => io.disconnect()
  }, [numPages, renderPage])

  // إعادة رسم الصفحات الظاهرة عند تغيّر التكبير/العرض
  useEffect(() => {
    visible.current.forEach((n) => renderPage(n))
  }, [renderPage])

  useEffect(() => () => tasks.current.forEach((t) => t.cancel()), [])

  // تتبع الصفحة الحالية بحسب مركز الشاشة
  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const mid = el.scrollTop + el.clientHeight / 2
    let best = 1
    for (let i = 0; i < wrapRefs.current.length; i += 1) {
      const w = wrapRefs.current[i]
      if (w && w.offsetTop <= mid) best = i + 1
    }
    setCurrent(best)
  }, [])

  const goTo = useCallback((n) => {
    const target = Math.min(Math.max(n, 1), numPages)
    wrapRefs.current[target - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' })
    setCurrent(target)
  }, [numPages])

  const changeZoom = useCallback((delta) =>
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2)))), [])

  // اختصارات + Ctrl/⌘ + عجلة الماوس للتكبير
  useEffect(() => {
    const el = scrollRef.current
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return
      if (e.key === '+' || e.key === '=') changeZoom(STEP)
      else if (e.key === '-') changeZoom(-STEP)
      else if (e.key === 'ArrowRight' && e.altKey) goTo(current - 1)
      else if (e.key === 'ArrowLeft' && e.altKey) goTo(current + 1)
    }
    const onWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      changeZoom(e.deltaY < 0 ? STEP / 2 : -STEP / 2)
    }
    document.addEventListener('keydown', onKey)
    el?.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      document.removeEventListener('keydown', onKey)
      el?.removeEventListener('wheel', onWheel)
    }
  }, [current, goTo, changeZoom])

  // السحب بالماوس للتحريك أثناء التكبير
  const drag = useRef(null)
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || zoom <= 1) return
    const el = scrollRef.current
    drag.current = { x: e.clientX, y: e.clientY, l: el.scrollLeft, t: el.scrollTop }
    setDragging(true)
    el.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    const el = scrollRef.current
    el.scrollLeft = drag.current.l - (e.clientX - drag.current.x)
    el.scrollTop = drag.current.t - (e.clientY - drag.current.y)
  }
  const endDrag = () => {
    drag.current = null
    setDragging(false)
  }

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

      <div
        className={`pdfv-scroll ${zoom > 1 ? 'can-drag' : ''} ${dragging ? 'dragging' : ''}`}
        ref={scrollRef}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 2))}
      >
        {!ready && (
          <div className="pdfv-loading">
            <div className="spinner"></div>
            <span>جاري تجهيز القائمة...</span>
          </div>
        )}
        <div className={`pdfv-pages ${ready ? 'ready' : ''}`}>
          {sizes.map((s, i) => (
            <div
              className="pdfv-page"
              data-page={i + 1}
              key={i}
              ref={(el) => { wrapRefs.current[i] = el }}
              style={targetW ? { width: targetW, height: Math.round((targetW * s.h) / s.w) } : undefined}
            >
              <canvas
                ref={(el) => { canvasRefs.current[i] = el }}
                style={{ width: '100%', height: '100%' }}
              />
              <span className="pdfv-tag">{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {numPages > 1 && ready && doc && (
        <div className="pdfv-thumbs" role="tablist" aria-label="صفحات القائمة">
          {sizes.map((_, i) => (
            <Thumb
              key={i}
              doc={doc}
              n={i + 1}
              active={current === i + 1}
              onClick={() => goTo(i + 1)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PdfViewer
