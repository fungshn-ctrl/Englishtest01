/* =========================================================
   國中英文單字直覺配對王 - JavaScript Core Engine (首頁 QR Code 版)
   ========================================================= */

// Vocabulary Database divided into progressive Levels (每關 3 個單字)
const LEVEL_VOCABULARY = [
  // Level 1 (第 1 關)
  [
    { id: 'astronaut', word: 'Astronaut', phonetic: '/ˈæstrənɔːt/', chinese: '太空人', image: 'images/astronaut.jpg' },
    { id: 'bicycle', word: 'Bicycle', phonetic: '/ˈbaɪsɪkl/', chinese: '腳踏車 / 單車', image: 'images/bicycle.jpg' },
    { id: 'dolphin', word: 'Dolphin', phonetic: '/ˈdɒlfɪn/', chinese: '海豚', image: 'images/dolphin.jpg' }
  ],
  // Level 2 (第 2 關)
  [
    { id: 'telescope', word: 'Telescope', phonetic: '/ˈtelɪskəʊp/', chinese: '望遠鏡', image: 'images/telescope.jpg' },
    { id: 'guitar', word: 'Guitar', phonetic: '/ɡɪˈtɑːr/', chinese: '吉他', image: 'images/guitar.jpg' },
    { id: 'volcano', word: 'Volcano', phonetic: '/vɒlˈkeɪnəʊ/', chinese: '火山', image: 'images/volcano.jpg' }
  ],
  // Level 3 (第 3 關)
  [
    { id: 'pyramid', word: 'Pyramid', phonetic: '/ˈpɪrəmɪd/', chinese: '金字塔', image: 'images/pyramid.jpg' },
    { id: 'astronaut', word: 'Astronaut', phonetic: '/ˈæstrənɔːt/', chinese: '太空人', image: 'images/astronaut.jpg' },
    { id: 'guitar', word: 'Guitar', phonetic: '/ɡɪˈtɑːr/', chinese: '吉他', image: 'images/guitar.jpg' }
  ]
];

// Additional words pool for higher level generation
const EXTRA_POOL = [
  { id: 'bicycle', word: 'Bicycle', phonetic: '/ˈbaɪsɪkl/', chinese: '腳踏車 / 單車', image: 'images/bicycle.jpg' },
  { id: 'telescope', word: 'Telescope', phonetic: '/ˈtelɪskəʊp/', chinese: '望遠鏡', image: 'images/telescope.jpg' },
  { id: 'dolphin', word: 'Dolphin', phonetic: '/ˈdɒlfɪn/', chinese: '海豚', image: 'images/dolphin.jpg' },
  { id: 'volcano', word: 'Volcano', phonetic: '/vɒlˈkeɪnəʊ/', chinese: '火山', image: 'images/volcano.jpg' },
  { id: 'pyramid', word: 'Pyramid', phonetic: '/ˈpɪrəmɪd/', chinese: '金字塔', image: 'images/pyramid.jpg' }
];

// Constants & Game State
const MAX_TIME = 15.0; // Seconds
let currentLevel = 1;
let levelPassed = false;

let selectedWordCard = null;
let selectedImageCard = null;
let matchedPairsCount = 0;
let mistakesCount = 0;
let score = 0;
let highScore = localStorage.getItem('wordMatchHighScore') ? parseInt(localStorage.getItem('wordMatchHighScore')) : 0;
let remainingTime = MAX_TIME;
let timerInterval = null;
let isGameActive = false;
let soundEnabled = true;
let activeRoundWords = [];

// DOM Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const btnStartQrCode = document.getElementById('btnStartQrCode');
const appContainer = document.getElementById('appContainer');

const levelBadge = document.getElementById('levelBadge');
const timerDisplay = document.getElementById('timerDisplay');
const timerBar = document.getElementById('timerBar');
const scoreDisplay = document.getElementById('scoreDisplay');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const progressDots = document.getElementById('progressDots').children;
const wordsListColumn = document.getElementById('wordsListColumn');
const imagesListColumn = document.getElementById('imagesListColumn');
const btnRestart = document.getElementById('btnRestart');
const btnSound = document.getElementById('btnSound');
const soundIcon = document.getElementById('soundIcon');
const modalOverlay = document.getElementById('modalOverlay');
const btnModalAction = document.getElementById('btnModalAction');
const modalActionIcon = document.getElementById('modalActionIcon');
const modalActionText = document.getElementById('modalActionText');

