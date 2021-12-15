const request = require('supertest')
const app = require('../app')
jest.setTimeout(50000);
describe("Test example", () => {
    // Hidden for simplicity
    test("POST /api/allmodels/timeinterval", (done) => {
      request(app)
        .post("/api/allmodels/timeinterval")
        .expect("Content-Type", /json/)
        .send({
          from: "2010.10.10 10:10:10"
        })
        .expect(201)
        // Even more logic goes here
    });
    // More things come here
  });