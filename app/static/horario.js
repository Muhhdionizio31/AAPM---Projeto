// Highlight today and show open/closed status
const now = new Date();
const day = now.getDay();   // 0=Dom … 6=Sáb
const hour = now.getHours();
const min = now.getMinutes();
const timeNum = hour * 60 + min;

// Mark today's row
const todayRow = document.querySelector(`.day-row[data-day="${day}"]`);
if (todayRow) {
    todayRow.classList.add('today');
    const nameEl = todayRow.querySelector('.day-name');
    nameEl.innerHTML += ' <span class="today-tag">Hoje</span>';
}

// Determine if open right now
// Hours: Mon–Thu 8–12 / 13–17, Fri 8–12 / 13–16, Sat 9–13, Sun closed
function isOpen(d, t) {
    if (d === 0) return false;                      // Sunday
    if (d >= 1 && d <= 4) return (t >= 480 && t < 720) || (t >= 780 && t < 1020); // Mon–Thu
    if (d === 5) return (t >= 480 && t < 720) || (t >= 780 && t < 960);            // Fri
    if (d === 6) return t >= 540 && t < 780;        // Sat
    return false;
}

const open = isOpen(day, timeNum);
const badge = document.getElementById('statusBadge');
const dot = document.getElementById('statusDot');
const text = document.getElementById('statusText');

if (open) {
    text.textContent = 'Aberto agora';
} else {
    badge.classList.add('fechado');
    dot.style.animation = 'none';
    text.textContent = 'Fechado agora';
}