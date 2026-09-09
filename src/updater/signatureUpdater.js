const fs = require('fs')
const https = require('https')
const fetch = (...args) => import('node-fetch').then(({
    default: fetch
}) => fetch(...args));

let info = {}

let access_token = '';

if (process.argv.length >= 3) {
    info = JSON.parse(process.argv[2])
}

function signatureDataIsEqual(x, y, debug) {
    var p;
    if (x instanceof Function) {
        if (y instanceof Function) {
        return x.toString() === y.toString();
        }
        return false;
    }
    if (x === null || x === void 0 || y === null || y === void 0) {
        return x === y;
    }
    if (x === y || x.valueOf() === y.valueOf()) {
        return true;
    }
    if (x instanceof Date) {
        return false;
    }
    if (y instanceof Date) {
        return false;
    }
    if (!(x instanceof Object)) {
        return false;
    }
    if (!(y instanceof Object)) {
        return false;
    }
    p = Object.keys(x);
    if (Object.keys(y).every(function(i) {
        return p.indexOf(i) !== -1;
    })) {
        return p.every((function(_this) {
        return function(i) {
            var eq;
            eq = signatureDataIsEqual(x[i], y[i], debug);
            if (!eq) {
            if (debug) {
                console.debug("X: ", x);
                console.debug("Differs to Y:", y);
                console.debug("Key differs: ", i);
                console.debug("Value X:", x[i]);
                console.debug("Value Y:", y[i]);
            }
            return false;
            } else {
            return true;
            }
        };
        })(this));
    } else {
        return false;
    }
};

function hasChanges(objectOne, objectTwo) {
    var len;
    const ref = ["signature", "_standard", "_fulltext"];
    for (let i = 0, len = ref.length; i < len; i++) {
        let key = ref[i];
        if (!signatureDataIsEqual(objectOne[key], objectTwo[key])) {
            return true;
        }
    }
    return false;
}

function getNewCustomExpiresAt() {
    const newExpiresAt = new Date()
    const customExpirationConfig = info?.config?.plugin?.['custom-data-type-gnd']?.config?.update_gnd?.custom_expires_days || 1

    newExpiresAt.setDate(newExpiresAt.getDate() + customExpirationConfig);

    return newExpiresAt.toISOString()
}

main = (payload) => {
    switch (payload.action) {
        case "start_update":
            outputData({
                "state": {
                    "personal": 2
                },
                "log": ["started logging"]
            })
            break
        case "update":

            ////////////////////////////////////////////////////////////////////////////
            // run gnd-api-call for every given uri
            ////////////////////////////////////////////////////////////////////////////

            // build cdata from all api-request-results
            let cdataList = [];
            payload.objects.forEach((result, index) => {
                let originalCdata = payload.objects[index].data;
                let newCdata = {};

                ///////////////////////////////////////////////////////
                // conceptName, conceptURI, _standard, _fulltext, facet, frontendLanguage, conceptGeoJSON
                if (originalCdata) {
                    // lock in save data
                    newCdata.signature = originalCdata.signature;        

                    newCdata.facetTerm = {};
                    newCdata.facetTerm.text = originalCdata.signature;

                    newCdata._standard = {};
                    newCdata._standard.text = originalCdata.signature;

                    newCdata._fulltext = {};
                    newCdata._fulltext.text = originalCdata.signature;

                    if (hasChanges(payload.objects[index].data, newCdata)) {
                        payload.objects[index].data = newCdata;
                    } else {
                        payload.objects[index].data = originalCdata
                    }
                    // set expires at for the custom data object according to the plugin base config
                    payload.objects[index].data._expires_at = getNewCustomExpiresAt()
                }

                });
                outputData({
                    "payload": payload.objects,
                    "log": [payload.objects.length + " objects in payload"]
                });            
            // send data back for update
            break;
        case "end_update":
            outputData({
                "state": {
                    "theend": 2,
                    "log": ["done logging"]
                }
            });
            break;
        default:
            outputErr("Unsupported action " + payload.action);
    }
}

outputData = (data) => {
    out = {
        "status_code": 200,
        "body": data
    }
    process.stdout.write(JSON.stringify(out))
    process.exit(0);
}

outputErr = (err2) => {
    let err = {
        "status_code": 400,
        "body": {
            "error": err2.toString()
        }
    }
    console.error(JSON.stringify(err))
    process.stdout.write(JSON.stringify(err))
    process.exit(0);
}

(() => {

    let data = ""

    process.stdin.setEncoding('utf8');

     // if not activated -> cancel
    if(info.config.plugin['signaturegenerator'].config['update_signature'].activate == false) {
        outputData({
            "state": {
                "theend": 2,
                "log": ["updater not enabled"]
            }
        });
    }

    access_token = info && info.plugin_user_access_token;

    if (access_token) {
        process.stdin.on('readable', () => {
            let chunk;
            while ((chunk = process.stdin.read()) !== null) {
                data = data + chunk
            }
        });
        process.stdin.on('end', () => {
            ///////////////////////////////////////
            // continue with update-routine
            ///////////////////////////////////////
            try {
                let payload = JSON.parse(data)
                main(payload)
            } catch (error) {
                console.error("caught error", error)
                outputErr(error)
            }
        });
    } else {
        console.error("kein Accesstoken gefunden");
    }
})();