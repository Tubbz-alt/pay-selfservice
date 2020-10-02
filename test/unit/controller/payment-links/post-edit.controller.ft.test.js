'use strict'

const supertest = require('supertest')
const nock = require('nock')
const csrf = require('csrf')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const formattedPathFor = require('../../../../app/utils/replace-params-in-path')
const { validGatewayAccountResponse } = require('../../../fixtures/gateway-account.fixtures')

const GATEWAY_ACCOUNT_ID = '929'
const PRODUCT_EXTERNAL_ID = '2903e4yohi0we9yho2hio'
const PAYMENT_1 = {
  external_id: 'product-external-id-1',
  gateway_account_id: 'product-gateway-account-id-1',
  description: 'product-description-1',
  name: 'payment-name-1',
  price: '150',
  type: 'ADHOC',
  return_url: 'http://return.url',
  _links: [{
    rel: 'pay',
    href: 'http://pay.url',
    method: 'GET'
  }]
}

const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'tokens:create' }]
})
const VALID_PAYLOAD = {
  csrfToken: csrf().create('123')
}

const productsMock = nock(process.env.PRODUCTS_URL)
const connectorMock = nock(process.env.CONNECTOR_URL)

describe('POST edit payment link controller', () => {
  let result, session, app
  beforeAll(() => {
    connectorMock.get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
      .reply(200, validGatewayAccountResponse({ gateway_account_id: GATEWAY_ACCOUNT_ID }).getPlain())
    productsMock.patch(`/v1/api/gateway-account/${GATEWAY_ACCOUNT_ID}/products/${PRODUCT_EXTERNAL_ID}`).reply(200, PAYMENT_1)
    session = getMockSession(VALID_USER)
    session.editPaymentLinkData = {
      externalId: PRODUCT_EXTERNAL_ID,
      name: 'Pay for an offline service'
    }

    app = createAppWithSession(getApp(), session)
  })
  beforeAll(done => {
    supertest(app)
      .post(formattedPathFor(paths.paymentLinks.edit, PRODUCT_EXTERNAL_ID))
      .send(VALID_PAYLOAD)
      .end((err, res) => {
        result = res
        done(err)
      })
  })
  afterAll(() => {
    nock.cleanAll()
  })

  it('should redirect with status code 302', () => {
    expect(result.statusCode).toBe(302)
  })

  it('should redirect to the manage page with a success message', () => {
    expect(result.headers).to.have.property('location').toBe(paths.paymentLinks.manage)
    expect(session.flash).toHaveProperty('generic')
    expect(session.flash.generic.length).toBe(1)
    expect(session.flash.generic[0]).toBe('Your payment link has been updated')
  })
})
