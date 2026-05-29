// Minimal ANSI styling, no dependencies. Disabled when not a TTY, when NO_COLOR is set, or in
// dumb terminals — honoring https://no-color.org. FORCE_COLOR overrides.
const enabled =
  process.env.NO_COLOR != null || process.env.TERM === "dumb"
    ? false
    : process.env.FORCE_COLOR != null
      ? process.env.FORCE_COLOR !== "0"
      : process.stdout.isTTY === true;

const ESC = String.fromCharCode(27);

function wrap(open: number, close: number) {
  return (text: string): string =>
    enabled ? `${ESC}[${open}m${text}${ESC}[${close}m` : text;
}

export const c = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  cyan: wrap(36, 39),
  yellow: wrap(33, 39),
  magenta: wrap(35, 39),
  underline: wrap(4, 24),
};
