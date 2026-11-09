const assert = require('node:assert/strict');
const fs = require('node:fs');

// Imports supply the Jingxuan-only base to the independent companion builder.
const isMergedBuild = require.main === module;
const jingxuanModal = '#dy-modal-video-container-waterFall';
const profileSidebarGlass = 'html[data-xydy-profile][data-xydy-sidebar="on"][data-xydy-liquid-glass="on"] :is(#douyin-navigation, [data-e2e="douyin-navigation"]).xydy-liquid-surface,\n' +
  'html[data-xydy-profile][data-xydy-sidebar="on"][data-xydy-liquid-glass="on"] :is(#douyin-navigation, [data-e2e="douyin-navigation"]) .AVblXapA.xydy-liquid-surface';
const adaptedModal = isMergedBuild
  ? ':is(' + jingxuanModal + ', #dy-modal-video-container-search_multi_modal, [data-e2e="modal-video-container"]:has(.searchModal), html[data-xydy-profile] [data-e2e="modal-video-container"])'
  : jingxuanModal;

let source = fs.readFileSync('work/upstream-1.txt', 'utf8').replace(/\r\n/g, '\n');
assert.match(source, /^\/\/ @version +6\.6\.10$/m);
assert.match(source, /^\/\/ @license +MIT$/m);

function replace(text, before, after) {
  assert.ok(text.includes(before), String(before));
  return text.replace(before, () => after);
}

function patch(name, edit) {
  const start = source.indexOf('/* ===== ' + name + '.js ===== */');
  assert.ok(start >= 0, name);
  const next = source.indexOf('/* ===== src/', start + 1);
  const end = next < 0 ? source.length : next;
  source = source.slice(0, start) + edit(source.slice(start, end)) + source.slice(end);
}

source = replace(source, '// @name         xyDouYinTools 抖音沉浸式优化', '// @name         xyDouYinTools 抖音沉浸式优化（含精选）');
source = replace(source, '// @version      6.6.10', '// @version      ' + (isMergedBuild ? '1.0.0' : '6.6.10.2'));
// The official update feed would replace this variant with a build without Jingxuan.
source = source.replace(/^\/\/ @(?:downloadURL|updateURL)\s+[^\n]*\n/gm, '');

