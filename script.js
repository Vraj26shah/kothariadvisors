const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');

toggle?.addEventListener('click', () => {
  const expanded = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!expanded));
  nav.classList.toggle('open');
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
}));

document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelector('#enquiry-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector('.form-status');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Sending enquiry...';
  status.textContent = '';
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    if (!response.ok) throw new Error('Submission failed');
    const result = await response.json();
    status.textContent = result.message;
    form.reset();
  } catch (error) {
    status.textContent = 'We could not send your enquiry. Please call +91 99794 34322.';
  } finally {
    button.disabled = false;
    button.textContent = 'Send enquiry';
  }
});
