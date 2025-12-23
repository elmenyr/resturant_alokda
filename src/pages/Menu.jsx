import React, { useState, useEffect } from 'react'
import { supabase, MENU_BUCKET } from '../lib/supabase'
import './Menu.css'

function Menu() {
  const [menuUrl, setMenuUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
    <div className="section menu-page">
      <div className="container">
        <h2 className="section-title">قائمة الطعام</h2>
        
        {error && !menuUrl ? (
          <div className="error-message">
            {error}
          </div>
        ) : menuUrl ? (
          <div className="menu-container">
            <iframe
              src={menuUrl}
              className="menu-pdf"
              title="قائمة الطعام"
            />
            <div className="menu-actions">
              <a 
                href={menuUrl} 
                download 
                className="btn btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                تحميل القائمة
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Menu

