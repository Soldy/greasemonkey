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
    read(input_, def_){
        const lines = input_.split(/\r?\n/);
        const raw = this.#getRaw(lines);
        return this.#dataMine(raw, def_);

    };
    check(line){
        return _firstLineCheck(line);
    };
    getRaw(lines){
        return _getRaw(lines);
    };
    dataMine(lines){
        return _dataMine(lines);
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
    #lastLineCheck = (line)=>{
        line = line.replace(/^\s*/gm, '');
        if(
            (line.slice(0, 2) === '//')&&
             (line.toLowerCase().indexOf('==/userscript==') > 1)
        )
            return true;
        return false;
    };
    #dict = {};
    #urls = {
        'require'      : 'requireUrls',
        'resource'     : 'resourceUrls',
        'icon'         : 'iconUrl'
    }
    #url(){

    }
    #local(){

    }
    #rev(name_){
        console.log(name_);
        console.log(name_.toLowerCase());
         if (typeof this.#dict[
             name_.toLowerCase()
           ] === 'undefined'
         )
             return name_;
         return this.#dict[name_.toLowerCase()];
    };
    #dataMine = function(lines, def_){
        for (let i in def_)
            this.#dict[i.toLowerCase()] = i;
        const out = def_;
        for (let line of lines){
            if(line.slice(0, 2) !== '//')
                continue;
            let cleaned = line.replace('//', '')
                .replace(/^\s*/gm, '');
            if(cleaned.slice(0, 1) !== '@')
                continue;
            cleaned = cleaned.replace('@', '').trim();
            if(cleaned.length < 2)
               continue;
            let name = (
              cleaned.slice(0, cleaned.indexOf(' '))
            );
            console.log(name);
            let value = cleaned.replace(name, '')
                .replace(/^\s*/gm, '');
            let sname = name.split(':');
            if(sname.length > 1 ){
               if(typeof out.locales[sname[1]] === 'undefined') 
                 out.locales[sname[1]] = {};
                 out.locales[sname[1]][sname[0]] = value;
                 continue;
            };
            name = this.#rev(name);
            console.log(value);
            console.log(cleaned);
            if(typeof out[name] === 'undefined')
                out[name] = [];
            if(value === 'true' || value === '' || typeof value == 'undefined'){
                out[name] = true;
                continue;
            }
            if (typeof out[name] === 'boolean'){
                out[name] = true;
                continue;
            }
            if (Array.isArray(out[name])){
                    out[name].push(value);
                    continue;
            }
            if (typeof out[name] === 'string' || out[name] == null ){
                out[name] = value;
                continue;
            }
            if (typeof out[name] === 'object'){
                const svalue = value.split(' ');
                out[name][svalue[0]] = svalue[1];
                continue;
            }
        }
        console.log(out);
        return out;
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
  const details = miner.read(content, {
    'downloadUrl': url,
    'excludes': [],
    'grants': [],
    'homePageUrl': null,
    'includes': [],
    'locales': {},
    'matches': [],
    'name': url && nameFromUrl(url) || 'Unnamed Script',
    'namespace': url && new URL(url).host || null,
    'noFrames': false,
    'requireUrls': [],
    'resourceUrls': {},
    'runAt': 'end'
  });
  return prepDefaults(details);
}

})();
