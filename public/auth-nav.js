(function () {
  const token = localStorage.getItem('customerToken');
  if (!token) return;

  const navCta = document.querySelector('.nav-cta');
  if (navCta) {
    navCta.href = '/customer_dashboard.html';
    navCta.textContent = 'My Dashboard';
  }
})();
