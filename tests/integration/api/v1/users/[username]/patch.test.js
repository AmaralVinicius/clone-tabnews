import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent 'username'", async () => {
      const usernameToFetch = "nonexistentuser";

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${usernameToFetch}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "The username provided was not found.",
        action: "Verify the provided username and try again.",
        status_code: 404,
      });
    });
    test("With duplicated 'username'", async () => {
      const userData1 = {
        username: "user1",
        email: "user1@email.com",
        password: "secretpassword",
      };

      const user1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData1),
      });
      expect(user1.status).toBe(201);

      const userData2 = {
        username: "user2",
        email: "user2@email.com",
        password: "secretpassword",
      };

      const user2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData2),
      });
      expect(user2.status).toBe(201);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userData2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: userData1.username }),
        },
      );
      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "The username provided is already in use.",
        action: "Use a different username to do this operation.",
        status_code: 400,
      });
    });
    test("With duplicated 'email'", async () => {
      const userData3 = {
        username: "user3",
        email: "user3@email.com",
        password: "secretpassword",
      };

      const user3 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData3),
      });
      expect(user3.status).toBe(201);

      const userData4 = {
        username: "user4",
        email: "user4@email.com",
        password: "secretpassword",
      };

      const user4 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData4),
      });
      expect(user4.status).toBe(201);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userData4.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: userData3.email }),
        },
      );
      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "The email address provided is already in use.",
        action: "Use a different email address to do this operation.",
        status_code: 400,
      });
    });
    test("With unique 'username'", async () => {
      const userData5 = {
        username: "user5",
        email: "user5@email.com",
        password: "secretpassword",
      };

      const user5 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData5),
      });
      expect(user5.status).toBe(201);

      const newUsername = "newUsername";

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userData5.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: newUsername,
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: newUsername,
        email: userData5.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
    test("With unique 'email'", async () => {
      const userData6 = {
        username: "user6",
        email: "user6@email.com",
        password: "secretpassword",
      };

      const user6 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData6),
      });
      expect(user6.status).toBe(201);

      const newEmail = "newemail@email.com";

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userData6.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: newEmail,
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: userData6.username,
        email: newEmail,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
    test("With new 'password'", async () => {
      const userData7 = {
        username: "user7",
        email: "user7@email.com",
        password: "secretpassword",
      };

      const user7 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData7),
      });
      expect(user7.status).toBe(201);

      const newPassword = "newsecretpassword";

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userData7.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: newPassword,
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: userData7.username,
        email: userData7.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(userData7.username);
      const correctPasswodMatch = await password.compare(
        newPassword,
        userInDatabase.password,
      );
      const incorrectPasswodMatch = await password.compare(
        userData7.password,
        userInDatabase.password,
      );

      expect(correctPasswodMatch).toBe(true);
      expect(incorrectPasswodMatch).toBe(false);
    });
  });
});
