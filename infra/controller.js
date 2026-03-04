import * as cookie from "cookie";
import session from "models/session.js";
import user from "models/user.js";
import authorization from "models/authorization";

import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
} from "infra/errors.js";

function onNoMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, req, res) {
  if (
    (error instanceof ValidationError) |
    (error instanceof NotFoundError) |
    (error instanceof ForbiddenError)
  ) {
    return res.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    if (req.cookies.sid) {
      clearSessionCookie(res);
    }
    return res.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
    statusCode: error.statusCode,
  });
  console.error(publicErrorObject);
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function setSessionCookie(sessionToken, res) {
  const setCookie = cookie.serialize("sid", sessionToken, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  res.setHeader("Set-Cookie", setCookie);
}

function clearSessionCookie(res) {
  const setCookie = cookie.serialize("sid", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  res.setHeader("Set-Cookie", setCookie);

  if (!res.getHeader("Cache-Control")) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, max-age=0, must-revalidate",
    );
  }
}

async function injectAnonymousOrUser(req, res, next) {
  if (req.cookies?.sid) {
    await injectAuthenticatedUser(req);
    return next();
  }

  injectAnonymousUser(req);
  return next();
}

async function injectAuthenticatedUser(req) {
  const sessionToken = req.cookies.sid;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userObject = await user.findOneById(sessionObject.user_id);

  req.context = {
    ...req.context,
    user: userObject,
  };
}

function injectAnonymousUser(req) {
  const anonymousUserObject = {
    features: ["read:activation_token", "create:session", "create:user"],
  };

  req.context = {
    ...req.context,
    user: anonymousUserObject,
  };
}

function canRequest(feature) {
  return function canRequestMiddleware(req, res, next) {
    const userTryingToRequest = req.context.user;

    if (authorization.can(userTryingToRequest, feature)) {
      return next();
    }

    throw new ForbiddenError({
      message: "Insufficient permissions to perform this action.",
      action: "Verify your permissions or log in again.",
    });
  };
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};

export default controller;
