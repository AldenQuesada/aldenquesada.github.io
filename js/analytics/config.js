/* Measurement rules, independent from the page content and carousel. */
window.BIO_ANALYTICS_CONFIG = Object.freeze({
  site: 'bio', release: 'bio-journey-1', sessionMs: 30 * 60 * 1000,
  idleMs: 30000, heartbeatMs: 15000, exposureMs: 1000, queueMax: 120,
  journeyRoutes: Object.freeze({'/test-insomnio/metodo/':'sales','/test-insomnio/':'quiz'}),
  internalKey: 'insonia_interno', optoutKey: 'instituto_analytics_optout'
});
