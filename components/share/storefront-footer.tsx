import type { StorefrontChrome } from "@/lib/share";
import { APP_NAME } from "@/lib/constants";
import { toWhatsAppNumber } from "@/lib/phone";

/**
 * Storefront footer: direct contact links, the shop's policy note, and the
 * "powered by" line (hidden only for Pro shops that switched it off).
 */
export function StorefrontFooter({ chrome }: { chrome: StorefrontChrome }) {
  const wa = toWhatsAppNumber(chrome.whatsappNumber);
  const showPolicy =
    chrome.config.sections.policyNote !== false && Boolean(chrome.sharePolicyText);

  return (
    <footer className="mt-12 border-t border-line bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
        <div className="sf-eyebrow flex flex-wrap gap-x-5 gap-y-1.5">
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--sf-accent)] hover:opacity-70"
            >
              WhatsApp
            </a>
          )}
          {chrome.instagramHandle && (
            <a
              href={`https://ig.me/m/${chrome.instagramHandle}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--sf-accent)] hover:opacity-70"
            >
              Instagram
            </a>
          )}
        </div>

        {showPolicy && (
          <p className="max-w-prose whitespace-pre-line text-xs leading-relaxed text-muted">
            {chrome.sharePolicyText}
          </p>
        )}

        {chrome.showPoweredBy && (
          <p className="sf-eyebrow text-muted">
            Powered by {APP_NAME}
          </p>
        )}
      </div>
    </footer>
  );
}
