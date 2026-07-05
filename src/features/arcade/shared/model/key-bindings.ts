/**
 * Game-agnostic remappable-keys store for the arcade: an action→codes map
 * (`KeyboardEvent.code` values), persisted per game in localStorage. A game
 * defines its own action union + defaults + storage key (see the Tetris
 * `bindings.ts`) and reads the live map in its key handler. Rebinding assigns
 * a SINGLE key to the action and steals that key from any other action.
 */

export type BindingMap<A extends string> = Record<A, readonly string[]>;

/** Stored map merged over `defaults`; corrupt/missing storage → defaults. */
export function loadBindings<A extends string>(
  storageKey: string,
  defaults: BindingMap<A>
): BindingMap<A> {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return defaults;
    const out = { ...defaults };
    for (const action of Object.keys(defaults) as A[]) {
      const v = (parsed as Record<string, unknown>)[action];
      if (Array.isArray(v) && v.every((k) => typeof k === "string")) {
        out[action] = v as string[];
      }
    }
    return out;
  } catch {
    return defaults;
  }
}

export function saveBindings<A extends string>(
  storageKey: string,
  map: BindingMap<A>
) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(map));
  } catch {
    // quota / private mode — the session map still works, it just won't persist
  }
}

/** Assign `code` as THE key of `action`, removing it from every other action.
 *  (An action can end up key-less — the UI renders it as "—".) */
export function rebind<A extends string>(
  map: BindingMap<A>,
  action: A,
  code: string
): BindingMap<A> {
  const out = {} as Record<A, readonly string[]>;
  for (const a of Object.keys(map) as A[]) {
    out[a] = map[a].filter((c) => c !== code);
  }
  out[action] = [code];
  return out;
}

/** Human label for one `KeyboardEvent.code` (hint rows, modal chips). */
const KEY_LABELS: Record<string, string> = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Space: "SPACE",
  Enter: "ENTER",
  ShiftLeft: "SHIFT",
  ShiftRight: "R-SHIFT",
  ControlLeft: "CTRL",
  ControlRight: "R-CTRL",
  AltLeft: "ALT",
  AltRight: "R-ALT",
};

export function keyLabel(code: string): string {
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code.toUpperCase();
}

/** " / "-joined labels of an action's keys; an unbound action reads "—". */
export function bindingLabel(codes: readonly string[]): string {
  return codes.map(keyLabel).join(" / ") || "—";
}
