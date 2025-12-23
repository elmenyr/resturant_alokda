import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">


          {/* Contact Info - معلومات التواصل */}
          <div className="footer-section">
            <h4 className="footer-section-title">
              <i className="fas fa-phone"></i>
              <span>معلومات التواصل</span>
            </h4>
            <ul className="contact-info">
              <li className="contact-item">
                <div className="contact-icon phone-icon">
                  <i className="fas fa-phone"></i>
                </div>
                <div className="contact-details">
                  <a href="tel:01069700299" className="contact-link">01069700299</a>
                  <a href="tel:01011474476" className="contact-link">01011474476</a>
                </div>
              </li>

              <li className="contact-item">
                <div className="contact-icon location-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div className="contact-details">
                  <span className="contact-text">شارع المركز الأول محلات النادي</span>

                  <span className="contact-text"> شارع السلك بجوار بنك القاهره</span>

                </div>
              </li>


            </ul>
          </div>

          {/* Social Media - تابعنا */}
          <div className="footer-section">
            <h4 className="footer-section-title">
              <span>تابعنا</span>
            </h4>
            <div className="social-section">
              <p className="social-text">تابعنا على السوشيال ميديا لأحدث العروض!</p>
              <div className="social-icons">
                <a
                  href="https://www.facebook.com/share/16Pbyk9ie2/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon facebook"
                  aria-label="Facebook"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a
                  href="https://www.instagram.com/resturant_alokda?igsh=MW5rOHg5M29zYTF2dw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon instagram"
                  aria-label="Instagram"
                >
                  <i className="fab fa-instagram"></i>
                </a>
                <a
                  href="https://www.tiktok.com/@resturant_alokda?_t=ZS-8vYNJ0XSWbY&_r=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon tiktok"
                  aria-label="TikTok"
                >
                  <i className="fab fa-tiktok"></i>
                </a>
              </div>
            </div>
          </div>
        </div>


      </div>
    </footer>
  )
}

export default Footer

