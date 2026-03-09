import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Insufficient permissions to perform this action.",
        action: "Verify your permissions or log in again.",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Retrieving pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `sid=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Insufficient permissions to perform this action.",
        action: "Verify your permissions or log in again.",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("Retrieving pending migrations", async () => {
      const privilegedUser = await orchestrator.createUser();
      await orchestrator.activateUser(privilegedUser);
      await orchestrator.addFeaturesToUser(privilegedUser, ["read:migration"]);
      const privilegedUserSessionObject = await orchestrator.createSession(
        privilegedUser.id,
      );

      const temporaryMigration = orchestrator.createTemporaryMigration();

      const getResponse = await fetch(
        "http://localhost:3000/api/v1/migrations",
        {
          headers: {
            Cookie: `sid=${privilegedUserSessionObject.token}`,
          },
        },
      );

      expect(getResponse.status).toBe(200);

      const getResponseBody = await getResponse.json();

      expect(Array.isArray(getResponseBody)).toBe(true);
      expect(getResponseBody.length).toBeGreaterThan(0);

      orchestrator.deleteTemporaryMigration(temporaryMigration);

      const postResponse = await fetch(
        "http://localhost:3000/api/v1/migrations",
        {
          method: "POST",
          headers: {
            Cookie: `sid=${privilegedUserSessionObject.token}`,
          },
        },
      );

      expect(postResponse.status).toBe(403);

      const postResponseBody = await postResponse.json();

      expect(postResponseBody).toEqual({
        name: "ForbiddenError",
        message: "Insufficient permissions to perform this action.",
        action: "Verify your permissions or log in again.",
        status_code: 403,
      });
    });
  });
});
