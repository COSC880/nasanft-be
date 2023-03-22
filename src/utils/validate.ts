import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { getUser } from "../model/UsersDb";

const accessTokenExpiresIn = "30m";
const refreshTokenExpiresIn = "200d";

export function createAccessToken(public_address: String) : string | undefined {
  return createToken(public_address, accessTokenExpiresIn);
}

export function createRefreshToken(public_address: String) : string | undefined {
  return createToken(public_address, refreshTokenExpiresIn);
}

export async function verifyRequest(req: Request, res: Response, next: NextFunction) {
  try {
    var token = getToken(req)!;
    const tokenRes = jwt.verify(token, process.env.JWT_SECRET!);
    const public_address = (tokenRes as JwtPayload).public_address; 
    if (public_address)  {
      res.locals.public_address = public_address;
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
    const user = await getUser(res.locals.public_address);
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

function createToken(public_address: String, expiresIn: string) : string | undefined {
  try {
    return "Bearer " + jwt.sign({ public_address: public_address }, process.env.JWT_SECRET!, {
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
