const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// mobile menu
const burger = $('#burger');
const menu = $('#menu');
const setMenu = open => {
  menu.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
  document.body.classList.toggle('menu-open', open);
};
burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
$$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// header shadow / shrink after scrolling
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 30);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// scroll reveal (staggered within each row of cards)
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: .12 });
$$('.reveal').forEach(el => {
  const i = [...el.parentElement.children].filter(c => c.classList.contains('reveal')).indexOf(el);
  el.style.transitionDelay = Math.min(i, 5) * 80 + 'ms';
  io.observe(el);
});

// highlight the menu link of the section in view
const links = $$('a[href^="#"]', menu);
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => spy.observe(s));

$('#yr').textContent = new Date().getFullYear();

// package "Enquire" buttons preselect the form option
const pkg = $('#pkg');
$$('[data-pkg]').forEach(b => b.addEventListener('click', () => {
  [...pkg.options].forEach(o => { if (o.text === b.dataset.pkg) pkg.value = o.value; });
}));

// contact form -> WhatsApp
const WHATSAPP_NUMBER = '9779801604389';
const waLink = text => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const text = `Hello Mithila Tourism,\nName: ${f.get('name')}\nPhone: ${f.get('phone')}\nInterested in: ${f.get('pkg')}\nMessage: ${f.get('msg') || '-'}`;
  window.open(waLink(text), '_blank', 'noopener');
});

// fare finder (source is always Janakpur). Prices are read from the list in index.html.
const ALL = $$('.pl li[data-to]').map(li => [li.dataset.to, +li.dataset.price]);
const ALIAS = { muzaffarpur: 'muzzaparpur', muzzafarpur: 'muzzaparpur', chandranighapur: 'chanranighapur',
                chandranigahapur: 'chanranighapur', ktm: 'kathmandu', jaynagar: 'jayanagar', birganj: 'birgunj' };
const fmt = n => 'Rs. ' + n.toLocaleString('en-IN');
const norm = s => s.toLowerCase().replace(/^\s*janakpur(dham)?\s*(to|-|>)?\s*/, '').replace(/[^a-z]/g, '');
$('#pf-list').innerHTML = ALL.map(([n]) => `<option value="${n}">`).join('');

const pfTo = $('#pf-to');
const pfOut = $('#pf-result');
const countUp = (el, to) => {
  if (reduceMotion) { el.textContent = fmt(to); return; }
  let t0;
  const step = t => {
    t0 ??= t;
    const p = Math.min((t - t0) / 600, 1);
    el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
const showFare = q => {
  const k = norm(q);
  if (!k) { pfOut.innerHTML = ''; return; }
  const key = ALIAS[k] || k;
  const hit = ALL.find(([n]) => n.toLowerCase() === key) || ALL.find(([n]) => n.toLowerCase().startsWith(key));
  $$('.pl li.hit').forEach(li => li.classList.remove('hit'));
  if (hit) {
    const msg = `Hello Mithila Tourism, I want to book a Scorpio from Janakpur to ${hit[0]} (${fmt(hit[1])}).`;
    pfOut.innerHTML = `<div class="price"><div><small>Janakpur &rarr; ${hit[0]}</small>Scorpio, one way</div><b>${fmt(hit[1])}</b><a class="btn btn-gold btn-sm" href="${waLink(msg)}" target="_blank" rel="noopener">Book on WhatsApp</a></div>`;
    countUp($('b', pfOut), hit[1]);
    const row = $(`.pl li[data-to="${hit[0]}"]`);
    if (row) row.classList.add('hit');
  } else {
    pfOut.innerHTML = `<div class="none">No fixed fare listed for that destination. <a href="tel:+9779803096480">Call 9803096480</a> for a quote, or pick one:<div class="sugg">${ALL.map(([n]) => `<button type="button" data-to="${n}">${n}</button>`).join('')}</div></div>`;
  }
};
$('#pf').addEventListener('submit', e => { e.preventDefault(); showFare(pfTo.value); });
pfTo.addEventListener('change', () => showFare(pfTo.value));
// any [data-to] button or link (quick picks, suggestions, footer routes) fills the search
document.addEventListener('click', e => {
  const b = e.target.closest('button[data-to], a[data-to]');
  if (b) { pfTo.value = b.dataset.to; showFare(b.dataset.to); }
});
