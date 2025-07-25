'use strict';
/*
This file is responsible for observing content navigation events and triggering
content script executions.

TODO: Make document_start execution time work as intended.
*/

const executeTools = {
   i: 0,
   detail:{},
   done:()=>{}
};
async function executeUserscriptOnNavigationWithCheck() {
  executeTools.i++;
  if(
     (executeTools.i < 100 ) && 
     (userScriptsReady !== true)
  )
      return setTimeout(executeUserscriptOnNavigationWithCheck, 10);
  const userScriptIterator = UserScriptRegistry.scriptsToRunAt(executeTools.detail.url);
  try{
    for (let userScript of userScriptIterator) {
      let options = {
        'code': userScript.evalContent,
        'matchAboutBlank': true,
        'runAt': 'document_' + userScript.runAt,
      };
      if (executeTools.detail.frameId) options.frameId = executeTools.detail.frameId;
      chrome.tabs.executeScript(executeTools.detail.tabId, options, () => {
        if (!chrome.runtime.lastError) return;
        const errMsg = chrome.runtime.lastError.message;

        // TODO: i18n?
        if (errMsg.startsWith('Message manager disconnected')) return;
        if (errMsg.startsWith('No matching message handler')) return;

        // TODO: Better indication of the root cause.
        console.error(
            'Could not execute', userScript.toString(), '\n', errMsg);
      });
    }
  }catch(e){
    console.log(e);
  }
  return executeTools.done();
};

function executeUserscriptOnNavigation(detail_) {
  executeTools.detail = detail_;
  if (false === getGlobalEnabled()) return;
  return new Promise(function(done_){
      executeTools.done = done_;
      setTimeout(executeUserscriptOnNavigationWithCheck, 10);
  });
}
