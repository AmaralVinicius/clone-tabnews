import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import { ForbiddenError } from "infra/errors.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const userTryingToGet = req.context.user;
  const { username } = req.query;
  const userFound = await user.findOneByUsername(username);

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user",
    userFound,
  );

  return res.status(200).json(secureOutputValues);
}

async function patchHandler(req, res) {
  const { username: usernameToSearch } = req.query;
  const { username, email, password } = req.body;

  const userTryingToPatch = req.context.user;
  const targetUser = await user.findOneByUsername(usernameToSearch);

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Insufficient permissions to perform this action.",
      action: "Verify your permissions or log in again.",
    });
  }

  const updatedUser = await user.update(usernameToSearch, {
    username,
    email,
    plainPassword: password,
  });

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:user",
    updatedUser,
  );

  return res.status(200).json(secureOutputValues);
}
