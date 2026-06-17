/* ============================================================
   iSpot Cannes Lions 2026 - Quiz App Logic
   Archetype Edition — 3 questions, 3 archetypes, contact form
   ============================================================ */

(function () {
  'use strict';

  // ---- Constants ----

  const STORAGE_KEY = 'ispot_cannes_2026';
  const RESULTS_TIMEOUT = 20000;
  const RESULTS_WARNING = 15000;
  const ANALYZING_DURATION = 4000; // 3 messages x 1.33s each ≈ 4s
  const ADVANCE_DELAY = 1800;

  // ---- Archetypes ----

  const ARCHETYPES = {
    glowGetter: {
      name: 'The Glow Getter',
      description: 'For those focused on looking refreshed between meetings and dinners',
      products: [
        { name: 'Revitalizing Eye Patches', emoji: '✨' },
        { name: 'Refreshing Facial Mist', emoji: '💧' }
      ]
    },
    powerNetworker: {
      name: 'The Power Networker',
      description: 'For the ones constantly socializing and on the move',
      products: [
        { name: 'Shea Butter Hand Cream', emoji: '🤝' },
        { name: 'Shea Lip Balm', emoji: '💋' }
      ]
    },
    recharger: {
      name: 'The Recharger',
      description: 'For those who need moments of calm between the chaos',
      products: [
        { name: 'Relaxing Aromatherapy Roller', emoji: '🌿' },
        { name: 'Cooling Hand Gel', emoji: '❄️' }
      ]
    }
  };

  const ARCHETYPE_KEYS = Object.keys(ARCHETYPES);

  // ---- Questions (3 questions, 3 answers each — index maps to archetype) ----
  // Index 0 → glowGetter, Index 1 → powerNetworker, Index 2 → recharger

  const QUESTIONS = [
    {
      text: "It's your first morning in Cannes. What's your opening move?",
      emoji: '🌅',
      optionEmojis: ['🪞', '☕', '🧘'],
      options: [
        'Mirror check — gotta look camera-ready from the start',
        'Espresso on the Croisette, already working the room',
        'Slow start with an ocean breeze, easing into the day'
      ]
    },
    {
      text: 'You just survived a 3-hour session. How are you recharging?',
      emoji: '🔋',
      optionEmojis: ['💅', '🥂', '🌊'],
      options: [
        'Quick refresh in the nearest restroom — touch-up time',
        'Grabbing drinks with the people I just met',
        'Finding a quiet corner to decompress for a minute'
      ]
    },
    {
      text: "Last night of Cannes. What's your move?",
      emoji: '🌙',
      optionEmojis: ['🍽️', '🎉', '🧖'],
      options: [
        'Dinner at that restaurant someone just recommended',
        'The biggest party of the week, obviously',
        'Face mask and room service — full recharge mode'
      ]
    }
  ];

  const ANALYZING_MESSAGES = [
    'Sage is reading your vibe...',
    'Sage is curating your match...',
    'Almost there...'
  ];

  // ---- State ----

  const state = {
    screen: 'welcome',
    currentQuestion: 0,
    answers: [],
    archetypeTally: {},
    result: null,
    contact: null,
    startTime: null
  };

  let resetTimer = null;
  let warningTimer = null;
  let countdownInterval = null;
  let logoTapCount = 0;
  let logoTapTimer = null;
  let confettiAnimId = null;

  // ---- DOM References ----

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const screens = {
    welcome: $('#screen-welcome'),
    contact: $('#screen-contact'),
    question: $('#screen-question'),
    analyzing: $('#screen-analyzing'),
    results: $('#screen-results')
  };

  // ---- Confetti System ----

  const confettiCanvas = $('#confetti-canvas');
  const confettiCtx = confettiCanvas.getContext('2d');
  let confettiPieces = [];

  function resizeConfetti() {
    confettiCanvas.width = window.innerWidth * 2;
    confettiCanvas.height = window.innerHeight * 2;
    confettiCanvas.style.width = window.innerWidth + 'px';
    confettiCanvas.style.height = window.innerHeight + 'px';
    confettiCtx.scale(2, 2);
  }

  window.addEventListener('resize', resizeConfetti);
  resizeConfetti();

  function launchConfetti() {
    confettiPieces = [];
    const colors = ['#0095B0', '#4AC500', '#D4A853', '#EC4899', '#8B5CF6', '#F59E0B', '#FFFFFF', '#6ECFBD', '#E8A0BF'];
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < 150; i++) {
      confettiPieces.push({
        x: w / 2 + (Math.random() - 0.5) * w * 0.6,
        y: h + 10,
        vx: (Math.random() - 0.5) * 12,
        vy: -(Math.random() * 18 + 10),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        gravity: 0.15 + Math.random() * 0.1,
        friction: 0.99,
        opacity: 1
      });
    }

    animateConfetti();
  }

  function animateConfetti() {
    confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let alive = false;
    confettiPieces.forEach(p => {
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;

      if (p.y > window.innerHeight + 50) {
        p.opacity -= 0.02;
      }

      if (p.opacity <= 0) return;
      alive = true;

      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate((p.rotation * Math.PI) / 180);
      confettiCtx.globalAlpha = p.opacity;
      confettiCtx.fillStyle = p.color;

      if (p.shape === 'rect') {
        confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        confettiCtx.beginPath();
        confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        confettiCtx.fill();
      }

      confettiCtx.restore();
    });

    if (alive) {
      confettiAnimId = requestAnimationFrame(animateConfetti);
    }
  }

  function stopConfetti() {
    if (confettiAnimId) {
      cancelAnimationFrame(confettiAnimId);
      confettiAnimId = null;
    }
    confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    confettiPieces = [];
  }

  // ---- Screen Transitions ----

  function showScreen(name) {
    const current = screens[state.screen];
    const next = screens[name];

    if (current) {
      current.classList.remove('screen--active');
      current.classList.add('screen--exiting');
      setTimeout(() => current.classList.remove('screen--exiting'), 600);
    }

    setTimeout(() => {
      next.classList.add('screen--active');
    }, 120);

    state.screen = name;
  }

  // ---- Welcome Screen ----

  function initWelcome() {
    $('#btn-start').addEventListener('click', showContactScreen);
    $('#logo-tap-target').addEventListener('click', handleLogoTap);
  }

  function handleLogoTap() {
    logoTapCount++;
    clearTimeout(logoTapTimer);
    logoTapTimer = setTimeout(() => { logoTapCount = 0; }, 2000);

    if (logoTapCount >= 5) {
      logoTapCount = 0;
      window.location.href = 'admin.html';
    }
  }

  // ---- Contact Screen ----

  function showContactScreen() {
    showScreen('contact');
    // Clear previous values
    $('#contact-first').value = '';
    $('#contact-last').value = '';
    $('#contact-title').value = '';
    $('#contact-company').value = '';
    $('#contact-email').value = '';
  }

  function initContactForm() {
    $('#contact-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const firstName = $('#contact-first').value.trim();
      const lastName = $('#contact-last').value.trim();
      const title = $('#contact-title').value.trim();
      const company = $('#contact-company').value.trim();
      const email = $('#contact-email').value.trim();

      if (!firstName || !lastName || !title || !company || !email) return;

      state.contact = { firstName, lastName, title, company, email };
      startQuiz();
    });
  }

  // ---- Start Quiz ----

  function startQuiz() {
    state.currentQuestion = 0;
    state.answers = [];
    state.archetypeTally = {};
    state.result = null;
    state.startTime = Date.now();
    ARCHETYPE_KEYS.forEach(k => { state.archetypeTally[k] = 0; });
    stopConfetti();

    showScreen('question');
    renderQuestion();
  }

  // ---- Question Screen ----

  function renderQuestion() {
    const q = QUESTIONS[state.currentQuestion];
    const questionText = $('#question-text');
    const counter = $('#question-counter');
    const progressFill = $('#progress-fill');
    const questionEmoji = $('#question-emoji');

    // Update counter and progress
    counter.textContent = `Q${state.currentQuestion + 1} of ${QUESTIONS.length}`;
    progressFill.style.width = `${((state.currentQuestion) / QUESTIONS.length) * 100}%`;

    // Set floating emoji
    questionEmoji.textContent = q.emoji;

    // Hide question text, then show
    questionText.classList.remove('visible');
    questionText.textContent = q.text;

    // Hide answer cards
    const cards = $$('.answer-card');
    cards.forEach(card => {
      card.classList.remove('visible', 'selected', 'disabled');
    });

    // Stagger reveal with spring animation
    setTimeout(() => questionText.classList.add('visible'), 150);

    cards.forEach((card, i) => {
      const textEl = $(`#answer-${i}`);
      const emojiEl = $(`#answer-emoji-${i}`);
      textEl.textContent = q.options[i];
      emojiEl.textContent = q.optionEmojis[i];
      setTimeout(() => card.classList.add('visible'), 350 + i * 150);
    });
  }

  function handleAnswerSelect(e) {
    const card = e.currentTarget;
    const index = parseInt(card.dataset.index, 10);
    const cards = $$('.answer-card');

    if (card.classList.contains('disabled')) return;
    cards.forEach(c => c.classList.add('disabled'));

    // Visual selection
    card.classList.add('selected');

    // Burst emoji from the selected card
    spawnEmojiPop(card, QUESTIONS[state.currentQuestion].optionEmojis[index]);

    // Record answer and tally archetype
    state.answers.push(index);
    const archetypeKey = ARCHETYPE_KEYS[index];
    state.archetypeTally[archetypeKey] = (state.archetypeTally[archetypeKey] || 0) + 1;

    // Advance after delay
    setTimeout(() => {
      state.currentQuestion++;

      if (state.currentQuestion < QUESTIONS.length) {
        $('#progress-fill').style.width = `${((state.currentQuestion) / QUESTIONS.length) * 100}%`;
        renderQuestion();
      } else {
        $('#progress-fill').style.width = '100%';
        showAnalyzing();
      }
    }, ADVANCE_DELAY);
  }

  // Big dramatic emoji explosion when selecting an answer
  function spawnEmojiPop(card, emoji) {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Big center emoji that scales up
    const bigEmoji = document.createElement('div');
    bigEmoji.textContent = emoji;
    bigEmoji.style.cssText = `
      position: fixed;
      left: ${cx}px;
      top: ${cy}px;
      font-size: 60px;
      pointer-events: none;
      z-index: 200;
      transition: all 1100ms cubic-bezier(0.34, 1.56, 0.64, 1);
      opacity: 1;
      transform: translate(-50%, -50%) scale(0);
    `;
    document.body.appendChild(bigEmoji);
    requestAnimationFrame(() => {
      bigEmoji.style.transform = 'translate(-50%, -50%) scale(1.2)';
    });
    setTimeout(() => {
      bigEmoji.style.transition = 'all 800ms ease';
      bigEmoji.style.transform = 'translate(-50%, -50%) scale(0)';
      bigEmoji.style.opacity = '0';
    }, 900);
    setTimeout(() => bigEmoji.remove(), 1800);

    // Ring of smaller emojis bursting outward
    for (let i = 0; i < 10; i++) {
      const el = document.createElement('div');
      el.textContent = emoji;
      el.style.cssText = `
        position: fixed;
        left: ${cx}px;
        top: ${cy}px;
        font-size: ${20 + Math.random() * 16}px;
        pointer-events: none;
        z-index: 200;
        transition: all 1400ms cubic-bezier(0.16, 1, 0.3, 1);
        opacity: 1;
      `;
      document.body.appendChild(el);

      const angle = (Math.PI * 2 * i) / 10;
      const dist = 60 + Math.random() * 80;
      requestAnimationFrame(() => {
        el.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist - 40}px) scale(${0.8 + Math.random() * 0.6}) rotate(${Math.random() * 60 - 30}deg)`;
        el.style.opacity = '0';
      });

      setTimeout(() => el.remove(), 1600);
    }

    // Glow ring effect
    const ring = document.createElement('div');
    ring.style.cssText = `
      position: fixed;
      left: ${cx}px;
      top: ${cy}px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2px solid rgba(0, 149, 176, 0.6);
      pointer-events: none;
      z-index: 199;
      transform: translate(-50%, -50%);
      transition: all 1200ms cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 0 20px rgba(0, 149, 176, 0.3);
    `;
    document.body.appendChild(ring);
    requestAnimationFrame(() => {
      ring.style.width = '200px';
      ring.style.height = '200px';
      ring.style.opacity = '0';
      ring.style.borderColor = 'rgba(0, 149, 176, 0)';
    });
    setTimeout(() => ring.remove(), 1400);
  }

  function initAnswerCards() {
    $$('.answer-card').forEach(card => {
      card.addEventListener('click', handleAnswerSelect);
    });
  }

  // ---- Analyzing Screen ----

  function showAnalyzing() {
    showScreen('analyzing');

    let msgIndex = 0;
    const textEl = $('#analyzing-text');
    const barFill = $('#analyzing-bar-fill');
    textEl.textContent = ANALYZING_MESSAGES[0];
    barFill.style.width = '0%';

    const interval = ANALYZING_DURATION / ANALYZING_MESSAGES.length;

    const msgInterval = setInterval(() => {
      msgIndex++;
      if (msgIndex < ANALYZING_MESSAGES.length) {
        textEl.style.opacity = '0';
        setTimeout(() => {
          textEl.textContent = ANALYZING_MESSAGES[msgIndex];
          textEl.style.opacity = '1';
        }, 250);
      }
    }, interval);

    // Animate progress bar
    let elapsed = 0;
    const barInterval = setInterval(() => {
      elapsed += 50;
      const pct = Math.min((elapsed / ANALYZING_DURATION) * 100, 100);
      barFill.style.width = pct + '%';
    }, 50);

    setTimeout(() => {
      clearInterval(msgInterval);
      clearInterval(barInterval);
      barFill.style.width = '100%';
      calculateResults();
      showResults();
    }, ANALYZING_DURATION);
  }

  // ---- Scoring Algorithm ----

  function calculateResults() {
    const data = loadData();
    const counts = data.archetypeCounts;

    // Sort archetypes: highest tally first, ties broken by least-distributed
    const sorted = ARCHETYPE_KEYS
      .map(key => ({ key, tally: state.archetypeTally[key] || 0 }))
      .sort((a, b) => {
        if (b.tally !== a.tally) return b.tally - a.tally;
        const countA = counts[a.key] || 0;
        const countB = counts[b.key] || 0;
        if (countA !== countB) return countA - countB;
        return ARCHETYPE_KEYS.indexOf(a.key) - ARCHETYPE_KEYS.indexOf(b.key);
      });

    state.result = sorted[0].key;
  }

  // ---- Results Screen ----

  function showResults() {
    const archetypeKey = state.result;
    const archetype = ARCHETYPES[archetypeKey];

    // Set archetype name and description
    $('#results-archetype-name').textContent = archetype.name;
    $('#results-archetype-desc').textContent = archetype.description;

    // Build product list
    const productListEl = $('#results-product-list');
    productListEl.innerHTML = archetype.products.map((p, i) => {
      let html = '';
      if (i > 0) {
        html += '<span class="results-product-plus">+</span>';
      }
      html += `
        <div class="results-product-item">
          <span class="results-product-item__emoji">${p.emoji}</span>
          <span class="results-product-item__name">${p.name}</span>
        </div>
      `;
      return html;
    }).join('');

    // Show results screen
    showScreen('results');

    const header = $('.results-header');
    const productsLabel = $('.results-products-label');
    const productList = $('#results-product-list');
    const footer = $('.results-footer');

    header.classList.remove('visible');
    productsLabel.classList.remove('visible');
    productList.classList.remove('visible');
    footer.classList.remove('visible');

    setTimeout(() => header.classList.add('visible'), 200);
    setTimeout(() => productsLabel.classList.add('visible'), 700);
    setTimeout(() => productList.classList.add('visible'), 900);
    setTimeout(() => footer.classList.add('visible'), 1100);

    // Confetti burst
    setTimeout(() => launchConfetti(), 400);
    setTimeout(() => launchConfetti(), 1200);

    // Save session data
    saveSession();

    // Start auto-reset timer
    setTimeout(() => startResetTimer(), 2000);
  }

  // ---- Auto-Reset ----

  function startResetTimer() {
    clearResetTimers();

    const indicator = $('#reset-indicator');
    const ringFill = $('#reset-ring-fill');
    const circumference = 2 * Math.PI * 16;
    ringFill.style.strokeDasharray = circumference;
    ringFill.style.strokeDashoffset = '0';

    screens.results.addEventListener('click', restartResetTimer);

    warningTimer = setTimeout(() => {
      indicator.classList.add('visible');
      const remaining = RESULTS_TIMEOUT - RESULTS_WARNING;
      let elapsed = 0;
      countdownInterval = setInterval(() => {
        elapsed += 1000;
        const progress = elapsed / remaining;
        ringFill.style.strokeDashoffset = (circumference * progress).toString();
      }, 1000);
    }, RESULTS_WARNING);

    resetTimer = setTimeout(() => {
      resetApp();
    }, RESULTS_TIMEOUT);
  }

  function restartResetTimer() {
    clearResetTimers();
    $('#reset-indicator').classList.remove('visible');
    startResetTimer();
  }

  function clearResetTimers() {
    clearTimeout(resetTimer);
    clearTimeout(warningTimer);
    clearInterval(countdownInterval);
    resetTimer = null;
    warningTimer = null;
    countdownInterval = null;
  }

  function resetApp() {
    clearResetTimers();
    screens.results.removeEventListener('click', restartResetTimer);
    $('#reset-indicator').classList.remove('visible');
    stopConfetti();
    showScreen('welcome');
  }

  // ---- LocalStorage Persistence ----

  function getDefaultData() {
    return {
      version: 2,
      sessions: [],
      archetypeCounts: {
        glowGetter: 0,
        powerNetworker: 0,
        recharger: 0
      },
      totalParticipants: 0,
      lastReset: new Date().toISOString()
    };
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultData();
      const data = JSON.parse(raw);
      // Migrate from v1 (productCounts) to v2 (archetypeCounts)
      if (!data.archetypeCounts) {
        data.archetypeCounts = { glowGetter: 0, powerNetworker: 0, recharger: 0 };
        data.version = 2;
      }
      return data;
    } catch {
      return getDefaultData();
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* Storage unavailable */ }
  }

  function generateId() {
    return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
      Math.floor(Math.random() * 16).toString(16)
    );
  }

  function saveSession() {
    const data = loadData();
    const session = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      contact: state.contact ? { ...state.contact } : null,
      answers: [...state.answers],
      result: state.result,
      durationMs: Date.now() - state.startTime
    };

    data.sessions.push(session);
    data.totalParticipants++;
    data.archetypeCounts[state.result] = (data.archetypeCounts[state.result] || 0) + 1;
    saveData(data);
  }

  // ---- Kiosk Lockdown ----

  function initKiosk() {
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dragstart', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
  }

  // ---- Initialize ----

  function init() {
    initKiosk();
    initWelcome();
    initContactForm();
    initAnswerCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
