// popup.js – Manage enable/disable state and Pokémon theme / original colors toggle

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('enableToggle');
  const statusText = document.getElementById('statusText');
  const originalToggle = document.getElementById('originalToggle');
  const originalText = document.getElementById('originalText');
  const headerStatus = document.getElementById('headerStatus');
  const previewCard = document.getElementById('previewCard');
  const previewGrid = document.getElementById('previewGrid');
  const previewModeLabel = document.getElementById('previewModeLabel');

  function updateUI(enabled, useOriginal) {
    // 1. Enabled Toggle & Text
    toggle.checked = enabled;
    statusText.textContent = enabled ? 'Enabled' : 'Disabled';
    statusText.className = 'badge ' + (enabled ? 'badge-enabled' : 'badge-disabled');
    statusText.style.color = ''; // clean inline style

    // 2. Header Status Indicator
    if (headerStatus) {
      headerStatus.className = 'header-status ' + (enabled ? 'status-active' : 'status-inactive');
      const label = headerStatus.querySelector('.status-text');
      if (label) label.textContent = enabled ? 'Active' : 'Paused';
    }

    // 3. Pokémon Theme / Original Colors Toggle & Text
    // Toggle ON means Pokémon Theme (!useOriginal); Toggle OFF means Original Colors (useOriginal)
    const isPokemonTheme = !useOriginal;
    originalToggle.checked = isPokemonTheme;
    originalText.textContent = isPokemonTheme ? 'Pokémon Theme' : 'Original Colors';
    originalText.className = 'badge ' + (isPokemonTheme ? 'badge-pokemon' : 'badge-original');
    originalText.style.color = ''; // clean inline style

    // 4. Contribution Preview Strip
    if (previewCard) {
      if (!enabled) {
        previewCard.classList.add('preview-disabled');
      } else {
        previewCard.classList.remove('preview-disabled');
      }
    }

    if (previewGrid) {
      if (useOriginal) {
        previewGrid.classList.add('mode-original');
        previewGrid.classList.remove('mode-pokemon');
      } else {
        previewGrid.classList.add('mode-pokemon');
        previewGrid.classList.remove('mode-original');
      }
    }

    if (previewModeLabel) {
      previewModeLabel.textContent = useOriginal ? 'GitHub Classic' : 'Charizard Evolution';
      previewModeLabel.style.color = useOriginal ? '#A78BFA' : '#14B8A6';
    }
  }

  // Load saved states (default true for enabled, false for original colors)
  chrome.storage.local.get(['enabled', 'originalColors'], (result) => {
    const enabled = result.enabled !== undefined ? result.enabled : true;
    const useOriginal = result.originalColors !== undefined ? result.originalColors : false;
    updateUI(enabled, useOriginal);
  });

  // Listen for enable/disable changes
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.local.set({ enabled }, () => {
      chrome.storage.local.get(['originalColors'], (result) => {
        const useOriginal = result.originalColors !== undefined ? result.originalColors : false;
        updateUI(enabled, useOriginal);
      });
    });
  });

  // Listen for Pokémon theme / original colors toggle changes
  originalToggle.addEventListener('change', () => {
    const isPokemonTheme = originalToggle.checked;
    const useOriginal = !isPokemonTheme;
    chrome.storage.local.set({ originalColors: useOriginal }, () => {
      chrome.storage.local.get(['enabled'], (result) => {
        const enabled = result.enabled !== undefined ? result.enabled : true;
        updateUI(enabled, useOriginal);
      });
    });
  });
});
