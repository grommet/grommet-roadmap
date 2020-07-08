const apiUrl =
  'https://us-central1-grommet-designer.cloudfunctions.net/roadmaps';

const upgrade = (roadmap) => {
  // remove pin
  delete roadmap.pin;
  // add empty items if needed
  if (!roadmap.items) roadmap.items = [];
  // convert type to section
  roadmap.items.forEach((i) => {
    if (i.type) {
      i.section = i.type;
      delete i.type;
    }
  });
  // add sections if not there
  if (!roadmap.sections)
    roadmap.sections = Array.from(new Set(roadmap.items.map((i) => i.section)));
  // ensure all item.section are in sections
  roadmap.items.forEach(({ section }) => {
    if (section && !roadmap.sections.includes(section))
      roadmap.sections.push(section);
  });
};

const addIdentifier = (roadmap, password) => {
  const nextIdentifiers = JSON.parse(
    global.localStorage.getItem('roadmaps') || '[]',
  ).filter((i) => i.id !== roadmap.id);
  const { id, email, name } = roadmap;
  const identifier = { id, email, name, password };
  nextIdentifiers.unshift(identifier);
  global.localStorage.setItem('roadmaps', JSON.stringify(nextIdentifiers));
  return identifier;
};

const removeIdentifier = (id) => {
  const nextIdentifiers = JSON.parse(
    global.localStorage.getItem('roadmaps') || '[]',
  ).filter((i) => i.id !== id);
  global.localStorage.setItem('roadmaps', JSON.stringify(nextIdentifiers));
};

const getIdentifier = (id) =>
  JSON.parse(global.localStorage.getItem('roadmaps') || '[]').find(
    (i) => i.id === id,
  );

// returns an array of identifiers
export const list = () =>
  JSON.parse(global.localStorage.getItem('roadmaps') || '[]');

// returns an identifier
export const create = (roadmap) => {
  roadmap.email = roadmap.email.toLowerCase();
  return fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(roadmap),
  })
    .then((response) => response.text())
    .then((id) => {
      roadmap.id = id;
      const password = roadmap.password;
      delete roadmap.password;
      global.localStorage.setItem(id, JSON.stringify(roadmap));
      return addIdentifier(roadmap, password);
    });
};

// returns a roadmap or false
export const get = (identifier) => {
  const { id, password: passwordArg } = identifier;
  const password = passwordArg || getIdentifier(id).password;
  const auth = password ? { Authorization: `Basic ${btoa(password)}` } : {};
  return fetch(`${apiUrl}/${id}`, {
    method: 'GET',
    headers: { ...auth },
  }).then((response) => {
    if (!response.ok) {
      if (response.status === 404) {
        global.localStorage.removeItem(id);
        removeIdentifier(id);
      }
      throw response.status;
    } else
      return response.json().then((nextRoadmap) => {
        upgrade(nextRoadmap);
        global.localStorage.setItem(
          nextRoadmap.id,
          JSON.stringify(nextRoadmap),
        );
        addIdentifier(nextRoadmap, password);
        return nextRoadmap;
      });
  });
};

// returns nothing, throws an exception if unable to update
export const update = (roadmap, passwordArg) => {
  const { id } = roadmap;
  const password = passwordArg || getIdentifier(id).password;
  const auth = password ? { Authorization: `Basic ${btoa(password)}` } : {};
  return fetch(`${apiUrl}/${id}`, {
    method: 'PUT',
    headers: {
      ...auth,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(roadmap),
  }).then((response) => {
    if (!response.ok) {
      if (response.status === 404) {
        global.localStorage.removeItem(id);
        removeIdentifier(id);
      }
      throw response.status;
    }
    // if user change password, remember the new one
    if (roadmap.password) addIdentifier(roadmap, roadmap.password);
    // if user supplied a password since we didn't ahve one, remember it
    else if (passwordArg) addIdentifier(roadmap, passwordArg);
  });
};

// returns nothing, throws an exception if unable to delete
export const delet = (roadmap, passwordArg) => {
  const { id } = roadmap;
  const password = passwordArg || getIdentifier(id).password;
  const auth = password ? { Authorization: `Basic ${btoa(password)}` } : {};
  return fetch(`${apiUrl}/${id}`, {
    method: 'DELETE',
    headers: { ...auth },
  }).then((response) => {
    if (!response.ok) {
      if (response.status === 404) {
        global.localStorage.removeItem(id);
        removeIdentifier(id);
      }
      throw response.status;
    }
    global.localStorage.removeItem(id);
    removeIdentifier(id);
  });
};
