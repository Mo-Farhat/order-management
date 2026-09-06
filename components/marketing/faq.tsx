"use client";

import { useState } from "react";
import { APP_NAME } from "@/lib/constants";

const ITEMS: [string, string][] = [
  [
    "How quickly can I set up?",
    `Minutes. Add a few products, connect your WhatsApp number or Instagram handle, and share your storefront link. ${APP_NAME} walks you through it the first time you log in.`,
  ],
  [
    "Do my customers need an app or account?",
    "No. They open your link in any browser, pick what they want, enter their details, and tap send. The order arrives in your desk as Pending for you to accept.",
  ],
  [
    "Does it work with Instagram as well as WhatsApp?",
    "Yes. Add either or both. WhatsApp opens with the order pre-filled; Instagram copies the order to the clipboard and opens your DMs so the customer can paste it.",
  ],
  [
    "What happens after the free trial?",
    "You get 14 days free with no card. After that it's LKR 1,500/month to keep going. Your data stays put if you pause.",
  ],
  [
    "Can I get a real website later?",
    `Yes — and ${APP_NAME} storefront owners get 20% off the build. Your products, photos and branding move over, so you're not starting from scratch.`,
  ],
  [
    "Is my data safe?",
    "Each shop's data is isolated at the database level. Daily encrypted backups. You can export your customers and orders to CSV any time.",
  ],
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col divide-y divide-line rounded-2xl border border-line bg-card">
      {ITEMS.map(([q, a], i) => (
        <div key={q}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            aria-expanded={open === i}
          >
            <span className="text-sm font-medium">{q}</span>
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line text-muted">
              {open === i ? "–" : "+"}
            </span>
          </button>
          {open === i && <p className="px-5 pb-5 text-sm text-muted">{a}</p>}
        </div>
      ))}
    </div>
  );
}
