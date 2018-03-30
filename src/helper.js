import Chance from "chance";

const chance = new Chance();

const FIELD_NODE_COUNT_THRESHOLD = 4;

export const NodeType = {
  IP: "ip",
  DOMAIN: "domain",
  USERNAME: "username",
  FILE_HASH: "fileHash",
  FILE_NAME: "fileName",
  URL: "url",
  EMAIL: "email"
};

export const Fields = {
  sourceIp: { type: NodeType.IP },
  destIp: { type: NodeType.IP },
  username: { type: NodeType.USERNAME },
  domain: { type: NodeType.DOMAIN },
  url: { type: NodeType.URL },
  email: { type: NodeType.EMAIL }
};

export function getRandomNodeContent() {
  switch (Math.floor(Math.random() * 4)) {
    case 0:
      return {
        label: chance.ip(),
        type: NodeType.IP
      };
      break;
    case 1:
      return {
        label: chance.hash(),
        type: NodeType.FILE_HASH
      };
      break;

    case 2:
      return {
        label: chance.domain(),
        type: NodeType.DOMAIN
      };
    case 3:
      return {
        label: chance.email(),
        type: NodeType.EMAIL
      };
  }
}

function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

/**
 * return an array of random observations
 *
 * if an array is passed in, we will draw content from existing event
 *
 * observations -> array of existing observations
 * p -> possiblity of drawn from existing event, default to 25%
 * forcedAssociation -> drawn from bad observations
 */

function getSeverity() {
  return chance.weighted(
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0.5]
  );
}

/**
 * observation can be of different types...
 *
 * event, offense, lookup etc. keep that in mind.
 *
 *
 */
export function getRandomObservation(observations, p, tryToBeBad, startDate) {
  // geenrate the random date
  let start = startDate !== undefined ? startDate : new Date();
  let end = new Date(start.getTime() + 60 * 60 * 1000);
  let newDate = randomDate(start, end);

  if (observations.length === 0 || p === undefined || p === 0) {
    return {
      sourceIp: chance.ip(),
      destIp: chance.ip(),
      startDate: newDate,
      username: chance.name(),
      url: chance.url(),
      email: chance.email(),
      domain: chance.domain(),
      severity: getSeverity(),
      uuid: chance.guid()
    };
  }

  const fields = getFields({}, observations);

  // randomly pick an entry of a particular type from the array and returns the value

  const ips = getIps(fields);
  const usernames = getUsernames(fields);

  return {
    sourceIp:
      Math.random() < p
        ? ips[Math.floor(Math.random() * ips.length)]
        : chance.ip(),
    destIp:
      Math.random() < p
        ? ips[Math.floor(Math.random() * ips.length)]
        : chance.ip(),
    startDate: newDate,
    username:
      Math.random() < p
        ? usernames[Math.floor(Math.random() * usernames.length)]
        : chance.name(),
    url: chance.url(),
    email: chance.email(),
    domain: chance.domain(),
    severity: getSeverity(),
    uuid: chance.guid()
  };
}

function getIps(fields) {
  const ips = [];

  for (var fieldKey in fields) {
    if (fields[fieldKey].type === NodeType.IP) {
      ips.push(fieldKey);
    }
  }

  return ips;
}

function getUsernames(fields) {
  const usernames = [];

  for (var fieldKey in fields) {
    if (fields[fieldKey].type === NodeType.USERNAME) {
      usernames.push(fieldKey);
    }
  }

  return usernames;
}

export function getRandomObservations(
  numOfObservations,
  p,
  tryToBeBad,
  startDate
) {
  const observations = [];
  let newStartDate = startDate === undefined ? new Date() : startDate;
  for (var i = 0; i < numOfObservations; i++) {
    observations.push(
      getRandomObservation(observations, p, tryToBeBad, newStartDate)
    );
    newStartDate = observations[i].startDate;
  }

  return observations;
}

export function genObservations(numOfObservations, opts, existingObservations) {
  const newObservations = [];
  const numOfExistingObservations = existingObservations.length;
  let newStartDate =
    numOfExistingObservations == 0
      ? new Date()
      : existingObservations[numOfExistingObservations - 1].startDate;

  for (var i = 0; i < numOfObservations; i++) {
    newObservations.push(
      getRandomObservation(
        existingObservations,
        opts.p,
        opts.tryToBeBad,
        newStartDate
      )
    );
    newStartDate = newObservations[i].startDate;
  }

  return newObservations;
}

/**
 * extract all the observed fields from the observation
 * fields - existing fields
 */
