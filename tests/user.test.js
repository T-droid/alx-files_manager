const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const mocha = require('mocha');

const app = require('../server');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

chai.use(chaiHttp) // use http for the reqs

const assert = chai.assert;
const expect = chai.expect;

describe('testing endpoints', ()=>{
    /** TODO
     *  GET /status
     *  GET /stats
     *  POST /users
     *  GET /connect
     *  GET /disconnect
     *  GET /users/me
    */
    afterEach(() => {
        sinon.restore()
      })
   // Mock the database f
    describe('GET /status', () =>{
        it('returns correct status code and response', (done) => {
            chai.request(app)
                .get('/status')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('redis');
                    expect(res.body).to.have.property('db');
                    done();
                });
        });
    });

    describe('GET /stats', ()=> {
        it('returns correct response and status code', (done)=>{
            chai.request(app)
                .get('/stats')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('users');
                    expect(res.body).to.have.property('files');
                    expect(res.body.users && res.body.files).to.be.an('number');
                    done();
                });
        });
    });

    describe("POST /users", ()=> {
        it('gives correct response when email is missing', (done) => {
            const formData = {'password': "hola"};
            chai.request(app)
                .post('/users')
                .send(formData)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('error');
                    done();
                });
        });

        it('gives correct response when password is missing', (done)=>{
            const formData = {'email': "coder@mail.com"};
            chai.request(app)
                .post('/users')
                .send(formData)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('error');
                    done();
                });
        });

        it('gives correct response when both fields are present', (done)=>{
            // mimic create user so that test user are not stored in db
            const createUserStub = sinon.stub(dbClient, 'createUser').resolves({ "_id": "someId", "email": "someEmail"});
            const formData = {'email': "testing@test.com", 'password': "1234"};
            chai.request(app)
                .post('/users')
                .send(formData)
                .end((err, res) => {
                    expect(res).to.have.status(201);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('id');
                    expect(res.body).to.have.property('email');
                    createUserStub.restore();
                    done();
                });
        });
    });

    describe('GET /connect', ()=>{
        it('returns unauthorized when no user is found', (done)=>{
            const getuserWithEmailStub = sinon.stub(dbClient, 'getUserWithEmail').rejects("not found");
            chai.request(app)
                .get('/connect')
                .set('Authorization', '')
                .end((err, res) => {
                    expect(res).to.have.status(401);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('error');
                    getuserWithEmailStub.restore();
                    done();
                });
        });

        it('returns unauthorized when no auth headers are sent', (done)=>{
            chai.request(app)
                .get('/connect')
                .end((err, res) => {
                    expect(res).to.have.status(401);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('error');
                    done();
                });
        });

        it('returns a token when user is found', (done)=>{
            const getuserWithEmailStub = sinon.stub(dbClient, 'getUserWithEmail').resolves({"_id": "someId"});

            chai.request(app)
                .get('/connect')
                .set('Authorization', `Basic CorrectToken`)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('token');
                    getuserWithEmailStub.restore();
                    done();
                });
        });
    });

    describe('GET /disconnect', ()=>{
        it('returns unauthorised when no x-token is put', (done)=>{
            chai.request(app)
                .get('/disconnect')
                .end((err, res)=>{
                    expect(res.status).to.be.equal(401);
                    expect(res.body).to.have.property('error');
                    done();
                });
        });

        it('returns unauthorised when no user is found', (done)=>{
            const getUserWithIdStub = sinon.stub(redisClient, 'get').returns(null);
            chai.request(app)
                .get('/disconnect')
                .set('x-token', 'someCorrectValue')
                .end((err, res)=>{
                    expect(res.status).to.be.equal(401);
                    expect(res.body).to.have.property('error');
                    getUserWithIdStub.restore();
                    done();
                });
        });

        it('deletes token and returns nothing', (done)=>{
            const getUserIdRedisStub = sinon.stub(redisClient, 'get').resolves("someId");
            chai.request(app)
                .get('/disconnect')
                .set('x-token', 'someCorrectValue')
                .end((err, res)=>{
                    expect(res.status).to.be.equal(204);
                    expect(res.body).to.be.empty
                    getUserIdRedisStub.restore();
                    done();
                });
        });
    });

    describe('GET /users/me', ()=>{
        it('return unauthorized if no user', (done)=>{
            const getUserWithIdStub = sinon.stub(dbClient, 'getUserWithId').rejects("no user");
            chai.request(app)
            .get('/users/me')
            .set('x-token', 'someCorrectValue')
            .end((err, res)=>{
                expect(res.status).to.be.equal(401);
                expect(res.body.error).to.be.equal('Unauthorized');
                getUserWithIdStub.restore();
                done();
            });
        })

        it('return  user when found', (done)=>{
            const getUserWithIdStub = sinon.stub(dbClient, 'getUserWithId').resolves({"_id": "someId", "email": "someEmail"});
            const getUserIdRedisStub = sinon.stub(redisClient, 'get').resolves('someId');
            chai.request(app)
            .get('/users/me')
            .set('x-token', 'someCorrectValue')
            .end((err, res)=>{
                expect(res.status).to.be.equal(200);
                expect(res.body).to.haveOwnProperty('id');
                expect(res.body).to.haveOwnProperty('email');
                getUserWithIdStub.restore();
                getUserIdRedisStub.restore();
                done();
            });
        });
    });

})