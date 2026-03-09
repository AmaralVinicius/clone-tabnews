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
  const { username } = req.query;

  const userFound = await user.findOneByUsername(username);

  return res.status(200).json(userFound);
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

  return res.status(200).json(updatedUser);
}
