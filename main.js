
let galleryData = [];
const itemsPerPage = 8;
let currentPage = 1;
let totalPages = 1;
let chaosMode = false;

async function loadGalleryData() {
    // gallery.json을 현재 페이지 기준으로 상대 참조
    const url = new URL('gallery.json', window.location.href).toString();
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) {
        console.error('gallery.json 불러오기 실패:', res.status, '요청 URL:', url);
        return [];
    }
    return await res.json();
}

// 초기화
async function init() {
    try {
        galleryData = await loadGalleryData();
    } catch (e) {
        console.error('갤러리 로딩 중 예외:', e);
        galleryData = [];
    }

    totalPages = Math.max(1, Math.ceil(galleryData.length / itemsPerPage));
    renderGallery();
    renderPagination();
}

console.log(galleryData);

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

    if (chaosMode) toggleChaos(); // 상태 유지
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
    const gallery = document.getElementById('galleryContainer');
    gallery?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function viewImage(imageSrc) {
    document.getElementById('viewerImage').src = imageSrc;
    document.getElementById('imageViewer').classList.add('active');
}

function closeImageViewer() {
    document.getElementById('imageViewer').classList.remove('active');
}

function randomGlitch() {
    const elements = document.querySelectorAll('.artwork-card, .corrupted-element, .overlap-shape');
    if (elements.length === 0) return;
    const randomElement = elements[Math.floor(Math.random() * elements.length)];

    randomElement.style.animation = 'none';
    setTimeout(() => {
        randomElement.style.animation = '';
    }, 10);

    const glitchOverlay = document.createElement('div');
    glitchOverlay.style.position = 'fixed';
    glitchOverlay.style.top = '0';
    glitchOverlay.style.left = '0';
    glitchOverlay.style.width = '100%';
    glitchOverlay.style.height = '100%';
    glitchOverlay.style.background = `linear-gradient(45deg, transparent 48%, rgba(255,0,0,0.3) 49%, rgba(0,255,255,0.3) 50%, transparent 51%)`;
    glitchOverlay.style.backgroundSize = '20px 20px';
    glitchOverlay.style.zIndex = '1000';
    glitchOverlay.style.pointerEvents = 'none';
    glitchOverlay.style.animation = 'glitch-move 0.5s linear';

    document.body.appendChild(glitchOverlay);
    setTimeout(() => {
        document.body.removeChild(glitchOverlay);
    }, 500);
}

function toggleChaos() {
    chaosMode = !chaosMode;
    const elements = document.querySelectorAll('.artwork-card');
    elements.forEach((el) => {
        if (chaosMode) {
            const randomRotate = Math.random() * 20 - 10;
            const randomScale = 0.8 + Math.random() * 0.4;
            const randomTranslateX = Math.random() * 40 - 20;
            const randomTranslateY = Math.random() * 40 - 20;
            el.style.transform = `rotate(${randomRotate}deg) scale(${randomScale}) translate(${randomTranslateX}px, ${randomTranslateY}px)`;
            el.style.zIndex = Math.floor(Math.random() * 10);
        } else {
            el.style.transform = '';
            el.style.zIndex = '';
        }
    });
}

document.addEventListener('mousemove', (e) => {
    if (Math.random() > 0.98) {
        const x = e.clientX;
        const y = e.clientY;
        const glitch = document.createElement('div');
        glitch.style.position = 'fixed';
        glitch.style.left = x + 'px';
        glitch.style.top = y + 'px';
        glitch.style.width = '10px';
        glitch.style.height = '10px';
        glitch.style.background = Math.random() > 0.5 ? 'red' : 'cyan';
        glitch.style.borderRadius = '50%';
        glitch.style.pointerEvents = 'none';
        glitch.style.zIndex = '1000';
        glitch.style.opacity = '0.7';
        glitch.style.transform = 'translate(-50%, -50%)';

        document.body.appendChild(glitch);

        setTimeout(() => {
            glitch.style.transition = 'all 1s';
            glitch.style.opacity = '0';
            glitch.style.transform = 'translate(-50%, -50%) scale(5)';

            setTimeout(() => {
                document.body.removeChild(glitch);
            }, 1000);
        }, 10);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeImageViewer();
    }
});
