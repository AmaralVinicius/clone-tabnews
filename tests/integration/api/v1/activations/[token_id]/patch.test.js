import orchestrator from "tests/orchestrator.js";
import activation from "models/activation.js";
import user from "models/user.js";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("PATCH /api/v1/activations/[token_id]", () => {
  describe("Anonymous user", () => {
    test("With non existent token", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/activations/256bc49a-132a-42e4-8334-998fd17ee71e",
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "The activation token was not found or has expired.",
        action: "Please register again.",
        status_code: 404,
      });
    });
    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser();
      const expiredActivationToken = await activation.create(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredActivationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "The activation token was not found or has expired.",
        action: "Please register again.",
        status_code: 404,
      });
    });
    test("With already used token", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);

      const tokenActivationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(tokenActivationResponse.status).toBe(200);

      const secondTokenActivationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(secondTokenActivationResponse.status).toBe(404);

      const secondTokenActivationResponseBody =
        await secondTokenActivationResponse.json();

      expect(secondTokenActivationResponseBody).toEqual({
        name: "NotFoundError",
        message: "The activation token was not found or has expired.",
        action: "Please register again.",
        status_code: 404,
      });
    });
    test("With valid token", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);

      const tokenActivationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(tokenActivationResponse.status).toBe(200);

      const tokenActivationResponseBody = await tokenActivationResponse.json();

      expect(tokenActivationResponseBody).toEqual({
        id: activationToken.id,
        used_at: tokenActivationResponseBody.used_at,
        user_id: activationToken.user_id,
        expires_at: activationToken.expires_at.toISOString(),
        created_at: activationToken.created_at.toISOString(),
        updated_at: tokenActivationResponseBody.updated_at,
      });

      expect(uuidVersion(tokenActivationResponseBody.id)).toBe(4);
      expect(uuidVersion(tokenActivationResponseBody.user_id)).toBe(4);

      expect(Date.parse(tokenActivationResponseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(tokenActivationResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(tokenActivationResponseBody.updated_at)).not.toBeNaN();
      expect(
        tokenActivationResponseBody.updated_at >
          tokenActivationResponseBody.created_at,
      ).toBe(true);

      const expiresAt = new Date(tokenActivationResponseBody.expires_at);
      const createdAt = new Date(tokenActivationResponseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(activation.EXPIRATION_IN_MILLISECONDS);

      const activatedUser = await user.findOneById(
        tokenActivationResponseBody.user_id,
      );
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
      ]);
    });
    test("With valid token but already activated user", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const activationToken = await activation.create(createdUser.id);

      const tokenActivationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(tokenActivationResponse.status).toBe(403);

      const tokenActivationResponseBody = await tokenActivationResponse.json();

      expect(tokenActivationResponseBody).toEqual({
        name: "ForbiddenError",
        message: "The user cant perform this action.",
        action: "Check if the user has the permission.",
        status_code: 403,
      });
    });
  });
  describe("Default user", () => {
    test("With valid token, but already logged in user", async () => {
      const loggedUser = await orchestrator.createUser();
      await orchestrator.activateUser(loggedUser);
      const loggedUserSessionObject = await orchestrator.createSession(
        loggedUser.id,
      );

      const inactiveUser = await orchestrator.createUser();
      const inactiveUserActivationToken = await activation.create(
        inactiveUser.id,
      );

      const tokenActivationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${inactiveUserActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `sid=${loggedUserSessionObject.token}`,
          },
        },
      );

      expect(tokenActivationResponse.status).toBe(403);

      const tokenActivationResponseBody = await tokenActivationResponse.json();

      expect(tokenActivationResponseBody).toEqual({
        name: "ForbiddenError",
        message: "Insufficient permissions to perform this action.",
        action: "Verify your permissions or log in again.",
        status_code: 403,
      });
    });
  });
});
