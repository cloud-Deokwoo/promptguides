/**
 * MBC AI 마스터클래스 공통 스크립트
 * 진행률 저장, 페이지 네비게이션, 목차(T.O.C) 생성을 담당합니다.
 */

const COURSE_STRUCTURE = [
  { id: 'intro', title: 'Intro', path: 'intro.html', emoji: '🌟' },
  { id: 'llm', title: 'AI & LLM', path: 'llm/index.html', emoji: '🤖' },
  { id: 'prompt', title: 'Prompt Engineering', path: 'prompt/index.html', emoji: '💡' },
  { id: 'sora', title: 'Sora AI', path: 'sora/index.html', emoji: '✨' },
  { id: 'premiere', title: '영상 제작 (Premiere Pro)', path: 'premiere/index.html', emoji: '🎬' },
  { id: 'aftereffects', title: 'After Effects', path: 'aftereffects/index.html', emoji: '🎞️' },
  { id: 'audio', title: 'Audio', path: 'audio/index.html', emoji: '🔊' },
  { id: 'projects', title: 'Projects 허브', path: 'projects/index.html', emoji: '🚀' },
  { id: 'capcut', title: 'CapCut 영상 편집', path: 'capcut/index.html', emoji: '✂️' }
];

const STORAGE_KEY = 'mbc-course-progress';

function computeBasePath() {
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  if (!window.location.pathname.endsWith('/')) {
    pathSegments.pop();
  }
  const depth = pathSegments.length;
  return depth > 0 ? '../'.repeat(depth) : '';
}

function resolveCoursePath(targetPath) {
  if (!targetPath) return null;
  const normalizedTarget = targetPath.startsWith('/') ? targetPath.slice(1) : targetPath;
  return `${computeBasePath()}${normalizedTarget}`;
}

class ProgressTracker {
  constructor() {
    this.totalPages = COURSE_STRUCTURE.length;
    this.currentPage = 1;
    this.completedPages = new Set();
    this.loadProgress();
  }

  getCurrentPageIndex() {
    const rawPath = window.location.pathname.replace(/\/+/g, '/');
    let normalizedPath = rawPath;

    if (normalizedPath.endsWith('/')) {
      normalizedPath = `${normalizedPath}index.html`;
    } else {
      const lastSegment = normalizedPath.split('/').pop() || '';
      if (lastSegment && !lastSegment.includes('.')) {
        normalizedPath = `${normalizedPath}/index.html`;
      }
    }

    normalizedPath = normalizedPath.replace(/\/{2,}/g, '/');

    return COURSE_STRUCTURE.findIndex((page) => {
      const pagePathWithLeadingSlash = `/${page.path}`.replace(/\/+/g, '/');

      if (normalizedPath.includes(`/${page.id}/`)) {
        return true;
      }

      if (normalizedPath.endsWith(pagePathWithLeadingSlash)) {
        return true;
      }

      return false;
    });
  }
  updateProgress(pageIndex = null) {
    const index = pageIndex !== null ? pageIndex : this.getCurrentPageIndex();
    if (index >= 0) {
      this.currentPage = index + 1;
      this.completedPages.add(index);
      this.saveProgress();
      this.updateUI();
    }
  }

  updateUI() {
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');
    const percentage = (this.currentPage / this.totalPages) * 100;

    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }

    if (progressText) {
      progressText.textContent = `${this.currentPage}/${this.totalPages}`;
    }

    this.updateBreadcrumb();
  }

  updateBreadcrumb() {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (!breadcrumb) return;

    const index = this.getCurrentPageIndex();
    if (index >= 0) {
      const info = COURSE_STRUCTURE[index];
      const homePath = resolveCoursePath('index.html');
      breadcrumb.innerHTML = `
        <a href="${homePath}">🏠 MBC AI 마스터클래스</a>
        <span class="breadcrumb-separator">›</span>
        <span>${info.emoji} ${info.title}</span>
      `;
    }
  }

  saveProgress() {
    const payload = {
      currentPage: this.currentPage,
      completedPages: Array.from(this.completedPages),
      lastVisited: new Date().toISOString(),
      totalPages: this.totalPages
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (data.currentPage) {
        this.currentPage = data.currentPage;
      }
      if (Array.isArray(data.completedPages)) {
        this.completedPages = new Set(data.completedPages);
      }
    } catch (error) {
      console.warn('진행 정보를 불러오지 못했습니다:', error);
    }
  }

  resetProgress() {
    this.currentPage = 1;
    this.completedPages.clear();
    localStorage.removeItem(STORAGE_KEY);
    this.updateUI();
  }
}

