/* ==========================================================================
   BABKE KEBAB & PLATES — INTERACTIVE APPLICATION MECHANICS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const getLang = () => localStorage.getItem('babke_lang') || 'en';

  // 0. Immersive Theme Switcher Controls
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  
  const setTheme = (theme) => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      localStorage.setItem('babke_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('babke_theme', 'dark');
    }
  };

  // Load saved preference or default to dark-embers mode
  const savedTheme = localStorage.getItem('babke_theme') || 'dark';
  setTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isLight = document.body.classList.contains('light-theme');
      setTheme(isLight ? 'dark' : 'light');
    });
  }

  // 1. Sticky Navigation Scroll Mechanic
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  const handleScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    highlightNavOnScroll();
  };

  // Highlight active section on navigation links on scroll
  const highlightNavOnScroll = () => {
    const scrollPos = window.scrollY + 100; // Offset for sticky navbar
    
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      
      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Trigger initially on page load

  // 2. Mobile Responsive Burger Menu Controls
  const burgerMenuBtn = document.getElementById('burger-menu');
  const navMenu = document.getElementById('nav-menu');

  if (burgerMenuBtn && navMenu) {
    const toggleMobileMenu = () => {
      burgerMenuBtn.classList.toggle('open');
      navMenu.classList.toggle('open');
    };

    const closeMobileMenu = () => {
      burgerMenuBtn.classList.remove('open');
      navMenu.classList.remove('open');
    };

    burgerMenuBtn.addEventListener('click', toggleMobileMenu);

    navLinks.forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  // 3. DYNAMIC RENDERING FUNCTIONS

  // A. Dynamic Menu Rendering
  let isScrollingProgrammatically = false;
  let scrollTimeout = null;

  const menuTabs = document.querySelectorAll('.menu-tab');

  // Smooth scroll links on tab clicks
  menuTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const category = e.currentTarget.dataset.category;
      const targetSection = document.getElementById(`cat-section-${category}`);
      if (targetSection) {
        // Set flag to prevent IntersectionObserver overrides during smooth scroll
        isScrollingProgrammatically = true;
        clearTimeout(scrollTimeout);

        // Immediate tab visual active state update
        menuTabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');

        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Reset programmatic scroll flag after scroll duration
        scrollTimeout = setTimeout(() => {
          isScrollingProgrammatically = false;
        }, 800);
      }
    });
  });

  const setupMenuScrollObserver = () => {
    // Avoid double observers on language changes/re-renders
    if (window.babkeMenuObserver) {
      window.babkeMenuObserver.disconnect();
    }

    const sections = document.querySelectorAll('.menu-category-section');
    if (sections.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-140px 0px -50% 0px',
      threshold: 0
    };

    window.babkeMenuObserver = new IntersectionObserver((entries) => {
      if (isScrollingProgrammatically) return;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const category = id.replace('cat-section-', '');

          menuTabs.forEach(tab => {
            if (tab.dataset.category === category) {
              tab.classList.add('active');
            } else {
              tab.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(sec => window.babkeMenuObserver.observe(sec));
  };

  const renderMenu = () => {
    const wrapper = document.getElementById('menu-categories-wrapper');
    if (!wrapper) return;

    if (typeof BabkeDB === 'undefined') {
      console.error("BabkeDB data store not loaded.");
      return;
    }

    const menuItems = BabkeDB.getMenu();
    const lang = getLang();

    // Localized category definitions matching the required languages
    const categories = [
      { id: 'wraps', label: { en: 'Wraps & Sandwiches', fr: 'Wraps & Sandwichs', tn: 'سندويشات' } },
      { id: 'plates', label: { en: 'Feast Platters', fr: 'Plats Grillades', tn: 'أطباق مشوية' } },
      { id: 'mezze', label: { en: 'Mezze & Dips', fr: 'Mezzés & Entrées', tn: 'مقبلات و غطوس' } },
      { id: 'specialties', label: { en: 'Specialties', fr: 'Spécialités', tn: 'العروض الخاصة' } }
    ];

    // Localized bottom button texts
    let btnText = "Customize & Order";
    if (lang === 'fr') {
      btnText = "Personnaliser";
    } else if (lang === 'tn') {
      btnText = "أطلب البنة";
    }

    wrapper.innerHTML = '';

    categories.forEach(cat => {
      const catItems = menuItems.filter(item => item.category === cat.id);
      if (catItems.length === 0) return;

      const catTitle = cat.label[lang] || cat.label['en'];

      // Create Category Section
      const section = document.createElement('section');
      section.className = 'menu-category-section';
      section.id = `cat-section-${cat.id}`;

      // Section Title with glow shadow styling
      const heading = document.createElement('h3');
      heading.className = 'category-section-title';
      heading.textContent = catTitle;
      section.appendChild(heading);

      // Carousel Container
      const carouselWrapper = document.createElement('div');
      carouselWrapper.className = 'menu-carousel-wrapper';

      const prevBtn = document.createElement('button');
      prevBtn.className = 'carousel-btn prev';
      prevBtn.setAttribute('aria-label', 'Previous items');
      prevBtn.innerHTML = '&#8249;';

      const nextBtn = document.createElement('button');
      nextBtn.className = 'carousel-btn next';
      nextBtn.setAttribute('aria-label', 'Next items');
      nextBtn.innerHTML = '&#8250;';

      const track = document.createElement('div');
      track.className = 'menu-carousel-track';

      // Item Cards
      catItems.forEach(item => {
        const card = document.createElement('article');
        card.className = 'menu-item-card';
        card.id = item.id;
        card.dataset.cat = item.category;

        const title = item.title[lang] || item.title['en'];
        const desc = item.description[lang] || item.description['en'];
        const imageSrc = item.image;
        const fallbackSrc = item.fallbackImage;

        // Tags markup
        let tagsHtml = '';
        const tagsList = item.tags[lang] || item.tags['en'] || [];
        tagsList.forEach(tag => {
          let style = '';
          if (tag.includes('2025') || tag.toLowerCase().includes('seller') || tag.toLowerCase().includes('vendeur') || tag.includes('طلب')) {
            style = 'style="background:#ffb830;color:#000000;font-weight:900;letter-spacing:0.02em;"';
          }
          tagsHtml += `<span class="card-tag" ${style}>${tag}</span>`;
        });

        card.innerHTML = `
          <div class="menu-item-img-wrapper">
            <img src="${imageSrc}" onerror="this.onerror=null; this.src='${fallbackSrc}';" alt="${title}" class="menu-item-img" loading="lazy">
            <div class="menu-item-tags">
              ${tagsHtml}
            </div>
          </div>
          <div class="menu-item-body">
            <div class="menu-item-header">
              <h3>${title}</h3>
              <span class="menu-item-price">${item.price.toFixed(1)} TND</span>
            </div>
            <p class="menu-item-text">${desc}</p>
          </div>
          <div class="menu-card-actions-row">
            <button class="btn-card-add" data-id="${item.id}" data-name="${title}" data-price="${item.price}" data-desc="${desc}">
              <span>${btnText}</span>
              <span class="btn-plus-icon">+</span>
            </button>
          </div>
        `;
        track.appendChild(card);
      });

      carouselWrapper.appendChild(prevBtn);
      carouselWrapper.appendChild(track);
      carouselWrapper.appendChild(nextBtn);
      section.appendChild(carouselWrapper);
      wrapper.appendChild(section);

      // Horizontal Carousel scroll wire (dynamically calculates card width + gap)
      prevBtn.addEventListener('click', () => {
        const cardWidth = track.querySelector('.menu-item-card')?.clientWidth || 280;
        const scrollAmount = cardWidth + 24;
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', () => {
        const cardWidth = track.querySelector('.menu-item-card')?.clientWidth || 280;
        const scrollAmount = cardWidth + 24;
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });

      // Update Arrow overlay buttons visibility & centering helper
      const updateCarouselButtons = () => {
        const scrollLeft = track.scrollLeft;
        const maxScrollLeft = track.scrollWidth - track.clientWidth;

        // Hide prev button at start limit
        prevBtn.disabled = (scrollLeft <= 5);
        // Hide next button at end limit
        nextBtn.disabled = (scrollLeft >= maxScrollLeft - 5);

        // Center elements if they don't overflow the visible track area (looks professional on desktop)
        if (track.scrollWidth <= track.clientWidth) {
          track.classList.add('justify-center');
          prevBtn.style.display = 'none';
          nextBtn.style.display = 'none';
        } else {
          track.classList.remove('justify-center');
          prevBtn.style.display = '';
          nextBtn.style.display = '';
        }
      };

      // Initial execution & bind events
      setTimeout(updateCarouselButtons, 50); // slight timeout to let DOM dimensions settle
      track.addEventListener('scroll', updateCarouselButtons, { passive: true });
      window.addEventListener('resize', updateCarouselButtons, { passive: true });
    });

    // Wire customization modal dispatch triggers
    wrapper.querySelectorAll('.btn-card-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dataset = e.currentTarget.dataset;
        const event = new CustomEvent('babkeOpenCustomizer', {
          detail: {
            id: dataset.id,
            name: dataset.name,
            price: parseFloat(dataset.price),
            desc: dataset.desc
          }
        });
        window.dispatchEvent(event);
      });
    });

    // Initialize/sync scroll observers
    setupMenuScrollObserver();
  };

  // B. Dynamic Reviews Rendering
  let activeReviewIndex = 0;
  let reviewTimer = null;

  const renderReviews = () => {
    const track = document.getElementById('reviews-slider-track');
    if (!track) return;

    const reviews = BabkeDB.getReviews().filter(r => !r.hidden);
    track.innerHTML = '';

    reviews.forEach((review, index) => {
      const slide = document.createElement('div');
      slide.className = `review-slide ${index === activeReviewIndex ? 'active' : ''}`;
      
      let starsHtml = '';
      for (let i = 0; i < review.stars; i++) starsHtml += '★';
      for (let i = review.stars; i < 5; i++) starsHtml += '☆';

      slide.innerHTML = `
        <div class="review-header">
          <div class="stars">${starsHtml}</div>
          <span class="review-date">${review.date}</span>
        </div>
        <p class="review-text">"${review.text}"</p>
        <div class="review-author">
          <span class="author-avatar">${review.avatar || review.author.charAt(0)}</span>
          <div>
            <h4>${review.author}</h4>
            <p>${review.role}</p>
          </div>
        </div>
      `;

      track.appendChild(slide);
    });

    resetReviewTimer();
  };

  const showReview = (index) => {
    const slides = document.querySelectorAll('.review-slide');
    if (slides.length === 0) return;

    slides[activeReviewIndex].classList.remove('active');
    activeReviewIndex = (index + slides.length) % slides.length;
    slides[activeReviewIndex].classList.add('active');
  };

  const nextReview = () => {
    showReview(activeReviewIndex + 1);
    resetReviewTimer();
  };

  const prevReview = () => {
    showReview(activeReviewIndex - 1);
    resetReviewTimer();
  };

  const startReviewTimer = () => {
    reviewTimer = setInterval(nextReview, 6000);
  };

  const resetReviewTimer = () => {
    clearInterval(reviewTimer);
    startReviewTimer();
  };

  // Wire slider clicks
  const prevBtn = document.getElementById('btn-prev-review');
  const nextBtn = document.getElementById('btn-next-review');
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', prevReview);
    nextBtn.addEventListener('click', nextReview);
  }

  // D. Dynamic Events Swiper Rendering
  const renderEvents = () => {
    const section = document.getElementById('events');
    const track = document.getElementById('events-swiper-track');
    if (!section || !track) return;

    if (typeof BabkeDB === 'undefined') {
      console.error("BabkeDB data store not loaded.");
      return;
    }

    const events = BabkeDB.getEvents();
    const lang = getLang();

    // Filter events to only show published and cancelled ones
    const activeEvents = events.filter(e => e.status === 'published' || e.status === 'cancelled');

    if (activeEvents.length === 0) {
      section.style.display = 'none';
      return;
    } else {
      section.style.display = 'block';
    }

    track.innerHTML = '';

    activeEvents.forEach(evt => {
      const card = document.createElement('article');
      card.className = 'event-card';
      card.id = evt.id;

      const title = evt.title[lang] || evt.title['en'];
      const desc = evt.description[lang] || evt.description['en'];
      const duration = evt.duration[lang] || evt.duration['en'];
      const location = evt.location[lang] || evt.location['en'];
      const statusLabel = evt.status === 'cancelled' 
        ? (lang === 'fr' ? 'ANNULÉ' : (lang === 'tn' ? 'ملغي' : 'CANCELLED'))
        : (lang === 'fr' ? 'À VENIR' : (lang === 'tn' ? 'قريبًا' : 'UPCOMING'));

      // Format date nicely if possible
      let dateDisplay = evt.date;
      try {
        const dObj = new Date(evt.date);
        if (!isNaN(dObj.getTime())) {
          const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
          dateDisplay = dObj.toLocaleDateString(lang === 'tn' ? 'ar-TN' : (lang === 'fr' ? 'fr-FR' : 'en-US'), dateOptions);
        }
      } catch (err) {
        console.error(err);
      }

      card.innerHTML = `
        <div class="event-image-wrapper">
          <img src="${evt.image}" loading="lazy" alt="${title}" onerror="this.onerror=null; this.src='${evt.fallbackImage}';" class="event-img">
          <div class="event-status-badge ${evt.status === 'cancelled' ? 'cancelled' : 'upcoming'}">${statusLabel}</div>
        </div>
        <div class="event-card-body">
          <h4 class="event-card-title">${title}</h4>
          <div class="event-meta">
            <div class="event-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>${dateDisplay} • ${duration}</span>
            </div>
            <div class="event-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${location}</span>
            </div>
          </div>
          <p class="event-card-desc">${desc}</p>
        </div>
      `;

      track.appendChild(card);
    });

    // Wire swiper navigation controls
    const prevBtn = document.getElementById('event-prev-btn');
    const nextBtn = document.getElementById('event-next-btn');

    if (prevBtn && nextBtn) {
      const updateButtonStates = () => {
        const scrollLeft = track.scrollLeft;
        const maxScroll = track.scrollWidth - track.clientWidth;
        
        prevBtn.disabled = scrollLeft <= 10;
        nextBtn.disabled = scrollLeft >= maxScroll - 10;
      };

      prevBtn.onclick = () => {
        const cardWidth = track.firstElementChild ? track.firstElementChild.offsetWidth + 24 : 350;
        track.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      };

      nextBtn.onclick = () => {
        const cardWidth = track.firstElementChild ? track.firstElementChild.offsetWidth + 24 : 350;
        track.scrollBy({ left: cardWidth, behavior: 'smooth' });
      };

      track.onscroll = () => {
        updateButtonStates();
      };

      setTimeout(updateButtonStates, 100);
      window.addEventListener('resize', updateButtonStates);
    }
  };

  // C. Dynamic Gallery Rendering
  const renderGallery = () => {
    const grid = document.querySelector('.gallery-grid');
    if (!grid) return;

    const gallery = BabkeDB.getGallery();
    grid.innerHTML = '';

    gallery.forEach(item => {
      const card = document.createElement('div');
      card.className = 'gallery-item-card';
      card.dataset.src = item.image;

      card.innerHTML = `
        <img src="${item.image}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=500&auto=format&fit=crop&q=80';" alt="${item.alt}" class="gallery-img" loading="lazy">
        <div class="gallery-overlay">
          <svg class="insta-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          <span class="gallery-likes">
            <svg class="like-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            ${item.likes}
          </span>
        </div>
      `;

      card.addEventListener('click', openLightbox);
      grid.appendChild(card);
    });
  };

  // D. Dynamic Table Reservation Form
  const injectReservationForm = () => {
    const placeholder = document.getElementById('reservation-form-placeholder');
    if (!placeholder) return;

    const lang = getLang();
    if (typeof BabkeComponents !== 'undefined' && BabkeComponents.getReservationFormHTML) {
      placeholder.innerHTML = BabkeComponents.getReservationFormHTML(lang);
      BabkeComponents.initReservationForm(lang);
    }
  };

  // 4. INSTAGRAM LIGHTBOX OVERLAY
  const lightboxOverlay = document.getElementById('lightbox-overlay');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCloseBtn = document.getElementById('lightbox-close');

  function openLightbox(e) {
    const imgElement = e.currentTarget.querySelector('img');
    const fullImgSrc = imgElement.src;
    const imgAlt = imgElement.getAttribute('alt');
    
    if (lightboxImg && lightboxOverlay) {
      lightboxImg.setAttribute('src', fullImgSrc);
      lightboxImg.setAttribute('alt', imgAlt);
      lightboxOverlay.classList.add('open');
      document.body.style.overflow = 'hidden'; // Lock scrolling
    }
  }

  const closeLightbox = () => {
    if (lightboxOverlay) {
      lightboxOverlay.classList.remove('open');
      document.body.style.overflow = ''; // Unlock scrolling
      setTimeout(() => {
        if (lightboxImg) lightboxImg.setAttribute('src', ''); // Clear source on exit
      }, 300);
    }
  };

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxOverlay) {
    lightboxOverlay.addEventListener('click', (e) => {
      if (e.target === lightboxOverlay) closeLightbox();
    });
  }

  // Handle escape keyboard close trigger
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxOverlay && lightboxOverlay.classList.contains('open')) {
      closeLightbox();
    }
  });

  // 5. GLOBAL LISTENERS & INITIALIZATION
  const initAll = async () => {
    try {
      await BabkeDB.init();
    } catch (e) {
      console.error("Failed to initialize database cache:", e);
    }
    renderMenu();
    renderReviews();
    renderGallery();
    renderEvents();
    injectReservationForm();
  };

  // Listen to DB triggers to re-render in real-time
  window.addEventListener('babkeMenuChanged', renderMenu);
  window.addEventListener('babkeReviewsChanged', renderReviews);
  window.addEventListener('babkeGalleryChanged', renderGallery);
  window.addEventListener('babkeEventsChanged', renderEvents);
  window.addEventListener('babkeLangChanged', () => {
    renderMenu();
    renderReviews();
    renderEvents();
    injectReservationForm();
  });

  // Fire up page dynamic render
  initAll();

  // Expose triggers for Customizer communication (fired by dynamic cards click, handled in cart.js)
  window.addEventListener('babkeOpenCustomizer', (e) => {
    // Re-dispatch click to let cart handle opening the item customization modal
    const cartCardAdd = document.querySelector(`.btn-card-add[data-id="${e.detail.id}"]`);
    if (cartCardAdd) {
      // Direct click trigger which cart.js is listening for
      // To bypass duplication, if cart.js is already listening to '.btn-card-add', it works
    }
  });
});
