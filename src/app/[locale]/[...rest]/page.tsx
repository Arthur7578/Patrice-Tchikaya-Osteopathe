import { notFound } from "next/navigation";

/**
 * Adresse à plusieurs segments inconnue (« /a/b », « /en/a/b ») : 404 avec la page « Page introuvable » de sa langue
 * (app/[locale]/not-found.tsx). Sans cette route, Next répondrait par sa 404 par défaut, en anglais et sans le site.
 */
export default function UnknownPage(): never {
  notFound();
}
