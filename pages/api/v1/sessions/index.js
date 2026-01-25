import { createRouter } from "next-connect";
import * as cookie from "cookie";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import session from "models/session.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const { email, password: plainPassword } = req.body;

  const authenticatedUser = await authentication.getValidatedUser({
    email,
    plainPassword,
  });

  const newSession = await session.create(authenticatedUser.id);

  const setCookie = cookie.serialize("sid", newSession.token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  res.setHeader("Set-Cookie", setCookie);

  return res.status(201).json(newSession);
}