class NavigationManager {
  constructor() {
    this.initNavigation();
  }

  initNavigation() {
    this.attachEventListeners();
    this.updateNavigationButtons();
  }

  attachEventListeners() {
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : event.target.parentElement;
      if (!target) return;

      const homeButton = target.closest('.home-button, .btn-home');
      if (homeButton) {
        event.preventDefault();
        this.goHome();
        return;
      }

      const prevButton = target.closest('.nav-button[data-action="previous"]');
      if (prevButton) {
        if (prevButton.dataset.manual === 'true') {
          return;
        }
        event.preventDefault();
        this.goToPrevious();
        return;
      }

      const nextButton = target.closest('.nav-button[data-action="next"]');
      if (nextButton) {
        if (nextButton.dataset.manual === 'true') {
          return;
        }
        event.preventDefault();
        this.goToNext();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        this.goToPrevious();
      }

      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        this.goToNext();
      }

      if (event.altKey && event.key === 'Home') {
        event.preventDefault();
        this.goHome();
      }
    });
  }

  getCurrentPageIndex() {
    return window.progressTracker ? window.progressTracker.getCurrentPageIndex() : -1;
  }

  goHome() {
    const homePath = resolveCoursePath('index.html');
    if (homePath) {
      window.location.href = homePath;
    }
  }

  goToPrevious() {
    const manualButton = document.querySelector('.nav-button[data-action="previous"][data-manual="true"]');
    if (manualButton) {
      const href = manualButton.getAttribute('href');
      if (href) {
        window.location.href = href;
        return;
      }
    }

    const currentIndex = this.getCurrentPageIndex();
    if (currentIndex > 0) {
      const previousPage = COURSE_STRUCTURE[currentIndex - 1];
      const target = resolveCoursePath(previousPage.path);
      if (target) {
        window.location.href = target;
      }
    } else {
      this.goHome();
    }
  }

  goToNext() {
    const manualButton = document.querySelector('.nav-button[data-action="next"][data-manual="true"]');
    if (manualButton) {
      const href = manualButton.getAttribute('href');
      if (href) {
        window.location.href = href;
        return;
      }
    }

    const currentIndex = this.getCurrentPageIndex();
    if (currentIndex < COURSE_STRUCTURE.length - 1) {
      const nextPage = COURSE_STRUCTURE[currentIndex + 1];
      const target = resolveCoursePath(nextPage.path);
      if (target) {
        window.location.href = target;
      }
    }
  }

  updateNavigationButtons() {
    const currentIndex = this.getCurrentPageIndex();
    const prevButton = document.querySelector('.nav-button[data-action="previous"]');
    const nextButton = document.querySelector('.nav-button[data-action="next"]');

    if (prevButton) {
      if (prevButton.dataset.manual === 'true') {
        prevButton.classList.remove('disabled');
        prevButton.style.opacity = '1';
        prevButton.setAttribute('aria-disabled', 'false');
        prevButton.removeAttribute('tabindex');
      } else if (currentIndex <= 0) {
        const homePath = resolveCoursePath('index.html');
        prevButton.innerHTML = '← 메인 페이지로';
        prevButton.classList.remove('disabled');
        prevButton.style.opacity = '1';
        prevButton.setAttribute('aria-disabled', 'false');
        prevButton.removeAttribute('tabindex');
        prevButton.setAttribute('aria-label', '메인 페이지로 이동');
        prevButton.setAttribute('href', homePath || '#');
      } else {
        const prevPage = COURSE_STRUCTURE[currentIndex - 1];
        const prevPath = resolveCoursePath(prevPage.path);
        prevButton.innerHTML = `← 이전: ${prevPage.emoji} ${prevPage.title}`;
        prevButton.classList.remove('disabled');
        prevButton.style.opacity = '1';
        prevButton.setAttribute('aria-disabled', 'false');
        prevButton.removeAttribute('tabindex');
        prevButton.setAttribute('aria-label', `이전 페이지 ${prevPage.title}`);
        prevButton.setAttribute('href', prevPath || '#');
      }
    }

    if (nextButton) {
      if (nextButton.dataset.manual === 'true') {
        nextButton.classList.remove('disabled');
        nextButton.style.opacity = '1';
        nextButton.setAttribute('aria-disabled', 'false');
        nextButton.removeAttribute('tabindex');
      } else if (currentIndex >= COURSE_STRUCTURE.length - 1 || currentIndex < 0) {
        nextButton.classList.add('disabled');
        nextButton.style.opacity = '0.5';
        nextButton.setAttribute('aria-disabled', 'true');
        nextButton.setAttribute('tabindex', '-1');
        nextButton.setAttribute('aria-label', '다음 페이지 없음');
        nextButton.setAttribute('href', '#');
      } else {
        const nextPage = COURSE_STRUCTURE[currentIndex + 1];
        const nextPath = resolveCoursePath(nextPage.path);
        nextButton.innerHTML = `다음: ${nextPage.emoji} ${nextPage.title} →`;
        nextButton.classList.remove('disabled');
        nextButton.style.opacity = '1';
        nextButton.setAttribute('aria-disabled', 'false');
        nextButton.removeAttribute('tabindex');
        nextButton.setAttribute('aria-label', `다음 페이지 ${nextPage.title}`);
        nextButton.setAttribute('href', nextPath || '#');
      }
    }
  }
}

