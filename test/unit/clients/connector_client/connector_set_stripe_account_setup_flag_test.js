'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const path = require('path')

const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector_client').ConnectorClient
const stripeAccountSetupFixtures = require('../../../fixtures/stripe_account_setup_fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)

chai.use(chaiAsPromised)

const existingGatewayAccountId = 42
const defaultState = `a stripe gateway account with external id ${existingGatewayAccountId} exists in the database`

describe('connector client - set stripe account setup flag', () => {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('set bank account flag', () => {
    const request = stripeAccountSetupFixtures.buildUpdateBankAccountDetailsFlagRequest(true).getPlain()

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/stripe-setup`)
          .withUponReceiving('a valid patch update stripe account bank account flag request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update successfully', done => {
      connectorClient.setStripeAccountSetupFlag(existingGatewayAccountId, 'bank_account')
        .should.be.fulfilled
        .notify(done)
    })
  })

  describe('set vat number company number flag', () => {
    const request = stripeAccountSetupFixtures.buildUpdateVatNumberCompanyNumberFlagRequest(true).getPlain()

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/stripe-setup`)
          .withUponReceiving('a valid patch update stripe account vat number company number flag request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update successfully', done => {
      connectorClient.setStripeAccountSetupFlag(existingGatewayAccountId, 'vat_number_company_number')
        .should.be.fulfilled
        .notify(done)
    })
  })

  describe('set responsible person flag', () => {
    const request = stripeAccountSetupFixtures.buildUpdateResponsiblePersonFlagRequest(true).getPlain()

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/stripe-setup`)
          .withUponReceiving('a valid patch update stripe account responsible person flag request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update successfully', done => {
      connectorClient.setStripeAccountSetupFlag(existingGatewayAccountId, 'responsible_person')
        .should.be.fulfilled
        .notify(done)
    })
  })
})
