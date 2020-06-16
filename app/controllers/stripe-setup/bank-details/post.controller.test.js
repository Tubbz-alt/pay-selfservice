'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const paths = require('../../../paths')

chai.use(chaiAsPromised)
const { expect } = chai // must be called after chai.use(chaiAsPromised) to use "should.eventually"

describe('Bank details post controller', () => {
  const rawAccountNumber = '00012345'
  const rawSortCode = '10 - 88 - 00'
  const sanitisedAccountNumber = '00012345'
  const sanitisedSortCode = '108800'

  let req
  let res
  let setStripeAccountSetupFlagMock
  let updateBankAccountMock

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1'
      },
      body: {
        'account-number': rawAccountNumber,
        'sort-code': rawSortCode,
        'answers-checked': true
      }
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy(),
      locals: {
        stripeAccount: {
          stripeAccountId: 'acct_123example123'
        }
      }
    }
  })

  it('should call stripe and connector and redirect to the dashboard', done => {
    updateBankAccountMock = sinon.spy((stripeAccountId, body) => {
      return new Promise(resolve => {
        resolve()
      })
    })
    setStripeAccountSetupFlagMock = sinon.spy((gatewayAccountId, stripeAccountSetupFlag, correlationId) => {
      return new Promise(resolve => {
        resolve()
      })
    })
    const controller = getControllerWithMocks()

    controller(req, res)

    setTimeout(() => {
      expect(updateBankAccountMock.calledWith(res.locals.stripeAccount.stripeAccountId, { // eslint-disable-line
        bank_account_sort_code: sanitisedSortCode,
        bank_account_number: sanitisedAccountNumber
      })).to.be.true
      expect(setStripeAccountSetupFlagMock.calledWith(req.account.gateway_account_id, 'bank_account', req.correlationId)).to.be.true // eslint-disable-line
      expect(res.redirect.calledWith(303, paths.dashboard.index)).to.be.true // eslint-disable-line
      done()
    }, 250)
  })

  it('should render error page when Stripe returns unknown error', done => {
    updateBankAccountMock = sinon.spy((stripeAccountId, body) => {
      return new Promise((resolve, reject) => {
        reject(new Error())
      })
    })
    setStripeAccountSetupFlagMock = sinon.spy((gatewayAccountId, stripeAccountSetupFlag, correlationId) => {
      return new Promise(resolve => {
        resolve()
      })
    })
    const controller = getControllerWithMocks()

    controller(req, res)

    setTimeout(() => {
      expect(updateBankAccountMock.calledWith(res.locals.stripeAccount.stripeAccountId, { // eslint-disable-line
        bank_account_sort_code: sanitisedSortCode,
        bank_account_number: sanitisedAccountNumber
      })).to.be.true
      expect(setStripeAccountSetupFlagMock.notCalled).to.be.true // eslint-disable-line
      expect(res.redirect.notCalled).to.be.true // eslint-disable-line
      expect(res.status.calledWith(500)).to.be.true // eslint-disable-line
      expect(res.render.calledWith('error', { message: 'Please try again or contact support team' })).to.be.true // eslint-disable-line
      done()
    }, 250)
  })

  it('should re-render the form page when Stripe returns "routing_number_invalid" error', done => {
    updateBankAccountMock = sinon.spy((stripeAccountId, body) => {
      return new Promise((resolve, reject) => {
        const error = new Error()
        error.code = 'routing_number_invalid'
        reject(error)
      })
    })
    setStripeAccountSetupFlagMock = sinon.spy((gatewayAccountId, stripeAccountSetupFlag, correlationId) => {
      return new Promise(resolve => {
        resolve()
      })
    })
    const controller = getControllerWithMocks()

    controller(req, res)

    setTimeout(() => {
      expect(updateBankAccountMock.calledWith(res.locals.stripeAccount.stripeAccountId, { // eslint-disable-line
        bank_account_sort_code: sanitisedSortCode,
        bank_account_number: sanitisedAccountNumber
      })).to.be.true
      expect(setStripeAccountSetupFlagMock.notCalled).to.be.true // eslint-disable-line
      expect(res.redirect.notCalled).to.be.true // eslint-disable-line
      expect(res.render.called).to.be.true // eslint-disable-line
      done()
    }, 250)
  })

  it('should re-render the form page when Stripe returns "account_number_invalid" error', done => {
    updateBankAccountMock = sinon.spy((stripeAccountId, body) => {
      return new Promise((resolve, reject) => {
        const error = new Error()
        error.code = 'account_number_invalid'
        reject(error)
      })
    })
    setStripeAccountSetupFlagMock = sinon.spy((gatewayAccountId, stripeAccountSetupFlag, correlationId) => {
      return new Promise(resolve => {
        resolve()
      })
    })
    const controller = getControllerWithMocks()

    controller(req, res)

    setTimeout(() => {
      expect(updateBankAccountMock.calledWith(res.locals.stripeAccount.stripeAccountId, { // eslint-disable-line
        bank_account_sort_code: sanitisedSortCode,
        bank_account_number: sanitisedAccountNumber
      })).to.be.true
      expect(setStripeAccountSetupFlagMock.notCalled).to.be.true // eslint-disable-line
      expect(res.redirect.notCalled).to.be.true // eslint-disable-line
      expect(res.render.called).to.be.true // eslint-disable-line
      done()
    }, 250)
  })

  it('should render error page when connector returns error', done => {
    updateBankAccountMock = sinon.spy((stripeAccountId, body) => {
      return new Promise(resolve => {
        resolve()
      })
    })
    setStripeAccountSetupFlagMock = sinon.spy((gatewayAccountId, stripeAccountSetupFlag, correlationId) => {
      return new Promise((resolve, reject) => {
        reject(new Error())
      })
    })
    const controller = getControllerWithMocks()

    controller(req, res)

    setTimeout(() => {
      expect(updateBankAccountMock.calledWith(res.locals.stripeAccount.stripeAccountId, { // eslint-disable-line
        bank_account_sort_code: sanitisedSortCode,
        bank_account_number: sanitisedAccountNumber
      })).to.be.true
      expect(setStripeAccountSetupFlagMock.calledWith(req.account.gateway_account_id, 'bank_account', req.correlationId)).to.be.true // eslint-disable-line
      expect(res.redirect.notCalled).to.be.true // eslint-disable-line
      expect(res.status.calledWith(500)).to.be.true // eslint-disable-line
      expect(res.render.calledWith('error', { message: 'Please try again or contact support team' })).to.be.true // eslint-disable-line
      done()
    }, 250)
  })

  function getControllerWithMocks () {
    return proxyquire('./post.controller', {
      '../../../services/clients/stripe/stripe_client': {
        updateBankAccount: updateBankAccountMock
      },
      '../../../services/clients/connector_client': {
        ConnectorClient: function () {
          this.setStripeAccountSetupFlag = setStripeAccountSetupFlagMock
        }
      }
    })
  }
})
