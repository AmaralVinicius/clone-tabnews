import authorization from "models/authorization.js";
import { InternalServerError } from "infra/errors.js";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("Without 'user'", () => {
      expect(() => authorization.can()).toThrow(InternalServerError);
    });
    test("Without 'user.features'", () => {
      const createdUser = {
        username: "UserWithtoutFeatures",
      };
      expect(() => authorization.can(createdUser)).toThrow(InternalServerError);
    });
    test("Without unknow 'feature'", () => {
      const createdUser = {
        features: [],
      };
      expect(() => authorization.can(createdUser, "unknow:feature")).toThrow(
        InternalServerError,
      );
    });
    test("With valid 'user' and 'feature'", () => {
      const createdUser = {
        features: ["create:user"],
      };
      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("Without 'user'", () => {
      expect(() => authorization.filterOutput()).toThrow(InternalServerError);
    });
    test("Without 'user.features'", () => {
      const createdUser = {
        username: "UserWithtoutFeatures",
      };
      expect(() => authorization.filterOutput(createdUser)).toThrow(
        InternalServerError,
      );
    });
    test("Without unknow 'feature'", () => {
      const createdUser = {
        features: [],
      };
      expect(() =>
        authorization.filterOutput(createdUser, "unknow:feature"),
      ).toThrow(InternalServerError);
    });
    test("With valid 'user' and 'feature' but no 'resource'", () => {
      const createdUser = {
        features: [],
      };
      expect(() =>
        authorization.filterOutput(createdUser, "read:user"),
      ).toThrow(InternalServerError);
    });
    test("With valid 'user' and 'feature' and 'resource'", () => {
      const createdUser = {
        features: ["read:user"],
      };

      const resource = {
        id: "b8a72e4f-b195-4eaf-9fcc-d350afe0d583",
        username: "mocked_user",
        email: "mocked_user@yahoo.com",
        password:
          "$2b$04$N2MAkU3onbxI5Ba9EB8bceKyRKFrgRyjWAlod3UAFIra0wjKHHchG",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        features: ["create:session", "read:session", "update:user"],
      };

      expect(
        authorization.filterOutput(createdUser, "read:user", resource),
      ).toEqual({
        id: "b8a72e4f-b195-4eaf-9fcc-d350afe0d583",
        username: "mocked_user",
        features: ["create:session", "read:session", "update:user"],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });
    });
  });
});
