// popup.js – Manage enable/disable state and original colors toggle

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('enableToggle');
  const statusText = document.getElementById('statusText');
  const originalToggle = document.getElementById('originalToggle');
  const originalText = document.getElementById('originalText');

  // Load saved states (default true for enabled, false for original colors)
  chrome.storage.local.get(['enabled', 'originalColors'], (result) => {
    const enabled = result.enabled !== undefined ? result.enabled : true;
    const useOriginal = result.originalColors !== undefined ? result.originalColors : false;
    toggle.checked = enabled;
    statusText.textContent = enabled ? 'Enabled' : 'Disabled';
    statusText.style.color = enabled ? '#ff8c00' : '#777';

    originalToggle.checked = useOriginal;
    originalText.textContent = useOriginal ? 'Original Colors' : 'Pokémon Theme';
    originalText.style.color = useOriginal ? '#777' : '#ff8c00';
  });

  // Listen for enable/disable changes
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.local.set({ enabled }, () => {
      statusText.textContent = enabled ? 'Enabled' : 'Disabled';
      statusText.style.color = enabled ? '#ff8c00' : '#777';
    });
  });

  // Listen for original colors toggle changes
  originalToggle.addEventListener('change', () => {
    const useOriginal = originalToggle.checked;
    chrome.storage.local.set({ originalColors: useOriginal }, () => {
      originalText.textContent = useOriginal ? 'Original Colors' : 'Pokémon Theme';
      originalText.style.color = useOriginal ? '#777' : '#ff8c00';
    });
  });
});

