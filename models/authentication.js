import user from "models/user.js";
import password from "models/password.js";
import { NotFoundError, UnauthorizedError } from "infra/errors.js";

async function getValidatedUser({ email, plainPassword }) {
  try {
    const userFound = await findUserByEmail(email);
    await validatePassword(plainPassword, userFound.password);

    return userFound;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "We couldn't log you in with the information provided.",
        action: "Check your credentials and try again.",
      });
    }

    throw error;
  }

  async function findUserByEmail(email) {
    try {
      const userFound = await user.findOneByEmail(email);
      return userFound;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Wrong email.",
          action: "Check the provided email.",
        });
      }

      throw error;
    }
  }

  async function validatePassword(plainPassword, hashedPassword) {
    const correctPasswodMatch = await password.compare(
      plainPassword,
      hashedPassword,
    );

    if (!correctPasswodMatch) {
      throw new UnauthorizedError({
        message: "Wrong password.",
        action: "Check the provided password.",
      });
    }
  }
}

const authentication = {
  getValidatedUser,
};

export default authentication;
