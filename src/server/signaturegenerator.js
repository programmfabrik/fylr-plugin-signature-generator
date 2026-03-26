const MAX_CHUNK_SIZE = 10000;
let API_URL = '';
let access_token = '';
let input = '';
let info = undefined
let databaseLanguages = [];

if (process.argv.length >= 3) {
    info = JSON.parse(process.argv[2])
    API_URL = info.api_url;
    access_token = info.api_user_access_token;
}

process.stdin.on('data', d => {
    try {
        input += d.toString();
    } catch(e) {
        console.error(`Could not read input into string: ${e.message}`, e.stack);
        process.exit(1);
    }
});

process.stdin.on('end', async () => {
    // get data and input
    const data = JSON.parse(input);
    const configuration = data?.info?.config?.plugin['signaturegenerator']?.config['signature-generator']    

    if(!configuration) {
        throwErrorToFrontend("Pluginconfig not found");
    }

    // get plugin-user-token for sequence-generation
    if(info?.plugin_user_access_token) {
        access_token = info.plugin_user_access_token
    }
    else {
        throwErrorToFrontend("No user for sequence-generation configured in pluginconfig");
    }

    //////////////////////////////////////////
    // check configuration
    //////////////////////////////////////////

    if(!configuration) {
        throwErrorToFrontend("Exited process after disabled not configured signature generation");
    }

    // check if signature generation is enabled
    if (!configuration.enabled || configuration.enabled === false) {
        throwErrorToFrontend("Exited process after disabled signature generation");
    }    
    
    // check if a sequence-objecttype is correctly configured
    if (configuration.sequence_objecttype == '' || configuration.sequence_pattern_id_field == '' || configuration.sequence_sequence_id_field == '' || configuration.sequence_num_field == '') {
        throwErrorToFrontend("Sequence-Objecttype not correctly configured");
    }

    ///////////////////////////////////////////////////////////////////////////////////
    // do some common checks for objecttype and field
    ///////////////////////////////////////////////////////////////////////////////////

    // get objecttype of record
    let object = data.objects[0];    
    const objecttype = object._objecttype;

    ///////////////////////////////////////////////////////////////////////////////
    // get config for databaselanguages from fylr

    var url = 'http://fylr.localhost:8081/api/v1/config?access_token=' + access_token;
    let datamodelConfigResponse = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!datamodelConfigResponse.ok) {
        throwErrorToFrontend("Could not fetch config from fylr");
    }
    let datamodelConfig = await datamodelConfigResponse.json();
    databaseLanguages = datamodelConfig.system.config.languages.database;
    databaseLanguages = databaseLanguages.map((value, key, array) => {
        return value.value;
    });    

    ///////////////////////////////////////////////////////////////////////////////
    // check if objecttype has an signature-field and get fields name (toplevel)

    var url = 'http://fylr.localhost:8081/api/v1/schema/user/CURRENT?access_token=' + access_token;
    let datamodelResponse = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!datamodelResponse.ok) {
        throwErrorToFrontend("Could not fetch datamodel from fylr");
    }
    let datamodelData = await datamodelResponse.json();

    let signatureColumnNameInDM = false;
    for(let objecttypeDatamodel of datamodelData.tables) {
        if(objecttypeDatamodel.name == objecttype) {
            // check only on toplevel - patterns only allowed on toplevel
            for(let column of objecttypeDatamodel.columns) {
                if(column.kind == 'column') {
                    if(column.type == 'custom:base.signaturegenerator.signaturegenerator' || column.type == 'custom:extension.signaturegenerator.signaturegenerator') {
                        signatureColumnNameInDM = column.name;
                    }
                }
            }
        }
    }

    if(!signatureColumnNameInDM) {
        // save and quit routine
        logLongString(JSON.stringify(data), () => {
            process.exit(0);
        });
    }

    ////////////////////////////////////////////////////////////////////////
    // get all Pools-configuration                 
    
    let poolURL = 'http://fylr.localhost:8081/api/v1/pool?access_token=' + access_token;
    let poolResponse = await fetch(poolURL, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json', 
        }
    });
    if (!poolResponse.ok) {
        throwErrorToFrontend("Could not fetch pool data from fylr");
    }
    let poolDataAllPools = await poolResponse.json();    
    
    ////////////////////////////////////////////////////////////////////////////////////
    // iterate the saved objects and handle each signature 
    ////////////////////////////////////////////////////////////////////////////////////
    for (let object of data.objects) {
        
        // check if object has a pool-link (obligatory to render a signature)                   
        if(! object[objecttype]?._pool?.pool?._id) {
            continue;
        }

        // find the pattern, which is configured for objecttype in this pool   
        let patternPoolCheck = false;
        let patternToApply = null;
        
        // find matching pool
        let poolID = object[objecttype]._pool.pool._id;  

        // get poolData for this pool
        const poolData = poolDataAllPools.find(poolInfo => poolInfo.pool._id === poolID);      

        // try to find a matching pattern in pool
        if(poolData?.pool?.custom_data) {
            for (const [key, val] of Object.entries(poolData.pool.custom_data)) {
                if(key.startsWith("signaturegenerator__") && val) {
                    keyParts = key.split('__');
                    if(keyParts[1] === objecttype) {
                        patternToApply = val;                        
                        break;
                    }
                }
            }              
        }

        // skip, if no pattern is configured for that objecttype in pool
        if(! patternToApply) {
            continue;         
        }   

        // check if pattern from poolmanager exists in basepluginconfig 
        let patternConfigToUse = false;
        let patternFoundInConfig = false;
        for(let patternConfig of configuration.patterns) {
            if(patternConfig.pattern_id === patternToApply) {                
                patternConfigToUse = patternConfig;
                patternPoolCheck = true;
                patternFoundInConfig = true;
                break;
            }
        }

        if(!patternFoundInConfig) {
            throwErrorToFrontend("The pattern configured in the pool does not exist in the plugin configuration anymore.");
        }

        // check if the original pattern has correct objecttype configured
        if(patternConfigToUse?.allowed_objecttype !== objecttype) {
            throwErrorToFrontend("The pattern configured in the pluginconfig does not match the objecttype of the object.");
        }

        // check if signature field is empty, otherwise continue to next object
        let signatureFieldValue = '';
        if(object[objecttype][signatureColumnNameInDM]) {
            signatureFieldValue = object[objecttype][signatureColumnNameInDM];
        }
        if(signatureFieldValue.signature != '') {
            continue;
        }

        // no pattern found? maybe no pattern is configured for that objecttype in the pool
        if(!patternPoolCheck) {
            console.error("No signature-generator-pattern configured for this pool");
            throwErrorToFrontend("No signature-generator-pattern configured for this pool");
        }

        // objecttypes can contain nested fields, which are tables themselves in the datamodel

        // validate pattern first
        let validationResult = validatePattern(patternConfigToUse.pattern);
        if(validationResult.errors.length > 0) {
            throwErrorToFrontend("The pattern configured for signature generation is invalid: " + validationResult.errors.join(', '));
        }            

        // render pattern
        let generatedSignature = await renderPattern(configuration, patternConfigToUse, object, access_token);

        // put generated signature into the found field
        if(signatureColumnNameInDM) {                    
            signatureJSON = {};
            signatureJSON.signature = generatedSignature;
            signatureJSON.pattern = patternConfigToUse.pattern;
            signatureJSON.pattern_id = patternConfigToUse.pattern_id;

            signatureJSON._standard = getStandardTextFromSignature(databaseLanguages, generatedSignature);
            signatureJSON._fulltext = signatureJSON._standard;
            signatureJSON.facetTerm = getFacetTerm(databaseLanguages, signatureJSON.pattern, signatureJSON.pattern_id);

            object[objecttype][signatureColumnNameInDM] = signatureJSON;
        }
    }
    
    logLongString(JSON.stringify(data), () => {
        process.exit(0);
    });
});