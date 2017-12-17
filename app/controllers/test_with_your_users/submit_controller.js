'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products_client.js')
const publicAuthClient = require('../../services/clients/public_auth_client')
const authService = require('../../services/auth_service.js')
const {isCurrency, isHttps, isBelowMaxAmount} = require('../../browsered/field-validation-checks')

const AMOUNT_FORMAT = /^([0-9]+)(?:\.([0-9]{2}))?$/

module.exports = (req, res) => {
  const params = {
    linksPage: paths.prototyping.demoService.links
  }

  const gatewayAccountId = authService.getCurrentGatewayAccountId(req)
  const confirmationPage = req.body['confirmation-page']
  const paymentDescription = req.body['payment-description']
  let paymentAmount = req.body['payment-amount']
  lodash.set(req, 'session.pageData.createPrototypeLink', {paymentAmount, paymentDescription, confirmationPage})

  if (!paymentDescription) {
    req.flash('genericError', `<h2>Enter a description</h2> Tell users what they are paying for`)
  } else if (!paymentAmount || isCurrency(paymentAmount)) {
    req.flash('genericError', `<h2>Use valid characters only</h2> ${isCurrency(paymentAmount)}`)
  } else if (isBelowMaxAmount(paymentAmount)) {
    req.flash('genericError', `<h2>Enter a valid amount</h2> ${isBelowMaxAmount(paymentAmount)}`)
  } else if (!confirmationPage || isHttps(confirmationPage)) {
    req.flash('genericError', `<h2>Enter a valid secure URL</h2>${isHttps(confirmationPage)}`)
  }

  if (lodash.get(req, 'session.flash.genericError.length')) {
    return res.redirect(paths.prototyping.demoService.create)
  }

  paymentAmount = paymentAmount.replace(/[^0-9.-]+/g, '')
  const currencyMatch = AMOUNT_FORMAT.exec(paymentAmount)
  if (!currencyMatch[2]) {
    paymentAmount = paymentAmount + '.00'
  }

  publicAuthClient.createTokenForAccount({
    accountId: gatewayAccountId,
    correlationId: req.correlationId,
    payload: {
      account_id: gatewayAccountId,
      created_by: req.user.email,
      description: `Token for Prototype: ${req.body['payment-description']}`
    }})
    .then(publicAuthData => productsClient.product.create({
      payApiToken: publicAuthData.token,
      gatewayAccountId,
      name: req.body['payment-description'],
      returnUrl: req.body['confirmation-page'],
      serviceName: req.service.name,
      price: Math.trunc(paymentAmount * 100)
    }))
    .then(product => {
      params.prototypeLink = lodash.get(product, 'links.pay.href')
      lodash.set(req, 'session.pageData.createPrototypeLink', {})
      return response(req, res, 'dashboard/demo-service/confirm', params)
    })
    .catch(() => {
      req.flash('genericError', `<h2>There were errors</h2> Error while creating product`)
      return res.redirect(paths.prototyping.demoService.create)
    })
}