patch('src/content/style-payload', part => {
  const match = part.match(/var t=("(?:[^"\\]|\\.)*");function install/);
  assert.ok(match);
  let css = JSON.parse(match[1]);
  if (isMergedBuild) css = css.replaceAll(
    '[data-xydy-navigation="on"][data-xydy-styles="on"] #xydy-header-',
    '[data-xydy-navigation="on"]:is([data-xydy-styles="on"], [data-xydy-nav-glass]) #xydy-header-');
  if (isMergedBuild) {
    const glassRule = 'html[data-xydy-styles="on"][data-xydy-liquid-glass="on"] :is(\n  #xydy-header-actions-background,';
    css = replace(css, glassRule, profileSidebarGlass + ',\n' + glassRule);
  }
  const proximity = css.match(/\/\* Proximity Hover Panels Zen Mode \*\/\n([\s\S]*?)(?=\/\* Video player hover popups:)/)?.[1];
  assert.ok(proximity);
  const base = 'html[data-xydy-proximity="on"]';
  const active = '[data-e2e="feed-active-video"]';
  const slides = adaptedModal + ' :is(.dySwiperSlide, ' + active + ')';
  const adapted = proximity.replaceAll(base, base + '[data-xydy-jingxuan="player"]')
    .replaceAll('.dySwiperSlide', slides)
    .replaceAll(':not(.xydy-proximity-visible)', ':not(' + active + ' :is(.xydy-proximity-visible, :focus-within))')
    .replace(slides + ' .xydy-proximity-visible {', slides + ' .xydy-proximity-visible:is(' + active + ' *) {')
    .replaceAll('0.08s', 'var(--xydy-jingxuan-proximity-duration, .08s)');
  const hidden = adapted.slice(0, adapted.indexOf(' {')).trim();
  const normal = proximity.replaceAll(base, base + ':not([data-xydy-jingxuan="player"])');
  const playerRules = '@media (hover: hover) {\n' + adapted
    + ':is(' + hidden + ') * { pointer-events: none !important; }\n}\n';
  let layout = fs.readFileSync('work/jingxuan-layout.css', 'utf8').replaceAll(jingxuanModal, adaptedModal);
  const caption = ':is(.xgplayer-video-info-wrap, .douyin-player-video-info-wrap, .video-info-detail)';
  if (isMergedBuild) layout = replace(layout,
    `html[data-xydy-jingxuan="player"][data-xydy-styles="on"]
  ${adaptedModal} .modalPlayer.xgplayer
  .player-position-box-bottom > :is(.xgplayer-video-info-wrap, .douyin-player-video-info-wrap)`,
    `html:root[data-xydy-styles="on"]
  :is(.dySwiperSlide, ${adaptedModal} .modalPlayer)
  .player-position-box-bottom ${caption}:not(.player-position-box-bottom ${caption} *)`);
  const merged = replace(css, proximity, normal + playerRules)
    + '\n' + layout
    + (isMergedBuild ? `
html:is([data-xydy-jingxuan="home"], [data-xydy-search-sidebar="on"], :not([data-xydy-styles="on"]))[data-xydy-sidebar="on"].xydy-sidebar-hidden
  :is(#douyin-navigation, [data-e2e="douyin-navigation"]) {
  visibility: hidden !important;
  transition: none !important;
}

html[data-xydy-search-sidebar="on"] :is(#search-body-container, .header-ui:has(#search-toolbar-container)) {
  --navigation-width: 0px !important;
}
html[data-xydy-search-sidebar="on"] #douyin-header {
  left: 0 !important;
  width: 100% !important;
}

html[data-xydy-search-style] :is(#douyin-header, #search-toolbar-container) {
  background: color-mix(in srgb, var(--color-bg-b0, Canvas) 84%, transparent) !important;
  backdrop-filter: blur(18px) saturate(1.2);
}
html[data-xydy-search-style] #douyin-header :has(> :has(> [data-e2e="searchbar-input"])):has(> [data-e2e="searchbar-button"]) {
  border: 1px solid var(--xydy-panel-border) !important;
  border-radius: 999px !important;
  background: var(--xydy-panel-bg-soft) !important;
  box-shadow: var(--xydy-panel-shadow-soft);
}
html[data-xydy-search-style] #search-toolbar-container,
html[data-xydy-search-style] #search-result-container .search-result-card {
  box-sizing: border-box;
  border: 1px solid color-mix(in srgb, var(--xydy-panel-border) 45%, transparent);
  border-radius: 14px;
}
html[data-xydy-search-style] #search-result-container .search-result-card {
  background: color-mix(in srgb, var(--xydy-panel-bg) 34%, transparent);
  box-shadow: var(--xydy-panel-shadow-soft);
}
html[data-xydy-search-style] #search-result-container .search-result-card:is(:hover, :focus-within) {
  border-color: var(--xydy-panel-border);
}
` : '');
  return replace(part, match[1], JSON.stringify(merged));
});

patch('src/shared/constants', part => replace(part,
  'headerSearchInput: ["[data-e2e=\\"searchbar-input\\"]"]',
  'headerSearchInput: ["[data-e2e=\\"searchbar-input\\"]", ".GySDQyGR input"]'));

patch('src/shared/utils', part => replace(part, '  app.utils = {', `  const jingxuanVideo = '${adaptedModal} [data-e2e="feed-active-video"]';

  ${isMergedBuild ? `function isSearchPage() {
    return location.host === 'www.douyin.com' && /^(?:\\/(?:jingxuan|recommend|root|follow|friend|user\\/self))?\\/search(?:\\/|$)/.test(location.pathname);
  }

  function isProfilePage() {
    return location.host === 'www.douyin.com' && /^\\/user\\/self\\/?$/.test(location.pathname);
  }

  function supportsSidebar() {
    return ['www.douyin.com', 'live.douyin.com'].includes(location.host) &&
      !isModalVideoPage() && jingxuanMode() !== 'player';
  }

  function visibleActiveVideo(selector = '.dySwiperSlide [data-e2e="feed-active-video"], .dySwiperSlide[data-e2e="feed-active-video"]') {
    return Array.from(document.querySelectorAll(selector)).find(video => video.offsetWidth && video.offsetHeight);
  }

  ` : ''}function jingxuanMode() {
    ${isMergedBuild ? "if (isProfilePage() && (isModalVideoPage() || visibleActiveVideo(jingxuanVideo))) return 'player';\n    if (isSearchPage() && (isModalVideoPage() || visibleActiveVideo(jingxuanVideo + ':has(.searchModal)'))) return 'player';\n    " : ''}if (window.location.host !== 'www.douyin.com' || !/^\\/jingxuan\\/?$/.test(window.location.pathname)) return null;
    return isModalVideoPage() ? 'player' : 'home';
  }

  function jingxuanCommentCard() {
    return ${isMergedBuild ? "visibleActiveVideo(jingxuanVideo)?.querySelector(':scope" : "document.querySelector(jingxuanVideo + '"} > #videoSideCard:not(.QwkWPUUt, ${isMergedBuild ? '.yoHWkLaG, ' : ''}[hidden]):has(.comment-header-inner-container, [data-e2e="comment-list"], #semiTabauthor_card[aria-selected="true"])');
  }

  app.utils = {
    ${isMergedBuild ? 'isSearchPage,\n    isProfilePage,\n    supportsSidebar,\n    isFollowingPage,\n    visibleActiveVideo,\n    ' : ''}jingxuanMode,
    jingxuanVideo,
    jingxuanCommentCard,`));

