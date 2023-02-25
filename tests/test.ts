import request from "supertest";
import app from "../src/app";
import generateImageFromAttributes from "../src/utils/generateImage";
import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

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
    expect(refreshRes.body).toHaveProperty('accessToken');
  });
  it("Should be able to get username from middleware that decoded token.", async () => {
    const username = "EarthRockSunStarIRockStar"
    const res = await request(app).post("/api/token/login").send({
      username: username,
      password: "FavoritePlaceIsSpace"
    });
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');

    const userRes = await request(app).get("/api/users/read").set("x-auth-token", res.body.accessToken);
    expect(userRes.body).toHaveProperty('username', username);
  });
  it("Test generating nft image", async () => {
    const expectedImage = PNG.sync.read(fs.readFileSync(path.join(__dirname, "baselineImages", "hazardSmall.png")));
    const actualBuffer = await generateImageFromAttributes("background1", new Map<String, String>([
      ["size", "small"],
      ["isHazardous", "hazard"]
    ]));
    const actualImage = PNG.sync.read(actualBuffer!);
    const {width, height} = expectedImage;
    const diffImage = new PNG({width, height});
    const match = pixelmatch(expectedImage.data, actualImage.data, diffImage.data, width, height);
    expect(match).toEqual(0);
  });
});