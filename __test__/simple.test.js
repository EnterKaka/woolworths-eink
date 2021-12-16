const request = require('supertest');
const MongoClient = require("mongodb").MongoClient;
const app = require('../app_test');
const api = require('../routes/api');
jest.setTimeout(10000);

describe("Test example", () => {
    // Hidden for simplicity
    test("POST /api/allmodels/timeinterval", async (done) => {
      request(app)
        .post("/api/allmodels/timeinterval")
        .expect("Content-Type", /json/)
        .send({
          from: "2010.10.10 10:10:10"
        })
        .expect(201).
        expect((res) => {
          // res.body.data.length = 2;
          // res.body.data[0].email = "test@example.com";
          // res.body.data[1].email = "francisco@example.com";
        })
        .end((err, res) => {
          if (err) return done(err);
          // elementId = res.body.data[1].id;
          return done();
        });
        // Even more logic goes here
    });
    // More things come here
  });
  // describe('insert', () => {
  //   let connection;
  //   let db;
  
  //   beforeAll(async () => {
  //     connection = await MongoClient.connect("mongodb://127.0.0.1:27017/", {
  //       useUnifiedTopology: true,
  //       useNewUrlParser: true,
  //       connectTimeoutMS: 30000,
  //     });
  //     db = await connection.db('111');
  //   });
  
  //   afterAll(async () => {
  //     await connection.close();
  //     // await db.close();
  //   });
  
  //   it('should insert a doc into collection', async () => {
  //     const users = db.collection('users');
  
  //     const mockUser = {_id: 'some-user-id', name: 'John'};
  //     await users.insertOne(mockUser);
  
  //     const insertedUser = await users.findOne({_id: 'some-user-id'});
  //     expect(insertedUser).toEqual(mockUser);
  //   });
  // });