const jwt = require("jsonwebtoken");
var accessTokenExpiresIn = "30m";
var refreshTokenExpiresIn = "200d";

function createAccessToken(username) {
  return createToken(username, accessTokenExpiresIn);
}

function createRefreshToken(username) {
  return createToken(username, refreshTokenExpiresIn);
}

async function verifyRequest(req, res, callback) {
  try {
    var token = getToken(req);
    const res = jwt.verify(token, process.env.JWT_SECRET);
    if (res && res.username) {
      callback(res);
    } else {
      throw new Error("Invalid decoded token");
    }
  } catch (err) {
    res.status(403).send(err.message);
  }
}

function createToken(username, expiresIn) {
  try {
    return jwt.sign({ username: username }, process.env.JWT_SECRET, {
      expiresIn: expiresIn,
    });
  } catch (err) {
    console.error(err);
  }
  return null;
}

function getToken(req) {
  try {
    return req.header("x-auth-token").split(" ")[1];
  } catch {
    throw new Error("Invalid Token Provided");
  }
}

module.exports = { createAccessToken, createRefreshToken, verifyRequest };