class TOCManager {
  constructor() {
    this.isOpen = false;
    this.render();
  }

  render() {
    if (document.querySelector('.toc-toggle')) return;

    const toggle = document.createElement('button');
    toggle.className = 'toc-toggle';
    toggle.type = 'button';
    toggle.textContent = '목차';
    document.body.appendChild(toggle);

    const sidebar = document.createElement('aside');
    sidebar.className = 'toc-sidebar';
    sidebar.innerHTML = `
      <h3 class="toc-title">과정 목차</h3>
      <div class="toc-list"></div>
    `;
    document.body.appendChild(sidebar);

    this.toggleButton = toggle;
    this.sidebar = sidebar;
    this.list = sidebar.querySelector('.toc-list');

    this.populateList();
    this.attachEvents();
  }

  populateList() {
    if (!this.list) return;
    const currentIndex = window.progressTracker ? window.progressTracker.getCurrentPageIndex() : -1;

    this.list.innerHTML = COURSE_STRUCTURE.map((page, index) => {
      const isActive = index === currentIndex ? 'active' : '';
      const isCompleted = window.progressTracker && window.progressTracker.completedPages.has(index) ? 'complete' : '';
      return `
        <button class="toc-item ${isActive} ${isCompleted}" data-index="${index}" type="button">
          <span class="toc-emoji">${page.emoji}</span>
          <span class="toc-label">${page.title}</span>
        </button>
      `;
    }).join('');
  }

  attachEvents() {
    if (!this.toggleButton || !this.sidebar) return;

    this.toggleButton.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      this.sidebar.classList.toggle('open', this.isOpen);
    });

    this.sidebar.addEventListener('click', (event) => {
      const button = event.target.closest('.toc-item');
      if (!button) return;
      const index = Number(button.dataset.index);
      const target = resolveCoursePath(COURSE_STRUCTURE[index].path);
      if (target) {
        window.location.href = target;
      }
    });
  }
}

const Utils = {
  debounce(fn, delay = 200) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  throttle(fn, limit = 200) {
    let inThrottle = false;
    return function throttled(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  smoothScrollTo(element, duration = 800) {
    if (!element) return;
    const targetPosition = element.offsetTop;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = Utils.easeInOutQuad(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    requestAnimationFrame(animation);
  },

  easeInOutQuad(t, b, c, d) {
    let time = t;
    time /= d / 2;
    if (time < 1) return (c / 2) * time * time + b;
    time -= 1;
    return (-c / 2) * (time * (time - 2) - 1) + b;
  }
};

function initializeCommonFeatures() {
  window.progressTracker = new ProgressTracker();
  window.navigationManager = new NavigationManager();
  window.tocManager = new TOCManager();

  window.progressTracker.updateProgress();
  window.navigationManager.updateNavigationButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCommonFeatures);
} else {
  initializeCommonFeatures();
