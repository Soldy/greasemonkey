'use strict';
/*
This file is responsible for tracking and exposing the global "enabled" state
of Greasemonkey.
*/

// Private implementation.
(async function() {

/**
 * A simplified storage layer for asynchronous operations,
 * while regarding to the DRY principle.
 *
 * @param {string}
 * @param {any}
 * @async
**/
const chromeGet = async function (key_, default_){
  return await (new Promise((resolve)=>{
    chrome.storage.local.get(key_, (v)=> {
      if (typeof v[key_] === 'undefined')
        resolve(default_);
      resolve(v);
    });
  }));
};

let gIsEnabled = await chromeGet('globalEnabled', true);
let gUseCodeMirror = await chromeGet('useCodeMirror', true);
let gGlobalExcludes = (await chromeGet('globalExcludes', '')).split('/n');

function getGlobalEnabled() {
  return !!gIsEnabled;
}
window.getGlobalEnabled = getGlobalEnabled;


function getGlobalExcludes() {
  return gGlobalExcludes.slice();
}
window.getGlobalExcludes = getGlobalExcludes;


function onEnabledQuery(message, sender, sendResponse) {
  sendResponse(gIsEnabled);
}
window.onEnabledQuery = onEnabledQuery;


function setGlobalEnabled(enabled) {
  gIsEnabled = !!enabled;
  chrome.runtime.sendMessage({
    'name': 'EnabledChanged',
    'enabled': gIsEnabled,
  }, logUnhandledError);
  setIcon();
  chrome.storage.local.set({'globalEnabled': enabled});
}
window.setGlobalEnabled = setGlobalEnabled;
function onEnabledSet(message, sender, sendResponse) {
  setGlobalEnabled(message.enabled);
  sendResponse();
}
window.onEnabledSet = onEnabledSet;


function setIcon() {
  // Firefox for Android does not have setIcon
  // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/browserAction/setIcon#Browser_compatibility
  if (!chrome.browserAction.setIcon) {
    return;
  }
  let iconPath = chrome.extension.getURL('skin/icon.svg');
  if (gIsEnabled) {
    chrome.browserAction.setIcon({'path': iconPath});
  } else {
    let img = document.createElement('img');
    img.onload = function() {
      let canvas = document.createElement('canvas');
      let ctx = canvas.getContext('2d');
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, 0, 0);
      chrome.browserAction.setIcon({
        'imageData': ctx.getImageData(0, 0, img.width, img.height),
      });
    };
    img.src = iconPath;
  }
}


function toggleGlobalEnabled() {
  setGlobalEnabled(!gIsEnabled);
}
window.toggleGlobalEnabled = toggleGlobalEnabled;

/*****************************************************************************/

function onEnabledToggle(message, sender, sendResponse) {
  toggleGlobalEnabled();
  sendResponse(gIsEnabled);
}
window.onEnabledToggle = onEnabledToggle;


function onOptionsLoad(message, sender, sendResponse) {
  let options = {
    'excludes': gGlobalExcludes.join('\n'),
    'useCodeMirror': gUseCodeMirror,
  };
  sendResponse(options);
}
window.onOptionsLoad = onOptionsLoad;


function onOptionsSave(message, sender, sendResponse) {
  chrome.storage.local.set(
      {
        'globalExcludes': message.excludes,
        'useCodeMirror': message.useCodeMirror,
        },
      logUnhandledError);
  gGlobalExcludes = message.excludes.split('\n');
  gUseCodeMirror = message.useCodeMirror;
  sendResponse();
}
window.onOptionsSave = onOptionsSave;

})();
