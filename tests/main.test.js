const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const mocha = require('mocha');

const app = require('../server');

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
})