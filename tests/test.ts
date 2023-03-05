import request from "supertest";
import app from "../src/app";
import generateImageFromAttributes from "../src/utils/generateImage";
import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { Database as User } from "../src/model/Users";

describe("NasaFT", function () {
  it("Shouldnt be able to get access token without refresh token.", async () => {
    await request(app).post("/api/token/refresh").expect(403);
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
    const username = "EarthSunRockStar"
    const res = await request(app).post("/api/token/login").send({
      username: username,
      password: "FavoritePlaceIsSpace"
    });
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');

    const userRes = await request(app).get("/api/users/").set("x-auth-token", res.body.accessToken);
    expect(userRes.body).toHaveProperty('user_name', username);
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
  it("Inserting user with required data should insert data", async () => {
    const authenication = await getAuthenticationHeader();
    const user: User['users_data']['Tables']['user_data']['Insert'] = {
      user_name: "SpaceXCellAnt",
      public_address: "0x0000000000000000000000000000000000000000"
    };
    
    await request(app).post("/api/users/").send(user)
      .set(authenication.field, authenication.value!).expect(201);
  });
  it("Inserting user without required data should not insert data", async () => {
    const authenication = await getAuthenticationHeader();
    //Missing user_name
    await request(app).post("/api/users/").send({public_address: "0x0000000000000000000000000000000000000000"})
      .set(authenication.field, authenication.value!).expect(400);
  });
  it("Should be able to update user", async () => {
    const authenication = await getAuthenticationHeader();
    const time = "22:56:00+00";

    const user: User['users_data']['Tables']['user_data']['Update'] = {
      last_completed: time
    };
    
    const res = await request(app).put("/api/users/").send({user: user, user_name: "SpaceXCellAnt"})
      .set(authenication.field, authenication.value!);
    expect(res.body.last_completed).toEqual(time);
  });
  it("Should be able to get another user", async () => {
    const authenication = await getAuthenticationHeader();
    const username = "SpaceXCellAnt";

    const res = await request(app).get("/api/users/" + username).set(authenication.field, authenication.value!);
    expect(res.body.user_name).toEqual(username);
  });
  it("Should be able to delete user", async () => {
    const authenication = await getAuthenticationHeader();
    const user: User['users_data']['Tables']['user_data']['Update'] = {
      user_name: "SpaceXCellAnt"
    };
    
    const res = await request(app).delete("/api/users/").send(user)
      .set(authenication.field, authenication.value!);
    expect(res.status).toEqual(204);
  });
});

async function getAuthenticationHeader() 
{
  const res = await request(app).post("/api/token/login").send({
    username: "GiveMeSomeSpace",
    password: "YodaBest",
  });
  return { field: "x-auth-token", value: res.body.accessToken };
}