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


describe('file tests', ()=>{
    const getUserFromRedisStub = sinon.stub(redisClient, 'get');
    const getUserWithIdStub = sinon.stub(dbClient, 'getUserWithId');

    describe('POST /files', ()=>{
        it('returns unauthorized when no user found', (done)=>{
            chai.request(app)
                .post('/files')
                .end((err, res)=>{
                    getUserFromRedisStub.returns(null);
                    expect(res.status).to.be.equal(401);
                    done();
                });
        });
    });
});
