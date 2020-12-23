'use strict'

const lodash = require('lodash')

const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')
const transactionDetailsFixtures = require('../../fixtures/refund.fixtures')
const ledgerTransactionFixtures = require('../../fixtures/ledger-transaction.fixtures')
const cardFixtures = require('../../fixtures/card.fixtures')
const ledgerFixture = require('../../fixtures/ledger-transaction.fixtures')
const tokenFixtures = require('../../fixtures/token.fixtures')
const worldpay3dsFlexCredentialsFixtures = require('../../fixtures/worldpay-3ds-flex-credentials.fixtures')
const { stubBuilder } = require('../stubs/stub-builder')

const simpleStubBuilder = function simpleStubBuilder (method, path, responseCode, additionalParams = {}) {
  const stub = stubBuilder(method, path, responseCode, additionalParams)
  return [stub]
}

/**
 * Stub definitions added here should always use fixture builders to generate request and response bodys.
 * The fixture builders used should be validated by also being used in the pact tests for the API endpoint, and they
 * should be written in a strict enough way the JSON they produce will adhere to a validated structure.
 */
module.exports = {

  getGatewayAccountSuccessRepeat: (opts = {}) => {
    const aValidGetGatewayAccountResponse = gatewayAccountFixtures.validGatewayAccountResponse(opts[0])
    const aDifferentValidGetGatewayAccountResponse = gatewayAccountFixtures.validGatewayAccountResponse(opts[1])
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: '/v1/frontend/accounts/' + opts[0].gateway_account_id,
            headers: {
              'Accept': 'application/json'
            }
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: aValidGetGatewayAccountResponse
          },
          _behaviors: {
            repeat: opts[0].repeat
          }
        }, {
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: aDifferentValidGetGatewayAccountResponse
          },
          _behaviors: {
            repeat: opts[1].repeat
          }
        }]
      }
    ]
  },
  postRefundSuccess: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/charges/${opts.charge_id}/refunds`
    return simpleStubBuilder('POST', path, 200, {
      request: transactionDetailsFixtures.validTransactionRefundRequest(opts),
      verifyCalledTimes: opts.verifyCalledTimes
    })
  },
  postRefundAmountNotAvailable: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/charges/${opts.charge_id}/refunds`
    return simpleStubBuilder('POST', path, 400, {
      request: transactionDetailsFixtures.validTransactionRefundRequest(opts),
      response: transactionDetailsFixtures.invalidTransactionRefundResponse({
        error_identifier: 'REFUND_NOT_AVAILABLE',
        reason: 'amount_not_available'
      })
    })
  },
  getLedgerTransactionSuccess: (opts = {}) => {
    const path = `/v1/transaction/${opts.transaction_id}`
    return simpleStubBuilder('GET', path, 200, {
      response: ledgerTransactionFixtures.validTransactionDetailsResponse(opts)
    })
  },
  getLedgerEventsSuccess: (opts = {}) => {
    const path = `/v1/transaction/${opts.transaction_id}/event`
    return simpleStubBuilder('GET', path, 200, {
      response: ledgerTransactionFixtures.validTransactionEventsResponse(opts)
    })
  },
  getLedgerTransactionsSuccess: (opts = {}) => {
    const path = '/v1/transaction'
    return simpleStubBuilder('GET', path, 200, {
      query: lodash.defaults(opts.filters, {
        account_id: opts.gateway_account_id,
        page: opts.page || 1,
        display_size: opts.display_size || 100,
        limit_total: true,
        limit_total_size: 5001
      }),
      response: ledgerTransactionFixtures.validTransactionSearchResponse(opts)
    })
  },
  getAcceptedCardsForAccountSuccess: opts => {
    const path = `/v1/frontend/accounts/${opts.account_id}/card-types`
    return simpleStubBuilder('GET', path, 200, {
      response: cardFixtures.validUpdatedAcceptedCardTypesResponse()
    })
  },
  redirectToGoCardlessConnectFailure: (opts = {}) => {
    const path = '/oauth/authorize'
    return simpleStubBuilder('GET', path, 500, {
      responseHeaders: {}
    })
  },
  getDashboardStatisticsStub: (opts = {}) => {
    const path = '/v1/report/transactions-summary'
    return simpleStubBuilder('GET', path, 200, {
      response: ledgerFixture.validTransactionSummaryDetails(opts)
    })
  },
  postCreateTokenForAccountSuccess: (opts = {}) => {
    const path = '/v1/frontend/auth'
    return simpleStubBuilder('POST', path, 200, {
      response: tokenFixtures.validCreateTokenForGatewayAccountResponse()
    })
  },
  postCheckWorldpay3dsFlexCredentialsFailure: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/worldpay/check-3ds-flex-config`
    return simpleStubBuilder('POST', path, 500, {
      request: worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsRequest(opts).payload
    })
  }
}
