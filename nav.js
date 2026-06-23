const hamburgerBtn = document.getElementById('hamburgerBtn');
const closeBtn = document.getElementById('closeBtn');
const navOverlay = document.getElementById('navOverlay');
hamburgerBtn.addEventListener('click', () => navOverlay.classList.add('is-open'));
closeBtn.addEventListener('click', () => navOverlay.classList.remove('is-open'));
