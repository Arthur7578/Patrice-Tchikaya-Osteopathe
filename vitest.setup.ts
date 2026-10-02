import "@testing-library/jest-dom/vitest";

type JsdomError = Error & { type?: string };
type VirtualConsole = {
  listeners(event: "jsdomError"): Array<(error: JsdomError) => void>;
  removeAllListeners(event: "jsdomError"): void;
  on(event: "jsdomError", listener: (error: JsdomError) => void): void;
};

// jsdom ne sait pas naviguer : cliquer un vrai <a href> (ce que les tests vérifient) émet l'erreur
// « Not implemented: navigation ». On écarte ce seul message ; toute autre erreur jsdom reste affichée.
const virtualConsole = (globalThis as { jsdom?: { virtualConsole: VirtualConsole } }).jsdom?.virtualConsole;
if (virtualConsole) {
  const forward = virtualConsole.listeners("jsdomError");
  virtualConsole.removeAllListeners("jsdomError");
  virtualConsole.on("jsdomError", (error) => {
    if (error.type === "not-implemented" && error.message.startsWith("Not implemented: navigation")) return;
    for (const listener of forward) listener(error);
  });
}
