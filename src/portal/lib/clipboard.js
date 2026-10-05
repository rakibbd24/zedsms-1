// Copy text, resolving to true only if it actually landed on the clipboard.
// navigator.clipboard exists only in secure contexts (https / localhost) — opened
// over a LAN address like http://192.168.x.x it's undefined — so fall back to a
// hidden textarea + execCommand. Call from the tap/click handler itself: Safari
// only allows the fallback during a user gesture.
export async function copyText(value) {
  const text = String(value ?? "");
  if (!text) return false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // permission denied or unfocused document — try the fallback
    }
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  // 16px stops iOS zooming; off-screen-but-rendered so it can be selected
  ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, text.length); // iOS ignores select()
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}
