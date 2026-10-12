/**
 * Robust Cross-Platform Clipboard Helper
 * Works across Android WebView (via AndroidBridge), modern mobile browsers (Ridmik/Gboard), and desktop browsers.
 */

export async function readClipboardText(): Promise<string> {
  // 1. If running inside our Android APK, query AndroidBridge (bypasses browser prompt & works 100%)
  if (typeof window !== 'undefined' && (window as any).AndroidBridge?.getClipboardText) {
    try {
      const text = (window as any).AndroidBridge.getClipboardText();
      if (text && typeof text === 'string' && text.trim().length > 0) {
        return text.trim();
      }
    } catch (err) {
      console.warn('AndroidBridge.getClipboardText failed:', err);
    }
  }

  // 2. Standard navigator.clipboard.readText()
  if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
    try {
      const text = await navigator.clipboard.readText();
      if (text && typeof text === 'string') {
        return text.trim();
      }
    } catch (err) {
      console.warn('navigator.clipboard.readText failed or permission denied:', err);
    }
  }

  return '';
}

export async function writeClipboardText(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. AndroidBridge in APK
  if (typeof window !== 'undefined' && (window as any).AndroidBridge?.setClipboardText) {
    try {
      (window as any).AndroidBridge.setClipboardText(text);
      return true;
    } catch (err) {
      console.warn('AndroidBridge.setClipboardText error:', err);
    }
  }

  // 2. Modern navigator.clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed:', err);
    }
  }

  // 3. Fallback execCommand
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.warn('document.execCommand fallback error:', err);
    }
  }

  return false;
}
