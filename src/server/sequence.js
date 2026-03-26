async function getLastSequence(sequenceConfig, access_token) {
  // 1. get all sequences and then find the matching one
  const url =  API_URL + "/api/v1/db/" + sequenceConfig.sequence_objecttype + "/_all_fields/list?version=current&access_token=" + access_token;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throwErrorToFrontend("Failed to fetch sequence");
  }

  const data = await response.json();

  // check all existing records
  if(data && data.length > 0) {
    for(record of data) {
      // must not be an deleted record and must be latest version
      if(record._latest_version == true && ! record._latest_version_deleted_at) {
        // compare pattern_id and sequence_id
        if(record[sequenceConfig.sequence_objecttype][sequenceConfig.sequence_pattern_id_field.split('.').pop()] == sequenceConfig.pattern_id) {
          if(record[sequenceConfig.sequence_objecttype][sequenceConfig.sequence_sequence_id_field.split('.').pop()] == sequenceConfig.sequence_id) {
            return record;
          }
        }
      }
    }
  }

  // sequence not found
  if (!data || data.length === 0) {
    return false;
  }
  return false;
}

async function createSequence(sequenceConfig, access_token) {
    const url = API_URL + "/api/v1/db/" + sequenceConfig.sequence_objecttype + "?priority=2&format=long&access_token=" + access_token;

    let sequenceObj = {};
    sequenceObj._mask = '_all_fields';
    sequenceObj._objecttype = sequenceConfig.sequence_objecttype;
    sequenceObj[sequenceConfig.sequence_objecttype] = {}
    sequenceObj[sequenceConfig.sequence_objecttype]._id = null;
    sequenceObj[sequenceConfig.sequence_objecttype]._version = 1;
    sequenceObj[sequenceConfig.sequence_objecttype][sequenceConfig.sequence_pattern_id_field.split(".").pop()] = sequenceConfig.pattern_id;
    sequenceObj[sequenceConfig.sequence_objecttype][sequenceConfig.sequence_sequence_id_field.split(".").pop()] = sequenceConfig.sequence_id;
    sequenceObj[sequenceConfig.sequence_objecttype][sequenceConfig.sequence_num_field.split(".").pop()] = sequenceConfig.startvalue * 1;

    sequenceObj = [sequenceObj];
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sequenceObj)
        });

        if (!response.ok) {
            throwErrorToFrontend('Failed to create new sequence, status: ' + response.status);
        }

        const data = await response.json();
        return data[0]?.[sequenceConfig.sequence_objecttype] ?? null;
    } catch (err) {
        throwErrorToFrontend("Failed to create new sequence" + err.message);
        return null;
    }
}


async function updateSequence(sequenceConfig, seqLastData, access_token) {
  let seqNewData = seqLastData;
  // increase version
  seqNewData[sequenceConfig.sequence_objecttype]._version++;
  // increase number
  seqNewData[sequenceConfig.sequence_objecttype][sequenceConfig.sequence_num_field.split('.').pop()]++;

  const url = API_URL + '/api/v1/db/' + sequenceConfig.sequence_objecttype + '?format=full';

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + access_token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([seqNewData])
  });

  if (!response.ok) return false; // version conflict or different error

  const data = await response.json();

  return data[0] ?? false;  
}