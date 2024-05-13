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
     *  POST /files
     *  GET /files/:id
     *  GET /files (don’t forget the pagination)
     *  PUT /files/:id/publish
     *  PUT /files/:id/unpublish
     *  GET /files/:id/data
    */

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
            const createUserStub = sinon.stub(dbClient, 'createUser');
            const formData = {'email': "coder@mail.com", 'password': "1234"};
            chai.request(app)
                .post('/users')
                .send(formData)
                .end((err, res) => {
                    createUserStub(formData);
                    const calledOnce = expect(createUserStub.calledOnce).to.be.true;
                    if (calledOnce) {
                        expect(res).to.have.status(201);
                        expect(res.body).to.be.an('object');
                        expect(res.body).to.have.property('id');
                        expect(res.body).to.have.property('email');
                        createUserStub.restore();
                        done();
                    } else{
                        expect(res).to.have.status(400);
                        expect(res.body).to.be.an('object');
                        expect(res.body).to.have.property('error');
                        expect(res.body.error).to.be.equal('Already exist');
                        createUserStub.restore();
                        done();
                    }
                    
                });
        });
    });

})