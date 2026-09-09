/////////////////////////////////////////////////////
// run some tests, if they fail, abort
/////////////////////////////////////////////////////

const tests = [];

tests.push('{SEQ inventar:6}');
tests.push('{SEQ teil:6}');
tests.push('{DATE YYYY-MM-DD}');
tests.push('{DATE YYYY}');
tests.push('{DATE D.M.YYYY}');
tests.push('{DATE D.M.YY}');
tests.push('{DATE M.YY}');
tests.push('{DATE M/YY}');
tests.push('{SEQ haupt:5}/{SEQ teil:6}');
tests.push('arch-{VAR reihe}/{SEQ laufnummer:4}');
tests.push('mus/{VAR standort}/{DATE YYYY-MM-DD}/{SEQ objekt:5}');

for(test of tests) {    
  let result = validatePattern(test);
  if(result.valid == false) {
    throwErrorToFrontend('An signature-test (valid) failed: ' + test);
  }
}

const xtests = [];
xtests.push('{iSEQ teil:6}');
xtests.push('{SEQ teil}');
xtests.push('{SEQ teil:}');
xtests.push('{SEQdirekt}');
xtests.push('{DATE:FEE}');
xtests.push('{DATEYY}');
xtests.push('{DATE:YYY}');
xtests.push('{VAR 123$%§$asd}');
xtests.push('{VARPITTI}');
xtests.push('{alskdalskjd VAR}');
xtests.push('{VAR: dottts}');
xtests.push('{VAR:dottts}');
xtests.push('{SEQi inventar:6} - asdb {VAR gogogo}');
xtests.push('{SEQ inventar_6} - asdb {VAR ?gogogo}');
xtests.push('{SEQ inventar:-6} - asdb {VARX gogogo}');
xtests.push('{SEQ: inventar:-6} - asdb {VAR:123}');


for(xtest of xtests) {    
  let result = validatePattern(xtest);
  if(result.valid == true) {
    throwErrorToFrontend('An signature-test (not valid) failed: ' + xtest);
  }
}

function validatePattern(pattern) {
    // to lowercase
    pattern = pattern.toLowerCase();
  
    const errors = [];

    // validate allowed characters
    const allowedChars = /^[a-zA-Z0-9_\-\/\.\(\)\{\}: ]+$/;

    const findInvalidChars = (pattern) => {    
        const invalid = pattern.match(/[^a-zA-Z0-9_\-\/\.\(\)\{\}: ]/g);
        return invalid;
    };

    let charTest = allowedChars.test(pattern);

    if (!charTest) {
        const invalidChars = findInvalidChars(pattern);
        errors.push("Pattern enthält ungültige Zeichen: " + invalidChars.join(', '));
    }

    // extract all the tokens within {}
    const tokenRegex = /\{([^}]+)\}/g;

    // iterate over all tokens
    for (const match of pattern.matchAll(tokenRegex)) {
        
        const content = match[1].trim();

        /////////////////////////////////////////////
        // check DATE
        /////////////////////////////////////////////

        if(content.startsWith("date ")) {
            // extract the iso-part
            const dateString = content.substring(5).trim();
            const validDateTokens = ["yyyy", "yy", "mm", "m", "dd", "d"];
            // regex check for iso format
            const isoRegex = /^(yyyy|yy|mm|m|dd|d)([-./](yyyy|yy|mm|m|dd|d)){0,2}$/                             
            if (!isoRegex.test(dateString)) {
                errors.push(`invalid DATE-syntax: {${content}}`);
                continue;
            }

            // further validate each part
            const dateParts = dateString.split(/[-./]/);         

            let isValidDate = true;
            for (let part of dateParts) {
                if (!validDateTokens.includes(part)) {
                    isValidDate = false;
                    break;
                }
            }
            
            if (!isValidDate) {
                errors.push(`invalid DATE-syntax: {${content}}`);
                continue;
            }
            continue;
        }

        /////////////////////////////////////////////
        // check SEQ
        /////////////////////////////////////////////

        if (content.startsWith("seq ")) {
            // structure: {seq name:123}
            const seqRegex = /^seq ([a-z0-9_]+):([0-9]+)?$/;

            const seqMatch = content.match(seqRegex);
            if (!seqMatch) {
                errors.push(`invalid SEQ-syntax: {${content}}`);
                continue;
            }

            const name = seqMatch[1];

            let padding = 0;
            
            if(seqMatch[2]) {
                padding = parseInt(seqMatch[2], 10);
            }

            // count digits ≥ 1
            if (padding < 1) {
                errors.push(`SEQ "${name}" needs a value for padding.`);
            }
            continue;
        }

        /////////////////////////////////////////////
        // check VAR
        /////////////////////////////////////////////

        if (content.startsWith("var ")) {
            // structure: {var name}
            const varName = content.substring(4).trim();
            const varNameRegex = /^[a-z0-9_]+$/;
            if (!varNameRegex.test(varName)) {
                errors.push(`invalid variablename: {${content}}`);
                continue;
            }
            continue;
        }

        // everything else is an unknown error
        errors.push(`unknown token: {${content}}`);
    }

    let validInput = true;

    if(errors.length > 0) {
        validInput = false;
    }

    let returnResult = {
        valid: validInput,
        errors
    };

    return returnResult;
}