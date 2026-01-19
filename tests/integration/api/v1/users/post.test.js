import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const userData = {
        username: "cursodev",
        email: "contato@cursodev.com",
        password: "secretpassword",
      };

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: userData.username,
        email: userData.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername(userData.username);
      const correctPasswodMatch = await password.compare(
        userData.password,
        userInDatabase.password,
      );
      const incorrectPasswodMatch = await password.compare(
        "incorrectPassword",
        userInDatabase.password,
      );

      expect(correctPasswodMatch).toBe(true);
      expect(incorrectPasswodMatch).toBe(false);
    });
    test("With duplicated 'email'", async () => {
      const userData1 = {
        username: "duplicatedemail1",
        email: "duplicated@email.com",
        password: "secretpassword",
      };

      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData1),
      });
      expect(response1.status).toBe(201);

      const userData2 = {
        username: "duplicatedemail2",
        email: "Duplicated@email.com",
        password: "secretpassword",
      };

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData2),
      });
      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "The email address provided is already in use.",
        action: "Use a different email address to sign up.",
        status_code: 400,
      });
    });
    test("With duplicated 'username'", async () => {
      const userData1 = {
        username: "duplicatedusername",
        email: "username1@email.com",
        password: "secretpassword",
      };

      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData1),
      });
      expect(response1.status).toBe(201);

      const userData2 = {
        username: "DuplicatedUsername",
        email: "username2@email.com",
        password: "secretpassword",
      };

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData2),
      });
      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "The username provided is already in use.",
        action: "Use a different username to sign up.",
        status_code: 400,
      });
    });
  });
});
