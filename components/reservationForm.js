/* ==========================================================================
   BABKE KEBAB & PLATES — TABLE RESERVATION FORM COMPONENT
   ========================================================================== */

(function() {
  window.BabkeComponents = window.BabkeComponents || {};
  const bc = window.BabkeComponents;

  bc.reservationTranslations = {
  en: {
    title: "RESERVE A CHARCOAL TABLE",
    desc: "Guarantee your seats next to the embers. Fill out the reservation details below and we will confirm your booking.",
    label_name: "Full Name",
    label_phone: "Phone Number",
    label_date: "Reservation Date",
    label_time: "Time Slot",
    label_guests: "Number of Guests",
    label_notes: "Special Requests / Dietary Info",
    placeholder_name: "e.g. Anis...",
    placeholder_phone: "e.g. +216 98...",
    placeholder_notes: "e.g. Birthday dinner, baby high-chair, etc.",
    btn_submit: "Book My Table",
    success_msg: "Reservation request sent successfully! We'll call you shortly.",
    error_fill: "Please fill out all required fields!",
    confirm_title: "Reservation Request Received!",
    confirm_subtitle: "Your charcoal table booking is registered. We will call you shortly to confirm.",
    confirm_address_label: "Address",
    confirm_address: "Avenue des Orangers, Hammam Sousse, Tunisia",
    confirm_hours_label: "Operating Hours",
    confirm_hours_week: "Mon - Thu: 11:30 AM - Midnight",
    confirm_hours_weekend: "Fri - Sun: 11:30 AM - 1:00 AM",
    confirm_phone: "+216 73 821 999",
    confirm_btn_call: "Call Restaurant Now",
    confirm_btn_close: "Got it, Thank You"
  },
  fr: {
    title: "RÉSERVER UNE TABLE AU CHARBON",
    desc: "Garantissez vos places à côté des braises. Remplissez les détails ci-dessous pour effectuer votre réservation.",
    label_name: "Nom Complet",
    label_phone: "Numéro de Téléphone",
    label_date: "Date de Réservation",
    label_time: "Créneau Horaire",
    label_guests: "Nombre de Personnes",
    label_notes: "Demandes Spéciales / Allergies",
    placeholder_name: "ex : Anis...",
    placeholder_phone: "ex : +216 98...",
    placeholder_notes: "ex : Dîner d'anniversaire, chaise haute pour bébé, etc.",
    btn_submit: "Réserver ma Table",
    success_msg: "Demande de réservation envoyée ! Nous vous appellerons rapidement.",
    error_fill: "Veuillez remplir tous les champs obligatoires !",
    confirm_title: "Demande de réservation reçue !",
    confirm_subtitle: "Votre réservation est enregistrée. Nous vous appellerons sous peu pour confirmer.",
    confirm_address_label: "Adresse",
    confirm_address: "Avenue des Orangers, Hammam Sousse, Tunisie",
    confirm_hours_label: "Heures d'ouverture",
    confirm_hours_week: "Lun - Jeu : 11:30 - Minuit",
    confirm_hours_weekend: "Ven - Dim : 11:30 - 01:00",
    confirm_phone: "+216 73 821 999",
    confirm_btn_call: "Appeler le Restaurant",
    confirm_btn_close: "D'accord, Merci"
  },
  tn: {
    title: "أحجز طاولة البنة عالجمر",
    desc: "أضمن بلاصتك بحذا كانون الفحم الحامي. عبي البيانات لوطا وتوا نكلموك باش نأكدولك الحجز.",
    label_name: "الاسم الكامل",
    label_phone: "رقم الهاتف",
    label_date: "تاريخ الحجز",
    label_time: "وقت الحجز",
    label_guests: "عدد الأشخاص",
    label_notes: "توصيات خاصة / ملاحظات",
    placeholder_name: "مثال: أنيس...",
    placeholder_phone: "مثال: +216 98...",
    placeholder_notes: "مثال: عيد ميلاد، كرسي صغير للطفل...",
    btn_submit: "أحجز طاولتي توا",
    success_msg: "تبعت طلب الحجز بنجاح! كلمتنا باش تجيك في أقرب وقت.",
    error_fill: "عايش خويا عبي البيانات المطلوبة الكل!",
    confirm_title: "تبعت طلب الحجز بنجاح !",
    confirm_subtitle: "حجز طاولة البنة تسجل. توا نكلموك باش نأكدولك في أقرب وقت.",
    confirm_address_label: "العنوان",
    confirm_address: "نهج البرتقال، حمام سوسة، تونس",
    confirm_hours_label: "أوقات العمل",
    confirm_hours_week: "الاثنين - الخميس: 11:30 صباحًا - منتصف الليل",
    confirm_hours_weekend: "الجمعة - الأحد: 11:30 صباحًا - 1:00 صباحًا",
    confirm_phone: "+216 73 821 999",
    confirm_btn_call: "طلب الهاتف الآن",
    confirm_btn_close: "واضح، يعيشك"
  }
};

  bc.getReservationFormHTML = function(lang) {
  const t = bc.reservationTranslations[lang] || bc.reservationTranslations.en;
  
  return `
    <div class="reservation-form-card glass-card">
      <div class="reservation-form-header">
        <h4>${t.title}</h4>
        <p>${t.desc}</p>
      </div>
      <form id="landing-reservation-form" onsubmit="event.preventDefault();">
        <div class="res-form-grid">
          <div class="res-input-group">
            <label for="res-name">${t.label_name} <span class="req">*</span></label>
            <input type="text" id="res-name" placeholder="${t.placeholder_name}" required>
          </div>
          <div class="res-input-group">
            <label for="res-phone">${t.label_phone} <span class="req">*</span></label>
            <input type="tel" id="res-phone" placeholder="${t.placeholder_phone}" required>
          </div>
          <div class="res-input-group">
            <label for="res-date">${t.label_date} <span class="req">*</span></label>
            <input type="date" id="res-date" required>
          </div>
          <div class="res-input-group">
            <label for="res-time">${t.label_time} <span class="req">*</span></label>
            <select id="res-time" required>
              <option value="11:30">11:30</option>
              <option value="12:30">12:30</option>
              <option value="13:30">13:30</option>
              <option value="14:30">14:30</option>
              <option value="19:00" selected>19:00</option>
              <option value="20:00">20:00</option>
              <option value="21:00">21:00</option>
              <option value="22:00">22:00</option>
              <option value="23:00">23:00</option>
            </select>
          </div>
          <div class="res-input-group full-width">
            <label for="res-guests">${t.label_guests} <span class="req">*</span></label>
            <select id="res-guests" required>
              <option value="1">1 Person</option>
              <option value="2" selected>2 People</option>
              <option value="3">3 People</option>
              <option value="4">4 People</option>
              <option value="5">5 People</option>
              <option value="6">6 People</option>
              <option value="8">8 People</option>
              <option value="10">10+ People</option>
            </select>
          </div>
          <div class="res-input-group full-width">
            <label for="res-notes">${t.label_notes}</label>
            <textarea id="res-notes" rows="2" placeholder="${t.placeholder_notes}"></textarea>
          </div>
        </div>
        
        <div id="res-form-feedback" class="res-feedback-message" style="display:none;"></div>
        
        <button type="submit" class="btn-submit-reservation" id="btn-submit-reservation">
          <span>${t.btn_submit}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </form>
    </div>
  `;
};

// Wire reservation form submit logic
  bc.initReservationForm = function(lang) {
  const form = document.getElementById('landing-reservation-form');
  if (!form) return;

  const t = bc.reservationTranslations[lang] || bc.reservationTranslations.en;

  // Set today's date as min
  const dateInput = document.getElementById('res-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('res-name').value.trim();
    const phone = document.getElementById('res-phone').value.trim();
    const date = document.getElementById('res-date').value;
    const time = document.getElementById('res-time').value;
    const guests = parseInt(document.getElementById('res-guests').value);
    const notes = document.getElementById('res-notes').value.trim();

    if (!name || !phone || !date || !time) {
      if (typeof window.showToast === 'function') {
        window.showToast("⚠️ " + t.error_fill);
      } else {
        alert(t.error_fill);
      }
      return;
    }

    const reservation = {
      id: "RES-" + Date.now(),
      name: name,
      phone: phone,
      date: date,
      time: time,
      guests: guests,
      notes: notes,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    // Save to Local Database Store
    if (typeof BabkeDB !== 'undefined') {
      BabkeDB.addReservation(reservation);
    }

    // Display feedback message
    const feedback = document.getElementById('res-form-feedback');
    if (feedback) {
      feedback.textContent = t.success_msg;
      feedback.className = "res-feedback-message success";
      feedback.style.display = "block";
    }

    form.reset();
    
    // Reset date input
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }

    // Hide feedback after 5 seconds
    setTimeout(() => {
      if (feedback) {
        feedback.style.display = "none";
      }
    }, 5000);

    // Show booking confirmation overlay
    showConfirmationModal(lang);
  });
};

const showConfirmationModal = (lang) => {
  const t = bc.reservationTranslations[lang] || bc.reservationTranslations.en;
  const isRtl = lang === 'tn';
  const alignStyle = isRtl ? 'text-align: right; direction: rtl;' : 'text-align: center;';
  
  // Inject styles if not present
  let styleEl = document.getElementById('res-confirm-modal-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'res-confirm-modal-styles';
    styleEl.textContent = `
      .res-confirm-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(11, 15, 22, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        padding: 20px;
        opacity: 0;
        transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1);
      }
      .res-confirm-overlay.open {
        opacity: 1;
      }
      .res-confirm-card {
        background: rgba(22, 19, 18, 0.95);
        border: 1px solid var(--accent-primary, #ff5a1f);
        border-radius: 20px;
        max-width: 480px;
        width: 100%;
        padding: 32px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
        transform: translateY(25px);
        transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
      }
      body.light-theme .res-confirm-card {
        background: #ffffff;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.15);
      }
      .res-confirm-overlay.open .res-confirm-card {
        transform: translateY(0);
      }
      .res-confirm-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: rgba(255, 90, 31, 0.1);
        color: var(--accent-primary, #ff5a1f);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px auto;
      }
      .res-confirm-title {
        font-family: var(--font-heading, inherit);
        font-size: 1.45rem;
        font-weight: 800;
        color: var(--text-primary, #ffffff);
        margin-bottom: 12px;
      }
      .res-confirm-subtitle {
        font-size: 0.92rem;
        color: var(--text-secondary, #b3b3b3);
        line-height: 1.5;
        margin-bottom: 24px;
      }
      .res-info-section {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 28px;
      }
      body.light-theme .res-info-section {
        background: rgba(0, 0, 0, 0.01);
        border: 1px solid rgba(0, 0, 0, 0.05);
      }
      .res-info-item {
        margin-bottom: 12px;
      }
      .res-info-item:last-child {
        margin-bottom: 0;
      }
      .res-info-label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--accent-primary, #ff5a1f);
        margin-bottom: 2px;
      }
      .res-info-val {
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--text-primary, #ffffff);
      }
      .res-confirm-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .btn-confirm-call {
        background: var(--accent-primary, #ff5a1f);
        color: #ffffff;
        border: none;
        padding: 14px 24px;
        border-radius: 30px;
        font-weight: 700;
        font-size: 0.95rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        text-decoration: none;
        transition: all 0.2s ease;
      }
      .btn-confirm-call:hover {
        background: var(--accent-primary-hover, #d33c00);
        transform: translateY(-2px);
      }
      .btn-confirm-close {
        background: transparent;
        color: var(--text-secondary, #b3b3b3);
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 12px 24px;
        border-radius: 30px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      body.light-theme .btn-confirm-close {
        border: 1px solid rgba(0, 0, 0, 0.12);
      }
      .btn-confirm-close:hover {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary, #ffffff);
      }
      body.light-theme .btn-confirm-close:hover {
        background: rgba(0, 0, 0, 0.03);
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Build the modal elements
  const overlay = document.createElement('div');
  overlay.className = 'res-confirm-overlay';
  overlay.innerHTML = `
    <div class="res-confirm-card" style="${alignStyle}">
      <div class="res-confirm-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <h4 class="res-confirm-title">${t.confirm_title}</h4>
      <p class="res-confirm-subtitle">${t.confirm_subtitle}</p>
      
      <div class="res-info-section">
        <div class="res-info-item">
          <div class="res-info-label">${t.confirm_address_label}</div>
          <div class="res-info-val">${t.confirm_address}</div>
        </div>
        <div class="res-info-item">
          <div class="res-info-label">${t.confirm_hours_label}</div>
          <div class="res-info-val" style="font-size:0.82rem; margin-top:2px;">
            <div>${t.confirm_hours_week}</div>
            <div>${t.confirm_hours_weekend}</div>
          </div>
        </div>
      </div>
      
      <div class="res-confirm-actions">
        <a href="tel:${t.confirm_phone.replace(/\s+/g, '')}" class="btn-confirm-call">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>${t.confirm_btn_call}</span>
        </a>
        <button class="btn-confirm-close">${t.confirm_btn_close}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  
  // Animate open
  setTimeout(() => overlay.classList.add('open'), 50);

  // Close logic
  const closeBtn = overlay.querySelector('.btn-confirm-close');
  const closeOverlay = () => {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 350);
  };

  closeBtn.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });
};

})();
