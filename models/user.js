import database from "infra/database.js";
import password from "models/password.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function findOneById(id) {
  const userFound = await runSelectQuery(id);
  return userFound;

  async function runSelectQuery(id) {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM 
          users
        WHERE
          id = $1
        LIMIT
          1
      ;`,
      values: [id],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "The id provided was not found.",
        action: "Verify the provided id and try again.",
      });
    }

    return results.rows[0];
  }
}

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

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);
  return userFound;

  async function runSelectQuery(email) {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM 
          users
        WHERE
          LOWER(email) = LOWER($1)
        LIMIT
          1
      ;`,
      values: [email],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "The email provided was not found.",
        action: "Verify the provided email and try again.",
      });
    }

    return results.rows[0];
  }
}

async function create({ username, email, plainPassword }) {
  const defaultFeatures = ["read:activation_token"];

  await validateUniqueUsername(username);
  await validateUniqueEmail(email);
  const hashedPassword = await hashPassword(plainPassword);

  const newUser = await runInsertQuery({
    username,
    email,
    hashedPassword,
    features: defaultFeatures,
  });
  return newUser;

  async function runInsertQuery({ username, email, hashedPassword, features }) {
    const result = await database.query({
      text: `
        INSERT INTO 
          users (username, email, password, features)
        VALUES 
          ($1, LOWER($2), $3, $4)
        RETURNING
          *
      ;`,
      values: [username, email, hashedPassword, features],
    });

    return result.rows[0];
  }
}

async function update(usernameToSearch, { username, email, plainPassword }) {
  const currentUser = await findOneByUsername(usernameToSearch);
  let newValues = {};

  if (username) {
    await validateUniqueUsername(username);
    newValues = { ...newValues, username };
  }

  if (email) {
    await validateUniqueEmail(email);
    newValues = { ...newValues, email };
  }

  if (plainPassword) {
    const hashedPassword = await hashPassword(plainPassword);
    newValues = { ...newValues, password: hashedPassword };
  }

  const userWithNewValues = { ...currentUser, ...newValues };

  const updatedUser = await runUpdateQuery(userWithNewValues);
  return updatedUser;

  async function runUpdateQuery(userWithNewValues) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          username = $2,
          email = LOWER($3),
          password = $4,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });

    return results.rows[0];
  }
}

async function setFeatures(userId, features) {
  const updatedUser = await runUpdateQuery(features);
  return updatedUser;

  async function runUpdateQuery(features) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          features = $2,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [userId, features],
    });

    return results.rows[0];
  }
}

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
      action: "Use a different email address to do this operation.",
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
      action: "Use a different username to do this operation.",
    });
  }
}

async function hashPassword(plainPassword) {
  const hashedPassword = await password.hash(plainPassword);
  return hashedPassword;
}

const user = {
  findOneById,
  findOneByUsername,
  findOneByEmail,
  create,
  update,
  setFeatures,
};

export default user;
