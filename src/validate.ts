import createHttpError from "http-errors";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";

const accessTokenExpiresIn = "30m";
const refreshTokenExpiresIn = "200d";

function createAccessToken(username: String) {
  return createToken(username, accessTokenExpiresIn);
}

function createRefreshToken(username: String) {
  return createToken(username, refreshTokenExpiresIn);
}

async function verifyRequest(req: Request, res: Response, callback: (res: JwtPayload) => void) {
  try {
    var token = getToken(req)!;
    const tokenRes = jwt.verify(token, process.env.JWT_SECRET!);
    if (tokenRes && (tokenRes as JwtPayload).username) {
      callback((tokenRes as JwtPayload));
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

function createToken(username: String, expiresIn: string) {
  try {
    return jwt.sign({ username: username }, process.env.JWT_SECRET!, {
      expiresIn: expiresIn,
    });
  } catch (err) {
    console.error(err);
  }
  return null;
}

function getToken(req: Request) {
  try {
    return req.header("x-auth-token")?.split(" ")[1];
  } catch(err) {
    console.log(err);
    throw new Error("Invalid Token Provided");
  }
}

export default { createAccessToken, createRefreshToken, verifyRequest, verifyPostParams };