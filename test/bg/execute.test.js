'use strict';
describe('bg/execute', function(){
  this.timeout(5000); 
  before(() => sinon.stub(UserScriptRegistry, 'scriptsToRunAt'));
  after(() => UserScriptRegistry.scriptsToRunAt.restore());

  it('uses tabs.executeScript', async () => {
    chrome.tabs.executeScript.callsArg(2);
    UserScriptRegistry.scriptsToRunAt.returns([{}]);
    await executeUserscriptOnNavigation({});
    assert(chrome.tabs.executeScript.calledOnce);
  });
});
