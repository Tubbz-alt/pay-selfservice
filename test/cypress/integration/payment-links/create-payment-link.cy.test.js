const commonStubs = require('../../utils/common-stubs')
const userStubs = require('../../utils/user-stubs')
const userExternalId = 'a-user-id'
const gatewayAccountId = 42
const serviceName = {
  en: 'pay for something',
  cy: 'talu am rywbeth'
}

describe('The create payment link flow', () => {
  beforeEach(() => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId: userExternalId, gatewayAccountId, serviceName }),
      commonStubs.getGatewayAccountStub(gatewayAccountId, 'test', 'worldpay')
    ])
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('A English payment link', () => {
    const name = 'Pay for a parking permit'
    const description = 'Finish your application'
    const referenceName = 'invoice number'
    const referenceHint = 'Found in the email'
    const amount = 10

    describe('The create payment link start page', () => {
      it('Should display page content', () => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
        cy.visit('/create-payment-link')

        cy.get('h1').should('contain', 'Create a payment link')
        cy.get('a#create-payment-link').should('exist')
        cy.get('a[href="/create-payment-link/information?language=cy"]').should('exist')
          .should('contain', 'Create a payment link in Welsh')
      })

      it('Should navigate to create payment link in English information page', () => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
        cy.visit('/create-payment-link')

        cy.get('a#create-payment-link').click()

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/create-payment-link/information`)
        })
      })
    })

    describe('Information page', () => {
      it('Should display instructions for an English payment link', () => {
        cy.get('h1').should('contain', 'Set payment link information')

        cy.get('form[method=post][action="/create-payment-link/information"]').should('exist')
          .within(() => {
            cy.get('input#payment-link-title').should('exist')
            cy.get('input#payment-link-title').should('have.attr', 'lang', 'en')
            cy.get('label[for="payment-link-title"]').should('contain', 'Title')
            cy.get('input#payment-link-title').parent('.govuk-form-group').get('span')
              .should('contain', 'For example, “Pay for a parking permit”')

            cy.get('textarea#payment-link-description').should('exist')
            cy.get('textarea#payment-link-description').should('have.attr', 'lang', 'en')
            cy.get('label[for="payment-link-description"]').should('exist')
            cy.get('textarea#payment-link-description').parent('.govuk-form-group').get('span')
              .should('contain', 'Give your users more information.')

            cy.get('div#payment-link-title-confirmation').should('not.exist')

            cy.get('button').should('exist')
          })

        cy.get('#payment-link-example').should('exist').within(() => {
          cy.get('h3').should('contain', 'Example of what the user will see')
          cy.get('img').should('exist')
        })
      })

      it('Should display URL when title is entered', () => {
        cy.get('form[method=post][action="/create-payment-link/information"]').within(() => {
          cy.get('input#payment-link-title').type(name)
          cy.get('textarea#payment-link-description').type(description)

          cy.get('div#payment-link-title-confirmation').should('exist').within(() => {
            cy.get('h3').should('contain', 'The website address for this payment link will look like:')
            cy.contains('/pay-for-something/pay-for-parking-permit')
          })
        })
      })

      it('Should continue to the reference page', () => {
        cy.get('form[method=post][action="/create-payment-link/information"]').within(() => {
          cy.get('button').click()
        })

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/create-payment-link/reference`)
        })
      })
    })

    describe('Reference page', () => {
      it('should have instructions for an English patment link when "yes" is selected', () => {
        cy.get('h1').should('contain', 'Do your users already have a payment reference?')
        cy.get('#reference-type-group-hint').should('contain', `You can use numbers or words in your payment reference. For example, you can include the applicant’s name or an existing reference number.`)

        cy.get('form[method=post][action="/create-payment-link/reference"]').should('exist')
          .within(() => {
            cy.get('input[type=radio]#reference-type-custom').should('exist')
            cy.get('input[type=radio]#reference-type-standard').should('exist')
            cy.get('input[type=radio]#reference-type-custom').click()

            cy.get('input#reference-label').should('exist')
            cy.get('input#reference-label').should('have.attr', 'lang', 'en')
            cy.get('input#reference-label').parent('.govuk-form-group').get('span')
              .should('contain', 'For example, “invoice number”')

            cy.get('textarea#reference-hint-text').should('exist')
            cy.get('textarea#reference-hint-text').should('have.attr', 'lang', 'en')
            cy.get('textarea#reference-hint-text').parent('.govuk-form-group').get('span')
              .should('contain', 'Tell users what the')

            cy.get('button').should('exist')
          })

        cy.get('#payment-link-example').should('exist').within(() => {
          cy.get('h3').should('contain', 'Example of what the user will see')
          cy.get('img').should('exist')
        })
      })

      it('should continue to the amount page', () => {
        cy.get('form[method=post][action="/create-payment-link/reference"]').should('exist')
          .within(() => {
            cy.get('input#reference-label').type(referenceName)
            cy.get('textarea#reference-hint-text').type(referenceHint)
            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/create-payment-link/amount`)
        })
      })
    })

    describe('Amount page', () => {
      it('should display content', () => {
        cy.get('form[method=post][action="/create-payment-link/amount"]').should('exist')
          .within(() => {
            cy.get('input[type=radio]#amount-type-fixed').should('exist')
            cy.get('input[type=radio]#amount-type-variable').should('exist')
            cy.get('input#payment-amount').should('exist')
            cy.get('button').should('exist')
          })

        cy.get('#payment-link-example').should('exist').within(() => {
          cy.get('h3').should('contain', 'Example of what the user will see')
          cy.get('img').should('exist')
        })
      })

      it('should continue to the confirm page', () => {
        cy.get('form[method=post][action="/create-payment-link/amount"]').should('exist')
          .within(() => {
            cy.get('input[type=radio]#amount-type-fixed').click()
            cy.get('input#payment-amount').type(amount)
            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/create-payment-link/review`)
        })
      })
    })

    describe('Review page', () => {
      it('should display entered values', () => {
        cy.get('.govuk-summary-list').find('.govuk-summary-list__row').eq(0).should('exist').within(() => {
          cy.get('.govuk-summary-list__key').should('contain', 'Title')
          cy.get('.govuk-summary-list__value').should('contain', name)
          cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', '/create-payment-link/information?field=payment-link-title')
        })
        cy.get('.govuk-summary-list').find('.govuk-summary-list__row').eq(1).should('exist').within(() => {
          cy.get('.govuk-summary-list__key').should('contain', 'More details')
          cy.get('.govuk-summary-list__value').should('contain', description)
          cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', '/create-payment-link/information?field=payment-link-description')
        })
        cy.get('.govuk-summary-list').find('.govuk-summary-list__row').eq(2).should('exist').within(() => {
          cy.get('.govuk-summary-list__key').should('contain', 'Reference number')
          cy.get('.govuk-summary-list__value').should('contain', referenceName)
          cy.get('.govuk-summary-list__value').get('span').should('contain', referenceHint)
          cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', '/create-payment-link/reference?change=true')
        })
        cy.get('.govuk-summary-list').find('.govuk-summary-list__row').eq(3).should('exist').within(() => {
          cy.get('.govuk-summary-list__key').should('contain', 'Payment amount')
          cy.get('.govuk-summary-list__value').should('contain', '£10.00')
          cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', '/create-payment-link/amount')
        })

        cy.get('button').should('exist').should('contain', 'Create payment link')
      })

      it('should redirect to information page when "Change" clicked', () => {
        cy.get('dl').find('.govuk-summary-list__row').eq(0).find('.govuk-summary-list__actions a').click()

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/create-payment-link/information`)
        })
      })

      it('should have details pre-filled', () => {
        cy.get('input#payment-link-title').should('have.value', name)
        cy.get('textarea#payment-link-description').should('have.value', description)
      })

      it('should have instructions for an English payment link', () => {
        cy.get('input#payment-link-title').parent('.govuk-form-group').get('span')
          .should('contain', 'For example, “Pay for a parking permit”')
      })
    })
  })

  describe('A Welsh payment link', () => {
    const name = 'Talu am drwydded barcio'
    const description = 'Disgrifiad yn Gymraeg'
    const referenceName = 'rhif anfoneb'
    const referenceHint = 'mewn e-bost'
    const amount = 10

    describe('The create payment link start page', () => {
      it('Should navigate to create payment link in Welsh information page', () => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
        cy.visit('/create-payment-link')

        cy.get('a[href="/create-payment-link/information?language=cy"]').click()

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/create-payment-link/information`)
        })
      })
    })

    describe('Information page', () => {
      it('Should display Welsh-specific instructions', () => {
        cy.get('h1').should('contain', 'Set Welsh payment link information')

        cy.get('form[method=post][action="/create-payment-link/information"]').should('exist')
          .within(() => {
            cy.get('input#payment-link-title').should('exist')
            cy.get('input#payment-link-title').should('have.attr', 'lang', 'cy')
            cy.get('label[for="payment-link-title"]').should('contain', 'Welsh title')
            cy.get('input#payment-link-title').parent('.govuk-form-group').get('span')
              .should('contain', 'For example, “Talu am drwydded barcio”')

            cy.get('textarea#payment-link-description').should('exist')
            cy.get('textarea#payment-link-description').should('have.attr', 'lang', 'cy')
            cy.get('label[for="payment-link-description"]').should('exist')
            cy.get('textarea#payment-link-description').parent('.govuk-form-group').get('span')
              .should('contain', 'Give your users more information in Welsh')

            cy.get('button').should('exist')
          })

        cy.get('#payment-link-example').should('not.exist')
      })

      it('Should display URL with Welsh service name when title is entered', () => {
        cy.get('form[method=post][action="/create-payment-link/information"]').within(() => {
          cy.get('input#payment-link-title').type(name)
          cy.get('textarea#payment-link-description').type(description)

          cy.get('div#payment-link-title-confirmation').should('exist').within(() => {
            cy.get('h3').should('contain', 'The website address for this payment link will look like:')
            cy.contains('/talu-am-rywbeth/talu-am-drwydded-barcio')
          })
        })
      })

      it('Should continue to the reference page', () => {
        cy.get('form[method=post][action="/create-payment-link/information"]').within(() => {
          cy.get('button').click()
        })

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/create-payment-link/reference`)
        })
      })
    })

    describe('Reference page', () => {
      it('should have Welsh-specific instructions when "yes" is selected', () => {
        cy.get('h1').should('contain', 'Do your users already have a payment reference?')
        cy.get('#reference-type-group-hint').should('contain', `You can use numbers or words in your payment reference. For example, you can include the applicant’s name or an existing reference number.`)

        cy.get('form[method=post][action="/create-payment-link/reference"]').should('exist')
          .within(() => {
            cy.get('input[type=radio]#reference-type-custom').should('exist')
            cy.get('input[type=radio]#reference-type-custom').click()

            cy.get('input#reference-label').should('exist')
            cy.get('input#reference-label').should('have.attr', 'lang', 'cy')
            cy.get('input#reference-label').parent('.govuk-form-group').get('span')
              .should('contain', 'For example, “rhif anfoneb”')

            cy.get('textarea#reference-hint-text').should('exist')
            cy.get('textarea#reference-hint-text').should('have.attr', 'lang', 'cy')
            cy.get('textarea#reference-hint-text').parent('.govuk-form-group').get('span')
              .should('contain', 'Explain in Welsh')

            cy.get('button').should('exist')
          })

        cy.get('#payment-link-example').should('not.exist')
      })

      it('should continue to the amount page', () => {
        cy.get('form[method=post][action="/create-payment-link/reference"]').should('exist')
          .within(() => {
            cy.get('input#reference-label').type(referenceName)
            cy.get('textarea#reference-hint-text').type(referenceHint)
            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/create-payment-link/amount`)
        })
      })
    })

    describe('Amount page', () => {
      it('should display content', () => {
        cy.get('form[method=post][action="/create-payment-link/amount"]').should('exist')
          .within(() => {
            cy.get('input[type=radio]#amount-type-fixed').should('exist')
            cy.get('input[type=radio]#amount-type-variable').should('exist')
            cy.get('input#payment-amount').should('exist')
            cy.get('button').should('exist')
          })

        cy.get('#payment-link-example').should('not.exist')
      })

      it('should continue to the confirm page', () => {
        cy.get('form[method=post][action="/create-payment-link/amount"]').should('exist')
          .within(() => {
            cy.get('input[type=radio]#amount-type-fixed').click()
            cy.get('input#payment-amount').type(amount)
            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/create-payment-link/review`)
        })
      })
    })

    describe('Review page', () => {
      it('should have Welsh-specific instructions', () => {
        cy.get('button').should('exist').should('contain', 'Create Welsh payment link')
      })
    })

    describe('Should clear session when returning to the create payment link start page', () => {
      it('should return to the start page', () => {
        cy.get('nav').contains('Create a payment link').click()
        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/create-payment-link`)
        })
      })

      it('should show English instructions when the "Create a payment link" button is pressed', () => {
        cy.get('a#create-payment-link').click()

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/create-payment-link/information`)
        })

        cy.get('h1').should('contain', 'Set payment link information')
      })

      it('should have empty inputs', () => {
        cy.get('form[method=post][action="/create-payment-link/information"]').should('exist')
          .within(() => {
            cy.get('input#payment-link-title').should('be.empty')
            cy.get('textarea#payment-link-description').should('be.empty')
          })
      })
    })
  })
})
