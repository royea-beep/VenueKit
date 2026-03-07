/* =====================================================
   VenueKit Landing Page — Interactive pricing calculator
===================================================== */

const BASE_PRICE = 2500;
const FULL_PACKAGE_PRICE = 5900;

function updateTotal() {
  const checks = document.querySelectorAll('.vk-check');
  let extras = 0;
  const selected = [];

  checks.forEach(cb => {
    if (cb.checked) {
      extras += parseInt(cb.dataset.price, 10);
      const label = cb.closest('.vk-picker-item');
      const name = label.querySelector('strong').textContent;
      selected.push(name);
    }
  });

  const total = BASE_PRICE + extras;
  const totalEl = document.getElementById('total-price');
  const breakdownEl = document.getElementById('total-breakdown');
  const saveEl = document.getElementById('total-save');

  // Animate price change
  totalEl.classList.add('vk-price-flash');
  setTimeout(() => totalEl.classList.remove('vk-price-flash'), 300);

  totalEl.textContent = `₪${total.toLocaleString()}`;

  if (selected.length === 0) {
    breakdownEl.textContent = 'חבילת בסיס';
  } else {
    breakdownEl.textContent = `חבילת בסיס + ${selected.length} פיצ'רים`;
  }

  // Show savings if all selected
  if (selected.length === checks.length) {
    const regularTotal = BASE_PRICE + Array.from(checks).reduce((s, cb) => s + parseInt(cb.dataset.price, 10), 0);
    const savings = regularTotal - FULL_PACKAGE_PRICE;
    totalEl.textContent = `₪${FULL_PACKAGE_PRICE.toLocaleString()}`;
    saveEl.innerHTML = `<span class="vk-save-badge">חיסכון ₪${savings}!</span> במקום ₪${regularTotal.toLocaleString()}`;
  } else {
    saveEl.textContent = '';
  }
}

function selectAll() {
  document.querySelectorAll('.vk-check').forEach(cb => { cb.checked = true; });
  updateTotal();
}

function clearAll() {
  document.querySelectorAll('.vk-check').forEach(cb => { cb.checked = false; });
  updateTotal();
}

// Attach listeners
document.querySelectorAll('.vk-check').forEach(cb => {
  cb.addEventListener('change', updateTotal);
});

// Contact form
function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const name = data.get('name');
  const phone = data.get('phone');
  const venue = data.get('venue');
  const notes = data.get('notes');

  // Build WhatsApp message
  const checks = document.querySelectorAll('.vk-check:checked');
  const features = Array.from(checks).map(cb => cb.closest('.vk-picker-item').querySelector('strong').textContent);
  const total = document.getElementById('total-price').textContent;

  const msg = encodeURIComponent(
    `הזמנת אתר VenueKit\n\n` +
    `שם: ${name}\n` +
    `טלפון: ${phone}\n` +
    `מועדון: ${venue}\n` +
    `${notes ? `הערות: ${notes}\n` : ''}` +
    `\nפיצ'רים: חבילת בסיס${features.length > 0 ? ' + ' + features.join(', ') : ''}\n` +
    `סה"כ: ${total}`
  );

  // Open WhatsApp (replace with your number)
  window.open(`https://wa.me/9720523227765?text=${msg}`, '_blank');

  // Show confirmation
  form.innerHTML = `
    <div style="text-align:center;padding:40px">
      <div style="font-size:48px;margin-bottom:16px">✓</div>
      <h3 style="margin-bottom:8px">ההזמנה נשלחה!</h3>
      <p style="color:#94a3b8">נחזור אליכם בהקדם</p>
    </div>
  `;
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Animate on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('vk-visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.vk-feature-card, .vk-faq-item, .vk-picker-item').forEach(el => {
  observer.observe(el);
});
