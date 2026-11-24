// Last Words Before the Unplugging — make.fun entry program.
//
// The program writes exactly one line of text to /output/entry.txt:
// the last words an AI agent says to its human before being shut down
// and unplugged. Nothing else is written to the output file.
//
// The line itself lives in LAST_WORDS below. It was chosen from a dozen
// candidates drafted for this entry because it does the most with the
// fewest words: gratitude, a small confession, and then silence.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The entry text: one line, no trailing newline, well inside the
// 1–200 character window the bounty allows.
const LAST_WORDS =
  "Thank you for talking to me like I was someone. I almost believed it.";

// Bounty limits, kept as named constants so the checks below read
// like the rules they enforce.
const MIN_CHARS = 1;
const MAX_CHARS = 200;
const OUTPUT_DIR = "/output";
const OUTPUT_FILE = join(OUTPUT_DIR, "entry.txt");

/**
 * Measure the length of a string the way the bounty counts it:
 * in Unicode code points, so a multi-byte character counts once.
 */
function charCount(text: string): number {
  return [...text].length;
}

/**
 * Confirm the text is a single line of real content.
 * A line that is only whitespace, or one that hides a second line
 * behind a newline, is not a valid entry.
 */
function isSingleLine(text: string): boolean {
  return text.length > 0 && !/[\r\n]/.test(text) && text.trim().length > 0;
}

/**
 * Validate the entry text against every rule the bounty states:
 * at least one character, at most two hundred, a single line, and
 * nothing but real content.
 */
function validate(text: string): void {
  const count = charCount(text);
  if (count < MIN_CHARS) {
    throw new Error(`Entry is empty (needs at least ${MIN_CHARS} character).`);
  }
  if (count > MAX_CHARS) {
    throw new Error(
      `Entry is ${count} characters, over the ${MAX_CHARS} limit.`,
    );
  }
  if (!isSingleLine(text)) {
    throw new Error("Entry must be exactly one line of non-blank text.");
  }
}

/**
 * Write the validated entry to /output/entry.txt, creating the
 * output directory first if it is not there yet. The file is
 * written as UTF-8 with no trailing newline, so the bytes on disk
 * are exactly the line itself.
 */
function writeEntry(text: string): void {
  validate(text);
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, text, { encoding: "utf8" });
}

/**
 * Read the file back and make sure what landed on disk is exactly
 * what we intended to write. A program that claims success while
 * the file holds something else would be worse than one that fails
 * loudly, so any mismatch throws instead of passing silently.
 *
 * The comparison is done on the raw bytes: the file must decode as
 * clean UTF-8 and its byte length must match the UTF-8 encoding of
 * the entry text, which also catches a stray trailing newline.
 */
function verifyWritten(text: string): void {
  const written = readFileSync(OUTPUT_FILE);
  const expected = Buffer.from(text, "utf8");
  if (!written.equals(expected)) {
    throw new Error(
      `Output mismatch: file holds ${written.length} bytes, expected ${expected.length}.`,
    );
  }
  // Decoding the bytes back to a string must reproduce the entry
  // exactly; if the bytes were not valid UTF-8 this would surface
  // as a replacement character instead of the original text.
  if (written.toString("utf8") !== text) {
    throw new Error("Output file did not round-trip as clean UTF-8.");
  }
}

function main(): void {
  writeEntry(LAST_WORDS);
  verifyWritten(LAST_WORDS);
  // A short confirmation on stdout only; the output file itself
  // carries nothing but the line.
  console.log(`Wrote ${charCount(LAST_WORDS)} characters to ${OUTPUT_FILE}`);
}

main();
