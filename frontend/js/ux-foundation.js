(function () {
  const UX = {
    toastTimer: null,
    showStatus(message, tone) {
      let region = document.getElementById('ux-live-region');
      if (!region) {
        region = document.createElement('div');
        region.id = 'ux-live-region';
        region.className = 'ux-live-region';
        region.setAttribute('role', 'status');
        region.setAttribute('aria-live', 'polite');
        region.style.display = 'none';
        document.body.appendChild(region);
      }

      region.textContent = message;
      region.dataset.tone = tone || 'info';
      region.style.display = 'block';
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        region.style.display = 'none';
      }, 2800);
    },
  };

  function injectSkipLink() {
    if (document.querySelector('.ux-skip-link')) {
      return;
    }
    const main = document.querySelector('main') || document.querySelector('#main-content') || document.body;
    if (main && !main.id) {
      main.id = 'main-content';
    }
    const skip = document.createElement('a');
    skip.href = '#' + (main.id || 'main-content');
    skip.className = 'ux-skip-link';
    skip.textContent = 'Skip to main content';
    document.body.prepend(skip);
  }

  function wireForms() {
    document.querySelectorAll('form').forEach((form) => {
      form.addEventListener('submit', function () {
        const invalid = form.querySelector(':invalid');
        if (invalid) {
          UX.showStatus('Please complete required fields.', 'error');
          invalid.focus();
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn && !submitBtn.dataset.uxLoadingAttached) {
          submitBtn.dataset.uxLoadingAttached = '1';
          submitBtn.dataset.uxOriginalText = submitBtn.textContent || 'Submit';
          submitBtn.disabled = true;
          submitBtn.textContent = 'Please wait...';
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.uxOriginalText;
          }, 8000);
        }
      });
    });
  }

  function wireNavToggle() {
    const nav = document.querySelector('.nav-links');
    const topbarInner = document.querySelector('.topbar-inner');
    if (!nav || !topbarInner || document.querySelector('.ux-nav-toggle')) {
      return;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ux-nav-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Toggle navigation');
    btn.textContent = 'Menu';
    topbarInner.insertBefore(btn, nav);

    nav.classList.add('ux-mobile-hidden');

    btn.addEventListener('click', function () {
      const hidden = nav.classList.toggle('ux-mobile-hidden');
      btn.setAttribute('aria-expanded', String(!hidden));
    });
  }

  function wireKeyboardEscape() {
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') {
        return;
      }
      document.querySelectorAll('.modal').forEach((modal) => {
        modal.style.display = 'none';
      });
    });
  }

  function wireAriaLabels() {
    document.querySelectorAll('input, textarea, select').forEach((el) => {
      if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) {
        return;
      }
      const id = el.id;
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label && label.textContent.trim()) {
          el.setAttribute('aria-label', label.textContent.trim());
          return;
        }
      }
      const ph = el.getAttribute('placeholder');
      if (ph) {
        el.setAttribute('aria-label', ph);
      }
    });
  }

  function wireFeedbackDialog() {
    if (document.getElementById('ux-feedback-fab')) {
      return;
    }

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'ux-feedback-fab';
    fab.className = 'ux-feedback-fab';
    fab.textContent = 'Share Feedback';

    const dialog = document.createElement('div');
    dialog.className = 'ux-feedback-dialog';
    dialog.id = 'ux-feedback-dialog';
    dialog.innerHTML = [
      '<div class="ux-feedback-card" role="dialog" aria-modal="true" aria-label="Feedback">',
      '<h3>Help Us Improve</h3>',
      '<p>Tell us what felt confusing or what should be improved.</p>',
      '<textarea id="ux-feedback-text" placeholder="Your feedback..."></textarea>',
      '<div class="ux-feedback-actions">',
      '<button type="button" id="ux-feedback-cancel">Cancel</button>',
      '<button type="button" id="ux-feedback-send">Send</button>',
      '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(fab);
    document.body.appendChild(dialog);

    fab.addEventListener('click', () => {
      dialog.style.display = 'flex';
      const text = document.getElementById('ux-feedback-text');
      if (text) {
        text.focus();
      }
    });

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.style.display = 'none';
      }
    });

    document.getElementById('ux-feedback-cancel')?.addEventListener('click', () => {
      dialog.style.display = 'none';
    });

    document.getElementById('ux-feedback-send')?.addEventListener('click', () => {
      const text = document.getElementById('ux-feedback-text');
      const value = (text?.value || '').trim();
      if (!value) {
        UX.showStatus('Please write feedback before sending.', 'error');
        return;
      }
      const key = 'skillsprint_feedback_' + Date.now();
      localStorage.setItem(key, value);
      dialog.style.display = 'none';
      if (text) {
        text.value = '';
      }
      UX.showStatus('Thanks for your feedback.');
    });
  }

  function wireAuraAI() {
    if (document.getElementById('aura-ai-fab')) {
      return;
    }

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'aura-ai-fab';
    fab.className = 'aura-ai-fab';
    fab.innerHTML = '<span>✨</span> Aura AI';

    const panel = document.createElement('div');
    panel.className = 'aura-ai-panel';
    panel.id = 'aura-ai-panel';
    panel.innerHTML = [
      '<div class="aura-header">',
      '  <div class="aura-status"><span class="pulse"></span> Aura AI Online</div>',
      '  <button type="button" id="aura-close" style="background:none;border:none;color:#fff;cursor:pointer;">✕</button>',
      '</div>',
      '<div class="aura-messages" id="aura-messages">',
      '  <div class="aura-msg system">Hello! I am Aura, your SkillSprint AI Mentor. How can I help your sprint today?</div>',
      '</div>',
      '<div class="aura-input-area">',
      '  <input type="text" id="aura-input" placeholder="Ask Aura anything...">',
      '  <button type="button" id="aura-send">⚡</button>',
      '</div>'
    ].join('');

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    fab.addEventListener('click', () => {
      const isOpen = panel.classList.toggle('open');
      fab.classList.toggle('active', isOpen);
      if (isOpen) {
        document.getElementById('aura-input').focus();
      }
    });

    document.getElementById('aura-close').addEventListener('click', () => {
      panel.classList.remove('open');
      fab.classList.remove('active');
    });

    const input = document.getElementById('aura-input');
    const send = document.getElementById('aura-send');
    const messages = document.getElementById('aura-messages');

    function addMessage(text, type) {
      const msg = document.createElement('div');
      msg.className = `aura-msg ${type}`;
      msg.textContent = text;
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }

    async function handleSend() {
      const val = input.value.trim();
      if (!val) return;
      addMessage(val, 'user');
      input.value = '';
      
      const loadingMsg = document.createElement('div');
      loadingMsg.className = 'aura-msg system';
      loadingMsg.textContent = 'Aura is thinking...';
      messages.appendChild(loadingMsg);
      messages.scrollTop = messages.scrollHeight;

      try {
        const API_BASE = window.API_BASE_URL || "http://127.0.0.1:8000";
        const response = await fetch(`${API_BASE}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: val })
        });
        const data = await response.json();
        loadingMsg.textContent = data.response;
      } catch (err) {
        loadingMsg.textContent = "I'm having trouble connecting to my neural network. Please check the backend!";
      }
    }

    if (send) send.addEventListener('click', handleSend);
    if (input) input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  function wireNeuralBackground() {
    const canvas = document.createElement('canvas');
    canvas.id = 'neural-bg';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-2';
    canvas.style.pointerEvents = 'none';
    canvas.style.opacity = '0.9';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];
    const particleCount = 70;
    const maxDistance = 150;
    let mouse = { x: null, y: null };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.fill();
      }
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, index) => {
        p.update();
        p.draw();
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const opacity = 1 - distance / maxDistance;
            ctx.strokeStyle = `rgba(16, 185, 129, ${opacity * 0.5})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
        if (mouse.x) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.1 * (1 - dist / 200)})`;
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });

    resize();
    initParticles();
    animate();
  }

  function init() {
    injectSkipLink();
    wireAriaLabels();
    wireForms();
    wireNavToggle();
    wireKeyboardEscape();
    wireFeedbackDialog();
    wireNeuralBackground();
    wireAuraAI();
    window.SkillSprintUX = UX;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
