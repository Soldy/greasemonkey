'use strict';
const gAllMetaRegexp = new RegExp(
    '^(\u00EF\u00BB\u00BF)?// ==UserScript==([\\s\\S]*?)^// ==/UserScript==',
    'm');


/** Get just the stuff between ==UserScript== lines. */
function extractMeta(content) {
  const meta = content && content.match(gAllMetaRegexp);
  if (meta) return meta[2].replace(/^\s+/, '');
  return '';
}


// Private implementation.
(function() {

/** Pull the filename part from the URL, without `.user.js`. */
function nameFromUrl(url) {
  let name = url.substring(0, url.indexOf(".user.js"));
  name = name.substring(name.lastIndexOf("/") + 1);
  return name;
}


// Safely construct a new URL object from a path and base. According to MDN,
// if a URL constructor received an absolute URL as the path then the base
// is ignored. Unfortunately that doesn't seem to be the case. And if the
// base is invalid (null / empty string) then an exception is thrown.
function safeUrl(path, base) {
  if (base) {
    return new URL(path, base);
  } else {
    return new URL(path);
  }
}


// Defaults that can only be applied after the meta block has been parsed.
function prepDefaults(details) {
  // We couldn't set this default above in case of real data, so if there's
  // still no includes, set the default of include everything.
  if (details.includes.length == 0 && details.matches.length == 0) {
    details.includes.push('*');
  }

  if (details.grants.includes('none') && details.grants.length > 1) {
    details.grants = ['none'];
  }

  return details;
}

const _MonkeyBase = class{
    read(input_, url_){
        const lines = input_.split(/\r?\n/);
        this.#raw = this.#getRaw(lines);
        this.#url = url_;
        this.#dataInit();
        return this.#dataMine();

    };
    check(line){
        return _firstLineCheck(line);
    };
    lint(line_){
        return this.#line(line_)
    };
    getRaw(lines){
        return _getRaw(lines);
    };
    dataMine(lines){
        return _dataMine(lines);
    };
    #data_inited = false;
    #duplicated = {};
    #details(){
        return {
          'downloadUrl': this.#url,
          'excludes': [],
          'grants': [],
          'homePageUrl': null,
          'includes': [],
          'locales': {},
          'matches': [],
          'name':this.#url && nameFromUrl(this.#url) || 'Unnamed Script',
          'namespace': this.#url && new URL(this.#url).host || null,
          'noFrames': false,
          'requireUrls': [],
          'resourceUrls': {},
          'runAt': 'end'
        };
    };
    #data = {};
    #dataInit = function(){
        if(this.#data_inited)
            return;
        this.#data_inited = true;
        this.#data = this.#details();
    };
    #firstLineCheck = (line)=>{
        line = line.replace(/^\s*/gm, '');
        if(
            (line.slice(0, 2) === '//')&&
             (line.toLowerCase().indexOf('==userscript==') > 1)
        )
            return true;
        return false;
    };
    #duplicator = function(name_, file_){
        const index = file_.lastIndexOf(".");
        const arr = file_.split('');
        if(typeof this.#duplicated[name_] === 'undefined')
           this.#duplicated[name_] = {};
        if(typeof this.#duplicated[name_][file_] === 'undefined')
           this.#duplicated[name_][file_] = 1;
        this.#duplicated[name_][file_]++; 
        const extra = (
          '.'+
          this.#duplicated[name_][file_].toString()
        );
        return (arr.splice(index,0,extra)).join();
    };
    #lastLineCheck = (line)=>{
        line = line.replace(/^\s*/gm, '');
        if(
            (line.slice(0, 2) === '//')&&
             (line.toLowerCase().indexOf('==/userscript==') > 1)
        )
            return true;
        return false;
    };
    #url = '';
    #raw = [];
    #dict = {};
    #dictCache(){
        for (let i in this.#details(this.#url))
            this.#dict[i.toLowerCase()] = i;
    }
    #urls = {
        'require'      : 'requireUrls',
        'resources'    : 'resourceUrls',
        'resource'     : 'resourceUrls',
        'icon'         : 'iconUrl'
    };
    #local(){
      
    } 
    #rev(name_){
          if (typeof this.#dict[
              name_.toLowerCase()
            ] === 'undefined'
         )
             return name_;
         return this.#dict[name_.toLowerCase()];
    };
    #line = function(line_){
        let sname = [];
        let svalue = [];
        if(line_.slice(0, 2) !== '//')
            return false;
        let cleaned = line_.replace('//', '')
            .replace(/^\s*/gm, '');
        if(cleaned.slice(0, 1) !== '@')
           return false;
        cleaned = cleaned.replace('@', '').trim();
        if(cleaned.length < 2)
           return false;
        let name = (
          cleaned.slice(0, cleaned.indexOf(' '))
        );
        let value = cleaned.replace(name, '')
            .replace(/^\s*/gm, '');
        sname = name.split(':');
        if(sname.length > 1 ){
           if(typeof this.#data.locales[sname[1]] === 'undefined')
               this.#data.locales[sname[1]] = {};
           this.#data.locales[sname[1]][sname[0]] = value;
           return true;
        };
        svalue = value.split(' ');
        if(svalue.length > 1 ){
            if(typeof this.#data[name] === 'undefined')
                this.#data[name] = {};
            if (svalue[0] in this.#data[name]) {
               throw new Error(
                  _('duplicate_resource_NAME', svalue[0])
                );
            }
            if(typeof this.#urls[name] !== 'undefined' )
               name  = this.#urls[name].toString();
            this.#data[name][svalue[0]] = safeUrl(svalue[1], this.#url).toString();
            return true;
        }
        if(typeof this.#urls[name] !== 'undefined' ){
          name  = this.#urls[name].toString();
          value = safeUrl(value, this.#url).toString();
        }
        name = this.#rev(name);
        if(typeof this.#data[name] === 'undefined')
            this.#data[name] = [];
        if(value === 'true' || value === '' || typeof value == 'undefined'){
            this.#data[name] = true;
            return true;
        }
        if (typeof this.#data[name] === 'boolean'){
            this.#data[name] = true;
            return true;
        }
        if (Array.isArray(this.#data[name])){
            this.#data[name].push(value);
            return true;
        }
        if (typeof this.#data[name] === 'string' || this.#data[name] == null ){
            this.#data[name] = value;
            return true;
        }
        if (typeof this.#data[name] === 'object'){
            this.#data[name][svalue[0]] = svalue[1];
            return true;
        }
        return false;


    };
    #dataMine = function(){
        this.#dictCache();
        for (let line of this.#raw)
            this.#line(line);
        return this.#data;
    };
    #getRaw(lines){
        let out = [];
        let started = false;
        for(let i of lines)
            if(started){
                out.push(i);
                if(this.#lastLineCheck(i))
                    return out;
            }else if(this.#firstLineCheck(i)){
                out.push(i);
                started = true;
            }
        return [];
    };
};


/** Parse the source of a script; produce object of data. */
window.parseUserScript = function(content, url, failWhenMissing=false) {
  if (!content) {
    throw new Error('parseUserScript() got no content!');
  }

  // Populate with defaults in case the script specifies no value.
  const miner = new _MonkeyBase();
  const details = miner.read(content, url);
  return prepDefaults(details);
}

})();
