import request from "supertest";
import app from "../src/app";
import generateImageFromAttributes from "../src/utils/generateImage";
import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { InsertUser, UpdateUser } from "../src/model/UsersDb";
import { Question, Answer, stopSetRandomQuizJob } from "../src/model/QuizzesDb";

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
    const expectedImage = PNG.sync.read(fs.readFileSync(path.join(__dirname, "baselineImages", "average_far_small.png")));
    const actualBuffer = await generateImageFromAttributes("background", "average", "far", "small");
    const actualImage = PNG.sync.read(actualBuffer!);
    const {width, height} = expectedImage;
    const diffImage = new PNG({width, height});
    const match = pixelmatch(expectedImage.data, actualImage.data, diffImage.data, width, height);
    expect(match).toEqual(0);
  });
  it("Inserting user with required data should insert data", async () => {
    const authenication = await getAuthenticationHeader();
    const user: InsertUser = {
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

    const user: UpdateUser = {
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
    const user: UpdateUser = {
      user_name: "SpaceXCellAnt"
    };
    
    const res = await request(app).delete("/api/users/").send(user)
      .set(authenication.field, authenication.value!);
    expect(res.status).toEqual(204);
  });
  it("Should be able to get a random quiz", async () => {
    const authenication = await getAuthenticationHeader();
    
    const res = await request(app).get("/api/quizzes/")
      .set(authenication.field, authenication.value!);
    expect(res.status).toEqual(200);

    const id = res.body.quiz_id;

    //Force quiz refresh
    const res2 = await request(app).put("/api/quizzes/")
      .set(authenication.field, authenication.value!);
    expect(res2.status).toEqual(200);

    const res3 = await request(app).get("/api/quizzes/")
    .set(authenication.field, authenication.value!);
    expect(res3.status).toEqual(200);
    expect(res3.body.quiz_id).not.toEqual(id);
  });
  it("Questions should have the right answers returned", async () => {
    const authenication = await getAuthenticationHeader();
    
    const res = await request(app).get("/api/quizzes/")
      .set(authenication.field, authenication.value!);
    expect(res.status).toEqual(200);
    res.body.questions.forEach((question: Question) => {
      question?.answers.forEach((answer: Answer) => {
        expect(answer?.question_id).toEqual(question.question_id);
      });
    });
  });
  it("Should be able to get specific quiz", async () => {
    const authenication = await getAuthenticationHeader();
    const quiz_id  = "0e16e3ff-e7c9-42b4-9984-b4c005443194"

    const res = await request(app).get("/api/quizzes/" + quiz_id)
      .set(authenication.field, authenication.value!);
    expect(res.status).toEqual(200);
    expect(res.body.quiz_id).toEqual(quiz_id);
    res.body.questions.forEach((question: Question) => {
      expect(question?.quiz_id).toEqual(quiz_id);
      question?.answers.forEach((answer: Answer) => {
        expect(answer?.quiz_id).toEqual(quiz_id);
      });
    });
  });
  it("Should be able to stop cron job", async () => {
    expect(stopSetRandomQuizJob).not.toThrowError();
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

async function saveImage(path: string, buffer: Buffer | undefined)
{
  if (buffer)
  {
    //Add extension if doesnt exist
    if (!path.toLowerCase().endsWith(".png"))
    {
      path = path + ".png"
    }
    fs.writeFileSync(path, buffer);
  }
}