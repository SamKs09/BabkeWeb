/* ==========================================================================
   BABKE KEBAB & PLATES — GLOWING EMBERS CANVAS PARTICLE EMITTER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('embers-canvas');
  if (!canvas) return;

  // Disable completely on mobile viewports to prevent particle processing and paint loads
  if (window.innerWidth < 768) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let particles = [];
  let width = 0;
  let height = 0;

  // Track mouse coordinates for subtle drift interaction
  let mouse = { x: -9999, y: -9999 };

  // Track scroll position to pause rendering when canvas is out of view
  let isCanvasVisible = true;

  // Resize handler to match the parent container (.glow-disc-wrapper)
  const resizeCanvas = () => {
    const parent = canvas.parentElement;
    if (parent) {
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width;
      canvas.height = height;
    }
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Mouse hover event listeners inside parent
  const parent = canvas.parentElement;
  if (parent) {
    parent.addEventListener('mousemove', (e) => {
      const rect = parent.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    parent.addEventListener('mouseleave', () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });
  }

  // Particle constructor
  class EmberParticle {
    constructor() {
      this.reset(true); // Initial random positions across the whole bottom half
    }

    reset(initial = false) {
      // Base positions: Spawn in a circular area matching the charcoal disc
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (width * 0.42); // Bound inside the glow disc

      this.x = width / 2 + Math.cos(angle) * radius;
      // Spawn near the bottom/center region of the disc
      this.y = initial ? (height / 2 + Math.sin(angle) * radius) : (height * 0.75 + (Math.random() * 20 - 10));
      
      this.size = Math.random() * 2.5 + 0.8;
      this.speedY = -(Math.random() * 1.5 + 0.5); // Float upwards
      this.speedX = Math.random() * 1.2 - 0.6; // Slight side sway
      this.opacity = Math.random() * 0.8 + 0.2;
      this.maxLife = Math.random() * 120 + 80;
      this.life = this.maxLife;

      // Color ranges from burning yellow to vibrant red-orange
      const hue = Math.floor(Math.random() * 25) + 12; // HSL 12 (orange-red) to 37 (golden-orange)
      const saturation = Math.floor(Math.random() * 20) + 80; // 80% to 100%
      const lightness = Math.floor(Math.random() * 20) + 50; // 50% to 70%
      this.color = `hsla(${hue}, ${saturation}%, ${lightness}%, `;
      
      // Floating wave frequency
      this.waveFreq = Math.random() * 0.05 + 0.01;
      this.waveAmplitude = Math.random() * 0.8 + 0.2;
    }

    update() {
      // Floating physics
      this.y += this.speedY;
      
      // Wave sway effect
      this.x += this.speedX + Math.sin(this.life * this.waveFreq) * this.waveAmplitude;

      // Subtle mouse interaction - particles drift away from mouse position
      if (mouse.x !== -9999) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          const force = (80 - dist) / 80;
          this.x += (dx / dist) * force * 1.5;
          this.y += (dy / dist) * force * 0.8;
        }
      }

      this.life--;
      this.opacity = (this.life / this.maxLife) * (this.size > 2 ? 0.95 : 0.65);
    }

    draw() {
      ctx.beginPath();
      // Draw glowing drop/spark shadow
      ctx.shadowBlur = this.size * 3;
      ctx.shadowColor = `hsla(18, 90%, 55%, ${this.opacity})`;
      
      ctx.fillStyle = this.color + this.opacity + ')';
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Initialize particle array
  const initParticles = () => {
    particles = [];
    const count = 35; // Lightweight count for performance
    for (let i = 0; i < count; i++) {
      particles.push(new EmberParticle());
    }
  };

  initParticles();

  // Animation Loop
  const animate = () => {
    if (!isCanvasVisible) {
      animationFrameId = requestAnimationFrame(animate);
      return;
    }

    ctx.clearRect(0, 0, width, height);
    
    // Set global composite operation to screen/lighter for magical ember blend glow
    ctx.globalCompositeOperation = 'screen';

    // Clear shadow configurations for canvas performance resets
    ctx.shadowBlur = 0;

    particles.forEach(p => {
      p.update();
      p.draw();
      
      // Reset particle if it leaves the boundaries or dies
      if (p.life <= 0 || p.y < 0 || p.x < 0 || p.x > width) {
        p.reset(false);
      }
    });

    animationFrameId = requestAnimationFrame(animate);
  };

  // Start loop
  animate();

  // Intersection Observer to suspend animation loop when hero leaves view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isCanvasVisible = entry.isIntersecting;
    });
  }, { threshold: 0.1 });

  const heroSection = document.getElementById('home');
  if (heroSection) {
    observer.observe(heroSection);
  }
});
