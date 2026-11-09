module.exports = (patch, replace) => {
  patch('src/content/style-payload', part => replace(part,
    '.xydy-comments-force-hidden #videoSideCard:is(',
    '.xydy-comments-force-hidden:not([data-xydy-jingxuan=\\"player\\"]) #videoSideCard:is('));

  patch('src/content/modules/comments-dock', part => {
    part = replace(part, '      let state = { pinned: false, width: 320, floating: null };', `      const jingxuanKey = 'jx-ui-comments-dock';
      function readState(key) {
        try {
          const saved = JSON.parse(localStorage.getItem(key) || 'null');
          if (saved) return { pinned: saved.pinned === true, width: Number(saved.width) || 320, floating: saved.floating || null };
        } catch (error) {}
        return { pinned: false, width: 320, floating: null };
      }
      const states = { [storageKey]: readState(storageKey), [jingxuanKey]: readState(jingxuanKey) };
      let activeKey = storageKey;
      let state = states[activeKey];
      const keyFor = card => card?.closest('#dy-modal-video-container-waterFall') && app.utils.jingxuanMode() === 'player'
        ? jingxuanKey : storageKey;`);
    part = replace(part, `      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (saved) state = { pinned: saved.pinned === true, width: Number(saved.width) || 320, floating: saved.floating || null };
      } catch (error) {}

`, '');
    part = replace(part, 'localStorage.setItem(storageKey, JSON.stringify(state))', 'localStorage.setItem(activeKey, JSON.stringify(state))');
    part = replace(part, '      function applyGeometry(sideCard) {', `      function applyGeometry(sideCard) {
        const state = states[keyFor(sideCard)];`);
    part = replace(part, "document.documentElement.classList.contains('xydy-comments-force-hidden')",
      "(activeKey !== jingxuanKey && document.documentElement.classList.contains('xydy-comments-force-hidden'))");
    part = replace(part, '          restoreFloating(panel);\n          panel.querySelectorAll', `          if (activeKey !== jingxuanKey) restoreFloating(panel);
          else delete panel.dataset.xydyCommentsDock;
          panel.querySelectorAll`);
    part = replace(part, '        panel = host = player = button = resizeHandle = null;', `        if (activeKey === jingxuanKey && player) {
          delete player.dataset.xydyCommentsTransition;
          transitionedPlayers.delete(player);
        }
        panel = host = player = button = resizeHandle = null;`);
    part = replace(part, '        const current = document.querySelector(panelSelector);', `        const jingxuanMode = app.utils.jingxuanMode();
        const current = jingxuanMode
          ? (jingxuanMode === 'player' && enabled() ? app.utils.jingxuanCommentCard() : null)
          : document.querySelector(panelSelector);`);
    part = replace(part, '          panel = current;', `          activeKey = keyFor(current);
          state = states[activeKey];
          panel = current;`);
    part = replace(part, 'window.XYDYCommentsPanel.restoreGeometry(state.floating);', 'window.XYDYCommentsPanel.restoreGeometry(state.floating, sideCard);');
    part = replace(part, '      const api = { applyGeometry, isPinned: () => state.pinned };', '      const api = { applyGeometry, isPinned: () => state.pinned, refresh: schedule };');
    return replace(part, '          panelObserver = new MutationObserver(schedule);', `          panelObserver = new MutationObserver(() => {
            if (activeKey !== jingxuanKey || !window.xydyIsInteractingWithComments || state.pinned) schedule();
          });`);
  });

  patch('src/content/modules/comments-interactive', part => {
    part = replace(part, '      let activeSideCard = null;', `      let activeSideCard = null;
      let mountedJingxuanCard = null;
      let nativeGeometry;
      let cancelJingxuanDrag;
      let jingxuanStyles;
      const jingxuanKey = 'jx-ui-comments-floating';
      const isJingxuanCard = card => Boolean(card && card === mountedJingxuanCard);
      const geometryProperties = ['left', 'right', 'top', 'bottom', 'width', 'height'];
      try { jingxuanStyles = JSON.parse(localStorage.getItem(jingxuanKey) || 'null'); } catch (error) {}

      function saveGeometry(styles, card) {
        const jingxuan = isJingxuanCard(card);
        if (jingxuan) jingxuanStyles = styles;
        else lastStyles = styles;
        try { localStorage.setItem(jingxuan ? jingxuanKey : 'comments_panel_styles', JSON.stringify(styles)); } catch (error) {}
      }

      function syncJingxuanComments() {
        const card = utils.jingxuanMode() === 'player' && canRun() ? utils.jingxuanCommentCard() : null;
        if (card === mountedJingxuanCard) {
          if (card && !card.querySelector(':scope > .xydy-drag-handle')) {
            cancelJingxuanDrag?.();
            injectInteractiveHandles(card);
            app.commentsDock?.refresh();
          }
          return;
        }
        if (mountedJingxuanCard) {
          cancelJingxuanDrag?.();
          delete mountedJingxuanCard.dataset.xydyCommentsState;
          delete mountedJingxuanCard.dataset.xydyCommentsMounted;
          delete mountedJingxuanCard.dataset.xydyCommentsDock;
          for (const [property, value, priority] of nativeGeometry) {
            mountedJingxuanCard.style.setProperty(property, value, priority);
          }
          mountedJingxuanCard.querySelectorAll(':scope > :is(.xydy-drag-handle, .xydy-resize-handle)').forEach(handle => handle.remove());
        }
        mountedJingxuanCard = card;
        if (card) {
          nativeGeometry = geometryProperties.map(property => [property, card.style.getPropertyValue(property), card.style.getPropertyPriority(property)]);
          injectInteractiveHandles(card);
        }
        app.commentsDock?.refresh();
      }`);
    part = replace(part, '        // Force state to loading', `        if (isJingxuanCard(sideCard)) {
          sideCard.dataset.xydyCommentsState = "ready";
          sideCard.dataset.xydyCommentsMounted = "true";
        } else {
        // Force state to loading`);
    part = replace(part, '        // 修复滚轮滚动', `        }
        applyPanelGeometry(sideCard);

        // 修复滚轮滚动`);
    part = replace(part, '        applyPanelGeometry(sideCard);\n\n        if (isJingxuanCard', '        if (isJingxuanCard');
    part = replace(part, '        applyPanelGeometry(sideCard);\n\n        }\n        applyPanelGeometry(sideCard);', '        }\n        applyPanelGeometry(sideCard);');
    part = replace(part, "sideCard.addEventListener('wheel', function (e) {", `sideCard.addEventListener('wheel', function (e) {
            if (utils.jingxuanMode() === 'player' && sideCard !== mountedJingxuanCard) return;`);
    part = replace(part, '        // 1. Inject Drag Handle', `        const SIDEBAR_WIDTH = isJingxuanCard(sideCard) ? 0 : 160;
        const HEADER_HEIGHT = isJingxuanCard(sideCard) ? 24 : 56;

        // 1. Inject Drag Handle`);
    for (const handle of ['dragHandle', 'handle']) {
      part = replace(part, `${handle}.setPointerCapture(e.pointerId);`, `${handle}.setPointerCapture(e.pointerId);
            if (isJingxuanCard(sideCard)) sideCard.setAttribute('data-xydy-jingxuan-dragging', '');`);
      part = replace(part, `${handle}.releasePointerCapture(upEvent.pointerId);`, `${handle}.removeEventListener('lostpointercapture', onPointerUp);
              if (${handle}.hasPointerCapture(e.pointerId)) ${handle}.releasePointerCapture(e.pointerId);
              if (cancelJingxuanDrag === onPointerUp) cancelJingxuanDrag = undefined;
              sideCard.removeAttribute('data-xydy-jingxuan-dragging');`);
      part = replace(part, `${handle}.addEventListener('pointerup', onPointerUp);`, `${handle}.addEventListener('pointerup', onPointerUp);
            ${handle}.addEventListener('lostpointercapture', onPointerUp);
            if (isJingxuanCard(sideCard)) cancelJingxuanDrag = onPointerUp;`);
    }
    part = part.replaceAll('function onPointerUp(upEvent)', 'function onPointerUp()');
    part = part.replace(/lastStyles = (\{\s+left: sideCard.style.left,[\s\S]*?\});\n\s+localStorage.setItem\('comments_panel_styles', JSON.stringify\(lastStyles\)\);/g, 'saveGeometry($1, sideCard);');
    part = replace(part, '      function applyPanelGeometry(sideCard) {', `      function applyPanelGeometry(sideCard) {
        const jingxuan = isJingxuanCard(sideCard);
        const styles = jingxuan ? jingxuanStyles : lastStyles;
        const SIDEBAR_WIDTH = jingxuan ? 0 : 160;
        const HEADER_HEIGHT = jingxuan ? 24 : 56;`);
    part = part.replaceAll('parseFloat(lastStyles && lastStyles.', 'parseFloat(styles && styles.');
    part = part.replaceAll("          if (!canRun() || window.xydyIsInteractingWithComments) return;", "          if (!canRun() || utils.jingxuanMode() === 'player' || window.xydyIsInteractingWithComments) return;");
    part = replace(part, '        if (canRun()) applyPanelGeometry(document.getElementById(\'videoSideCard\'));',
      '        if (canRun() && utils.jingxuanMode() !== "player") applyPanelGeometry(document.getElementById(\'videoSideCard\'));');
    part = replace(part, '          if (!canRun()) return;', '          if (!canRun() || utils.jingxuanMode() === "player") return;');
    part = replace(part, '      function togglePanelFromShortcut() {', `      function togglePanelFromShortcut() {
        if (utils.jingxuanMode() === 'player') {
          utils.tapSyntheticKey('x');
          return true;
        }`);
    part = replace(part, '        closeListenerBound = true;', `        closeListenerBound = true;

        document.addEventListener('click', event => {
          if (event.defaultPrevented || utils.jingxuanMode() !== 'player' || !canRun() || event.button !== 0 ||
              !(event.target instanceof Element)) return;
          const avatar = event.target.closest(app.constants.SELECTORS.authorAvatar.join(','));
          const slide = avatar?.closest(utils.jingxuanVideo);
          if (!slide) return;

          event.preventDefault();
          event.stopPropagation();
          const authorTab = slide.querySelector('#videoSideCard:not(.QwkWPUUt, [hidden]) #semiTabauthor_card');
          if (!authorTab) utils.tapSyntheticKey('f');
          else if (authorTab.getAttribute('aria-selected') !== 'true') authorTab.click();
        }, true);`);
    part = replace(part, 'if (!canRun() || !(event.target instanceof Element)) return;',
      'if (!canRun() || utils.jingxuanMode() === "player" || !(event.target instanceof Element)) return;');
    part = replace(part, "          if (!sideCard || !sideCard.contains(event.target)) return;",
      "          if (utils.jingxuanMode() === 'player' || !sideCard || !sideCard.contains(event.target)) return;");
    part = replace(part, 'if (!canRun() || !event.isTrusted', 'if (!canRun() || utils.jingxuanMode() === "player" || !event.isTrusted');
    part = replace(part, `          restoreGeometry: function restoreGeometry(styles) {
            lastStyles = styles;
            localStorage.setItem('comments_panel_styles', JSON.stringify(lastStyles));
            applyPanelGeometry(document.getElementById('videoSideCard'));
          },`, `          restoreGeometry: function restoreGeometry(styles, card = document.getElementById('videoSideCard')) {
            saveGeometry(styles, card);
            applyPanelGeometry(card);
          },`);
    part = replace(part, "            applyPanelGeometry(document.getElementById('videoSideCard'));\n          }, { passive: true });",
      "            applyPanelGeometry(utils.jingxuanMode() ? mountedJingxuanCard : document.getElementById('videoSideCard'));\n          }, { passive: true });");
    return replace(part, '          setupScanner();\n        },\n        destroy: function destroy()', `          setupScanner();
          new MutationObserver(records => {
            if (utils.jingxuanMode() !== 'player') return;
            if (records.some(record => record.type === 'childList' || record.attributeName === 'data-e2e' ||
                record.target.id === 'videoSideCard')) syncJingxuanComments();
          }).observe(document.documentElement, {
            childList: true, subtree: true, attributeFilter: ['class', 'hidden', 'data-e2e']
          });
          syncJingxuanComments();
        },
        onSettingsChange: syncJingxuanComments,
        destroy: function destroy()`);
  });
};
