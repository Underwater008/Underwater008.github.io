(() => {
  console.log('🚀 Loader.js starting...');
  const loadingContainer = document.getElementById('loading-container');
  if (!loadingContainer) {
    console.error('❌ Loading container not found!');
    return;
  }
  console.log('✅ Loading container found');

  const starCanvas = document.getElementById('starfield-canvas');
  const particleCanvas = document.getElementById('loading-particle-canvas');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const progressTitle = document.getElementById('progress-title');
  const contentContainer = document.getElementById('content-container');

  if (contentContainer) {
    contentContainer.style.opacity = '0';
  }
  document.body.classList.add('loading-active');

  // Populate progress dots
  const progressDots = null;

  // Asset tracking ----------------------------------------------------------
  let assetsRequired = 0;
  let assetsLoaded = 0;
  let assetsTimedOut = false;
  let timelineComplete = false;
  let loaderCompleted = false;

  const assetTimeout = setTimeout(() => {
    assetsTimedOut = true;
    checkCompletion();
  }, 15000);

  function checkCompletion() {
    if (loaderCompleted) return;
    const assetsReady = assetsLoaded >= assetsRequired || assetsTimedOut;
    if (timelineComplete && assetsReady) {
      completeLoader();
    }
  }

  window.addEventListener('stellar-loader:setAssetCount', (event) => {
    const incoming = Number(event.detail);
    if (!Number.isNaN(incoming) && incoming >= 0) {
      assetsRequired = incoming;
      if (assetsLoaded >= assetsRequired) {
        clearTimeout(assetTimeout);
      }
      checkCompletion();
    }
  });

  window.addEventListener('stellar-loader:assetLoaded', () => {
    assetsLoaded += 1;
    if (assetsLoaded >= assetsRequired) {
      clearTimeout(assetTimeout);
    }
    checkCompletion();
  });

  loadingContainer.addEventListener('dblclick', () => {
    if (loaderCompleted) return;
    console.log('⚡ Loader skipped via double-click');
    assetsTimedOut = true;
    timelineComplete = true;
    clearTimeout(assetTimeout);
    if (progressBar) {
      progressBar.style.width = '100%';
    }
    if (progressTitle) {
      progressTitle.textContent = 'SKIPPING...';
    }
    if (progressText) {
      progressText.textContent = '100%';
    }
    checkCompletion();
  });

  // Starfield ---------------------------------------------------------------
  const starCtx = starCanvas.getContext('2d');
  const particleCtx = particleCanvas.getContext('2d');

  const prefixLeftRatio = 0.15;
  const titles = ['HELLO WORLD', 'I am a GAMER', 'I am a DEVELOPER', 'I am Homo Ludens', 'I am XIAO'];
  let currentTitleIndex = 0;
  let currentPrefixText = '';
  let prefixRightEdge = 0;
  let articleSpacing = 0;
  let prefixParticles = [];
  let articleParticles = [];
  let articleTargetPositions = [];
  let suffixParticles = [];

  function resizeCanvases() {
    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
    prefixParticles = [];
    articleParticles = [];
    articleTargetPositions = [];
    suffixParticles = [];
    prefixRightEdge = Math.max(40, particleCanvas.width * prefixLeftRatio);
    articleSpacing = 0;
  }
  resizeCanvases();
  console.log('📐 Canvas dimensions:', particleCanvas.width, 'x', particleCanvas.height);
  window.addEventListener('resize', () => {
    resizeCanvases();
    createPrefixParticles(currentPrefixText);
    articleTargetPositions = [];
    showTitle(currentTitleIndex);
  });

  class Star {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * starCanvas.width;
      this.y = Math.random() * starCanvas.height;
      this.z = Math.random() * 2000;
      this.size = Math.random() * 1.5 + 0.5;
      this.opacity = Math.random() * 0.5 + 0.3;
      this.twinkleSpeed = Math.random() * 0.02 + 0.01;
      this.twinkleOffset = Math.random() * Math.PI * 2;
    }

    update() {
      this.z -= 1;
      if (this.z <= 0) {
        this.reset();
        this.z = 2000;
      }
    }

    draw(time) {
      const x = (this.x - starCanvas.width / 2) * (1000 / this.z) + starCanvas.width / 2;
      const y = (this.y - starCanvas.height / 2) * (1000 / this.z) + starCanvas.height / 2;
      const size = this.size * (1000 / this.z);

      if (x < 0 || x > starCanvas.width || y < 0 || y > starCanvas.height) {
        this.reset();
        return;
      }

      const twinkle = Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.3 + 0.7;
      const opacity = this.opacity * twinkle * (1000 / this.z);

      starCtx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      starCtx.fillRect(x, y, size, size);
    }
  }

  const stars = Array.from({ length: 200 }, () => new Star());

  // Particle system ---------------------------------------------------------
  class Particle {
    constructor(x, y, targetX, targetY) {
      this.x = x;
      this.y = y;
      this.targetX = targetX;
      this.targetY = targetY;
      this.size = Math.random() * 2 + 1;
      this.opacity = 0;
      this.targetOpacity = 1;
    }

    update() {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const ease = 0.06;

      this.x += dx * ease;
      this.y += dy * ease;

      if (this.opacity < this.targetOpacity) {
        this.opacity = Math.min(this.opacity + 0.02, this.targetOpacity);
      } else if (this.opacity > this.targetOpacity) {
        this.opacity = Math.max(this.opacity - 0.02, this.targetOpacity);
      }
    }

    draw() {
      particleCtx.fillStyle = `rgba(0, 0, 0, ${this.opacity})`;
      particleCtx.fillRect(this.x, this.y, this.size, this.size);
    }
  }

  function getTextParticles(text, options = {}) {
    if (!text) return [];

    const fontSize = Math.min(window.innerWidth / 8, 80);
    particleCtx.font = `bold ${fontSize}px "Courier New", monospace`;
    particleCtx.textAlign = 'center';
    particleCtx.textBaseline = 'middle';

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const metrics = particleCtx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;
    tempCanvas.width = textWidth + 40;
    tempCanvas.height = textHeight + 40;

    const centerX = options.centerX ?? (particleCanvas.width / 2);
    const centerY = options.centerY ?? (particleCanvas.height / 2);
    const offsetX = centerX - tempCanvas.width / 2;
    const offsetY = centerY - tempCanvas.height / 2;

    tempCtx.font = particleCtx.font;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillStyle = '#fff';
    tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const particlePositions = [];
    const density = 4;

    for (let y = 0; y < tempCanvas.height; y += density) {
      for (let x = 0; x < tempCanvas.width; x += density) {
        const index = (y * tempCanvas.width + x) * 4;
        const alpha = imageData.data[index + 3];

        if (alpha > 128) {
          const px = offsetX + x;
          const py = offsetY + y;
          particlePositions.push({ x: px, y: py });
        }
      }
    }

    return particlePositions;
  }

  function createPrefixParticles(prefix) {
    currentPrefixText = prefix;

    const centerY = particleCanvas.height / 2;
    const baseLeft = Math.max(40, particleCanvas.width * prefixLeftRatio);
    const fontSize = Math.min(window.innerWidth / 8, 80);
    particleCtx.font = `bold ${fontSize}px "Courier New", monospace`;

    if (!prefix) {
      prefixRightEdge = baseLeft;
      articleSpacing = fontSize * 0.2;
      prefixParticles = [];
      articleParticles = [];
      articleTargetPositions = [];
      return;
    }

    let targetPositions = [];
    let rightEdge = baseLeft;
    let spacing = fontSize * 0.2;

    if (prefix === 'I am') {
      const widthI = particleCtx.measureText('I').width;
      const widthAm = particleCtx.measureText('am').width;
      const widthIWithSpace = particleCtx.measureText('I ').width;
      const spaceWidth = Math.max(0, widthIWithSpace - widthI);
      const desiredSpacing = spaceWidth * 0.75;

      const iPositions = getTextParticles('I', {
        centerX: baseLeft + widthI / 2,
        centerY
      });

      if (iPositions.length === 0) {
        prefixRightEdge = baseLeft;
        articleSpacing = desiredSpacing;
        prefixParticles = [];
        articleParticles = [];
        articleTargetPositions = [];
        return;
      }

      const iMin = Math.min(...iPositions.map((pos) => pos.x));
      const shiftI = baseLeft - iMin;
      const adjustedI = iPositions.map((pos) => ({
        x: pos.x + shiftI,
        y: pos.y
      }));
      const iRight = Math.max(...adjustedI.map((pos) => pos.x));

      const amLeft = iRight + desiredSpacing;
      const amCenter = amLeft + widthAm / 2;
      const amPositions = getTextParticles('am', {
        centerX: amCenter,
        centerY
      });

      if (amPositions.length === 0) {
        prefixRightEdge = iRight;
        articleSpacing = desiredSpacing;
        prefixParticles = [];
        articleParticles = [];
        articleTargetPositions = [];
        return;
      }

      const amMin = Math.min(...amPositions.map((pos) => pos.x));
      const adjustedAm = amPositions.map((pos) => ({
        x: pos.x + (amLeft - amMin),
        y: pos.y
      }));
      const amRight = Math.max(...adjustedAm.map((pos) => pos.x));

      targetPositions = adjustedI.concat(adjustedAm);
      rightEdge = amRight;
      spacing = desiredSpacing;
    } else {
      const positions = getTextParticles(prefix, { centerX: particleCanvas.width / 2, centerY });

      if (positions.length === 0) {
        prefixRightEdge = baseLeft;
        articleSpacing = spacing;
        prefixParticles = [];
        articleParticles = [];
        articleTargetPositions = [];
        return;
      }

      const minX = Math.min(...positions.map((pos) => pos.x));
      const maxX = Math.max(...positions.map((pos) => pos.x));
      const shift = baseLeft - minX;

      targetPositions = positions.map((pos) => ({
        x: pos.x + shift,
        y: pos.y
      }));
      rightEdge = maxX + shift;
    }

    const needsRebuild = prefixParticles.length !== targetPositions.length;

    if (needsRebuild) {
      prefixParticles = targetPositions.map((target) => {
        const particle = new Particle(
          particleCanvas.width / 2,
          particleCanvas.height / 2,
          target.x,
          target.y
        );
        particle.opacity = 0;
        particle.targetOpacity = 1;
        return particle;
      });
    } else {
      prefixParticles.forEach((particle, idx) => {
        const target = targetPositions[idx];
        particle.targetX = target.x;
        particle.targetY = target.y;
        particle.targetOpacity = 1;
      });
    }

    prefixRightEdge = rightEdge;
    articleSpacing = spacing;
    articleTargetPositions = [];
    articleParticles = [];
  }

  function prepareArticleTargets() {
    if (currentPrefixText !== 'I am') {
      articleTargetPositions = [];
      articleParticles = [];
      return;
    }

    const centerY = particleCanvas.height / 2;
    const positions = getTextParticles('a', { centerX: particleCanvas.width / 2, centerY });

    if (positions.length === 0) {
      articleTargetPositions = [];
      articleParticles = [];
      return;
    }

    const minX = Math.min(...positions.map((pos) => pos.x));
    const fontSize = Math.min(window.innerWidth / 8, 80);
    const spacing = articleSpacing > 0 ? articleSpacing : fontSize * 0.2;
    const targetLeft = prefixRightEdge + spacing;
    const shift = targetLeft - minX;

    articleTargetPositions = positions.map((pos) => ({
      x: pos.x + shift,
      y: pos.y
    }));

    if (articleParticles.length !== articleTargetPositions.length) {
      articleParticles = articleTargetPositions.map((pos) => {
        const particle = new Particle(
          particleCanvas.width / 2,
          particleCanvas.height / 2,
          pos.x,
          pos.y
        );
        particle.opacity = 0;
        particle.targetOpacity = 0;
        return particle;
      });
    } else {
      articleParticles.forEach((particle, idx) => {
        const target = articleTargetPositions[idx];
        particle.targetX = target.x;
        particle.targetY = target.y;
      });
    }
  }

  function updateArticleState(includeArticle) {
    if (currentPrefixText !== 'I am') {
      articleParticles.forEach((particle) => {
        particle.targetOpacity = 0;
      });
      return;
    }

    if (articleTargetPositions.length === 0) {
      prepareArticleTargets();
    }

    if (articleTargetPositions.length === 0) return;

    articleParticles.forEach((particle, idx) => {
      const target = articleTargetPositions[idx];
      particle.targetX = target.x;
      particle.targetY = target.y;
      particle.targetOpacity = includeArticle ? 1 : 0;
    });
  }

  function showTitle(index) {
    if (index >= titles.length) return;

    const fullText = titles[index];
    let prefixText = '';
    let includeArticle = false;

    if (fullText.startsWith('I am a ')) {
      prefixText = 'I am';
      includeArticle = true;
    } else if (fullText.startsWith('I am ')) {
      prefixText = 'I am';
    }

    if (prefixText !== currentPrefixText || prefixParticles.length === 0) {
      createPrefixParticles(prefixText);
    }

    if (prefixText === 'I am' && articleTargetPositions.length === 0) {
      prepareArticleTargets();
    }

    updateArticleState(includeArticle);

    const sliceLength = includeArticle
      ? 'I am a '.length
      : prefixText === 'I am'
        ? 'I am '.length
        : 0;

    const suffixText = sliceLength > 0
      ? fullText.slice(sliceLength).trimStart()
      : fullText;

    const targetParticles = getTextParticles(suffixText, {
      centerX: particleCanvas.width / 2,
      centerY: particleCanvas.height / 2
    });
    const newParticles = [];

    for (let i = 0; i < targetParticles.length; i += 1) {
      let startX;
      let startY;

      if (i < suffixParticles.length) {
        startX = suffixParticles[i].x;
        startY = suffixParticles[i].y;
      } else {
        startX = particleCanvas.width / 2;
        startY = particleCanvas.height / 2;
      }

      const particle = new Particle(
        startX,
        startY,
        targetParticles[i].x,
        targetParticles[i].y
      );

      newParticles.push(particle);
    }

    for (let i = targetParticles.length; i < suffixParticles.length; i += 1) {
      const fadeParticle = new Particle(
        suffixParticles[i].x,
        suffixParticles[i].y,
        particleCanvas.width / 2,
        particleCanvas.height / 2
      );
      fadeParticle.opacity = 0.5;
      newParticles.push(fadeParticle);
    }

    suffixParticles = newParticles;
    if (progressTitle) {
      // Fade out, change text, fade in
      progressTitle.style.opacity = '0';
      setTimeout(() => {
        progressTitle.textContent = fullText;
        progressTitle.style.opacity = '1';
      }, 250);
    }
  }

  // Animation loop ----------------------------------------------------------
  let startTime = Date.now();
  const titleDuration = 1500;
  const titleDelay = 500; // Delay after particles settle before next title
  const totalDuration = titleDuration + titleDelay;
  let animationActive = true;

  function animate() {
    if (!animationActive) {
      return;
    }

    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const titleIndex = Math.min(Math.floor(elapsed / totalDuration), titles.length - 1);

    if (titleIndex !== currentTitleIndex) {
      currentTitleIndex = titleIndex;
      console.log('🎬 Showing title', titleIndex, ':', titles[titleIndex], 'at', elapsed.toFixed(0), 'ms');
      showTitle(currentTitleIndex);
    }

    starCtx.fillStyle = 'rgba(255, 255, 255, 1)';
    starCtx.fillRect(0, 0, starCanvas.width, starCanvas.height);
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    stars.forEach((star) => {
      star.update();
      star.draw(elapsed * 0.001);
    });

    prefixParticles.forEach((particle) => {
      particle.update();
      particle.draw();
    });

    articleParticles.forEach((particle) => {
      particle.update();
      particle.draw();
    });

    suffixParticles.forEach((particle) => {
      particle.update();
      particle.draw();
    });

    // Calculate progress - all titles get equal time including the last one
    const progress = Math.min((elapsed / (totalDuration * titles.length)) * 100, 100);

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }

    if (progressText) {
      progressText.textContent = `${Math.round(progress)}%`;
      progressText.style.opacity = '1';
    }

    if (progress >= 100 && !timelineComplete) {
      timelineComplete = true;
      checkCompletion();
    }

    requestAnimationFrame(animate);
  }

  function completeLoader() {
    if (loaderCompleted) return;
    loaderCompleted = true;
    animationActive = false;

    const elapsed = Date.now() - startTime;
    console.log('✅ Loader complete! Showing portfolio page at', elapsed.toFixed(0), 'ms');

    // Smooth fade out for loading screen
    loadingContainer.style.transition = 'opacity 0.8s ease-out';
    loadingContainer.style.opacity = '0';

    // Smooth fade in for portfolio
    if (contentContainer) {
      contentContainer.style.transition = 'opacity 0.8s ease-in';
      contentContainer.style.opacity = '1';
    }

    // Remove loading container after fade completes
    setTimeout(() => {
      loadingContainer.classList.add('hidden');
    }, 800);
  }

  createPrefixParticles(currentPrefixText);
  console.log('🎬 Starting animation with title 0:', titles[0]);
  showTitle(0);
  animate();
  console.log('✨ Animation loop started');
})();
