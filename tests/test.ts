import request from "supertest";
import app from "../src/app";

describe("NasaFT", function () {
  it("Shouldnt be able to get access token without refresh token.", async () => {
    const res = await request(app).post("/api/token/refresh");
    expect(res.status).toEqual(403);
  });
  it("Should be able to authenticate and then get an access token.", async () => {
    const res = await request(app).post("/api/token/login").send({
      username: "xXSpacedOutXx",
      password: "INeedSpace"
    });
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');

    const refreshRes = await request(app).post("/api/token/refresh").set("x-auth-token", res.body.refreshToken);
    expect(res.body).toHaveProperty('accessToken');
  });
});