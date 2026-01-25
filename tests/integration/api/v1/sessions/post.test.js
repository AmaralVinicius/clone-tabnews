import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With incorrect 'email' but correct 'password'", async () => {
      const userPassword = "correctpassword";
      await orchestrator.createUser({
        password: userPassword,
      });

      const incorrectEmailToFecth = "email.errado@email.com";

      const createSessionResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: incorrectEmailToFecth,
            password: userPassword,
          }),
        },
      );
      expect(createSessionResponse.status).toBe(401);

      const createSessionResponseBody = await createSessionResponse.json();

      expect(createSessionResponseBody).toEqual({
        name: "UnauthorizedError",
        message: "We couldn't log you in with the information provided.",
        action: "Check your credentials and try again.",
        status_code: 401,
      });
    });
    test("With correct 'email' but incorrect 'password'", async () => {
      const createdUser = await orchestrator.createUser({
        email: "user1@email.com",
      });

      const incorrectPasswordToFecth = "incorrectpassword";

      const createSessionResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: createdUser.email,
            password: incorrectPasswordToFecth,
          }),
        },
      );
      expect(createSessionResponse.status).toBe(401);

      const createSessionResponseBody = await createSessionResponse.json();

      expect(createSessionResponseBody).toEqual({
        name: "UnauthorizedError",
        message: "We couldn't log you in with the information provided.",
        action: "Check your credentials and try again.",
        status_code: 401,
      });
    });
    test("With incorrect 'email' and incorrect 'password'", async () => {
      await orchestrator.createUser({
        email: "user2@email.com",
      });

      const incorrectPasswordToFecth = "incorrectpassword";
      const incorrectEmailToFecth = "email.errado@email.com";

      const createSessionResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: incorrectEmailToFecth,
            password: incorrectPasswordToFecth,
          }),
        },
      );
      expect(createSessionResponse.status).toBe(401);

      const createSessionResponseBody = await createSessionResponse.json();

      expect(createSessionResponseBody).toEqual({
        name: "UnauthorizedError",
        message: "We couldn't log you in with the information provided.",
        action: "Check your credentials and try again.",
        status_code: 401,
      });
    });
    test("With correct 'email' and correct 'password'", async () => {
      const userPassword = "correctpassword";
      const createdUser = await orchestrator.createUser({
        email: "user3@email.com",
        password: userPassword,
      });

      const createSessionResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: createdUser.email,
            password: userPassword,
          }),
        },
      );
      expect(createSessionResponse.status).toBe(201);

      const createSessionResponseBody = await createSessionResponse.json();

      expect(createSessionResponseBody).toEqual({
        id: createSessionResponseBody.id,
        token: createSessionResponseBody.token,
        user_id: createdUser.id,
        expires_at: createSessionResponseBody.expires_at,
        created_at: createSessionResponseBody.created_at,
        updated_at: createSessionResponseBody.updated_at,
      });

      expect(uuidVersion(createSessionResponseBody.id)).toBe(4);
      expect(uuidVersion(createSessionResponseBody.user_id)).toBe(4);
      expect(Date.parse(createSessionResponseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(createSessionResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(createSessionResponseBody.updated_at)).not.toBeNaN();

      const expiresAt = new Date(createSessionResponseBody.expires_at);
      const createdAt = new Date(createSessionResponseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(session.EXPIRATION_IN_MILLISECONDS);

      const parsedSetCookie = setCookieParser(createSessionResponse, {
        map: true,
      });

      expect(parsedSetCookie.sid).toEqual({
        name: "sid",
        value: createSessionResponseBody.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