// Web Audio API Context
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Sound Synthesizers using Web Audio API
function playSound(type) {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  if (type === 'start') {
    // Game start fanfare tone
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.3, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  } else if (type === 'select') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } else if (type === 'match') {
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.3, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.2);
    });
  } else if (type === 'wrong') {
    [240, 180].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.15);
    });
  } else if (type === 'tick') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } else if (type === 'victory') {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.3, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  } else if (type === 'gameover') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.5);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }
}

// Text to Speech for English Pronunciation
function speakWord(text) {
  if (!soundEnabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// Initialize Application (Shows Landing Screen initially)
function initApp() {
  highScoreDisplay.textContent = highScore;
  createBackgroundBubbles();
  setupEventListeners();
}

// Enter Game from Landing Screen upon clicking QR Code
function enterGame() {
  initAudio();
  playSound('start');

  welcomeScreen.style.display = 'none';
  appContainer.style.display = 'flex';

  loadLevel(1);
}

// Generate animated floating bubbles
function createBackgroundBubbles() {
  const container = document.getElementById('bgBubbles');
  container.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'bg-bubble';
    const size = Math.random() * 80 + 30;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${Math.random() * 100}%`;
    bubble.style.animationDelay = `${Math.random() * 8}s`;
    bubble.style.animationDuration = `${Math.random() * 10 + 10}s`;
    container.appendChild(bubble);
  }
}

// Get Vocabulary Set for Level
function getWordsForLevel(lvl) {
  const index = (lvl - 1) % LEVEL_VOCABULARY.length;
  if (LEVEL_VOCABULARY[index]) {
    return LEVEL_VOCABULARY[index];
  }
  return [...EXTRA_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
}

// Load and Start Level
function loadLevel(lvl) {
  currentLevel = lvl;
  levelPassed = false;
  levelBadge.textContent = `🚩 第 ${currentLevel} 關`;

  // Reset Level Variables
  clearInterval(timerInterval);
  selectedWordCard = null;
  selectedImageCard = null;
  matchedPairsCount = 0;
  mistakesCount = 0;
  remainingTime = MAX_TIME;
  isGameActive = true;

  updateTimerUI();
  updateProgressDots();
  modalOverlay.classList.remove('active');

  // Fetch words for this specific level
  activeRoundWords = getWordsForLevel(currentLevel);

  // Prepare Word items and Image items separately and shuffle their display orders
  const wordItems = [...activeRoundWords].sort(() => Math.random() - 0.5);
  const imageItems = [...activeRoundWords].sort(() => Math.random() - 0.5);

  renderMatchingColumns(wordItems, imageItems);
  startTimer();
}

// Render Word Column and Image Column
function renderMatchingColumns(wordItems, imageItems) {
  wordsListColumn.innerHTML = '';
  imagesListColumn.innerHTML = '';

  // Render Words (Left Column) - Chinese is hidden until matched!
  wordItems.forEach(item => {
    const wordCard = document.createElement('div');
    wordCard.className = 'direct-card card-type-word';
    wordCard.dataset.wordId = item.id;
    wordCard.dataset.word = item.word;
    wordCard.dataset.chinese = item.chinese;

    wordCard.innerHTML = `
      <span class="speak-icon">🔊</span>
      <div class="card-word-content">
        <div class="word-main">${item.word}</div>
        <div class="word-phonetic">${item.phonetic}</div>
        <div class="word-chinese hidden-chinese" id="chinese-${item.id}">🔒 解鎖中文翻譯</div>
      </div>
    `;

    wordCard.addEventListener('click', () => handleWordCardClick(wordCard));
    wordsListColumn.appendChild(wordCard);
  });

  // Render Images (Right Column)
  imageItems.forEach(item => {
    const imageCard = document.createElement('div');
    imageCard.className = 'direct-card card-type-image';
    imageCard.dataset.wordId = item.id;
    imageCard.dataset.word = item.word;

    imageCard.innerHTML = `
      <div class="card-image-content">
        <img src="${item.image}" alt="${item.word}" class="direct-img" />
      </div>
    `;

    imageCard.addEventListener('click', () => handleImageCardClick(imageCard));
    imagesListColumn.appendChild(imageCard);
  });
}

// Handle Word Card Selection
function handleWordCardClick(cardEl) {
  if (!isGameActive || cardEl.classList.contains('matched')) return;

  speakWord(cardEl.dataset.word);

  if (selectedWordCard === cardEl) return;

  playSound('select');

  if (selectedWordCard) {
    selectedWordCard.classList.remove('selected');
  }

  selectedWordCard = cardEl;
  selectedWordCard.classList.add('selected');

  if (selectedImageCard) {
    checkDirectMatch();
  }
}

// Handle Image Card Selection
function handleImageCardClick(cardEl) {
  if (!isGameActive || cardEl.classList.contains('matched')) return;

  if (selectedImageCard === cardEl) return;

  playSound('select');

  if (selectedImageCard) {
    selectedImageCard.classList.remove('selected');
  }

  selectedImageCard = cardEl;
  selectedImageCard.classList.add('selected');

  if (selectedWordCard) {
    checkDirectMatch();
  }
}

// Check Direct Match between selected Word and Image
function checkDirectMatch() {
  const wordId = selectedWordCard.dataset.wordId;
  const imageWordId = selectedImageCard.dataset.wordId;
  const wordText = selectedWordCard.dataset.word;
  const chineseText = selectedWordCard.dataset.chinese;

  const wCard = selectedWordCard;
  const iCard = selectedImageCard;

  if (wordId === imageWordId) {
    // MATCH SUCCESS!
    playSound('match');
    speakWord(wordText);

    wCard.classList.remove('selected');
    iCard.classList.remove('selected');
    wCard.classList.add('matched');
    iCard.classList.add('matched');

    // REVEAL CHINESE TRANSLATION ON MATCH!
    const chineseEl = wCard.querySelector('.word-chinese');
    if (chineseEl) {
      chineseEl.className = 'word-chinese revealed-chinese';
      chineseEl.textContent = `✨ ${chineseText}`;
    }

    selectedWordCard = null;
    selectedImageCard = null;

    matchedPairsCount++;
    updateProgressDots();

    score += 500;
    scoreDisplay.textContent = score;

    // Check Victory
    if (matchedPairsCount === 3) {
      handleVictory();
    }
  } else {
    // MATCH WRONG!
    mistakesCount++;
    playSound('wrong');

    wCard.classList.add('wrong');
    iCard.classList.add('wrong');

    const tempW = wCard;
    const tempI = iCard;

    selectedWordCard = null;
    selectedImageCard = null;

    setTimeout(() => {
      tempW.classList.remove('selected', 'wrong');
      tempI.classList.remove('selected', 'wrong');
    }, 450);
  }
}

// Timer Logic
function startTimer() {
  const startTime = Date.now();
  const initialTime = remainingTime;

  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    remainingTime = Math.max(0, initialTime - elapsed);
    updateTimerUI();

    if (remainingTime <= 4.0 && remainingTime > 0 && Math.floor(remainingTime * 10) % 10 === 0) {
      playSound('tick');
    }

    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      handleTimeOut();
    }
  }, 50);
}

function updateTimerUI() {
  const timeFormatted = remainingTime.toFixed(1);
  timerDisplay.innerHTML = `${timeFormatted}<small>s</small>`;

  const percent = (remainingTime / MAX_TIME) * 100;
  timerBar.style.width = `${percent}%`;

  timerDisplay.classList.remove('warning', 'danger');
  if (remainingTime <= 4.0) {
    timerDisplay.classList.add('danger');
  } else if (remainingTime <= 7.0) {
    timerDisplay.classList.add('warning');
  }
}

function updateProgressDots() {
  for (let i = 0; i < progressDots.length; i++) {
    if (i < matchedPairsCount) {
      progressDots[i].classList.add('active');
    } else {
      progressDots[i].classList.remove('active');
    }
  }
}

// Victory Handler (Passed Current Level!)
function handleVictory() {
  clearInterval(timerInterval);
  isGameActive = false;
  levelPassed = true;
  playSound('victory');
  triggerConfetti();

  const timeSpent = MAX_TIME - remainingTime;
  
  // Calculate Score (Shorter time -> Higher score!)
  const baseScore = 1500;
  const speedBonus = Math.round(remainingTime * 150);
  const accuracyBonus = mistakesCount === 0 ? 500 : Math.max(0, 300 - mistakesCount * 100);
  
  const levelScore = baseScore + speedBonus + accuracyBonus;
  score += levelScore;
  scoreDisplay.textContent = score;

  // Check High Score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('wordMatchHighScore', highScore);
    highScoreDisplay.textContent = highScore;
  }

  // Calculate Stars (1 to 3 stars)
  let stars = 1;
  if (timeSpent <= 6.0 || levelScore >= 2800) {
    stars = 3;
  } else if (timeSpent <= 10.0 || levelScore >= 2000) {
    stars = 2;
  }

  // Populate Modal UI for Level CLEAR
  document.getElementById('modalBadge').textContent = `🎉 第 ${currentLevel} 關 成功通關！`;
  document.getElementById('modalTitle').textContent = stars === 3 ? '⚡ 速度之王！解鎖下一關！' : '👍 通關成功！解鎖下一關！';
  
  const starsContainer = document.getElementById('starsContainer');
  starsContainer.querySelectorAll('.star').forEach((star, idx) => {
    if (idx < stars) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });

  document.getElementById('timeUsedText').textContent = `${timeSpent.toFixed(2)} 秒`;
  document.getElementById('baseScoreText').textContent = baseScore.toLocaleString();
  document.getElementById('speedBonusText').textContent = `+${speedBonus.toLocaleString()}`;
  document.getElementById('accuracyBonusText').textContent = `+${accuracyBonus.toLocaleString()}`;
  document.getElementById('finalScoreText').textContent = score.toLocaleString();

  // Set Modal Button to "進入下一關"
  modalActionIcon.textContent = '➡️';
  modalActionText.textContent = `進入第 ${currentLevel + 1} 關 (全新3個單字)`;

  renderWordsReview();

  setTimeout(() => {
    modalOverlay.classList.add('active');
  }, 400);
}

// Timeout / Game Over Handler (Failed Current Level!)
function handleTimeOut() {
  isGameActive = false;
  levelPassed = false; // Must retry current level!
  playSound('gameover');

  document.getElementById('modalBadge').textContent = `⏰ 第 ${currentLevel} 關 挑戰失敗`;
  document.getElementById('modalTitle').textContent = '未在 15 秒內通過，重試本關卡！';

  const starsContainer = document.getElementById('starsContainer');
  starsContainer.querySelectorAll('.star').forEach(star => star.classList.remove('active'));

  const baseScore = matchedPairsCount * 500;
  document.getElementById('timeUsedText').textContent = '15.00 秒 (逾時)';
  document.getElementById('baseScoreText').textContent = baseScore.toLocaleString();
  document.getElementById('speedBonusText').textContent = '+0';
  document.getElementById('accuracyBonusText').textContent = '+0';
  document.getElementById('finalScoreText').textContent = score.toLocaleString();

  // Set Modal Button to "重試本關"
  modalActionIcon.textContent = '🔄';
  modalActionText.textContent = `重試第 ${currentLevel} 關 (再次挑戰本組單字)`;

  renderWordsReview();

  modalOverlay.classList.add('active');
}

// Render Review List of active round words in Modal
function renderWordsReview() {
  const container = document.getElementById('wordsReviewList');
  container.innerHTML = '';
  activeRoundWords.forEach(item => {
    const chip = document.createElement('div');
    chip.className = 'word-chip';
    chip.innerHTML = `🔊 <strong>${item.word}</strong> (${item.chinese})`;
    chip.addEventListener('click', () => speakWord(item.word));
    container.appendChild(chip);
  });
}

// Event Listeners
function setupEventListeners() {
  // QR Code Landing trigger to enter game
  btnStartQrCode.addEventListener('click', enterGame);

  // Top Dashboard Restart button (Retry current level)
  btnRestart.addEventListener('click', () => {
    initAudio();
    playSound('select');
    loadLevel(currentLevel);
  });

  // Modal Primary Button: Advance if levelPassed, or Retry if failed
  btnModalAction.addEventListener('click', () => {
    initAudio();
    playSound('select');
    if (levelPassed) {
      loadLevel(currentLevel + 1); // Advance to NEXT LEVEL (New 3 words!)
    } else {
      loadLevel(currentLevel); // Retry CURRENT LEVEL
    }
  });

  btnSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    btnSound.classList.toggle('muted', !soundEnabled);
  });
}

// Confetti Particle Effect Canvas
function triggerConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#38bdf8'];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  let animationFrame;
  function updateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.rotation += p.rSpeed;
      p.opacity -= 0.015;

      if (p.opacity > 0) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (alive) {
      animationFrame = requestAnimationFrame(updateConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  updateConfetti();
}

// Start App when DOM ready
document.addEventListener('DOMContentLoaded', initApp);
