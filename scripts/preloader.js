/* ==========================================================================
   BABKE KEBAB & PLATES — CINEMATIC LOGO FIRE REVEAL (SIMPLE & ELEGANT)
   Buttery smooth fullscreen canvas fire embers & clean logo entrance transition
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.getElementById('cinematic-preloader');
  const canvas = document.getElementById('preloader-embers-canvas');
  const logoImg = document.querySelector('.preloader-logo-img');
  const fireGlow = document.querySelector('.preloader-fire-glow');
  
  if (!preloader || !canvas || !logoImg) return;

  const ctx = canvas.getContext('2d');
  let animationId = null;
  let particles = [];
  let width = 0;
  let height = 0;
  let globalTick = 0;
  let introCompleted = false;

  // Resize handler - Cover the entire viewport to prevent any square cropping
  const resizeCanvas = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Disable layout scroll while preloader is active
  document.body.style.overflow = 'hidden';

  // Flame Embers Particle definition
  class EmberParticle {
    constructor(isInitial = false) {
      this.reset(isInitial);
    }

    reset(isInitial = false) {
      // Spawn across the bottom of the entire screen, concentrated near the middle
      this.x = width / 2 + (Math.random() - 0.5) * (width * 0.6);
      this.y = isInitial ? (Math.random() * height) : (height + Math.random() * 20);
      
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = -(Math.random() * 2.5 + 0.8); // Rise up speed
      
      this.life = Math.random() * 120 + 60;
      this.maxLife = this.life;
      this.size = Math.random() * 3.2 + 0.8;
      this.opacity = Math.random() * 0.85 + 0.15;
      
      // Burning orange-red HSL colors
      const hue = Math.floor(Math.random() * 22) + 12; // HSL 12 to 34
      this.color = `hsla(${hue}, 95%, 55%, `;

      this.waveFreq = Math.random() * 0.05 + 0.01;
      this.waveAmplitude = Math.random() * 1.5 + 0.5;
    }

    update() {
      this.x += this.vx + Math.sin(this.life * this.waveFreq) * this.waveAmplitude;
      this.y += this.vy;
      
      // Pull gently towards logo center in the middle height of the screen
      if (this.y < height * 0.75 && this.y > height * 0.25) {
        this.vx += (width / 2 - this.x) * 0.003;
      }

      this.life--;
      this.opacity = (this.life / this.maxLife) * 0.9;
    }

    draw() {
      ctx.beginPath();
      ctx.shadowBlur = this.size * 2.2;
      ctx.shadowColor = `hsla(18, 90%, 55%, ${this.opacity})`;
      ctx.fillStyle = this.color + this.opacity + ')';
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Generate initial particles dispersed across screen
  const initParticles = () => {
    particles = [];
    const count = 55; // Slightly increased for gorgeous fullscreen richness
    for (let i = 0; i < count; i++) {
      particles.push(new EmberParticle(true));
    }
  };

  // Main animation tick loop
  const animate = () => {
    if (introCompleted) return;

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';
    ctx.shadowBlur = 0;

    particles.forEach(p => {
      p.update();
      p.draw();
      
      if (p.life <= 0 || p.y < 0 || p.x < 0 || p.x > width) {
        p.reset(false);
      }
    });

    globalTick++;
    animationId = requestAnimationFrame(animate);
  };

  // Complete / skip sequence transition
  const completeIntro = () => {
    if (introCompleted) return;
    introCompleted = true;
    cancelAnimationFrame(animationId);

    // Apply super smooth fade-out exit
    preloader.style.transition = 'opacity 0.95s cubic-bezier(0.25, 1, 0.5, 1), visibility 0.95s';
    preloader.style.opacity = '0';
    preloader.style.visibility = 'hidden';

    // Restore layout scrolling
    document.body.style.overflow = '';

    // Smooth cascade reveal for hero elements
    const heroElements = document.querySelectorAll('.hero-content > *');
    heroElements.forEach((el, idx) => {
      el.style.transform = 'translateY(30px)';
      el.style.opacity = '0';
      el.style.transition = `all 0.8s cubic-bezier(0.25, 1, 0.5, 1) ${idx * 0.12 + 0.1}s`;
      el.getBoundingClientRect(); // Force layout
      el.style.transform = 'translateY(0)';
      el.style.opacity = '1';
    });

    setTimeout(() => {
      preloader.remove();
    }, 1000);
  };

  // Auto-complete intro after 3.2 seconds
  setTimeout(completeIntro, 3200);

  // Initialize and play reveal as soon as the high-res logo finishes loading
  const playIntro = () => {
    // Disable canvas and particle physics on mobile screens to save performance
    if (window.innerWidth >= 768) {
      initParticles();
      animate();
    } else {
      canvas.style.display = 'none';
    }
    
    // Trigger logo fade-in & scale-up and fire glow activation
    setTimeout(() => {
      logoImg.classList.add('visible');
      if (window.innerWidth >= 768) {
        fireGlow.classList.add('visible');
      }
    }, 150);
  };

  if (logoImg.complete) {
    playIntro();
  } else {
    logoImg.onload = playIntro;
  }
});
