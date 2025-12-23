import React, { useState, useEffect } from 'react'
import { supabase, MENU_BUCKET, OFFERS_IMAGES_BUCKET } from '../lib/supabase'
import './AdminDashboard.css'

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('menu')
  const [menuFile, setMenuFile] = useState(null)
  const [menuUrl, setMenuUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState(null)

  // Offers state
  const [offers, setOffers] = useState([])
  const [loadingOffers, setLoadingOffers] = useState(true)
  const [editingOffer, setEditingOffer] = useState(null)
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerImageFile, setOfferImageFile] = useState(null)
  const [offerImagePreview, setOfferImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    price: '',
    image_url: '',
    expiry_date: ''
  })

  useEffect(() => {
    loadMenu()
    loadOffers()
  }, [])

  const loadMenu = async () => {
    try {
      const { data, error } = await supabase
        .storage
        .from(MENU_BUCKET)
        .list('', {
          limit: 1,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (!error && data && data.length > 0) {
        const fileName = data[0].name
        const { data: urlData } = supabase
          .storage
          .from(MENU_BUCKET)
          .getPublicUrl(fileName)

        if (urlData?.publicUrl) {
          setMenuUrl(urlData.publicUrl)
        }
      }
    } catch (err) {
      console.error('Error loading menu:', err)
    }
  }

  const loadOffers = async () => {
    try {
      setLoadingOffers(true)
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOffers(data || [])
    } catch (err) {
      console.error('Error loading offers:', err)
    } finally {
      setLoadingOffers(false)
    }
  }

  const handleMenuUpload = async (e) => {
    e.preventDefault()
    if (!menuFile) {
      setUploadMessage({ type: 'error', text: 'يرجى اختيار ملف' })
      return
    }

    if (menuFile.type !== 'application/pdf') {
      setUploadMessage({ type: 'error', text: 'يرجى اختيار ملف PDF فقط' })
      return
    }

    try {
      setUploading(true)
      setUploadMessage(null)

      // Delete old menu if exists
      const { data: oldFiles } = await supabase
        .storage
        .from(MENU_BUCKET)
        .list()

      if (oldFiles && oldFiles.length > 0) {
        const oldFileNames = oldFiles.map(f => f.name)
        await supabase.storage.from(MENU_BUCKET).remove(oldFileNames)
      }

      // Upload new menu
      const fileName = `menu-${Date.now()}.pdf`
      const { error: uploadError } = await supabase.storage
        .from(MENU_BUCKET)
        .upload(fileName, menuFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      setUploadMessage({ type: 'success', text: 'تم رفع القائمة بنجاح' })
      setMenuFile(null)
      loadMenu()
    } catch (err) {
      console.error('Upload error:', err)
      setUploadMessage({
        type: 'error',
        text: err.message || 'حدث خطأ أثناء رفع الملف'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = async (file) => {
    try {
      setUploadingImage(true)

      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('يجب تسجيل الدخول أولاً')
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('يرجى اختيار ملف صورة فقط')
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت')
      }

      // Delete old image if editing
      if (editingOffer && editingOffer.image_url) {
        try {
          // Extract file path from URL
          const urlParts = editingOffer.image_url.split('/')
          const fileNameIndex = urlParts.findIndex(part => part === OFFERS_IMAGES_BUCKET)
          if (fileNameIndex !== -1 && fileNameIndex < urlParts.length - 1) {
            const oldImagePath = urlParts.slice(fileNameIndex + 1).join('/')
            await supabase.storage.from(OFFERS_IMAGES_BUCKET).remove([oldImagePath])
          }
        } catch (err) {
          console.warn('Error deleting old image:', err)
        }
      }

      // Upload new image
      const fileExt = file.name.split('.').pop()
      const fileName = `offer-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(OFFERS_IMAGES_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        if (uploadError.message.includes('row-level security')) {
          throw new Error('خطأ في الصلاحيات. تأكد من إعداد Storage Policies في Supabase')
        }
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from(OFFERS_IMAGES_BUCKET)
        .getPublicUrl(fileName)

      return urlData?.publicUrl || null
    } catch (err) {
      console.error('Image upload error:', err)
      throw err
    } finally {
      setUploadingImage(false)
    }
  }

  const handleOfferSubmit = async (e) => {
    e.preventDefault()

    try {
      let imageUrl = offerForm.image_url

      // Upload image if file is selected
      if (offerImageFile) {
        imageUrl = await handleImageUpload(offerImageFile)
        if (!imageUrl) {
          throw new Error('فشل رفع الصورة')
        }
      }

      const offerData = {
        title: offerForm.title,
        description: offerForm.description,
        price: offerForm.price || null,
        image_url: imageUrl || null,
        expiry_date: offerForm.expiry_date || null
      }

      if (editingOffer) {
        // Update existing offer
        const { error } = await supabase
          .from('offers')
          .update(offerData)
          .eq('id', editingOffer.id)

        if (error) throw error
        setUploadMessage({ type: 'success', text: 'تم تحديث العرض بنجاح' })
      } else {
        // Create new offer
        const { error } = await supabase
          .from('offers')
          .insert([offerData])

        if (error) throw error
        setUploadMessage({ type: 'success', text: 'تم إضافة العرض بنجاح' })
      }

      // Reset form
      setOfferForm({ title: '', description: '', price: '', image_url: '', expiry_date: '' })
      setOfferImageFile(null)
      setOfferImagePreview(null)
      setEditingOffer(null)
      setShowOfferForm(false)
      loadOffers()
    } catch (err) {
      console.error('Error saving offer:', err)
      setUploadMessage({
        type: 'error',
        text: err.message || 'حدث خطأ أثناء حفظ العرض'
      })
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setOfferImageFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setOfferImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditOffer = (offer) => {
    setEditingOffer(offer)
    setOfferForm({
      title: offer.title,
      description: offer.description,
      price: offer.price || '',
      image_url: offer.image_url || '',
      expiry_date: offer.expiry_date || ''
    })
    setOfferImageFile(null)
    setOfferImagePreview(offer.image_url || null)
    setShowOfferForm(true)
  }

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العرض؟')) {
      return
    }

    try {
      // Get offer to delete image
      const offer = offers.find(o => o.id === id)

      // Delete image from storage if exists
      if (offer && offer.image_url) {
        try {
          const imagePath = offer.image_url.split('/').pop()
          await supabase.storage.from(OFFERS_IMAGES_BUCKET).remove([imagePath])
        } catch (err) {
          console.warn('Error deleting image:', err)
        }
      }

      // Delete offer from database
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', id)

      if (error) throw error
      setUploadMessage({ type: 'success', text: 'تم حذف العرض بنجاح' })
      loadOffers()
    } catch (err) {
      console.error('Error deleting offer:', err)
      setUploadMessage({
        type: 'error',
        text: err.message || 'حدث خطأ أثناء حذف العرض'
      })
    }
  }

  return (
    <div className="section admin-dashboard">
      <div className="container">
        <h2 className="section-title">لوحة التحكم</h2>

        {uploadMessage && (
          <div className={uploadMessage.type === 'error' ? 'error-message' : 'success-message'}>
            {uploadMessage.text}
          </div>
        )}

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            إدارة القائمة
          </button>
          <button
            className={`tab-btn ${activeTab === 'offers' ? 'active' : ''}`}
            onClick={() => setActiveTab('offers')}
          >
            إدارة العروض
          </button>
        </div>

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="dashboard-content">
            <div className="card">
              <h3>رفع/استبدال قائمة الطعام</h3>
              <p className="section-description">
                قم برفع ملف PDF لقائمة الطعام. سيتم استبدال القائمة القديمة تلقائياً.
              </p>

              <form onSubmit={handleMenuUpload}>
                <div className="form-group">
                  <label htmlFor="menu-file">اختر ملف PDF</label>
                  <input
                    type="file"
                    id="menu-file"
                    accept="application/pdf"
                    onChange={(e) => setMenuFile(e.target.files[0])}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploading || !menuFile}
                >
                  {uploading ? 'جاري الرفع...' : 'رفع القائمة'}
                </button>
              </form>

              {menuUrl && (
                <div className="current-menu">
                  <h4>القائمة الحالية:</h4>
                  <a
                    href={menuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    عرض القائمة
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <div className="dashboard-content">
            <div className="card">
              <div className="offers-header">
                <h3>إدارة العروض</h3>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowOfferForm(!showOfferForm)
                    setEditingOffer(null)
                    setOfferForm({ title: '', description: '', price: '', image_url: '', expiry_date: '' })
                    setOfferImageFile(null)
                    setOfferImagePreview(null)
                  }}
                >
                  {showOfferForm ? 'إلغاء' : 'إضافة عرض جديد'}
                </button>
              </div>

              {showOfferForm && (
                <form onSubmit={handleOfferSubmit} className="offer-form">
                  <div className="form-group">
                    <label htmlFor="offer-title">عنوان العرض *</label>
                    <input
                      type="text"
                      id="offer-title"
                      value={offerForm.title}
                      onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                      required
                      placeholder="مثال: عرض خاص على الأطباق الرئيسية"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="offer-description">الوصف *</label>
                    <textarea
                      id="offer-description"
                      value={offerForm.description}
                      onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                      required
                      placeholder="وصف تفصيلي للعرض"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="offer-price">السعر (اختياري)</label>
                    <input
                      type="text"
                      id="offer-price"
                      value={offerForm.price}
                      onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                      placeholder="مثال: 50 جنيه"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="offer-expiry">تاريخ انتهاء العرض (اختياري)</label>
                    <input
                      type="datetime-local"
                      id="offer-expiry"
                      value={offerForm.expiry_date}
                      onChange={(e) => setOfferForm({ ...offerForm, expiry_date: e.target.value })}
                      placeholder="اختر تاريخ ووقت انتهاء العرض"
                    />
                    <small className="form-help">
                      إذا تم تحديد تاريخ، سيختفي العرض تلقائياً بعد انتهاء المدة
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="offer-image">صورة العرض (اختياري)</label>
                    <input
                      type="file"
                      id="offer-image"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {offerImagePreview && (
                      <div className="image-preview">
                        <img src={offerImagePreview} alt="Preview" />
                        <button
                          type="button"
                          className="btn-remove-image"
                          onClick={() => {
                            setOfferImageFile(null)
                            setOfferImagePreview(null)
                            if (editingOffer && editingOffer.image_url) {
                              setOfferForm({ ...offerForm, image_url: '' })
                            }
                          }}
                        >
                          إزالة الصورة
                        </button>
                      </div>
                    )}
                    <small className="form-help">
                      يمكنك رفع صورة مباشرة (JPG, PNG) أو تركها فارغة
                    </small>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={uploadingImage}
                  >
                    {uploadingImage
                      ? 'جاري رفع الصورة...'
                      : editingOffer
                        ? 'تحديث العرض'
                        : 'إضافة العرض'
                    }
                  </button>
                </form>
              )}

              {loadingOffers ? (
                <div className="loading">
                  <div className="spinner"></div>
                </div>
              ) : (
                <div className="offers-list">
                  {offers.length === 0 ? (
                    <p className="no-offers">لا توجد عروض حالياً</p>
                  ) : (
                    offers.map((offer) => (
                      <div key={offer.id} className="offer-item">
                        <div className="offer-item-content">
                          {offer.image_url && (
                            <img src={offer.image_url} alt={offer.title} className="offer-item-image" />
                          )}
                          <div className="offer-item-details">
                            <h4>{offer.title}</h4>
                            <p>{offer.description}</p>
                            {offer.price && <p className="offer-item-price">السعر: {offer.price}</p>}
                            {offer.expiry_date && (
                              <p className="offer-item-expiry">
                                ⏰ ينتهي: {new Date(offer.expiry_date).toLocaleString('ar-EG')}
                              </p>
                            )}
                            <p className="offer-item-date">
                              تاريخ الإنشاء: {new Date(offer.created_at).toLocaleDateString('ar-EG')}
                            </p>
                          </div>
                        </div>
                        <div className="offer-item-actions">
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleEditOffer(offer)}
                          >
                            تعديل
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteOffer(offer.id)}
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard

