'use strict'

const supertest = require('supertest')
const lodash = require('lodash')
const nock = require('nock')
const csrf = require('csrf')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { validProductResponse } = require('../../../fixtures/product.fixtures')

const { PRODUCTS_URL } = process.env
let product
const GATEWAY_ACCOUNT_ID = '929'
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'tokens:create' }]
})
const SERVICE_NAME_SLUGIFIED = 'pay-for-offline-service'
const PAYMENT_TITLE_SLUGIFIED = 'payment-title'
const VALID_PAYLOAD = {
  'csrfToken': csrf().create('123'),
  'payment-name-path': PAYMENT_TITLE_SLUGIFIED
}

describe('Create payment link web address post controller', () => {
  describe(`when an available product path name is submitted`, () => {
    let result, session, app
    beforeAll(() => {
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.createPaymentLink', {
        paymentLinkTitle: 'Payment title',
        paymentLinkDescription: 'Hello world',
        serviceNamePath: SERVICE_NAME_SLUGIFIED,
        productNamePath: PAYMENT_TITLE_SLUGIFIED
      })
      app = createAppWithSession(getApp(), session)
      product = validProductResponse({
        type: 'ADHOC',
        service_name_path: SERVICE_NAME_SLUGIFIED,
        product_name_path: PAYMENT_TITLE_SLUGIFIED
      }).getPlain()
      nock(PRODUCTS_URL)
        .get(`/v1/api/products`)
        .query({ 'serviceNamePath': product.service_name_path, 'productNamePath': product.product_name_path })
        .reply(404, product)
    })
    beforeAll(done => {
      supertest(app)
        .post(paths.paymentLinks.webAddress)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    it('should have productNamePath stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('productNamePath').toBe(PAYMENT_TITLE_SLUGIFIED)
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).toBe(302)
    })

    it('should redirect to the reference page', () => {
      expect(result.headers).to.have.property('location').toBe(paths.paymentLinks.reference)
    })
  })

  describe(`when an unavailable product path name is submitted`, () => {
    let result, session, app
    beforeAll(() => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
      lodash.set(session, 'pageData.createPaymentLink', {
        paymentLinkTitle: 'Payment title',
        paymentLinkDescription: 'Hello world',
        serviceNamePath: SERVICE_NAME_SLUGIFIED,
        productNamePath: PAYMENT_TITLE_SLUGIFIED
      })
      product = validProductResponse({
        type: 'ADHOC',
        service_name_path: SERVICE_NAME_SLUGIFIED,
        product_name_path: PAYMENT_TITLE_SLUGIFIED
      }).getPlain()
      nock(PRODUCTS_URL)
        .get(`/v1/api/products`)
        .query({ 'serviceNamePath': product.service_name_path, 'productNamePath': product.product_name_path })
        .reply(200, product)
    })
    beforeAll(done => {
      supertest(app)
        .post(paths.paymentLinks.webAddress)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    it('should have productNamePath stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('productNamePath').toBe(PAYMENT_TITLE_SLUGIFIED)
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).toBe(302)
    })

    it('should redirect to the web address page', () => {
      expect(result.headers).to.have.property('location').toBe(paths.paymentLinks.webAddress)
    })

    it(
      'should have a recovered object stored on the session containing errors and submitted data',
      () => {
        const recovered = lodash.get(session, 'pageData.createPaymentLink.webAddressPageRecovered', {})
        expect(recovered).to.have.property('paymentLinkURLPath').toBe(PAYMENT_TITLE_SLUGIFIED)
        expect(recovered).toHaveProperty('errors')
        expect(recovered.errors).toHaveProperty('path')
      }
    )
  })
})
