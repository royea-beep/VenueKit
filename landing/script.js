/* =====================================================
   VenueKit Landing Page — Supabase CRM + Payplus + interactions
===================================================== */

// ── Supabase client (for lead tracking) ──
const VK_SUPABASE_URL = 'https://uiyqswnhrbfctafeihdh.supabase.co';
const VK_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpeXFzd25ocmJmY3RhZmVpaGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTI5OTAsImV4cCI6MjA4ODM4ODk5MH0.w1YYTGyRlt8MVSEYRjv8tqORfP-aYveVry_xxVYaw0w';
let vkDb = null;
try {
  if (window.supabase) {
    vkDb = window.supabase.createClient(VK_SUPABASE_URL, VK_SUPABASE_KEY);
  }
} catch (e) { console.warn('Supabase init failed:', e); }

/**
 * Save a lead to Supabase (fire-and-forget, never blocks WhatsApp flow)
 */
async function saveLead(leadData) {
  if (!vkDb) return;
  try {
    await vkDb.from('vk_leads').insert([leadData]);
  } catch (e) { console.warn('Lead save failed:', e); }
}

/**
 * PAYPLUS PAYMENT LINKS
 * ─────────────────────
 * After running `node create-payplus-links.js` with real API keys,
 * paste the generated URLs here. When a URL is set, clicking the
 * CTA button redirects to the Payplus checkout page.
 * When empty, falls back to WhatsApp order message.
 *
 * HOW TO ACTIVATE:
 * 1. Get real PAYPLUS_API_KEY + PAYPLUS_SECRET_KEY from Tzach
 * 2. Run: PAYPLUS_API_KEY=xxx PAYPLUS_SECRET_KEY=yyy node create-payplus-links.js
 * 3. Paste the 3 URLs below
 * 4. Deploy landing/
 */
const PAYPLUS_LINKS = {
  Starter: '', // paste Payplus link for ₪2,500
  Pro:     '', // paste Payplus link for ₪3,900
  Full:    '', // paste Payplus link for ₪5,900
};

const WHATSAPP_NUMBER = '972523227765';

// ── Order handler ──
function orderPlan(e) {
  e.preventDefault();
  const btn = e.currentTarget;
  const plan = btn.dataset.plan;
  const price = btn.dataset.price;

  // Save lead to Supabase (fire-and-forget)
  saveLead({ name: 'Order Click', plan, price: '₪' + price, source: 'order_button' });

  // If Payplus link exists for this plan, redirect to payment
  if (PAYPLUS_LINKS[plan]) {
    window.location.href = PAYPLUS_LINKS[plan];
    return;
  }

  // Fallback: WhatsApp order message
  const msg = encodeURIComponent(
    `הזמנת אתר VenueKit\n\n` +
    `חבילה: ${plan}\n` +
    `מחיר: ₪${price}\n\n` +
    `אשמח לפרטים נוספים!`
  );
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
}

// ── Contact form ──
function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const name = data.get('name');
  const phone = data.get('phone');
  const venue = data.get('venue');
  const notes = data.get('notes');

  // Save lead to Supabase (fire-and-forget)
  saveLead({ name, phone, venue_name: venue, notes, source: 'contact_form' });

  // WhatsApp notification
  const msg = encodeURIComponent(
    `פנייה מאתר VenueKit\n\n` +
    `שם: ${name}\n` +
    `טלפון: ${phone}\n` +
    `מועדון: ${venue}\n` +
    `${notes ? `הערות: ${notes}\n` : ''}`
  );

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');

  form.innerHTML = `
    <div style="text-align:center;padding:40px">
      <div style="font-size:48px;margin-bottom:16px">&#10003;</div>
      <h3 style="margin-bottom:8px">ההודעה נשלחה!</h3>
      <p style="color:#94a3b8">נחזור אליכם בהקדם</p>
    </div>
  `;
}

// ── Payment result handling ──
// Payplus redirects back with ?payment=success or ?payment=failed
(function handlePaymentResult() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('payment');
  if (!status) return;

  // Clean URL without reloading
  window.history.replaceState({}, '', window.location.pathname);

  const overlay = document.createElement('div');
  overlay.className = 'vk-payment-overlay';

  if (status === 'success') {
    overlay.innerHTML = `
      <div class="vk-payment-modal">
        <div class="vk-payment-icon vk-payment-success">✓</div>
        <h2>התשלום התקבל בהצלחה!</h2>
        <p>תודה על ההזמנה. ניצור איתך קשר תוך 24 שעות להתחלת העבודה.</p>
        <button class="vk-btn vk-btn-primary" onclick="this.closest('.vk-payment-overlay').remove()">סגור</button>
      </div>
    `;
  } else {
    overlay.innerHTML = `
      <div class="vk-payment-modal">
        <div class="vk-payment-icon vk-payment-failed">✕</div>
        <h2>התשלום לא הושלם</h2>
        <p>משהו השתבש. אפשר לנסות שוב או ליצור קשר ישירות.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <a href="#pricing" class="vk-btn vk-btn-primary" onclick="this.closest('.vk-payment-overlay').remove()">נסה שוב</a>
          <a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" class="vk-btn vk-btn-ghost">WhatsApp</a>
        </div>
      </div>
    `;
  }

  document.body.appendChild(overlay);
})();

// ── Smooth scroll for anchor links ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    if (a.classList.contains('vk-order-btn')) return; // handled by orderPlan
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ── Animate on scroll ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('vk-visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.vk-feature-card, .vk-faq-item, .vk-tier-card, .vk-step, .vk-testimonial-card').forEach(el => {
  observer.observe(el);
});
