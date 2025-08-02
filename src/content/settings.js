/**
 * @type {HellForm}
**/
window.onload=async function(){

    const options = await browser.runtime.sendMessage({'name': 'OptionsLoad'});
    /**
     * @type {HellForm}
    **/
    const hellForm = new HellForm();

    /**
     *
     * @param {string}
     * @param {string}
     * @param {Object.<string, string>}
     * @param {function}
    **/
    const addSelect = function(
      label_,
      id_,
      list_
    ){
        const id = id_;
        hellForm.addSelect(
          _(label_),
          id_,
          list_,
          (e)=>{
               const msg = {
                  'name' : 'OptionsSave'
               };
               msg[id] =  e.target.value;
               chrome.runtime.sendMessage(
                 msg,
                 logUnhandledError
               );
            }
        );
        hellForm.set(
          id_,
          options[id_]
        );
    };

    /**
     *
     * @param {string}
     * @param {string}
     * @param {Object.<string, string>}
     * @param {function}
    **/
    const addCheckbox = function(
      label_,
      id_
    ){
        const id = id_;
        hellForm.addCheckbox(
          _(label_),
          id_,
          (e)=>{
               const msg = {
                  'name' : 'OptionsSave'
               };
               msg[id] =  e.target.checked;
               chrome.runtime.sendMessage(
                 msg,
                 logUnhandledError
               );
            }
        );
        hellForm.set(
          id_,
          options[id_]
        );
    };

    addSelect(
      'CodeMirror Key Map',
      'codeMirrorKeyMap',
      {
        'default' : 'Default',
        'sublime' : 'Sublime',
        'emacs' : 'Emacs',
        'vim' : 'Vim',
      }
    );
    addSelect(
      'CodeMirror Theme',
      'codeMirrorTheme',
      {
        'default':'Default',
        'material-darker':'Material Darker',
      }
    );
    addSelect(
        'Code Mirror tab size',
        'codeMirrorTabSize',
        {
            '2':'2',
            '4':'4',
        }
    );
    addSelect(
        'Code Mirror input style',
        'codeMirrorInputStyle',
        {
            'textarea' : 'textarea',
            'contenteditable' : 'contenteditable'
        }
    );
    addCheckbox(
      'CodeMirror Line Number',
      'codeMirrorLineNumber'
    );
    addCheckbox(
      'CodeMirror Line Wrapping',
      'codeMirrorLineWrapping'
    );
    addCheckbox(
      'CodeMirror ScreenReader Label',
      'codeMirrorScreenReaderLabel'
    );
    addCheckbox(
      'CodeMirror Spell Check',
      'codeMirrorSpellCheck'
    );
    addCheckbox(
      'CodeMirror autocorrect',
      'codeMirrorAutoCorrect'
    );
    document.getElementsByTagName('body')[0].appendChild(
      hellForm.render()
    );
};
