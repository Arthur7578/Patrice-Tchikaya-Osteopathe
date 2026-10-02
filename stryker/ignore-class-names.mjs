/**
 * « Ignorer » Stryker : pas de mutants dans les classes CSS (attribut JSX `className`, configuration `cva(...)`
 * des variantes de boutons). C'est du style, pas du comportement : les tests ne vérifient pas les classes
 * Tailwind, et ces mutants noieraient les vrais survivants. Le comportement lié à l'affichage reste testé
 * par d'autres attributs (`inert`, `hidden`, `aria-*`) et en e2e.
 * Module sans dépendance : Stryker (installé dans .stryker-bin/) le charge par son chemin.
 */
export const strykerPlugins = [
  {
    kind: "Ignore",
    name: "className",
    value: {
      shouldIgnore(path) {
        const attribute = path.findParent((p) => p.isJSXAttribute());
        if (attribute?.node.name.type === "JSXIdentifier" && attribute.node.name.name === "className") {
          return "Classes CSS (style) : non testées unitairement";
        }
        const call = path.findParent((p) => p.isCallExpression() && p.node.callee.type === "Identifier" && p.node.callee.name === "cva");
        if (call) return "Variantes de style (cva) : non testées unitairement";
        return undefined;
      },
    },
  },
];
