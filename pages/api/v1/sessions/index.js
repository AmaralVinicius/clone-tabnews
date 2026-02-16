import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import session from "models/session.js";

const router = createRouter();

router.post(postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const { email, password: plainPassword } = req.body;

  const authenticatedUser = await authentication.getValidatedUser({
    email,
    plainPassword,
  });

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
