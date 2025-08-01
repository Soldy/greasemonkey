'use strict';
window.initrc.startAdd(async function() {
describe('downloader', () => {
  const fakeReqs = [];
  let fakeXhr = null;

  beforeEach(() => {
    fakeReqs.length = 0;
    fakeXhr = sinon.useFakeXMLHttpRequest();
    fakeXhr.onCreate = xhr => {
      fakeReqs.push(xhr);
    }
  });

  after(() => {
    fakeXhr.restore();
  });

  it('downloads the given URL', async () => {
    let downloader = new UserScriptDownloader();
    downloader.setScriptUrl('http://example/test.user.js');

    let result = downloader.start();
    assert.equal(fakeReqs.length, 1);
    fakeReqs[0].respond(200, {}, metaBlockFromLines('// @name Fake'));

    let scriptDetails = await downloader.scriptDetails;
    assert.equal(scriptDetails.name, 'Fake');

    return result;
  });

  it('downloads @require', async () => {
    let downloader = new UserScriptDownloader();
    downloader.setScriptUrl('http://example/test.user.js');
    downloader.setScriptContent(metaBlockFromLines('// @require other.js'));

    let result = downloader.start();
    await downloader.scriptDetails;
    assert.equal(fakeReqs.length, 1);
    fakeReqs[0].respond(200, {}, 'alert()');

    let downloaderDetails = await downloader.details();
    assert.deepEqual(
        {'http://example/other.js': 'alert()'},
        downloaderDetails.requires);

    return result;
  });
});
}, 9);
