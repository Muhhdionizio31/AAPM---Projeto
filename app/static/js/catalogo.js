function filter(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cards = document.querySelectorAll('.product-card');
    let visible = 0;
    cards.forEach(card => {
        const show = cat === 'todos' || (card.dataset.cat || '').includes(cat);
        card.style.display = show ? '' : 'none';
        if (show) visible++;
    });
    document.getElementById('emptyState').style.display = visible === 0 ? 'block' : 'none';
}

function searchProducts() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.product-card');
    let visible = 0;
    cards.forEach(card => {
        const show = !q || card.innerText.toLowerCase().includes(q);
        card.style.display = show ? '' : 'none';
        if (show) visible++;
    });
    document.getElementById('emptyState').style.display = visible === 0 ? 'block' : 'none';
}