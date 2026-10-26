/* Medição do site: GA4 + Meta Pixel + clique no CTA do diagnóstico.
   Os IDs vivem só aqui. Enquanto estiverem como 'PREENCHER', nenhum script
   externo é carregado, mas o dataLayer recebe o evento do clique. */
(function () {
  var GA4_ID = 'PREENCHER';         // PREENCHER: ID do GA4, formato G-XXXXXXXXXX
  var META_PIXEL_ID = 'PREENCHER';  // PREENCHER: ID do Meta Pixel, só dígitos

  function preenchido(id) { return typeof id === 'string' && id !== '' && id !== 'PREENCHER'; }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());

  if (preenchido(GA4_ID)) {
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
    document.head.appendChild(ga);
    window.gtag('config', GA4_ID);
  }

  if (preenchido(META_PIXEL_ID)) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href*="wa.me"]');
    if (!link) return;
    var origem = link.getAttribute('data-local') || 'sem-local';
    window.dataLayer.push({ event: 'cta_diagnostico', origem: origem });
    if (preenchido(GA4_ID)) window.gtag('event', 'cta_diagnostico', { origem: origem });
    if (preenchido(META_PIXEL_ID) && window.fbq) window.fbq('trackCustom', 'cta_diagnostico', { origem: origem });
  });
})();
