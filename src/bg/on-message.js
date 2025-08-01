'use strict';
/*
This file sets up a message receiver, expecting to receive messages from
content scripts.  It dispatches to global methods registered in other
(background) scripts based on the `name` property of the received message,
and passes all arguments on to that callback.
*/

window.initrc.startAdd(async function() {
const myPrefix = chrome.runtime.getURL('');

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (!message.name) {
    console.error('Background received message without name!', message, sender);
    return;
  }

  if (!message.name.startsWith('Api') && !sender.url.startsWith(myPrefix)) {
    // Messages named "Api*" can come from anywhere (i.e. _content_ scripts,
    // where we execute user scripts).  These are handlers for the GM APIs.
    // Otherwise, only accept messages coming from our own source prefix.
    throw new Error(
        `ERROR refusing to handle "${message.name}" `
        + `message from sender "${sender.url}".`);
  }

  let cb = window['on' + message.name];
  if (!cb) {
    console.error(
        'Background has no callback for message:', message, 'sender:', sender);
    return;
  }

  (async () => {
    // Block until user scripts have been loaded.
    await userScriptsReady;

    let result = cb(message, sender, sendResponse);
    if (result instanceof Promise) {
      sendResponse(await result);
    }
  })();

  // Indicate async. handling of message response.
  return true;
});

}, 2);
