import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import session from "models/session.js";
import authorization from "models/authorization.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const userTryingToGet = req.context.user;
  const sessionToken = req.cookies.sid;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userFound = await user.findOneById(sessionObject.user_id);
  const newSession = await session.renew(sessionObject.id);

  controller.setSessionCookie(newSession.token, res);

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user:self",
    userFound,
  );

  return res.status(200).json(secureOutputValues);
}