patch('src/content/runtime', part => {
  part = replace(part, '    if (new URLSearchParams(window.location.search).has("modal_id")) {', `    ${isMergedBuild ? `if (app.utils.isSearchPage() && settings.features.sidebar) root.dataset.xydySearchSidebar = 'on';
    else delete root.dataset.xydySearchSidebar;
    root.toggleAttribute('data-xydy-search-style', app.utils.isSearchPage() && settings.features.styles);
    root.toggleAttribute('data-xydy-profile', app.utils.isProfilePage());
    root.toggleAttribute('data-xydy-nav-glass', settings.features.styles);

    root.toggleAttribute('data-xydy-follow', app.utils.isFollowingPage() && !app.utils.isModalVideoPage());

    ` : ''}const jingxuan = app.utils.jingxuanMode();
    if (jingxuan) root.dataset.xydyJingxuan = jingxuan;
    else delete root.dataset.xydyJingxuan;

    if (app.utils.isModalVideoPage() && jingxuan !== 'player') {`);
  part = replace(part, 'const allowed = app.utils.isImmersiveVideoPage();', 'const allowed = app.utils.isImmersiveVideoPage() || Boolean(jingxuan);');
  part = replace(part, 'allowed && location.host === "www.douyin.com" ? "on" : "off"', 'allowed && jingxuan !== "player" && location.host === "www.douyin.com" ? "on" : "off"');
  if (isMergedBuild) part = replace(part, 'root.dataset.xydySidebar = "off";',
    'root.dataset.xydySidebar = app.utils.supportsSidebar() && settings.features.sidebar ? "on" : "off";');
  for (const feature of ['sidebar', 'navigation', 'loading']) {
    part = replace(part, `= settings.features.${feature} ? "on" : "off";`, `= jingxuan !== "player" && settings.features.${feature} ? "on" : "off";`);
  }
  if (isMergedBuild) part = replace(part, 'if (currentUrlPath !== lastUrlPath) {', `if (currentUrlPath !== lastUrlPath ||
          ((app.utils.isSearchPage() || app.utils.isProfilePage()) && (app.utils.jingxuanMode() === 'player') !==
            (document.documentElement.dataset.xydyJingxuan === 'player'))) {`);
  return part;
});

function allow(name, expression, route) {
  patch('src/content/modules/' + name, part =>
    replace(part, expression, '(' + expression + ' || app.utils.jingxuanMode() === "' + route + '")'));
}

for (const name of ['sidebar', 'navigation', 'hide-elements']) {
  allow(name, 'utils.isImmersiveVideoPage()', 'home');
}
for (const [name, expression] of [
  ['styles', 'app.utils.isImmersiveVideoPage()'],
  ['mouse-gestures', 'utils.isImmersiveVideoPage()'],
  ['context-menu', 'app.utils.isImmersiveVideoPage()'],
  ['proximity', 'utils.isImmersiveVideoPage()'],
  ['comments-dock', 'app.utils.isImmersiveVideoPage()'],
  ['comments-interactive', 'utils.isImmersiveVideoPage()'],
]) allow(name, expression, 'player');

patch('src/content/modules/sidebar', part => replace(part,
  'else if (ss.hideRequested) {', 'else if (ss.hideRequested || utils.jingxuanMode() === "home"' +
  (isMergedBuild ? ' || (utils.supportsSidebar() && (utils.isSearchPage() || !utils.isImmersiveVideoPage()))' : '') + ') {'));
