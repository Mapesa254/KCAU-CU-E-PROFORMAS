import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CONFIG } from './config';
import PosterCanvas from './components/PosterCanvas';

// ─── Canvas → UI scale factor for the image editor ───────────────────────────
// The canvas photo circle has radius 860px (diameter 1720px).
// Our UI editor displays a circle of diameter 260px.
const CANVAS_PHOTO_DIAMETER = CONFIG.canvas.photo.radius * 2; // 1720
const UI_EDITOR_SIZE = 260; // px
const UI_TO_CANVAS_SCALE = CANVAS_PHOTO_DIAMETER / UI_EDITOR_SIZE; // ~6.615

function App() {
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [canvasLoading, setCanvasLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  // Image adjustment state (canvas-space values)
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Internal drag tracking refs (no re-render needed)
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (photoUrl && photoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  // ── File processing ──────────────────────────────────────────────────────
  const processFile = (file) => {
    if (!file) return;
    setErrorMsg('');
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Invalid file format. Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg('File is too large. Please upload an image smaller than 8MB.');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    if (photoUrl && photoUrl.startsWith('blob:')) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(objectUrl);
    setFileName(file.name);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);
  const handleDragOver = (e) => { e.preventDefault(); setIsDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragActive(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleRemovePhoto = () => {
    if (photoUrl && photoUrl.startsWith('blob:')) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setFileName('');
    setErrorMsg('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleResetAdjustments = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  // ── Image Editor: Drag to Pan ─────────────────────────────────────────────
  const getEventPos = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const onDragStart = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    lastPos.current = getEventPos(e);
  }, []);

  const onDragMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const pos = getEventPos(e);
    const dx = pos.x - lastPos.current.x;
    const dy = pos.y - lastPos.current.y;
    lastPos.current = pos;
    setCrop((prev) => ({
      x: prev.x + dx * UI_TO_CANVAS_SCALE,
      y: prev.y + dy * UI_TO_CANVAS_SCALE,
    }));
  }, []);

  const onDragEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ── Canvas Download ───────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your full name before downloading.');
      return;
    }
    const canvas = document.getElementById('poster-canvas');
    if (!canvas) {
      setErrorMsg('Canvas is not ready. Please try again.');
      return;
    }
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const sanitizedName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = `${sanitizedName || 'attendee'}_muhuru_bay_2026_poster.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to generate download. Ensure you are using a modern browser.');
    }
  };

  // UI-space crop (convert canvas-space back to screen pixels for the CSS preview)
  const uiCropX = crop.x / UI_TO_CANVAS_SCALE;
  const uiCropY = crop.y / UI_TO_CANVAS_SCALE;

  return (
    <div className="app-container">

      {/* ── Organization Header ─────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-branding">
          <img src={CONFIG.branding.logo} alt="KCAU CU Logo" className="header-logo" />
          <div className="header-title-container">
            <span className="header-org-name">{CONFIG.event.organizer}</span>
            <span className="header-subtitle">Muhuru Bay Mission 2026</span>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          EVENT LOGO HERO — Main visual introduction
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="event-hero" aria-label="Event Logo">
        <div className="event-hero-inner">
          <img
            src="/event-logo.png"
            alt="Muhuru Bay Mission 2026 — Theme: Repentance and Healing (2 Chronicles 7:14)"
            className="event-hero-logo"
          />
          <div className="event-hero-details">
            <span className="event-hero-date">17th — 23rd August 2026</span>
            <span className="event-hero-venue">Muhuru Bay, Migori County, Kenya</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: About Muhuru Bay Mission 2026
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mission-section about-section" aria-labelledby="about-heading">
        <div className="section-label-row">
          <span className="section-label-badge">About the Mission</span>
        </div>
        <h2 id="about-heading" className="section-heading">About Muhuru Bay Mission 2026</h2>
        <div className="about-content-grid">
          <div className="about-text-block">
            <p className="about-paragraph">
              Join KCA University Christian Union and Prayer and Ministry of Word as we journey to Muhuru Bay
              for a week of evangelism, discipleship, prayer, worship, and community outreach.
            </p>
            <p className="about-paragraph">
              Under the theme <strong className="about-theme">"Repentance and Healing"</strong> (2 Chronicles 7:14),
              participants will have the opportunity to serve communities, share the Gospel, grow spiritually,
              and experience the impact of missions firsthand.
            </p>
            <p className="about-paragraph">
              Whether you are joining us physically in Muhuru Bay or supporting from afar, your participation
              and support help make the mission possible and extend the reach of the Gospel to communities in need.
            </p>
          </div>
          <div className="about-theme-card">
            <div className="about-theme-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <blockquote className="about-verse">
              "If my people, who are called by my name, will humble themselves and pray and seek my face and turn from their wicked ways, then I will hear from heaven, and I will forgive their sin and will heal their land."
            </blockquote>
            <cite className="about-verse-ref">— 2 Chronicles 7:14</cite>
            <div className="about-theme-pill">Theme: Repentance &amp; Healing</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: What to Expect
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mission-section expectations-section" aria-labelledby="expect-heading">
        <div className="section-label-row">
          <span className="section-label-badge">Programme Highlights</span>
        </div>
        <h2 id="expect-heading" className="section-heading">What to Expect</h2>
        <div className="expectations-grid">
          {[
            {
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
              title: 'Evangelism and Outreach',
              desc: 'Taking the Gospel into homes, streets, and communities across Muhuru Bay.',
            },
            {
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>,
              title: 'Prayer and Intercession',
              desc: 'Corporate prayer sessions and intercession for the mission, communities, and the nation.',
            },
            {
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>,
              title: 'Worship and Fellowship',
              desc: 'Vibrant praise, worship nights, and meaningful fellowship with fellow believers.',
            },
            {
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
              title: 'Community Ministry',
              desc: 'Practical service in the community — health outreaches, clean-up drives, and more.',
            },
            {
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>,
              title: 'Discipleship and Spiritual Growth',
              desc: 'Bible studies, mentorship sessions, and teaching to deepen your walk with God.',
            },
            {
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
              title: 'Testimonies and Life Transformation',
              desc: 'Powerful testimonies of lives changed and encounters with God during the mission.',
            },
          ].map((item, i) => (
            <div key={i} className="expectation-card">
              <div className="expectation-icon" aria-hidden="true">{item.icon}</div>
              <h3 className="expectation-title">{item.title}</h3>
              <p className="expectation-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: Mission Contribution and Support
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mission-section contribution-section" aria-labelledby="contribution-heading">
        <div className="section-label-row">
          <span className="section-label-badge">Support the Mission</span>
        </div>
        <h2 id="contribution-heading" className="section-heading">Mission Contribution &amp; Support</h2>
        <div className="contribution-grid">
          {/* Participant Contribution Card */}
          <div className="contribution-card contribution-card--primary">
            <div className="contribution-card-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
            </div>
            <span className="contribution-card-tag">Participants</span>
            <div className="contribution-amount">Ksh. 2,000</div>
            <p className="contribution-card-desc">
              Required contribution for each participant physically attending Muhuru Bay Mission 2026.
            </p>
          </div>

          {/* Support Card */}
          <div className="contribution-card contribution-card--secondary">
            <div className="contribution-card-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </div>
            <span className="contribution-card-tag">Open Support</span>
            <div className="contribution-amount contribution-amount--any">Any Amount</div>
            <p className="contribution-card-desc">
              Support is open to everyone — alumni, churches, friends, partners, and well-wishers. Every contribution, no matter the size, matters and is greatly appreciated.
            </p>
          </div>

          {/* Payment Details Card */}
          <div className="contribution-card contribution-card--payment">
            <div className="contribution-card-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <span className="contribution-card-tag">Payment Details</span>
            <div className="payment-details-rows">
              <div className="payment-details-row">
                <span className="payment-details-label">M-PESA Paybill</span>
                <span className="payment-details-value">{CONFIG.payment.paybillNumber}</span>
              </div>
              <div className="payment-details-row">
                <span className="payment-details-label">Account Number</span>
                <span className="payment-details-value">{CONFIG.payment.accountNumber}</span>
              </div>
            </div>
            <p className="contribution-card-desc contribution-card-desc--note">
              Your contribution supports transport, accommodation, evangelism materials, outreach logistics, and ministry activities during Muhuru Bay Mission 2026.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4: Poster Generator (at the bottom)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mission-section poster-section" aria-labelledby="poster-heading">
        <div className="section-label-row">
          <span className="section-label-badge">Create Your Poster</span>
        </div>
        <h2 id="poster-heading" className="section-heading">Generate Your Attendance Poster</h2>
        <p className="poster-section-intro">
          Upload your photo and enter your name to generate a personalized Muhuru Bay Mission 2026 poster. Download and share it to let others know you'll be attending!
        </p>

        <div className="dashboard-grid">
          {/* Left: Customization Form */}
          <section className="corporate-card">
            <form onSubmit={(e) => e.preventDefault()}>
              <h3 className="form-section-title">Personalise Your Poster</h3>

              {/* Name Input */}
              <div className="form-group">
                <label htmlFor="fullname" className="form-label">Full Name</label>
                <input
                  id="fullname"
                  type="text"
                  maxLength="50"
                  placeholder="Enter your name to appear on the poster"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg.includes('name')) setErrorMsg('');
                  }}
                  className="input-text"
                  required
                />
                <span className="input-hint">Your name will appear on the gold banner at the bottom of the poster.</span>
              </div>

              {/* Photo Upload */}
              <div className="form-group">
                <label className="form-label">Profile Photo</label>
                <div className="upload-container">
                  <div
                    className={`upload-area ${isDragActive ? 'drag-active' : ''} ${photoUrl ? 'has-file' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="upload-icon-wrapper" aria-hidden="true">
                      {photoUrl ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      )}
                    </div>
                    <span className="upload-text">
                      {photoUrl ? 'Photo Uploaded Successfully' : 'Drag & drop your photo, or browse'}
                    </span>
                    <span className="upload-subtext">Supports PNG, JPG, or WEBP (Max 8MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden-input"
                    />
                  </div>

                  {photoUrl && (
                    <div className="upload-preview-bar">
                      <img src={photoUrl} alt="Thumbnail preview" className="upload-thumbnail" />
                      <span className="upload-filename">{fileName}</span>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="upload-remove-btn"
                        title="Remove image"
                        aria-label="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Image Adjustment Editor ── */}
              {photoUrl && (
                <div className="img-editor-section">
                  <div className="img-editor-header">
                    <span className="img-editor-title">Adjust Photo Position</span>
                    <button type="button" className="btn-reset-adj" onClick={handleResetAdjustments} title="Reset adjustments">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 .49-3.5"></path></svg>
                      Reset
                    </button>
                  </div>

                  <div className="img-editor-canvas-wrap">
                    <div
                      className="img-editor-circle"
                      style={{ width: UI_EDITOR_SIZE, height: UI_EDITOR_SIZE, touchAction: 'none', cursor: isDragging.current ? 'grabbing' : 'grab' }}
                      onMouseDown={onDragStart}
                      onMouseMove={onDragMove}
                      onMouseUp={onDragEnd}
                      onMouseLeave={onDragEnd}
                      onTouchStart={onDragStart}
                      onTouchMove={onDragMove}
                      onTouchEnd={onDragEnd}
                      aria-label="Drag to reposition your photo"
                      role="img"
                    >
                      <img
                        src={photoUrl}
                        alt="Profile preview"
                        className="img-editor-img"
                        style={{
                          transform: `translate(-50%, -50%) translate(${uiCropX}px, ${uiCropY}px) scale(${zoom}) rotate(${rotation}deg)`,
                        }}
                        draggable={false}
                      />
                      <div className="img-editor-overlay-ring" aria-hidden="true" />
                      <span className="img-editor-hint" aria-hidden="true">Drag to reposition</span>
                    </div>
                  </div>

                  {/* Zoom Slider */}
                  <div className="img-editor-control">
                    <label className="img-editor-control-label" htmlFor="zoom-slider">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                      Zoom
                    </label>
                    <input id="zoom-slider" type="range" min="1" max="4" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="img-editor-slider" />
                    <span className="img-editor-control-val">{zoom.toFixed(1)}×</span>
                  </div>

                  {/* Rotation Slider */}
                  <div className="img-editor-control">
                    <label className="img-editor-control-label" htmlFor="rotation-slider">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-.49-3.5"></path></svg>
                      Rotate
                    </label>
                    <input id="rotation-slider" type="range" min="-180" max="180" step="1" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value, 10))} className="img-editor-slider" />
                    <span className="img-editor-control-val">{rotation}°</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {errorMsg}
                </div>
              )}
            </form>
          </section>

          {/* Right: Live Canvas Preview */}
          <section className="corporate-card preview-card">
            <div className="preview-heading-wrapper">
              <h3 className="form-section-title" style={{ margin: 0 }}>Live Preview</h3>
              <span className="preview-badge-live">Live Sync</span>
            </div>

            <div style={{ position: 'relative', width: '100%' }}>
              <PosterCanvas
                name={name}
                photoUrl={photoUrl}
                onLoadingChange={setCanvasLoading}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
              />
              {canvasLoading && (
                <div className="canvas-loader">
                  <div className="spinner" aria-hidden="true"></div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Formatting assets...</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!name.trim() || canvasLoading}
              className="btn-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download Attendance Poster
            </button>
          </section>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="app-footer">
        <span className="footer-text">Supported by our partners</span>
        <div className="partner-row">
          {CONFIG.branding.partners.map((partner, index) => (
            <img
              key={index}
              src={partner.logo}
              alt={`${partner.name} logo`}
              className="partner-logo"
            />
          ))}
        </div>
      </footer>
    </div>
  );
}

export default App;
