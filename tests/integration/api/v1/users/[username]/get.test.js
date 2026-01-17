import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      const userData = {
        username: "SameCase",
        email: "same.case@email.com",
        password: "secretpassword",
      };

      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      expect(response1.status).toBe(201);

      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${userData.username}`,
      );
      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });
    test("With case mismatch", async () => {
      const userData = {
        username: "DifferentCase",
        email: "differentecase@email.com",
        password: "secretpassword",
      };

      const usernameToFetch = "differentcase";

      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      expect(response1.status).toBe(201);

      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${usernameToFetch}`,
      );
      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });
    test("With nonexistent username", async () => {
      const usernameToFetch = "nonexistentuser";

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${usernameToFetch}`,
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
  });
});
