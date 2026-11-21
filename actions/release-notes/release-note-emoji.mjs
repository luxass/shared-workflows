const releaseNoteEmoji = new Map([
  ['art', '🎨'],
  ['boom', '💥'],
  ['bug', '🐛'],
  ['fire', '🔥'],
  ['lock', '🔒'],
  ['memo', '📝'],
  ['package', '📦'],
  ['recycle', '♻️'],
  ['rocket', '🚀'],
  ['rotating_light', '🚨'],
  ['sparkles', '✨'],
  ['tada', '🎉'],
  ['test_tube', '🧪'],
  ['white_check_mark', '✅'],
  ['wrench', '🔧'],
  ['zap', '⚡️'],
]);

/** Expands stand-alone shortcodes in commit descriptions without changing the spacing. */
export function expandReleaseNoteEmoji(description) {
  return description.replace(/(?<!\S):([a-z0-9_+-]+):(?=\s|$)/gi, (shortcode, name) => {
    return releaseNoteEmoji.get(name.toLowerCase()) ?? shortcode;
  });
}
