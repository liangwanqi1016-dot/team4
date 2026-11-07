// Each language has its own shareable URL. Internal links retain that language.
const languageSelect = document.getElementById('language');
const basePage = location.pathname.split('/').pop().replace(/^(en|ko|ja)-/, '') || 'index.html';
function localizedUrl(language) {
  const prefix = language === 'zh' ? '' : language + '-';
  return new URL(prefix + basePage + location.search + location.hash, location.href);
}
languageSelect.addEventListener('change', () => {
  try { localStorage.setItem('museum-language', languageSelect.value); } catch {}
  location.assign(localizedUrl(languageSelect.value));
});
if (location.pathname.endsWith('/')) {
  try {
    const saved = localStorage.getItem('museum-language');
    if (['en', 'ko', 'ja'].includes(saved)) location.replace(localizedUrl(saved));
  } catch {}
}
