//////////////////////////////////////////////
// throws api-error to frontend
//////////////////////////////////////////////

function throwErrorToFrontend(error = '') {
    if(! error || error == '') {
        error = "SignatureGenerator Error, see editor for details";
    }
    error = 'SignatureGenerator-Error: ' + error;
    var result = JSON.stringify({
        "error": {
            "code": "signaturegenerator.plugin.error",
            "statuscode": 400,
            "realm": "api",
            "error": error,
            "package": "",
            "parameters": {
                'problems': []
            },
            "description": ''
        }
    });
    console.log(result);
    process.exit(0);
}

//////////////////////////////////////////////
// generates _standard 
//////////////////////////////////////////////

function getStandardTextFromSignature(databaseLanguages, signature) {
    const shortenedDatabaseLanguages = databaseLanguages.map(value => value.split('-')[0]);

    const _standard = {};
    const l10nObject = {};

    // init l10nObject for fulltext
    for (const language of databaseLanguages) {
      l10nObject[language] = signature;
    }

    // give l10n-languages the fylr-language-syntax
    for (const l10nObjectKey in l10nObject) {
      if (Object.hasOwnProperty.call(l10nObject, l10nObjectKey)) {
        // get shortened version
        const shortenedLanguage = l10nObjectKey.split('-')[0];
        // add to l10n
        l10nObject[l10nObjectKey] = signature;
      }
    }

    _standard.l10ntext = l10nObject;

    return _standard;
}

  //////////////////////////////////////////////
  // generates facetTerm
  //////////////////////////////////////////////

function getFacetTerm(databaseLanguages, pattern, pattern_id) {
    const shortenedDatabaseLanguages = databaseLanguages.map(value => value.split('-')[0]);

    let _facet_term = {};
    const l10nObject = {};

    // init l10nObject
    for (const language of databaseLanguages) {
      l10nObject[language] = pattern + '@$@' + pattern_id;
    }

    // if l10n-object is not empty
    _facet_term = l10nObject;
    return _facet_term;
}

//////////////////////////////////////////////
// logs a long string in parts
//////////////////////////////////////////////

function logLongString(longString, callback) {
    let chunks = [];
    for (let i = 0; i < longString.length; i += MAX_CHUNK_SIZE) {
        chunks.push(longString.substring(i, i + MAX_CHUNK_SIZE));
    }
    function writeNextChunk(index) {
        if (index < chunks.length) {
            process.stdout.write(chunks[index], () => {
                writeNextChunk(index + 1);
            });
        } else {
            callback();
        }
    }
    // Start writing the first chunk
    writeNextChunk(0);
}

//////////////////////////////////////////////
// basic json-path
//////////////////////////////////////////////

function getByJsonPath(obj, path) {
  const parts = path.split(".");
  let current = obj;
  
  for (let part of parts) {
    // Array target?
    const match = part.match(/^(.+)\[(\d+)\]$/);
    if (match) {
      const key = match[1];
      const index = Number(match[2]);
      current = current[key];
      if (!Array.isArray(current)) {
        return undefined;
      }
      current = current[index];
    } else {
      current = current[part];
    }
    if (current === undefined || current === null) {
      return current;
    }
  }
  return current;
}

//////////////////////////////////////////////
// add padding
//////////////////////////////////////////////

function pad(num, length) {
  return String(num).padStart(length, '0');
}

// Date
function formatDate(format, date = new Date()) {
  const YYYY = date.getFullYear();
  const YY = String(YYYY).slice(-2);
  const MM = pad(date.getMonth() + 1, 2);
  const M1 = pad(date.getMonth() + 1, 1);
  const DD = pad(date.getDate(), 2);
  const D1 = pad(date.getDate(), 1);

  return format
    .replace(/YYYY/g, YYYY)
    .replace(/YY/g, YY)
    .replace(/MM/g, MM)
    .replace(/M/g, M1)
    .replace(/DD/g, DD)
    .replace(/D/g, D1);
}

//////////////////////////////////////////////
// sleep
//////////////////////////////////////////////

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//////////////////////////////////////////////
// sleep random time, but time grows with each run
//////////////////////////////////////////////

function randomBackoff(attempt) {
  const base = 20 * attempt; 
  const jitter = Math.random() * 50; 
  return base + jitter;
}