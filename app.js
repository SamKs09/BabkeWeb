/* ==========================================================================
   BABKE KEBAB & PLATES — INTERACTIVE APPLICATION MECHANICS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
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

  const toggleMobileMenu = () => {
    burgerMenuBtn.classList.toggle('open');
    navMenu.classList.toggle('open');
  };

  const closeMobileMenu = () => {
    burgerMenuBtn.classList.remove('open');
    navMenu.classList.remove('open');
  };

  burgerMenuBtn.addEventListener('click', toggleMobileMenu);

  // Close mobile navigation drawer automatically on link clicks
  navLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // 3. Interactive Menu Filter Tabs
  const menuTabs = document.querySelectorAll('.menu-tab');
  const menuItemCards = document.querySelectorAll('.menu-item-card');

  menuTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetCategory = e.currentTarget.dataset.category;
      
      // Toggle active states on tabs
      menuTabs.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');

      // Filter and animate menu cards
      menuItemCards.forEach(card => {
        const cardCategory = card.dataset.cat;
        
        if (cardCategory === targetCategory) {
          card.style.opacity = '0';
          card.style.display = 'flex';
          
          // Smooth fade-in transition
          setTimeout(() => {
            card.style.transition = 'opacity 0.4s ease';
            card.style.opacity = '1';
          }, 50);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 4. Testimonials / Review Carousel Sliding Mechanics
  const reviewSlides = document.querySelectorAll('.review-slide');
  const prevBtn = document.getElementById('btn-prev-review');
  const nextBtn = document.getElementById('btn-next-review');
  let activeReviewIndex = 0;
  let reviewTimer = null;

  const showReview = (index) => {
    // Hide active slide
    reviewSlides[activeReviewIndex].classList.remove('active');
    
    // Calculate boundaries loop
    activeReviewIndex = (index + reviewSlides.length) % reviewSlides.length;
    
    // Show new active slide
    reviewSlides[activeReviewIndex].classList.add('active');
  };

  const nextReview = () => {
    showReview(activeReviewIndex + 1);
    resetReviewTimer();
  };

  const prevReview = () => {
    showReview(activeReviewIndex - 1);
    resetReviewTimer();
  };

  // Wire slider clicks
  nextBtn.addEventListener('click', nextReview);
  prevBtn.addEventListener('click', prevReview);

  // Automatic slide rotation every 6 seconds
  const startReviewTimer = () => {
    reviewTimer = setInterval(nextReview, 6000);
  };

  const resetReviewTimer = () => {
    clearInterval(reviewTimer);
    startReviewTimer();
  };

  startReviewTimer(); // Start slider automatically

  // 5. Instagram Gallery Image Zoom Lightbox Overlay
  const galleryItems = document.querySelectorAll('.gallery-item-card');
  const lightboxOverlay = document.getElementById('lightbox-overlay');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCloseBtn = document.getElementById('lightbox-close');

  const openLightbox = (e) => {
    const imgElement = e.currentTarget.querySelector('img');
    const fullImgSrc = imgElement.src;
    const imgAlt = imgElement.getAttribute('alt');
    
    lightboxImg.setAttribute('src', fullImgSrc);
    lightboxImg.setAttribute('alt', imgAlt);
    lightboxOverlay.classList.add('open');
    document.body.style.overflow = 'hidden'; // Lock scrolling
  };

  const closeLightbox = () => {
    lightboxOverlay.classList.remove('open');
    document.body.style.overflow = ''; // Unlock scrolling
    setTimeout(() => {
      lightboxImg.setAttribute('src', ''); // Clear source on exit
    }, 300);
  };

  // Wire gallery zoom triggers
  galleryItems.forEach(item => {
    item.addEventListener('click', openLightbox);
  });

  lightboxCloseBtn.addEventListener('click', closeLightbox);
  
  // Close lightbox on clicking dark backdrop overlay
  lightboxOverlay.addEventListener('click', (e) => {
    if (e.target === lightboxOverlay) {
      closeLightbox();
    }
  });

  // Handle escape keyboard close trigger
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxOverlay.classList.contains('open')) {
      closeLightbox();
    }
  });

});
