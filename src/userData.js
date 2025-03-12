let data = {
  users: [],
  sessions: []
};

export function getData() {
  return data;
}

export function clear() {
  // for resetting data in tests
  const data = getData();
  data.users = [];
  data.sessions = [];
}