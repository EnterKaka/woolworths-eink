const request = require("supertest");
const app = require("express");
describe("Post Endpoints", () => {
    it("should create a new post", async () => {
        const res = await request(app).post("/database/import").send({
            filename: "17.11.2021_total.json",
            dbname: "111111",
            collectionname: "22222",
        });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty("post");
    });
});
