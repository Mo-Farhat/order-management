/* Coloured brand marks for the "works with how you sell" strip. Simplified
 * glyphs in each platform's brand colour — nominative use ("works with X"). */

export function InstagramLogo({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Instagram" role="img">
      <defs>
        <radialGradient id="ig-g" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-g)" />
      <rect x="6" y="6" width="12" height="12" rx="4" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="17" cy="7" r="1.2" fill="#fff" />
    </svg>
  );
}

export function WhatsAppLogo({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="WhatsApp" role="img">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#25D366" />
      <path
        fill="#fff"
        d="M12 6.2a5.8 5.8 0 0 0-4.98 8.77L6.2 17.8l2.9-.8A5.8 5.8 0 1 0 12 6.2Zm0 1.5a4.3 4.3 0 0 1 3.6 6.66l-.17.26.42 1.5-1.54-.4-.25.15A4.3 4.3 0 1 1 12 7.7Zm-1.9 2.1c-.1 0-.26.04-.4.19-.14.15-.53.52-.53 1.26 0 .75.54 1.47.62 1.57.08.1 1.06 1.7 2.63 2.32 1.3.5 1.57.4 1.85.38.28-.03.9-.37 1.03-.72.13-.36.13-.66.09-.72-.04-.06-.14-.1-.3-.18-.15-.08-.9-.44-1.04-.49-.14-.05-.24-.08-.34.08-.1.15-.39.48-.48.58-.09.1-.18.11-.33.04a4.2 4.2 0 0 1-1.24-.77 4.7 4.7 0 0 1-.86-1.07c-.09-.15 0-.24.07-.31.07-.07.15-.18.22-.27.08-.1.1-.16.15-.26.05-.1.03-.19 0-.27-.04-.08-.34-.82-.46-1.12-.12-.29-.24-.25-.33-.25Z"
      />
    </svg>
  );
}

export function FacebookLogo({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Facebook" role="img">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#1877F2" />
      <path
        fill="#fff"
        d="M13.5 20v-6.3h2.1l.32-2.45H13.5V9.7c0-.7.2-1.2 1.22-1.2h1.3V6.3A17 17 0 0 0 15.33 6c-1.87 0-3.15 1.14-3.15 3.24v1.8H10v2.46h2.18V20Z"
      />
    </svg>
  );
}

export function TikTokLogo({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="TikTok" role="img">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#010101" />
      <path
        fill="#25F4EE"
        d="M15.9 6.5c.5.9 1.3 1.6 2.3 1.9v1a5 5 0 0 1-2.6-.8v4.9a4 4 0 1 1-4-4l.6.04v2.1a1.9 1.9 0 1 0 1.3 1.8V6.5Z"
        transform="translate(-.7 .2)"
      />
      <path
        fill="#FE2C55"
        d="M16.6 6.3c.5.9 1.3 1.6 2.3 1.9v1a5 5 0 0 1-2.6-.8v4.9a4 4 0 1 1-4-4c.2 0 .4 0 .6.03v2.1a1.9 1.9 0 1 0 1.3 1.8V6.3Z"
      />
      <path
        fill="#fff"
        d="M16.25 6.4c.48.86 1.24 1.5 2.15 1.8v.9a4.8 4.8 0 0 1-2.45-.75v4.75a3.8 3.8 0 1 1-3.8-3.8l.55.03v1.95a1.85 1.85 0 1 0 1.3 1.77V6.4Z"
      />
    </svg>
  );
}

export const SOCIALS = [
  { name: "Instagram", Logo: InstagramLogo },
  { name: "WhatsApp", Logo: WhatsAppLogo },
  { name: "Facebook", Logo: FacebookLogo },
  { name: "TikTok", Logo: TikTokLogo },
] as const;
