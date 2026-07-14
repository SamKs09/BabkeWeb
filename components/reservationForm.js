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
    error_fill: "Please fill out all required fields!"
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
    error_fill: "Veuillez remplir tous les champs obligatoires !"
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
    error_fill: "عايش خويا عبي البيانات المطلوبة الكل!"
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
      alert(t.error_fill);
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
  });
};

})();
