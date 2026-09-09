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
    <footer className="mt-8 border-t border-line bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--sf-accent)] hover:underline"
            >
              WhatsApp
            </a>
          )}
          {chrome.instagramHandle && (
            <a
              href={`https://ig.me/m/${chrome.instagramHandle}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--sf-accent)] hover:underline"
            >
              Instagram
            </a>
          )}
        </div>

        {showPolicy && (
          <p className="max-w-prose whitespace-pre-line text-xs text-muted">
            {chrome.sharePolicyText}
          </p>
        )}

        {chrome.showPoweredBy && (
          <p className="text-xs text-muted">
            Powered by <span className="font-medium">{APP_NAME}</span>
          </p>
        )}
      </div>
    </footer>
  );
}
