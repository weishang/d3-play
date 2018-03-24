import Chance from "chance";

const chance = new Chance();

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
    [50, 40, 30, 20, 10, 5, 2, 1, 0.5, 0.1, 0.01]
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
  const observations = existingObservations;
  const numOfExistingObservations = observations.length;
  let newStartDate =
    observations.length == 0
      ? new Date()
      : observations[observations.length - 1].startDate;

  console.log(newStartDate);

  for (var i = 0; i < numOfObservations; i++) {
    observations.push(
      getRandomObservation(observations, opts.p, opts.tryToBeBad, newStartDate)
    );
    newStartDate = observations[i + numOfExistingObservations].startDate;
  }

  return observations;
}

/**
 * extract all the observed fields from the observation
 * fields - existing fields
 */
export function getFields(fields, observations) {
  const newFields = Object.assign({}, fields);
  const numOfFields = Object.keys(Fields).length;
  observations.forEach(observation => {
    // go through fields of the observation
    let i = 0;
    for (var fieldKey in Fields) {
      if (observation[fieldKey] !== undefined) {
        newFields[observation[fieldKey]] = {
          uuid: chance.guid(),
          firstObservedDate: observation.startDate,
          type: Fields[fieldKey].type,
          angle: i / numOfFields
        };
        i++;
      }
    }
  });
  return newFields;
}
