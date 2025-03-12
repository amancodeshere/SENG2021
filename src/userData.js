import fs from 'fs';

const userData = './userData.json';

let data = {
  users: [],
  sessions: []
};

export const save = () => {
  const jsonstr = JSON.stringify(data, null, 2);
  fs.writeFileSync(userData, jsonstr);
};

export const load = () => {
  if (fs.existsSync(userData)) {
    const dbstr = fs.readFileSync(userData);
    data = JSON.parse(String(dbstr));
  }
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