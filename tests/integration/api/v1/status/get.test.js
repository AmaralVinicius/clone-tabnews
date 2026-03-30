import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(parsedUpdatedAt).toBe(responseBody.updated_at);

      expect(typeof responseBody.dependencies.database.max_connections).toEqual(
        "number",
      );
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });

    describe("Privileged user", () => {
      test("Retrieving current system status", async () => {
        const privilegedUser = await orchestrator.createUser();
        await orchestrator.activateUser(privilegedUser);
        await orchestrator.addFeaturesToUser(privilegedUser, [
          "read:status:all",
        ]);
        const privilegedUserSessionObject = await orchestrator.createSession(
          privilegedUser.id,
        );

        const response = await fetch("http://localhost:3000/api/v1/status", {
          headers: {
            Cookie: `sid=${privilegedUserSessionObject.token}`,
          },
        });
        expect(response.status).toBe(200);

        const responseBody = await response.json();

        const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
        expect(parsedUpdatedAt).toBe(responseBody.updated_at);

        expect(responseBody.dependencies.database.version).toEqual("16.0");
        expect(
          typeof responseBody.dependencies.database.max_connections,
        ).toEqual("number");
        expect(responseBody.dependencies.database.opened_connections).toEqual(
          1,
        );
      });
    });
  });
});
