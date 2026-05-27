/**
 * Aplica color de marca y variables derivadas (hover, soft, etc.) en plantillas HTML.
 * Debe mantenerse alineado con front/src/lib/brandColorDerivatives.ts
 */
(function (global) {
  var BRAND_SYNC_VARS = {
    coral: ['coral', 'peach', 'blush'],
    terracotta: ['terracotta', 'terracotta-soft'],
    orange: ['orange', 'orange-2', 'orange-soft'],
    accent: ['accent', 'accent-soft', 'accent-2'],
    champagne: ['champagne', 'champagne-2', 'champagne-soft'],
    gold: ['gold', 'gold-soft', 'gold-line'],
    wine: ['wine', 'wine-2'],
    cyan: ['cyan', 'cyan-soft'],
    lime: ['lime'],
    warm: ['warm', 'warm-soft'],
  };

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length !== 6) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  function mixHex(hex, target, amount) {
    var a = hexToRgb(hex);
    var b = hexToRgb(target);
    if (!a || !b) return hex.toLowerCase();
    var t = Math.min(1, Math.max(0, amount));
    var r = Math.round(a.r + (b.r - a.r) * t);
    var g = Math.round(a.g + (b.g - a.g) * t);
    var bl = Math.round(a.b + (b.b - a.b) * t);
    return (
      '#' +
      [r, g, bl]
        .map(function (n) {
          return n.toString(16).padStart(2, '0');
        })
        .join('')
    );
  }

  function rgbaFromHex(hex, alpha) {
    var rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')';
  }

  function srgbChannel(c) {
    var s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return 0;
    return (
      0.2126 * srgbChannel(rgb.r) +
      0.7152 * srgbChannel(rgb.g) +
      0.0722 * srgbChannel(rgb.b)
    );
  }

  function contrastTextOn(hex) {
    return relativeLuminance(hex) > 0.4 ? '#000000' : '#ffffff';
  }

  function hoverBrandHex(hex) {
    var h = hex.toLowerCase();
    var hover =
      relativeLuminance(h) > 0.45
        ? mixHex(h, '#000000', 0.28)
        : mixHex(h, '#ffffff', 0.22);
    if (hover === h) {
      hover =
        relativeLuminance(h) > 0.45
          ? mixHex(h, '#000000', 0.4)
          : mixHex(h, '#ffffff', 0.35);
    }
    return hover;
  }

  function valueForSyncedVar(name, hex) {
    var h = hex.toLowerCase();
    if (name.indexOf('-soft') === name.length - 5) {
      if (name === 'terracotta-soft') return mixHex(h, '#ffffff', 0.55);
      if (name === 'orange-soft' || name === 'champagne-soft') return mixHex(h, '#ffffff', 0.88);
      return rgbaFromHex(h, 0.16);
    }
    if (name === 'peach') return mixHex(h, '#ffffff', 0.35);
    if (name === 'blush') return mixHex(h, '#ffffff', 0.75);
    if (name.indexOf('-line') === name.length - 5) return rgbaFromHex(h, 0.3);
    if (name.slice(-2) === '-2') {
      return relativeLuminance(h) > 0.45
        ? mixHex(h, '#000000', 0.14)
        : mixHex(h, '#ffffff', 0.18);
    }
    return h;
  }

  function applyBrandColor(varName, hex) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex) || !/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(varName)) return;
    var h = hex.toLowerCase();
    var names = BRAND_SYNC_VARS[varName] || [varName];
    var root = document.documentElement;
    for (var i = 0; i < names.length; i++) {
      root.style.setProperty('--' + names[i], valueForSyncedVar(names[i], h));
    }
    if (names.indexOf(varName) !== -1) {
      root.style.setProperty('--' + varName + '-hover', hoverBrandHex(h));
      root.style.setProperty('--' + varName + '-on', contrastTextOn(h));
    }
  }

  function clearBrandColor(varName) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(varName)) return;
    var names = BRAND_SYNC_VARS[varName] || [varName];
    var root = document.documentElement;
    for (var i = 0; i < names.length; i++) {
      root.style.removeProperty('--' + names[i]);
    }
    root.style.removeProperty('--' + varName + '-hover');
    root.style.removeProperty('--' + varName + '-on');
  }

  global.lwApplyBrandColor = applyBrandColor;
  global.lwClearBrandColor = clearBrandColor;
})(typeof window !== 'undefined' ? window : globalThis);
