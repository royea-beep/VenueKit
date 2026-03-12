/* =====================================================
   VenueKit Landing Page — Order + interactions
===================================================== */

// Order via WhatsApp (replace with LemonSqueezy checkout URLs when ready)
// To switch to LemonSqueezy: replace the window.open line with:
// window.location.href = 'https://ftable.lemonsqueezy.com/checkout/buy/VARIANT_ID';
function orderPlan(e) {
  e.preventDefault();
  const btn = e.currentTarget;
  const plan = btn.dataset.plan;
  const price = btn.dataset.price;

  const msg = encodeURIComponent(
    `הזמנת אתר VenueKit\n\n` +
    `חבילה: ${plan}\n` +
    `מחיר: ₪${price}\n\n` +
    `אשמח לפרטים נוספים!`
  );

  window.open(`https://wa.me/9720523227765?text=${msg}`, '_blank');
}

// Contact form
function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const name = data.get('name');
  const phone = data.get('phone');
  const venue = data.get('venue');
  const notes = data.get('notes');

  const msg = encodeURIComponent(
    `פנייה מאתר VenueKit\n\n` +
    `שם: ${name}\n` +
    `טלפון: ${phone}\n` +
    `מועדון: ${venue}\n` +
    `${notes ? `הערות: ${notes}\n` : ''}`
  );

  window.open(`https://wa.me/9720523227765?text=${msg}`, '_blank');

  form.innerHTML = `
    <div style="text-align:center;padding:40px">
      <div style="font-size:48px;margin-bottom:16px">✓</div>
      <h3 style="margin-bottom:8px">ההודעה נשלחה!</h3>
      <p style="color:#94a3b8">נחזור אליכם בהקדם</p>
    </div>
  `;
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    if (a.classList.contains('vk-order-btn')) return; // handled by orderPlan
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

document.querySelectorAll('.vk-feature-card, .vk-faq-item, .vk-tier-card').forEach(el => {
  observer.observe(el);
});