if (isMergedBuild) patch('src/content/modules/sidebar', part => {
  part = replace(part, 'utils.isImmersiveVideoPage() ||', 'utils.supportsSidebar() || utils.isImmersiveVideoPage() ||');
  return replace(part, '      function notifySwiperAndPlayer() {\n        requestAnimationFrame(function () {',
    `      function notifySwiperAndPlayer() {
        if (utils.isProfilePage()) return;
        requestAnimationFrame(function () {
          if (utils.isProfilePage()) return;`);
});
if (isMergedBuild) patch('src/content/modules/navigation', part => {
  part = replace(part, 'utils.isImmersiveVideoPage() ||',
    `utils.isImmersiveVideoPage() || (utils.supportsSidebar() && !utils.isSearchPage() &&
                     Boolean(document.querySelector('#douyin-header .GjgTnTzB'))) ||`);
  return replace(part, 'if (currentUrlPath !== lastUrlPath) {',
    `if (currentUrlPath !== lastUrlPath ||
              canRun(context.getSettings()) !== (document.documentElement.dataset.xydyNavigation === "on")) {`);
});
patch('src/content/modules/navigation', part => replace(part,
  '        syncHeaderActions();\n        showHeader();', `        syncHeaderActions();
        if (utils.jingxuanMode() === "home" && !isHeaderInteractionActive() && lastMouseY > 60) {
          clearTimeout(showTimer);
          showTimer = null;
          document.documentElement.classList.remove("xydy-header-visible");
          return;
        }
        showHeader();`));

patch('src/content/modules/styles', part => replace(part,
  '      function handleTransformSwap() {', `      function handleTransformSwap() {
        if (app.utils.jingxuanMode() === 'player') return;`));

patch('src/content/modules/liquid-glass', part => {
  part = replace(part, 'app.utils.isImmersiveVideoPage() && !new URLSearchParams(location.search).has("modal_id") &&',
    '(app.utils.isImmersiveVideoPage() || app.utils.jingxuanMode()) &&');
  if (isMergedBuild) {
    part = replace(part, '      let host = null;', `      const sidebarSelector = app.constants.SELECTORS.liquidGlassSurfaces
        .filter(selector => selector.includes("douyin-navigation")).join(",");
      let activeSelector = materialSelector;
      let host = null;`);
    part = part.replaceAll('queryAll(materialSelector)', 'queryAll(activeSelector)')
      .replaceAll('matches(materialSelector)', 'matches(activeSelector)')
      .replaceAll('querySelector(materialSelector)', 'querySelector(activeSelector)');
    part = replace(part, '      function apply(settings) {', `      function apply(settings) {
        const fullPlayerGlass = app.utils.isImmersiveVideoPage() || app.utils.jingxuanMode();
        const sidebarOnly = !fullPlayerGlass && app.utils.isProfilePage() && settings.features.sidebar;`);
    part = replace(part, '(app.utils.isImmersiveVideoPage() || app.utils.jingxuanMode()) &&', '(fullPlayerGlass || sidebarOnly) &&');
    part = replace(part, '        if (running) return;', `        const nextSelector = sidebarOnly ? sidebarSelector : materialSelector;
        if (activeSelector !== nextSelector) {
          activeSelector = nextSelector;
          schedule();
        }
        if (running) return;`);
  }
  return replace(part, 'if (mutation.type === "attributes") return relevant(mutation.target);', `if (mutation.type === "attributes") {
          if (mutation.attributeName === "style" && mutation.target.hasAttribute("data-xydy-jingxuan-dragging")) return false;
          return relevant(mutation.target);
        }`);
});

patch('src/content/modules/mouse-gestures', part => replace(part,
  'const video = utils.queryFirst(selectors.video);', `const video = utils.jingxuanMode() === 'player'
          ? ${isMergedBuild ? "utils.visibleActiveVideo(utils.jingxuanVideo)?.querySelector('video')" : "document.querySelector(utils.jingxuanVideo + ' video')"}
          : utils.queryFirst(selectors.video);`));

