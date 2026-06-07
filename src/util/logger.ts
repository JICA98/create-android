const ANSI = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
};

const isColor = process.stdout.isTTY === true && !process.env.NO_COLOR;

function paint(color: keyof typeof ANSI, s: string): string {
  return isColor ? `${ANSI[color]}${s}${ANSI.reset}` : s;
}

export function log(msg: string): void {
  process.stdout.write(`${msg}\n`);
}

export function ok(msg: string): void {
  process.stdout.write(`${paint("green", "✔")} ${msg}\n`);
}

export function err(msg: string): void {
  process.stderr.write(`${paint("red", "✖")} ${msg}\n`);
}

export function warn(msg: string): void {
  process.stderr.write(`${paint("yellow", "!")} ${msg}\n`);
}

export function header(msg: string): void {
  process.stdout.write(`${paint("dim", msg)}\n`);
}