export function getFields(fields, observations) {
  const allFields = Object.assign({}, fields);
  const numOfFields = Object.keys(Fields).length;
  observations.forEach(observation => {
    // go through fields of the observation
    let i = 0;
    for (var fieldKey in Fields) {
      if (observation[fieldKey] !== undefined) {
        if (allFields[observation[fieldKey]] === undefined) {
          allFields[observation[fieldKey]] = {
            uuid: chance.guid(),
            lastSeen: observation.startDate,
            type: Fields[fieldKey].type,
            angle: i / numOfFields,
            count: 1,
            label: observation[fieldKey],
            severity: observation.severity,
            severities: [observation.severity]
          };
          i++;
        } else {
          let curField = allFields[observation[fieldKey]];
          curField.count = curField.count + 1;

          curField.severity =
            curField.severity > observation.severity
              ? curField.severity
              : observation.severity;

          curField.severities = curField.severities
            .concat(observation.severity)
            .sort((a, b) => {
              if (a < b) {
                return 1;
              } else if (a == b) {
                return 0;
              } else {
                return -1;
              }
            });

          curField.lastSeen = observation.startDate;
          curField.obsUuid = observation.uuid;
        }
      }
    }
  });
  return allFields;
}

export function touchFields(fields, observation, x, y) {
  const allFields = Object.assign({}, fields);
  const numOfFields = Object.keys(Fields).length;
  let i = 0;
  for (var fieldKey in Fields) {
    let curField = allFields[observation[fieldKey]];

    curField.isCustom = true;
    curField.x = x + (Math.random() - 0.5) * 100;
    curField.y = y + (Math.random() - 0.5) * 100;
  }

  return allFields;
}

/**
 * appending new observation
 */
export function appendData(
  existingObservations,
  existingFields,
  numOfObs,
  p,
  tryToBeBad
) {
  let params = {};
  const newObservations = genObservations(
    numOfObs,
    { p: p, tryToBeBad: tryToBeBad },
    existingObservations
  );

  const observations = existingObservations.concat(newObservations);
  // start anew... may want to find ways to optimize this .
  const obsNodes = [];
  const fieldNodes = [];
  const edges = [];

  // get the fields structure from all observations
  // this should contain all the identity fields from all observations

  const fields = getFields(existingFields, newObservations);

  // for each unique field, create a field node only if the field
  // node is shared by more than a certain number of observation
  let i = 0;

  for (var fieldKey in fields) {
    let curField = fields[fieldKey];
    if (curField.count > FIELD_NODE_COUNT_THRESHOLD) {
      fieldNodes.push({
        type: "FIELD",
        i: i,
        count: curField.count,
        t: curField.lastSeen,
        cy:
          10 +
          Math.pow(
            curField.severities
              .slice(0, 4)
              .reduce((total, current) => (total = total + current), 0),
            0.7
          ) *
            1.8,
        r:
          Math.pow(
            curField.severities
              .slice(0, 4)
              .reduce((total, current) => (total = total + current), 0),
            0.7
          ) + 3,
        label: fieldKey,
        uuid: curField.uuid
      });
      i++;
    } else if (curField.isCustom) {
      fieldNodes.push({
        type: "FIELD",
        i: i,
        count: curField.count,
        x: curField.x,
        y: curField.y,
        r:
          Math.pow(
            curField.severities
              .slice(0, 4)
              .reduce((total, current) => (total = total + current), 0),
            0.7
          ) + 3,
        label: fieldKey,
        uuid: curField.uuid
      });
      i++;
    }
  }

  // for each observation, creat an observation node
  observations.forEach(observation => {
    obsNodes.push({
      type: "OBS",
      t: observation.startDate,
      cy: observation.severity,
      r: Math.pow(observation.severity, 0.7) + 3,
      uuid: observation.uuid
    });

    // go through fields in the observation, make the edges
    //         sourceIp
    for (var fieldKey in observation) {
      let fieldNode = fields[observation[fieldKey]];
      if (
        fieldNode !== undefined &&
        fieldNode.count > FIELD_NODE_COUNT_THRESHOLD
      ) {
        edges.push({
          uuid: observation.uuid + fieldNode.uuid,
          obsNodeUuid: observation.uuid,
          fieldNodeUuid: fieldNode.uuid
        });
      }
    }
  });

  params.observations = observations;
  params.fields = fields;
  params.obsNodes = obsNodes;
  params.fieldNodes = fieldNodes;
  params.edges = edges;

  return params;
}
