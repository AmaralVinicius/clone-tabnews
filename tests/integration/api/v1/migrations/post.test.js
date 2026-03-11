import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Running pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
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

  describe("Default user", () => {
    test("Running pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
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
    test("Running pending migrations", async () => {
      const privilegedUser = await orchestrator.createUser();
      await orchestrator.activateUser(privilegedUser);
      await orchestrator.addFeaturesToUser(privilegedUser, [
        "read:migration",
        "create:migration",
      ]);
      const privilegedUserSessionObject = await orchestrator.createSession(
        privilegedUser.id,
      );

      const temporaryMigration = orchestrator.createTemporaryMigration();

      const firstResponse = await fetch(
        "http://localhost:3000/api/v1/migrations",
        {
          method: "POST",
          headers: {
            Cookie: `sid=${privilegedUserSessionObject.token}`,
          },
        },
      );
      expect(firstResponse.status).toBe(201);

      const firstResponseBody = await firstResponse.json();

      expect(Array.isArray(firstResponseBody)).toBe(true);
      expect(firstResponseBody.length).toBeGreaterThan(0);

      orchestrator.deleteTemporaryMigration(temporaryMigration);

      const secondResponse = await fetch(
        "http://localhost:3000/api/v1/migrations",
        {
          method: "POST",
          headers: {
            Cookie: `sid=${privilegedUserSessionObject.token}`,
          },
        },
      );
      expect(secondResponse.status).toBe(200);

      const secondResponseBody = await secondResponse.json();

      expect(Array.isArray(secondResponseBody)).toBe(true);
      expect(secondResponseBody.length).toBe(0);
    });
  });
});
