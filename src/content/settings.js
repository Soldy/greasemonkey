
window.onload=async function(){
    let options = await browser.runtime.sendMessage({'name': 'OptionsLoad'});
    const hellForm = new HellForm();
    hellForm.addSelect(
        'Code Mirror Theme',
        'codeMirrorTheme',
        {
            'default':'Default',
            'material-darker':'Material Darker',
        },
        (e)=>{
           chrome.runtime.sendMessage({
              'name': 'OptionsSave',
              'codeMirrorTheme': e.target.value,
           }, logUnhandledError);
        }
    );
    hellForm.addSelect(
        'Code Mirror tab size',
        'codeMirrorTabSize',
        {
            '2':'2',
            '4':'4',
        },
        (e)=>{
           chrome.runtime.sendMessage({
              'name': 'OptionsSave',
              'codeMirrorTabSize': e.target.value,
           }, logUnhandledError);
        }
    );
    document.getElementsByTagName('body')[0].appendChild(
        hellForm.render()
    );
    hellForm.set(
      'codeMirrorTheme',
      options.codeMirrorTheme
    );
    hellForm.set(
      'codeMirrorTabSize',
      options.codeMirrorTabSize
    );
};
