import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import { NotFoundError } from "infra/errors.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 30 * 1000; // 30 Minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Curso.dev <contato@curso.dev>",
    to: user.email,
    subject: "Ative seu cadastro no TabNews!",
    text: `Olá ${user.username}, clique no link abaixo para ativar seu cadastro no TabNews:

${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente,
Equipe TabNews`,
  });
}

async function findOneValidById(activationTokenId) {
  const sessionFound = await runSelectQuery(activationTokenId);
  return sessionFound;

  async function runSelectQuery(activationTokenId) {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM 
          user_activation_tokens
        WHERE
          id = $1
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT
          1
      ;`,
      values: [activationTokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "The activation token was not found or has expired.",
        action: "Please register again.",
      });
    }

    return results.rows[0];
  }
}

const activation = {
  create,
  sendEmailToUser,
  findOneValidById,
};

export default activation;
