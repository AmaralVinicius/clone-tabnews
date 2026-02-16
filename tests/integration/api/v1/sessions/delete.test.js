import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  describe("Default user", () => {
    test("With non existent session", async () => {
      const nonExistentToken =
        "8bfb1d0d3412c760b79ed776cd0fe01a729291b0f9f26f3ff4cbb1162b4b8c0ee79e4d950b3cfe5287bdaa0cbbe25ecf";

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `sid=${nonExistentToken}`,
        },
      });
      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "The user doesn't have an actived session.",
        action: "Check if the user is logged in and try again.",
        status_code: 401,
      });
    });
    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({
        username: "userWithExpiredSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `sid=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "The user doesn't have an actived session.",
        action: "Check if the user is logged in and try again.",
        status_code: 401,
      });
    });
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "userWithValidSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `sid=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: createdUser.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(responseBody.user_id)).toBe(4);
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(
        responseBody.expires_at < sessionObject.expires_at.toISOString(),
      ).toBe(true);
      expect(
        responseBody.updated_at > sessionObject.updated_at.toISOString(),
      ).toBe(true);

      // Set-Cookie ssertions
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.sid).toEqual({
        name: "sid",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });

      // Double check assertions
      const doubleCheckResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "DELETE",
          headers: {
            Cookie: `sid=${sessionObject.token}`,
          },
        },
      );
      expect(doubleCheckResponse.status).toBe(401);

      const doubleCheckResponseBody = await doubleCheckResponse.json();

      expect(doubleCheckResponseBody).toEqual({
        name: "UnauthorizedError",
        message: "The user doesn't have an actived session.",
        action: "Check if the user is logged in and try again.",
        status_code: 401,
      });
    });
  });
});
