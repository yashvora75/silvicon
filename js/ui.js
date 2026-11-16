/* SILVICON — UI behaviour: header, mobile nav, service dialog, form validation.
   Deliberately free of animation code so it works with or without motion. */

const header = document.querySelector('.header');
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.nav');

/* header + scroll progress */
const progressBar = document.querySelector('.scroll-progress');
const onScroll = () => {
  header.classList.toggle('scrolled', scrollY > 24);
  const max = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
};
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* mobile nav */
const setMenu = open => {
  nav.classList.toggle('open', open);
  header.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
menuButton.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuButton.focus(); }
});
matchMedia('(min-width:981px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

document.getElementById('year').textContent = new Date().getFullYear();
if (window.lucide) window.lucide.createIcons();

/* service dialog */
const serviceInfo = {
  planning: { title: 'Financial Planning', copy: 'A structured conversation about your financial priorities can help turn broad ambitions into considered next steps.', points: ['Clarify personal financial goals and time horizons', 'Explore approaches to wealth creation and risk management', 'Review priorities as circumstances change'] },
  loans: { title: 'Business Loans', copy: 'Explore financing options in the context of your business needs, timing and growth plans.', points: ['Understand working capital or expansion requirements', 'Consider available financing structures', 'Prepare for the next stage of a funding discussion'] },
  equity: { title: 'Private Equity', copy: 'Strategic support for businesses considering investment to pursue a new stage of growth.', points: ['Assess growth capital objectives', 'Consider strategic investment possibilities', 'Prepare for conversations around scaling'] },
  ipo: { title: 'IPO Fundraising', copy: 'Guidance through the planning and fundraising considerations that can accompany a potential listing journey.', points: ['Discuss pre-IPO priorities', 'Map key fundraising preparation stages', 'Coordinate next steps with relevant specialists'] }
};
const dialog = document.getElementById('service-dialog');
let dialogTrigger = null;
document.querySelectorAll('.service-open').forEach(button => button.addEventListener('click', () => {
  const info = serviceInfo[button.dataset.service];
  dialogTrigger = button;
  document.getElementById('dialog-title').textContent = info.title;
  document.getElementById('dialog-copy').textContent = info.copy;
  document.getElementById('dialog-points').replaceChildren(...info.points.map(text => {
    const li = document.createElement('li'); li.textContent = text; return li;
  }));
  dialog.showModal();
  window.silviconLenis?.stop();
  dialog.querySelector('.dialog-close').focus();
}));
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => { window.silviconLenis?.start(); dialogTrigger?.focus(); });
document.getElementById('dialog-contact').addEventListener('click', () => dialog.close());

/* contact form (demo only: validates locally, sends nothing) */
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
const fields = [
  { id: 'full-name', error: 'name-error', check: v => v.length >= 2, message: 'Please enter your full name.' },
  { id: 'email', error: 'email-error', check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: 'Please enter a valid email address.' },
  { id: 'phone', error: 'phone-error', check: v => !v || /^[+\d\s().-]{7,20}$/.test(v), message: 'Please enter a valid phone number or leave this blank.' },
  { id: 'interest', error: 'interest-error', check: v => v.length > 0, message: 'Please select a service.' },
  { id: 'message', error: 'message-error', check: v => v.length >= 10, message: 'Please add at least 10 characters.' }
];
function validateField(field) {
  const input = document.getElementById(field.id);
  const valid = field.check(input.value.trim());
  document.getElementById(field.error).textContent = valid ? '' : field.message;
  input.setAttribute('aria-invalid', String(!valid));
  input.setAttribute('aria-describedby', field.error);
  return valid;
}
fields.forEach(field => {
  const input = document.getElementById(field.id);
  input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validateField(field); });
  input.addEventListener('blur', () => { if (input.value.trim()) validateField(field); });
});
form.addEventListener('submit', e => {
  e.preventDefault();
  const results = fields.map(validateField);
  if (results.includes(false)) {
    status.textContent = 'Please correct the highlighted fields. Nothing has been sent.';
    status.className = 'form-status failure';
    document.getElementById(fields[results.indexOf(false)].id).focus();
    return;
  }
  status.textContent = 'Demo inquiry validated. No information was sent or stored. Connect a form service to enable real inquiries.';
  status.className = 'form-status success';
  form.reset();
  fields.forEach(f => { const i = document.getElementById(f.id); i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); });
});
