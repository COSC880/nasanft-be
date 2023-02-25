import createHttpError from "http-errors";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const accessTokenExpiresIn = "30m";
const refreshTokenExpiresIn = "200d";

function createAccessToken(username: String) : string | undefined {
  return createToken(username, accessTokenExpiresIn);
}

function createRefreshToken(username: String) : string | undefined {
  return createToken(username, refreshTokenExpiresIn);
}

async function verifyRequest(req: Request, res: Response, next: NextFunction) {
  try {
    var token = getToken(req)!;
    const tokenRes = jwt.verify(token, process.env.JWT_SECRET!);
    const username = (tokenRes as JwtPayload).username; 
    if (username)  {
      res.locals.username = (tokenRes as JwtPayload).username;
      next();
    } else {
      throw new Error("Invalid decoded token");
    }
  } catch (err) {
    const message = (err as Error).message ? (<Error>err).message : String(err);
    res.status(403).json({text: message});
  }
}

function verifyPostParams(req: Request, res: Response, requiredParams: string[])
{
  var invalidParameter;
  requiredParams.forEach(function(param){
    if (!req.body[param])
    {
      invalidParameter = param;
    }
  });

  if (invalidParameter)
  {
    res.status(400).json({text: "Missing required parameter " + invalidParameter});
    return false;
  }
  return true;
}

function createToken(username: String, expiresIn: string) : string | undefined {
  try {
    return jwt.sign({ username: username }, process.env.JWT_SECRET!, {
      expiresIn: expiresIn,
    });
  } catch (err) {
    console.error(err);
  }
  return undefined;
}

function getToken(req: Request) : string | undefined {
  const token = req.header("x-auth-token")?.split(" ")[1];
  if (token)
  {
    return token;
  }
  throw new Error("Invalid Token Provided");
}

export default { createAccessToken, createRefreshToken, verifyRequest, verifyPostParams };
