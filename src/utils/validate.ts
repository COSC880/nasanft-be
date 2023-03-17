import createHttpError from "http-errors";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { getUser, GetUser } from "../model/UsersDb";

const accessTokenExpiresIn = "30m";
const refreshTokenExpiresIn = "200d";

export function createAccessToken(username: String) : string | undefined {
  return createToken(username, accessTokenExpiresIn);
}

export function createRefreshToken(username: String) : string | undefined {
  return createToken(username, refreshTokenExpiresIn);
}

export async function verifyRequest(req: Request, res: Response, next: NextFunction) {
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
    res.status(401).json({text: message});
  }
}

export async function verifyAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getUser(res.locals.username);
    if (!user.error && user.data && user.data.isAdmin)
    {
      next();
    } else {
      throw new Error("User does not have administrator rights");
    }
  } catch (err) {
    const message = (err as Error).message ? (<Error>err).message : String(err);
    res.status(403).json({text: message});
  }
}

export function verifyPostParams(requiredParams: string[])
{
  return (req: Request, res: Response, next: NextFunction) => {
    var invalidParameter: string | undefined | null;
    requiredParams.forEach((param: string) => {
      const value = req.body[param];
      if (value === null || value === undefined)
      {
        invalidParameter = param;
      }
    });

    if (invalidParameter)
    {
      res.status(400).json({text: "Missing required parameter " + invalidParameter});
    }
    else
    {
      next();
    }
  };
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
