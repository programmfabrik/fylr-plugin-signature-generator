
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
// render new signature
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

async function renderPattern(configuration, patternConfig, object = {}, access_token) {
  const regex = /\{([^}]+)\}/g;

  const pattern = patternConfig.pattern;

  const matches = [...pattern.matchAll(regex)];

  let result = pattern;

  // parse all tokens, a token is everything like {....} according to spec
  for (const match of matches) {
    const full = match[0];
    const content = match[1];
    let replacement = full;

    //////////////////////////////////////////////////////////////////////////////////////////
    // DATE
    //////////////////////////////////////////////////////////////////////////////////////////

    if (content.startsWith("DATE ")) {
      const fmt = content.slice(5);
      replacement = formatDate(fmt);
    } 
    //////////////////////////////////////////////////////////////////////////////////////////
    // VARIABLE
    //////////////////////////////////////////////////////////////////////////////////////////

    else if (content.startsWith("VAR ")) {
      const variableName = content.slice(4).trim();
      replacement = '';      
      if(patternConfig.variables) {
        for(variable of patternConfig.variables) {          
          if(variable?.variable && variable?.path) {
            if(variable.variable == variableName && variable.path != '') {              
              const value = getByJsonPath(object, variable.path);
              if(value) {
                replacement = String(value);
              }
            }
          }
        }
      }

    //////////////////////////////////////////////////////////////////////////////////////////
    // SEQUENCE
    //////////////////////////////////////////////////////////////////////////////////////////

    /*
      Does:
      1. try to find a matching pattern-information
      2. if pattern-information was found, increase number and update pattern-information
      3. if not exists --> create new pattern-information and use the startvalue      
    */

    } else if (content.startsWith("SEQ ")) {
      const body = content.slice(4).trim();
      const parts = body.split(":");
      const sequenceName = parts[0];
      const sequencePadding = parts[1];
      let sequenceStartvalue = 1;
      let sequenceConfig = {};
      let sequenceConfigFound = false;

      // get sequence startvalue
      for(sequenceConfigEntry of patternConfig.sequences) {
        if(sequenceConfigEntry?.sequence_id && sequenceConfigEntry?.startvalue) {
          if(sequenceConfigEntry.sequence_id == sequenceName) {
            sequenceConfig = sequenceConfigEntry;
            sequenceConfigFound = true;
          }
        }
      }

      if(!sequenceConfigFound) {
        throwErrorToFrontend("No configuration found for sequence " + sequenceName);
      }

      // add informations about objecttype to sequenceconfig
      sequenceConfig.sequence_objecttype = configuration.sequence_objecttype;
      sequenceConfig.sequence_pattern_id_field = configuration.sequence_pattern_id_field;
      sequenceConfig.sequence_sequence_id_field = configuration.sequence_sequence_id_field;
      sequenceConfig.sequence_num_field = configuration.sequence_num_field;
      sequenceConfig.pattern_id = patternConfig.pattern_id;

      // get and set sequences in pluginconfig
      const maxRetries = 10;
      let nextNumber = sequenceConfig.startvalue * 1;

      let newSeqValue = 1;  
      let seqLastData = false;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // try to find existing sequence
        seqLastData = await getLastSequence(sequenceConfig, access_token);
        
        // if no sequence-record was found, create a new one
        if(!seqLastData) {
          seqLastData = await createSequence(sequenceConfig, access_token);      
          newSeqValue = pad(nextNumber, sequencePadding);
          break;
        }
        else {        
          // if a sequence was found
          const seqUpdatedData = await updateSequence(sequenceConfig, seqLastData, access_token);
          if (seqUpdatedData) {          
            newSeqValue = seqUpdatedData[sequenceConfig.sequence_objecttype][sequenceConfig.sequence_num_field.split('.').pop()];
            // add padding
            newSeqValue = pad(newSeqValue, sequencePadding);
            break;
          }
        }

        // short random pause, to avoid retry-sync-errors
        await sleep(randomBackoff(attempt));

        // maxretries reached --> error
        if(attempt == maxRetries) {
          throwErrorToFrontend('Could not allocate sequence number after max retries');
        }
      }   

      replacement = newSeqValue;
    }

    result = result.replace(full, replacement);
  }

  return result;
}


///////////////////////////////////////////////////////////////////////////////////////////
// handle the sequences
///////////////////////////////////////////////////////////////////////////////////////////

async function handleSequence(sequenceConfig, sequencePadding, access_token) {
    let seqData = await getLastSequence(sequenceConfig, access_token);
    let createdNew = false;

      let nextNumber = sequenceConfig.startvalue * 1;
      let nextVersion = 1;

    if (!seqData) {
      // no sequence given, create one
      seqData = await createSequence(sequenceConfig, access_token);
      createdNew = true;
    }

    if (!seqData) {
        throwErrorToFrontend('Could not initialize sequence');
    }

    if(!createdNew) {
      // get next number
      let nextNumber = Number(seqData[sequenceConfig.sequence_num_field] ?? sequenceConfig.startvalue);
      nextNumber += 1;

      // if existing sequence --> update
      if (seqData._id) {
          const updated = await updateSequence({
              id: seqData._id,
              number: nextNumber,
              version: seqData._version + 1
          }, access_token);

          if (!updated) {
              throwErrorToFrontend('Failed to update existing sequence');
          }
      }
    }
    return String(nextNumber).padStart(sequencePadding, '0');
}