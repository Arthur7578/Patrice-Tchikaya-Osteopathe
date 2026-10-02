"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { buttonVariants } from "@/components/ui/button";
import { COPY } from "@/content/ui-copy";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "cookie-consent";
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const isValidGtmId = (id: string | undefined): id is string => !!id && /^GTM-[A-Z0-9]+$/.test(id);

type Consent = "pending" | "accepted" | "refused";

let consentListeners: Array<() => void> = [];
const notifyConsent = () => consentListeners.forEach((listener) => listener());
const subscribeConsent = (callback: () => void) => {
  consentListeners.push(callback);
  window.addEventListener("storage", callback);
  return () => {
    consentListeners = consentListeners.filter((listener) => listener !== callback);
    window.removeEventListener("storage", callback);
  };
};
const getConsentSnapshot = (): Consent => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "accepted" || stored === "refused" ? stored : "pending";
};
const getConsentServerSnapshot = (): Consent => "pending";

const subscribeHash = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};
const getHashSnapshot = () => window.location.hash;
const getHashServerSnapshot = () => "";

const setConsentValue = (value: "accepted" | "refused") => {
  window.localStorage.setItem(STORAGE_KEY, value);
  if (window.location.hash === "#cookies") {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  notifyConsent();
};

/**
 * Bannière de consentement cookies + chargement de Google Tag Manager (uniquement après acceptation).
 * Ne rend rien si `NEXT_PUBLIC_GTM_ID` n'est pas configuré : fonctionnalité désactivée par défaut.
 * Réouverture possible via un lien `#cookies` (voir SiteFooter, « Gérer les cookies »).
 */
export function CookieConsent() {
  const consent = useSyncExternalStore(subscribeConsent, getConsentSnapshot, getConsentServerSnapshot);
  const hash = useSyncExternalStore(subscribeHash, getHashSnapshot, getHashServerSnapshot);

  if (!isValidGtmId(GTM_ID)) return null;

  const bannerOpen = consent === "pending" || hash === "#cookies";

  return (
    <>
      {consent === "accepted" && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      )}
      {bannerOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={COPY.cookies.label}
          className="fixed inset-x-0 bottom-[5rem] z-50 border-t border-sage-700/20 bg-white px-4 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:px-6 md:bottom-0 lg:px-8"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-slate-600">{COPY.cookies.text}</p>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => setConsentValue("refused")}
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
              >
                {COPY.cookies.refuse}
              </button>
              <button
                type="button"
                onClick={() => setConsentValue("accepted")}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                {COPY.cookies.accept}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
