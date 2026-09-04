type GoogleTagCommand = ['js', Date] | ['config', string];

declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: (...command: GoogleTagCommand) => void;
  }
}

export function initializeAnalytics() {
  if (
    !import.meta.env.PROD ||
    window.location.hostname !== 'chiboub.tn' ||
    document.getElementById('google-tag')
  )
    return;

  const measurementId = 'G-R5JHHHYRKE';
  const queue = (window.dataLayer ??= []);
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params -- Google tags consume an Arguments object.
    queue.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  const script = document.createElement('script');
  script.id = 'google-tag';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.append(script);
}
