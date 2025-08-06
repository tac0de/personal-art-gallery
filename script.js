document.addEventListener('DOMContentLoaded', function () {
    let allGalleryData = [];
    let currentMemeIndex = 0;
    const memesPerLoad = 1;

    // Fetch gallery data
    fetch('gallery.json')
        .then(response => response.json())
        .then(data => {
            allGalleryData = data.filter(item => item.image.startsWith('assets/abstract_'));
            renderMemeGrid();
            setupInfiniteScroll();
            setupChaosZone();
        })
        .catch(error => console.error('Error loading gallery data:', error));



    // Render meme grid
    function renderMemeGrid() {
        const memeGrid = document.getElementById('meme-grid');
        const memeItems = allGalleryData.slice(currentMemeIndex, currentMemeIndex + memesPerLoad);

        memeItems.forEach(item => {
            const memeCard = document.createElement('div');
            memeCard.className = 'meme-card';
            memeCard.innerHTML = `
                <img src="${item.image}" alt="Abstract Horror" class="meme-image">
                <h3 class="meme-title">Existential Glitch ${item.id}</h3>
                <p class="meme-caption">When reality fractures and the void stares back ${item.id}</p>
            `;
            memeGrid.appendChild(memeCard);
        });

        currentMemeIndex += memesPerLoad;
    }

    function setupInfiniteScroll() {
        const options = {
            root: null,
            rootMargin: '0px 0px 200px 0px', // Load more content when within 200px of the bottom
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && currentMemeIndex < allGalleryData.length) {
                    renderMemeGrid();

                    // If we've loaded all images, disconnect the observer
                    if (currentMemeIndex >= allGalleryData.length) {
                        observer.disconnect();
                    }
                }
            });
        }, options);

        // Observe the last meme card
        function observeLastMeme() {
            const memeCards = document.querySelectorAll('.meme-card');
            if (memeCards.length > 0) {
                observer.observe(memeCards[memeCards.length - 1]);
            }
        }

        // Initial observation
        observeLastMeme();

        // Re-observe after each render
        const memeGrid = document.getElementById('meme-grid');
        const mutationObserver = new MutationObserver(observeLastMeme);
        mutationObserver.observe(memeGrid, { childList: true });
    }

    // Setup chaos zone
    function setupChaosZone() {
        const chaosZone = document.querySelector('.chaos-zone');
        const title = chaosZone.querySelector('.section-title');
        const jumpscareButton = chaosZone.querySelector('.jumpscare-trigger');

        // Glitch effect on title
        setInterval(() => {
            title.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
            title.style.color = Math.random() > 0.5 ? 'var(--blood-red)' : 'var(--white)';
        }, 100);

        // Interactive background
        chaosZone.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            chaosZone.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255, 32, 78, 0.2), var(--deep-black))`;
        });

        jumpscareButton.addEventListener('click', triggerWindowBreak);
    }

    function triggerWindowBreak() {
        const glassOverlay = document.getElementById('glass-overlay');
        const glassBreakSound = document.getElementById('glass-break-sound');

        // Play glass breaking sound
        glassBreakSound.play();

        // Show glass overlay
        glassOverlay.style.opacity = '1';

        // Create glitch overlay
        const glitchOverlay = document.createElement('div');
        glitchOverlay.className = 'glitch-overlay';
        document.body.appendChild(glitchOverlay);

        // Add intense shake effect to the entire body
        document.body.classList.add('extreme-shake');

        // Generate random error messages
        const errorMessages = [
            'CRITICAL_PROCESS_DIED',
            'SYSTEM_SERVICE_EXCEPTION',
            'MEMORY_MANAGEMENT',
            'IRQL_NOT_LESS_OR_EQUAL',
            'PAGE_FAULT_IN_NONPAGED_AREA'
        ];

        // Add error messages to the glitch overlay
        for (let i = 0; i < 20; i++) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = errorMessages[Math.floor(Math.random() * errorMessages.length)];
            errorMessage.style.left = `${Math.random() * 100}%`;
            errorMessage.style.top = `${Math.random() * 100}%`;
            glitchOverlay.appendChild(errorMessage);
        }

        // Trigger glitch effect on the entire page
        document.body.style.animation = 'extreme-glitch 0.2s infinite';

        // After a delay, reload the page
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    }

});
