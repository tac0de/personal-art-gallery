let galleryData = [];
const itemsPerPage = 8;
let currentPage = 1;
let totalPages = 1;
let chaosMode = false;
let currentImageIndex = 0;

async function loadGalleryData() {
    const url = new URL('gallery.json', window.location.href).toString();
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) {
        console.error('gallery.json 불러오기 실패:', res.status, '요청 URL:', url);
        return [];
    }
    return await res.json();
}

async function init() {
    console.log('Initializing gallery...');
    try {
        galleryData = await loadGalleryData();
        console.log('Gallery data loaded:', galleryData.length, 'items');
    } catch (e) {
        console.error('갤러리 로딩 중 예외:', e);
        galleryData = [];
    }
    totalPages = Math.max(1, Math.ceil(galleryData.length / itemsPerPage));
    console.log('Total pages:', totalPages);

    renderGallery();
    renderPagination();
    initGlitchEffects();
    initChaosMode();

    console.log('Initialization complete');
}

document.addEventListener('DOMContentLoaded', init);

function renderGallery() {
    const container = document.getElementById('galleryContainer');
    if (!container) return;

    if (galleryData.length === 0) {
        container.innerHTML = '<div class="empty">이미지가 없습니다.</div>';
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = galleryData.slice(startIndex, endIndex);

    container.innerHTML = currentItems
        .map(
            (artwork) => `
      <div class="artwork-card" onclick="viewImage('${artwork.image}')">
        <img src="${artwork.image}" alt="" class="artwork-image" loading="lazy">
      </div>`
        )
        .join('');

    setTimeout(() => {
        applyRandomSizes();
        if (chaosMode) {
            applyChaosStyles();
        }
    }, 100);
}

function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    paginationContainer.style.display = 'flex';

    const symbols = ['◉', '◈', '◇', '◎', '◐', '◑', '◒', '◓', '◔', '◕'];
    let paginationHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const symbol = symbols[i % symbols.length];
        paginationHTML += `
        <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
          ${symbol}
        </button>`;
    }
    paginationContainer.innerHTML = paginationHTML;
}

function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderGallery();
    renderPagination();
    document.getElementById('galleryContainer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (Math.random() > 0.7) triggerRandomGlitch();
}

function navigateGallery(direction) {
    const imageViewer = document.getElementById('imageViewer');
    if (!imageViewer.classList.contains('active')) return;

    let nextIndex = direction === 'prev'
        ? (currentImageIndex > 0 ? currentImageIndex - 1 : galleryData.length - 1)
        : (currentImageIndex < galleryData.length - 1 ? currentImageIndex + 1 : 0);

    const nextImage = galleryData[nextIndex];
    if (nextImage) {
        document.getElementById('viewerImage').src = nextImage.image;
        currentImageIndex = nextIndex;
        if (Math.random() > 0.6) triggerImageGlitch();
    }
}

function viewImage(imageSrc) {
    document.getElementById('viewerImage').src = imageSrc;
    document.getElementById('imageViewer').classList.add('active');
    document.querySelector('.gallery-nav').classList.add('active');
    currentImageIndex = galleryData.findIndex(item => item.image === imageSrc);
}

function closeImageViewer() {
    document.getElementById('imageViewer').classList.remove('active');
    document.querySelector('.gallery-nav').classList.remove('active');
}

function initGlitchEffects() {
    setInterval(() => {
        if (Math.random() > 0.95) triggerRandomGlitch();
    }, 8000);

    setInterval(() => {
        const imageViewer = document.getElementById('imageViewer');
        if (imageViewer.classList.contains('active') && Math.random() > 0.9) {
            triggerImageGlitch();
        }
    }, 5000);
}

function initChaosMode() {
    setInterval(() => {
        if (Math.random() > 0.85 && !chaosMode) {
            toggleChaos();
            setTimeout(() => {
                if (chaosMode) toggleChaos();
            }, 4000);
        }
    }, 6000);

    setInterval(() => {
        if (Math.random() > 0.7) randomizeGalleryItems();
    }, 3000);
}

function createGlitchOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'glitch-overlay';
    overlay.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.8) 49%, rgba(255,255,255,0.8) 51%, transparent 52%);
        background-size: 10px 10px;
        animation: glitch-sweep 0.3s linear;
        pointer-events: none;
        z-index: 10;
    `;
    return overlay;
}

function triggerRandomGlitch() {
    const elements = document.querySelectorAll('.artwork-card');
    if (!elements.length) return;
    const el = elements[Math.floor(Math.random() * elements.length)];
    const overlay = createGlitchOverlay();
    el.appendChild(overlay);
    setTimeout(() => {
        if (el.contains(overlay)) el.removeChild(overlay);
    }, 300);
}

function triggerImageGlitch() {
    const img = document.getElementById('viewerImage');
    if (!img) return;
    img.classList.add('image-glitch');
    setTimeout(() => img.classList.remove('image-glitch'), 500);
}

function applyRandomSizes() {
    document.querySelectorAll('.artwork-card').forEach(el => {
        const scale = 0.7 + Math.random() * 0.8;
        const rotate = Math.random() * 15 - 7.5;
        el.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
        el.style.transition = 'all 0.5s ease-out';
    });
}

function randomizeGalleryItems() {
    document.querySelectorAll('.artwork-card').forEach(el => {
        const tx = Math.random() * 100 - 50;
        const ty = Math.random() * 100 - 50;
        const scale = 0.8 + Math.random() * 0.6;
        const rotate = Math.random() * 20 - 10;
        const z = Math.floor(Math.random() * 20);
        el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rotate}deg)`;
        el.style.zIndex = z;
        el.style.transition = 'all 0.8s ease-out';
    });
}

function applyChaosStyles() {
    document.querySelectorAll('.artwork-card').forEach(el => {
        const rRot = Math.random() * 60 - 30;
        const rScale = 0.4 + Math.random() * 1.2;
        const rTX = Math.random() * 120 - 60;
        const rTY = Math.random() * 120 - 60;
        const hue = Math.random() * 360;
        const bright = 0.1 + Math.random() * 0.4;
        const sat = 1.0 + Math.random() * 2.0;
        const cont = 2.0 + Math.random() * 2.0;
        el.style.transform = `rotate(${rRot}deg) scale(${rScale}) translate(${rTX}px, ${rTY}px) skew(${Math.random() * 20 - 10}deg)`;
        el.style.filter = `hue-rotate(${hue}deg) brightness(${bright}) saturate(${sat}) contrast(${cont})`;
        el.style.transition = 'all 0.8s ease-out';
        el.style.boxShadow = `0 0 20px rgba(139,0,0,0.8)`;
        el.style.zIndex = Math.floor(Math.random() * 50);
    });
}

function toggleChaos() {
    chaosMode = !chaosMode;
    if (chaosMode) {
        document.body.classList.add('chaos-mode');
        applyChaosStyles();
    } else {
        document.querySelectorAll('.artwork-card').forEach(el => {
            el.style.transform = '';
            el.style.filter = '';
            el.style.boxShadow = '';
            el.style.transition = 'all 0.5s ease-in';
        });
        document.body.classList.remove('chaos-mode');
        // Optional: 리셋 후 초기 랜덤 사이즈로 복귀
        applyRandomSizes();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeImageViewer();
    const imageViewer = document.getElementById('imageViewer');
    if (imageViewer.classList.contains('active')) {
        if (e.key === 'ArrowLeft') navigateGallery('prev');
        if (e.key === 'ArrowRight') navigateGallery('next');
    }
});

document.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('artwork-card') && Math.random() > 0.95) {
        triggerRandomGlitch();
    }
});
