import bcryptjs from "bcryptjs";

async function hash(plainPassword) {
  const rounds = getNumberOfRounds();

  return await bcryptjs.hash(plainPassword, rounds);
}

function getNumberOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 4;
}

async function compare(providedPassword, storedPassword) {
  return await bcryptjs.compare(providedPassword, storedPassword);
}

const password = {
  hash,
  compare,
};

export default password;