patch('src/content/modules/proximity', part => {
  part = replace(part, '      const THRESHOLD = 85;', `      let jingxuanSlide;
      let jingxuanModal;
      const THRESHOLD = 85;`);
  part = replace(part, '      function getActiveSlide() {', `      function getActiveSlide() {
        if (utils.jingxuanMode() === "player") {
          const slide = ${isMergedBuild ? 'utils.visibleActiveVideo(utils.jingxuanVideo)' : 'document.querySelector(utils.jingxuanVideo)'};
          const modal = new URLSearchParams(location.search).get("modal_id");
          if (slide !== jingxuanSlide || modal !== jingxuanModal) {
            clearProximityClasses();
            jingxuanSlide = slide;
            jingxuanModal = modal;
          }
          return slide;
        }
        jingxuanSlide = jingxuanModal = null;`);
  if (isMergedBuild) {
    part = replace(part, '          const rect = s.getBoundingClientRect();', `          const rect = s.getBoundingClientRect();
          // In-app navigation keeps the previous feed mounted in a hidden container.
          if (!rect.width || !rect.height) return;`);
  }
  part = replace(part, '        group.detect.forEach(sel => {', `        const detection = group.name === "info" && utils.jingxuanMode() === "player"
          ? ['[data-e2e="feed-video-nickname"]', '[data-e2e="video-desc"]', '.xgplayer-recommend-tag', ...constants.SELECTORS.playerShopAnchor]
          : group.detect;
        detection.forEach(sel => {`);
  part = replace(part, '        const rightPanel = document.querySelector(', `        const scope = utils.jingxuanMode() === "player" ? getActiveSlide() : document;
        const rightPanel = scope?.querySelector(`);
  part = replace(part, '          if (el.closest(constants.SELECTORS.chapterPanel.join(\',\'))) continue;', `          if (el.closest(constants.SELECTORS.chapterPanel.join(','))) continue;
          if (utils.jingxuanMode() === "player" && el.closest('.dySwiperSlide') &&
              !el.closest(utils.jingxuanVideo)) continue;`);
  part = replace(part, '      function clearProximityClasses() {', `      function clearProximityClasses() {
        for (const group of PANEL_GROUPS) {
          clearTimeout(hideTimers[group.name]);
          hideTimers[group.name] = null;
        }`);
  part = replace(part, '            if (isChapterPanelOpen()) {', `            if (utils.jingxuanMode() === "player") getActiveSlide();
            if (isChapterPanelOpen()) {`);
  return replace(part, '            subtree: true\n          });', '            subtree: true,\n            attributes: true,\n            attributeFilter: ["data-e2e"]\n          });');
});

require('./merge-comments.cjs')(patch, replace);

if (isMergedBuild) {
  patch('src/shared/utils', part => {
    part = replace(part, '  function isImmersiveVideoPage() {', `  function isFollowingPage() {
    return location.pathname === "/follow" || location.pathname === "/follow/";
  }

  function isImmersiveVideoPage() {`);
    return replace(part, 'if (allowedPaths.some(p => path === p || path.startsWith(p + "/"))) {',
      'if (isFollowingPage() || (location.host === "www.douyin.com" && /^\\/friend\\/?$/.test(path)) || allowedPaths.some(p => path === p || path.startsWith(p + "/"))) {');
  });
  patch('src/content/modules/comments-dock', part => replace(replace(part,
    "card?.closest('#dy-modal-video-container-waterFall')",
    "card?.matches(app.utils.jingxuanVideo + ' > #videoSideCard')"),
    'document.querySelector(panelSelector)', 'app.utils.visibleActiveVideo()?.querySelector(panelSelector)'));
  patch('src/content/modules/comments-interactive', part => replace(part,
    '#videoSideCard:not(.QwkWPUUt, [hidden]) #semiTabauthor_card',
    '#videoSideCard:not(.QwkWPUUt, .yoHWkLaG, [hidden]) #semiTabauthor_card')
    .replaceAll("document.getElementById('videoSideCard')", "utils.visibleActiveVideo()?.querySelector('#videoSideCard')"));
}

if (isMergedBuild) {
  const license = fs.readFileSync('LICENSE', 'utf8').trim();
  source = source.replaceAll('xyDouYinTools', 'shDouYinTools');
  source = replace(source, '// ==/UserScript==', `// ==/UserScript==

/* Based on xyDouYinTools 6.6.10 by lxy (咸鱼真人).
 * Upstream: https://greasyfork.org/zh-CN/scripts/548904
 *
${license}
*/`);
  fs.writeFileSync('outputs/shDouYinTools.user.js', source);
}
module.exports = source;
