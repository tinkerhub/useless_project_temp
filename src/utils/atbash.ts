/**
 * Layer 1: Atbash Keyboard Reversal Cipher
 * Maps a-z to z-a and A-Z to Z-A.
 * Preserves numbers, spaces, and punctuation.
 */
export function applyAtbash(input: string): string {
  return input.split('').map(char => {
    const code = char.charCodeAt(0);
    // lowercase a-z
    if (code >= 97 && code <= 122) {
      return String.fromCharCode(219 - code);
    }
    // uppercase A-Z
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(155 - code);
    }
    return char;
  }).join('');
}
