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
const expect = chai.expect

chai.use(chaiAsPromised)

const existingGatewayAccountId = 42
const defaultState = `a stripe gateway account with external id ${existingGatewayAccountId} exists in the database`

describe('connector client - get stripe account setup', () => {
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

  describe('get stripe account setup success', () => {
    const stripeSetupOpts = {
      bank_account: true,
      vat_number_company_number: false,
      responsible_person: true
    }
    const response = stripeAccountSetupFixtures.buildGetStripeAccountSetupResponse(stripeSetupOpts)

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/stripe-setup`)
          .withUponReceiving('a valid get stripe account bank account flag request')
          .withState(defaultState)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(response.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update successfully', done => {
      connectorClient.getStripeAccountSetup(existingGatewayAccountId)
        .should.be.fulfilled
        .then(stripeAccountSetup => {
          expect(stripeAccountSetup.bankAccount).to.equal(stripeSetupOpts.bank_account)
          expect(stripeAccountSetup.vatNumberCompanyNumber).to.equal(stripeSetupOpts.vat_number_company_number)
          expect(stripeAccountSetup.responsiblePerson).to.equal(stripeSetupOpts.responsible_person)
        }).should.notify(done)
    })
  })
})
