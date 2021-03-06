'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const serviceFixtures = require('../../../../fixtures/service.fixtures')
const { pactify } = require('../../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - create a new service', function () {
  let provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('success', () => {
    const name = 'Service name'
    const externalId = 'externalId'
    const gatewayAccountIds = []
    const validCreateServiceResponse = serviceFixtures.validServiceResponse({
      name: name,
      external_id: externalId,
      gateway_account_ids: gatewayAccountIds
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(SERVICE_RESOURCE)
          .withUponReceiving('a valid create service request with empty object')
          .withMethod('POST')
          .withRequestBody({})
          .withStatusCode(201)
          .withResponseBody(pactify(validCreateServiceResponse))
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should create a new service', function (done) {
      adminusersClient.createService().should.be.fulfilled.then(service => {
        expect(service.externalId).to.equal(externalId)
        expect(service.name).to.equal(name)
        expect(service.gatewayAccountIds).to.deep.equal(gatewayAccountIds)
      }).should.notify(done)
    })
  })

  describe('create a service sending gateway account ids - success', () => {
    const name = 'Service name'
    const externalId = 'externalId'
    const gatewayAccountIds = ['1', '5']
    const validRequest = serviceFixtures.validCreateServiceRequest({
      gateway_account_ids: gatewayAccountIds
    })
    const validCreateServiceResponse = serviceFixtures.validServiceResponse({
      name: name,
      external_id: externalId,
      gateway_account_ids: gatewayAccountIds
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(SERVICE_RESOURCE)
          .withUponReceiving('a valid create service request with gateway account ids')
          .withMethod('POST')
          .withRequestBody(validRequest)
          .withStatusCode(201)
          .withResponseBody(pactify(validCreateServiceResponse))
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should create a new service', function (done) {
      adminusersClient.createService(null, null, validRequest.gateway_account_ids).should.be.fulfilled.then(service => {
        expect(service.externalId).to.equal(externalId)
        expect(service.name).to.equal(name)
        expect(service.gatewayAccountIds).to.deep.equal(validCreateServiceResponse.gateway_account_ids)
      }).should.notify(done)
    })
  })

  describe('create a service sending service name - success', () => {
    const name = 'Service name'
    const externalId = 'externalId'
    const gatewayAccountIds = []
    const validRequest = serviceFixtures.validCreateServiceRequest({
      service_name: {
        en: name
      }
    })
    const validCreateServiceResponse = serviceFixtures.validServiceResponse({
      name: name,
      external_id: externalId,
      gateway_account_ids: gatewayAccountIds
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(SERVICE_RESOURCE)
          .withUponReceiving('a valid create service request with service name')
          .withMethod('POST')
          .withRequestBody(validRequest)
          .withStatusCode(201)
          .withResponseBody(pactify(validCreateServiceResponse))
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should create a new service', function (done) {
      adminusersClient.createService('Service name', null, null).should.be.fulfilled.then(service => {
        expect(service.externalId).to.equal(externalId)
        expect(service.name).to.equal(name)
        expect(service.gatewayAccountIds).to.deep.equal(gatewayAccountIds)
      }).should.notify(done)
    })
  })
})
