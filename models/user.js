import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
          SELECT 
            *
          FROM 
            users
          WHERE
            LOWER(username) = LOWER($1)
          LIMIT
            1
          ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "The username provided was not found.",
        action: "Verify the provided username and try again.",
      });
    }

    return results.rows[0];
  }
}

async function create({ username, email, password }) {
  await validateUniqueEmail(email);
  await validateUniqueUsername(username);

  const newUser = await runInsertQuery({ username, email, password });
  return newUser;

  async function validateUniqueEmail(email) {
    const results = await database.query({
      text: `
          SELECT 
            email
          FROM 
            users
          WHERE
            LOWER(email) = LOWER($1)
          LIMIT
            1
          ;`,
      values: [email],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "The email address provided is already in use.",
        action: "Use a different email address to sign up.",
      });
    }
  }

  async function validateUniqueUsername(username) {
    const results = await database.query({
      text: `
          SELECT 
            username
          FROM 
            users
          WHERE
            LOWER(username) = LOWER($1)
          LIMIT
            1
          ;`,
      values: [username],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "The username provided is already in use.",
        action: "Use a different username to sign up.",
      });
    }
  }

  async function runInsertQuery({ username, email, password }) {
    const result = await database.query({
      text: `
          INSERT INTO 
            users (username, email, password)
          VALUES 
            ($1, LOWER($2), $3)
          RETURNING
            *
          ;`,
      values: [username, email, password],
    });

    return result.rows[0];
  }
}

const user = {
  create,
  findOneByUsername,
};

export default user;
