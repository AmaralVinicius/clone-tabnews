import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import authorization from "models/authorization.js";
import session from "models/session.js";

import { ForbiddenError } from "infra/errors.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const { email, password: plainPassword } = req.body;

  const authenticatedUser = await authentication.getValidatedUser({
    email,
    plainPassword,
  });

  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "You do not have permission to perform this action.",
      action: "Check your permission level or if you are logged in .",
    });
  }

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(newSession.token, res);

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return res.status(201).json(newSession);
}

async function deleteHandler(req, res) {
  const sessionToken = req.cookies.sid;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const expiredSession = await session.expireById(sessionObject.id);

  controller.clearSessionCookie(res);

  return res.status(200).json(expiredSession);
}
