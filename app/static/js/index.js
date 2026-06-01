
const carousel = document.getElementById('carousel');
const dotsContainer = document.getElementById('dots');

let visibleCount = () => window.innerWidth <= 480 ? 1 : window.innerWidth <= 800 ? 2 : 4;
let currentIndex = 0;

const cards = Array.from(carousel.children);
const totalPages = () => Math.ceil(cards.length / visibleCount());



function buildDots() {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalPages(); i++) {
        const d = document.createElement('div');
        d.className = 'dot' + (i === 0 ? ' active' : '');
        d.onclick = () => goTo(i);
        dotsContainer.appendChild(d);
    }
}

function updateDots() {
    document.querySelectorAll('.dot').forEach((d, i) => {
        d.classList.toggle('active', i === currentIndex);
    });
}

function goTo(page) {
    currentIndex = Math.max(0, Math.min(page, totalPages() - 1));
    const cardWidth = cards[0].offsetWidth + 20;
    carousel.style.transform = `translateX(-${currentIndex * visibleCount() * cardWidth}px)`;
    carousel.style.transition = 'transform 0.4s ease';
    updateDots();
}

function slide(dir) {
    goTo(currentIndex + dir);
}

// Init
carousel.style.display = 'flex';
buildDots();

window.addEventListener('resize', () => {
    buildDots();
    goTo(0);
});