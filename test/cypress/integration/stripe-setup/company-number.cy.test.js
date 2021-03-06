'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')

function setupStubs (userExternalId, gatewayAccountId, companyNumber, type = 'live', paymentProvider = 'stripe') {
  let stripeSetupStub

  if (Array.isArray(companyNumber)) {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupFlagForMultipleCalls({
      gatewayAccountId,
      companyNumber: companyNumber
    })
  } else {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, companyNumber })
  }

  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
    gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type, paymentProvider }),
    stripeSetupStub,
    stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'acct_123example123'),
    transactionSummaryStubs.getDashboardStatistics()
  ])
}

describe('Stripe setup: company number page', () => {
  const gatewayAccountId = 42
  const userExternalId = 'userExternalId'

  describe('Card gateway account', () => {
    describe('when user is admin, account is Stripe and "company number" is not already submitted', () => {
      beforeEach(() => {
        setupStubs(userExternalId, gatewayAccountId, false)

        cy.setEncryptedCookies(userExternalId, gatewayAccountId, {})
        cy.visit('/company-number')
      })

      it('should display page correctly', () => {
        cy.get('h1').should('contain', 'Does your organisation have a company registration number?')

        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').should('be.visible')

            cy.get('input#company-number-declaration-2[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').should('not.be.visible')

            cy.get('button').should('exist')
            cy.get('button').should('contain', 'Save and continue')
          })
      })

      it('should display an error when no options are selected', () => {
        cy.get('#company-number-form > button').click()

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Company registration number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#company-number-declaration')

        cy.get('#company-number-declaration-error').should('contain', 'You must answer this question')
      })

      it('should display an error when company number input is blank and "Yes" option is selected', () => {
        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').type('        ')

            cy.get('button').click()
          })

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Company registration number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#company-number')

        cy.get('input#company-number[name="company-number"]').should('have.class', 'govuk-input--error')
        cy.get('#company-number-error').should('contain', 'This field cannot be blank')
      })

      it('should display an error when company number is invalid and "Yes" option is selected', () => {
        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').type('(╯°□°)╯︵ ┻━┻')

            cy.get('button').click()
          })

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Company registration number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#company-number')

        cy.get('input#company-number[name="company-number"]').should('have.class', 'govuk-input--error')
        cy.get('#company-number-error').should('contain', 'Enter a valid company number')
      })
    })

    describe('when user is admin, account is Stripe and "company number" is already submitted', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      })

      it('should redirect to Dashboard with an error message when displaying the page', () => {
        setupStubs(userExternalId, gatewayAccountId, true)

        cy.visit('/company-number')

        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq('/')
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your company registration number.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update it.')
      })

      it('should redirect to Dashboard with an error message when submitting the form', () => {
        setupStubs(userExternalId, gatewayAccountId, [false, true])

        cy.visit('/company-number')

        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration-2[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').should('not.be.visible')

            cy.get('button').click()
          })

        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq('/')
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your company registration number.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update it.')
      })
    })

    describe('when it is not a Stripe gateway account', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      })

      it('should show a 404 error when gateway account is not Stripe', () => {
        setupStubs(userExternalId, gatewayAccountId, [false, true], 'live', 'sandbox')

        cy.visit('/company-number', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('when it is not a live gateway account', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      })

      it('should show a 404 error when gateway account is not live', () => {
        setupStubs(userExternalId, gatewayAccountId, [false, true], 'test', 'stripe')

        cy.visit('/company-number', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('when the user does not have the correct permissions', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      })

      it('should show a permission error when the user does not have enough permissions', () => {
        cy.task('setupStubs', [
          userStubs.getUserWithNoPermissions(userExternalId, gatewayAccountId),
          gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe' })
        ])

        cy.visit('/company-number', { failOnStatusCode: false })
        cy.get('h1').should('contain', 'An error occurred:')
        cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
      })
    })
  })

  describe('Direct Debit gateway account', () => {
    const directDebitGatewayAccountId = 'DIRECT_DEBIT:101'

    it('should show an error page', () => {
      cy.setEncryptedCookies(userExternalId, directDebitGatewayAccountId)

      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId: directDebitGatewayAccountId }),
        gatewayAccountStubs.getDirectDebitGatewayAccountSuccess({ gatewayAccountId: directDebitGatewayAccountId, type: 'live', paymentProvider: 'go-cardless' })
      ])

      cy.visit('/company-number', {
        failOnStatusCode: false
      })

      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'This page is only available to card accounts not direct debit accounts.')
    })
  })
})
