'use strict'

const { Router } = require('express')
const lodash = require('lodash')

const logger = require('./utils/logger')(__filename)
const response = require('./utils/response.js').response
const generateRoute = require('./utils/generate-route')
const paths = require('./paths.js')

const userIsAuthorised = require('./middleware/user-is-authorised')
const getServiceAndAccount = require('./middleware/get-service-and-gateway-account.middleware')

// Middleware
const { lockOutDisabledUsers, enforceUserAuthenticated, enforceUserFirstFactor, redirectLoggedInUser } = require('./services/auth.service')
const { validateAndRefreshCsrf, ensureSessionHasCsrfSecret } = require('./middleware/csrf')
const getEmailNotification = require('./middleware/get-email-notification')
const getAccount = require('./middleware/get-gateway-account')
const hasServices = require('./middleware/has-services')
const resolveService = require('./middleware/resolve-service')
const trimUsername = require('./middleware/trim-username')
const permission = require('./middleware/permission')
const paymentMethodIsCard = require('./middleware/payment-method-card')
const correlationIdMiddleware = require('./middleware/correlation-id')
const getRequestContext = require('./middleware/get-request-context').middleware
const restrictToSandbox = require('./middleware/restrict-to-sandbox')
const restrictToLiveStripeAccount = require('./middleware/stripe-setup/restrict-to-live-stripe-account')
const getStripeAccount = require('./middleware/stripe-setup/get-stripe-account')
const checkBankDetailsNotSubmitted = require('./middleware/stripe-setup/check-bank-details-not-submitted')
const checkResponsiblePersonNotSubmitted = require('./middleware/stripe-setup/check-responsible-person-not-submitted')
const checkVatNumberNotSubmitted = require('./middleware/stripe-setup/check-vat-number-not-submitted')
const checkCompanyNumberNotSubmitted = require('./middleware/stripe-setup/check-company-number-not-submitted')

// Controllers
const staticController = require('./controllers/static.controller')
const transactionsDownloadController = require('./controllers/transactions/transaction-download.controller')
const transactionsListController = require('./controllers/transactions/transaction-list.controller')
const transactionDetailController = require('./controllers/transactions/transaction-detail.controller')
const transactionRefundController = require('./controllers/transactions/transaction-refund.controller')
const transactionDetailRedirectController = require('./controllers/transactions/transaction-detail-redirect.controller')
const credentialsController = require('./controllers/credentials.controller')
const loginController = require('./controllers/login')
const dashboardController = require('./controllers/dashboard')
const healthcheckController = require('./controllers/healthcheck.controller')
const apiKeysController = require('./controllers/api-keys')
const digitalWalletController = require('./controllers/digital-wallet')
const emailNotificationsController = require('./controllers/email-notifications/email-notifications.controller')
const forgotPasswordController = require('./controllers/forgotten-password.controller')
const myServicesController = require('./controllers/my-services')
const editServiceNameController = require('./controllers/edit-service-name.controller')
const serviceUsersController = require('./controllers/service-users.controller')
const merchantDetailsController = require('./controllers/edit-merchant-details')
const inviteUserController = require('./controllers/invite-user.controller')
const registerController = require('./controllers/register-user.controller')
const serviceRolesUpdateController = require('./controllers/service-roles-update.controller')
const toggle3dsController = require('./controllers/toggle-3ds')
const toggleMotoMaskCardNumber = require('./controllers/toggle-moto-mask-card-number')
const toggleMotoMaskSecurityCode = require('./controllers/toggle-moto-mask-security-code')
const selfCreateServiceController = require('./controllers/register-service.controller')
const createServiceController = require('./controllers/create-service.controller')
const inviteValidationController = require('./controllers/invite-validation.controller')
const testWithYourUsersController = require('./controllers/test-with-your-users')
const makeADemoPaymentController = require('./controllers/make-a-demo-payment')
const paymentLinksController = require('./controllers/payment-links')
const twoFactorAuthController = require('./controllers/two-factor-auth-controller')
const feedbackController = require('./controllers/feedback')
const toggleBillingAddressController = require('./controllers/billing-address/toggle-billing-address.controller')
const requestToGoLiveIndexController = require('./controllers/request-to-go-live/index')
const requestToGoLiveOrganisationNameController = require('./controllers/request-to-go-live/organisation-name')
const requestToGoLiveOrganisationAddressController = require('./controllers/request-to-go-live/organisation-address')
const requestToGoLiveChooseHowToProcessPaymentsController = require('./controllers/request-to-go-live/choose-how-to-process-payments')
const requestToGoLiveAgreementController = require('./controllers/request-to-go-live/agreement')
const policyDocumentsController = require('./controllers/policy')
const stripeSetupBankDetailsController = require('./controllers/stripe-setup/bank-details')
const stripeSetupResponsiblePersonController = require('./controllers/stripe-setup/responsible-person')
const stripeSetupVatNumberController = require('./controllers/stripe-setup/vat-number')
const stripeSetupCompanyNumberController = require('./controllers/stripe-setup/company-number')
const stripeSetupAddPspAccountDetailsController = require('./controllers/stripe-setup/add-psp-account-details')
const paymentTypesController = require('./controllers/payment-types')
const settingsController = require('./controllers/settings')
const userPhoneNumberController = require('./controllers/user/phone-number')
const goCardlessRedirect = require('./controllers/partnerapp/handle-redirect-to-gocardless-connect.controller')
const goCardlessOAuthGet = require('./controllers/partnerapp/handle-gocardless-connect-get.controller')
const yourPspController = require('./controllers/your-psp')
const allTransactionsController = require('./controllers/all-service-transactions/index')
const payoutsController = require('./controllers/payouts/payout-list.controller')
const stripeSetupDashboardRedirectController = require('./controllers/stripe-setup/stripe-setup-link')

// Assignments
const {
  healthcheck, registerUser, user, dashboard, selfCreateService, transactions, credentials,
  apiKeys, serviceSwitcher, teamMembers, staticPaths, inviteValidation, editServiceName, merchantDetails,
  notificationCredentials: nc, paymentTypes: pt, emailNotifications: en, toggle3ds: t3ds, toggleMotoMaskCardNumberAndSecurityCode, prototyping, paymentLinks,
  partnerApp, requestToGoLive, policyPages, stripeSetup, stripe, digitalWallet,
  settings, yourPsp, allServiceTransactions, payouts
} = paths
const { toggleBillingAddress: billingAddress } = paths.account

// Exports
module.exports.generateRoute = generateRoute
module.exports.paths = paths

module.exports.bind = function (app) {
  const account = new Router({ mergeParams: true })
  account.use(getServiceAndAccount, userIsAuthorised)

  app.get('/style-guide', (req, res) => response(req, res, 'style_guide'))

  // APPLY CORRELATION MIDDLEWARE
  app.use('*', correlationIdMiddleware, getRequestContext)

  app.all(lockOutDisabledUsers) // On all requests, if there is a user, and its disabled, lock out.

  // ----------------------
  // UNAUTHENTICATED ROUTES
  // ----------------------

  // HEALTHCHECK
  app.get(healthcheck.path, healthcheckController.healthcheck)

  // STATIC
  app.all(staticPaths.naxsiError, staticController.naxsiError)

  // VALIDATE INVITE
  app.get(inviteValidation.validateInvite, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, inviteValidationController.validateInvite)

  // REGISTER USER
  app.get(registerUser.registration, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerController.showRegistration)
  app.get(registerUser.subscribeService, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerController.subscribeService)
  app.post(registerUser.registration, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerController.submitRegistration)
  app.get(registerUser.otpVerify, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerController.showOtpVerify)
  app.post(registerUser.otpVerify, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerController.submitOtpVerify)
  app.get(registerUser.reVerifyPhone, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerController.showReVerifyPhone)
  app.post(registerUser.reVerifyPhone, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerController.submitReVerifyPhone)
  app.get(registerUser.logUserIn, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, loginController.loginAfterRegister, enforceUserAuthenticated, hasServices, resolveService, getAccount, dashboardController.dashboardActivity)

  // LOGIN
  app.get(user.logIn, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, redirectLoggedInUser, loginController.loginGet)
  app.post(user.logIn, validateAndRefreshCsrf, trimUsername, loginController.loginUser, hasServices, resolveService, getAccount, loginController.postLogin)
  app.get(dashboard.index, enforceUserAuthenticated, validateAndRefreshCsrf, hasServices, resolveService, getAccount, dashboardController.dashboardActivity)
  app.get(user.noAccess, loginController.noAccess)
  app.get(user.logOut, loginController.logout)
  app.get(user.otpSendAgain, enforceUserFirstFactor, validateAndRefreshCsrf, loginController.sendAgainGet)
  app.post(user.otpSendAgain, enforceUserFirstFactor, validateAndRefreshCsrf, loginController.sendAgainPost)
  app.get(user.otpLogIn, enforceUserFirstFactor, validateAndRefreshCsrf, loginController.otpLogin)
  app.post(user.otpLogIn, validateAndRefreshCsrf, loginController.loginUserOTP, loginController.afterOTPLogin)

  // FORGOTTEN PASSWORD
  app.get(user.forgottenPassword, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, forgotPasswordController.emailGet)
  app.post(user.forgottenPassword, trimUsername, validateAndRefreshCsrf, forgotPasswordController.emailPost)
  app.get(user.passwordRequested, forgotPasswordController.passwordRequested)
  app.get(user.forgottenPasswordReset, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, forgotPasswordController.newPasswordGet)
  app.post(user.forgottenPasswordReset, validateAndRefreshCsrf, forgotPasswordController.newPasswordPost)

  // SELF CREATE SERVICE
  app.get(selfCreateService.register, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceController.showRegistration)
  app.post(selfCreateService.register, trimUsername, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceController.submitRegistration)
  app.get(selfCreateService.confirm, selfCreateServiceController.showConfirmation)
  app.get(selfCreateService.otpVerify, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceController.showOtpVerify)
  app.post(selfCreateService.otpVerify, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceController.createPopulatedService)
  app.get(selfCreateService.otpResend, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceController.showOtpResend)
  app.post(selfCreateService.otpResend, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceController.submitOtpResend)
  app.get(selfCreateService.logUserIn, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, loginController.loginAfterRegister, enforceUserAuthenticated, getAccount, selfCreateServiceController.loggedIn)
  app.get(selfCreateService.serviceNaming, enforceUserAuthenticated, validateAndRefreshCsrf, hasServices, getAccount, selfCreateServiceController.showNameYourService)
  app.post(selfCreateService.serviceNaming, enforceUserAuthenticated, validateAndRefreshCsrf, hasServices, getAccount, selfCreateServiceController.submitYourServiceName)

  // GOCARDLESS PARTNER APP
  app.get(partnerApp.oauthComplete, resolveService, getAccount, goCardlessOAuthGet.index)

  // ----------------------
  // AUTHENTICATED ROUTES
  // ----------------------

  const authenticatedPaths = [
    ...lodash.values(transactions),
    ...lodash.values(allServiceTransactions),
    ...lodash.values(credentials),
    ...lodash.values(nc),
    ...lodash.values(apiKeys),
    ...lodash.values(pt),
    ...lodash.values(en),
    ...lodash.values(editServiceName),
    ...lodash.values(serviceSwitcher),
    ...lodash.values(teamMembers),
    ...lodash.values(t3ds),
    ...lodash.values(merchantDetails),
    ...lodash.values(prototyping.demoPayment),
    ...lodash.values(prototyping.demoService),
    ...lodash.values(paymentLinks),
    ...lodash.values(user.profile),
    ...lodash.values(partnerApp),
    ...lodash.values(billingAddress),
    ...lodash.values(requestToGoLive),
    ...lodash.values(policyPages),
    ...lodash.values(stripeSetup),
    ...lodash.values(stripe),
    ...lodash.values(digitalWallet),
    ...lodash.values(settings),
    ...lodash.values(yourPsp),
    ...lodash.values(payouts),
    ...lodash.values(toggleMotoMaskCardNumberAndSecurityCode),
    paths.feedback
  ] // Extract all the authenticated paths as a single array

  app.use(authenticatedPaths, enforceUserAuthenticated, validateAndRefreshCsrf) // Enforce authentication on all get requests
  app.use(authenticatedPaths.filter(item => !lodash.values(serviceSwitcher).includes(item)), hasServices) // Require services everywhere but the switcher page

  app.get(settings.index, permission('transactions-details:read'), getAccount, getEmailNotification, settingsController.index)

  //  TRANSACTIONS
  app.get(transactions.index, permission('transactions:read'), getAccount, paymentMethodIsCard, transactionsListController)
  app.get(transactions.download, permission('transactions-download:read'), getAccount, paymentMethodIsCard, transactionsDownloadController)
  app.get(transactions.detail, permission('transactions-details:read'), resolveService, getAccount, paymentMethodIsCard, transactionDetailController)
  app.post(transactions.refund, permission('refunds:create'), getAccount, paymentMethodIsCard, transactionRefundController)
  app.get(transactions.redirectDetail, permission('transactions-details:read'), getAccount, transactionDetailRedirectController)

  // ALL SERVICE TRANSACTIONS
  app.get(allServiceTransactions.index, permission('transactions:read'), getAccount, allTransactionsController.getController)
  app.get(allServiceTransactions.download, permission('transactions-download:read'), getAccount, allTransactionsController.downloadTransactions)

  app.get(payouts.list, permission('transactions:read'), payoutsController.listAllServicesPayouts)

  // YOUR PSP
  app.get(yourPsp.index, permission('gateway-credentials:read'), getAccount, paymentMethodIsCard, yourPspController.getIndex)
  app.post(yourPsp.worldpay3dsFlex, permission('toggle-3ds:update'), getAccount, paymentMethodIsCard, yourPspController.postToggleWorldpay3dsFlex)
  app.get(yourPsp.flex, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, yourPspController.getFlex)
  app.post(yourPsp.flex, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, yourPspController.postFlex)

  // CREDENTIALS
  app.get(credentials.index, permission('gateway-credentials:read'), getAccount, paymentMethodIsCard, credentialsController.index)
  app.get(credentials.edit, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, credentialsController.editCredentials)
  app.post(credentials.index, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, credentialsController.update)

  app.get(nc.index, permission('gateway-credentials:read'), getAccount, paymentMethodIsCard, credentialsController.index)
  app.get(nc.edit, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, credentialsController.editNotificationCredentials)
  app.post(nc.update, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, credentialsController.updateNotificationCredentials)

  // MERCHANT DETAILS
  app.get(merchantDetails.index, permission('merchant-details:read'), merchantDetailsController.getIndex)
  app.get(merchantDetails.edit, permission('merchant-details:update'), merchantDetailsController.getEdit)
  app.post(merchantDetails.edit, permission('merchant-details:update'), merchantDetailsController.postEdit)

  // API KEYS
  app.get(apiKeys.index, permission('tokens-active:read'), getAccount, apiKeysController.getIndex)
  app.get(apiKeys.revoked, permission('tokens-revoked:read'), getAccount, apiKeysController.getRevoked)
  app.get(apiKeys.create, permission('tokens:create'), getAccount, apiKeysController.getCreate)
  app.post(apiKeys.create, permission('tokens:create'), getAccount, apiKeysController.postCreate)
  app.post(apiKeys.revoke, permission('tokens:delete'), getAccount, apiKeysController.postRevoke)
  app.post(apiKeys.update, permission('tokens:update'), getAccount, apiKeysController.postUpdate)

  account.get(pt.index, permission('payment-types:read'), paymentTypesController.getIndex)
  account.post(pt.index, permission('payment-types:update'), paymentTypesController.postIndex)

  // DIGITAL WALLET
  app.get(digitalWallet.applePay, permission('payment-types:update'), getAccount, paymentMethodIsCard, digitalWalletController.getApplePay)
  app.post(digitalWallet.applePay, permission('payment-types:update'), getAccount, paymentMethodIsCard, digitalWalletController.postApplePay)
  app.get(digitalWallet.googlePay, permission('payment-types:update'), getAccount, paymentMethodIsCard, digitalWalletController.getGooglePay)
  app.post(digitalWallet.googlePay, permission('payment-types:update'), getAccount, paymentMethodIsCard, digitalWalletController.postGooglePay)

  // EMAIL
  app.get(en.index, permission('email-notification-template:read'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.index)
  app.get(en.indexRefundTabEnabled, permission('email-notification-template:read'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.indexRefundTabEnabled)
  app.get(en.edit, permission('email-notification-paragraph:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.edit)
  app.post(en.confirm, permission('email-notification-paragraph:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.confirm)
  app.post(en.update, permission('email-notification-paragraph:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.update)
  app.get(en.collection, permission('email-notification-template:read'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.collectionEmailIndex)
  app.post(en.collection, permission('email-notification-toggle:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.collectionEmailUpdate)
  app.get(en.confirmation, permission('email-notification-template:read'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.confirmationEmailIndex)
  app.post(en.confirmation, permission('email-notification-toggle:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.confirmationEmailUpdate)
  app.post(en.off, permission('email-notification-toggle:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.confirmationEmailOff)
  app.post(en.on, permission('email-notification-toggle:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.confirmationEmailOn)
  app.get(en.refund, permission('email-notification-template:read'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.refundEmailIndex)
  app.post(en.refund, permission('email-notification-toggle:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.refundEmailUpdate)

  // SERVICE SWITCHER
  app.get(serviceSwitcher.index, myServicesController.getIndex)
  app.post(serviceSwitcher.switch, myServicesController.postIndex)
  app.get(serviceSwitcher.create, createServiceController.get)
  app.post(serviceSwitcher.create, createServiceController.post)

  // EDIT SERVICE NAME
  app.get(editServiceName.index, permission('service-name:update'), editServiceNameController.get)
  app.post(editServiceName.update, permission('service-name:update'), editServiceNameController.post)

  // TEAM MEMBERS - USER PROFILE
  app.get(teamMembers.index, resolveService, serviceUsersController.index)
  app.get(teamMembers.show, permission('users-service:read'), serviceUsersController.show)
  app.get(teamMembers.permissions, permission('users-service:create'), serviceRolesUpdateController.index)
  app.post(teamMembers.permissions, permission('users-service:create'), serviceRolesUpdateController.update)
  app.post(teamMembers.delete, permission('users-service:delete'), serviceUsersController.delete)
  app.get(user.profile.index, enforceUserAuthenticated, serviceUsersController.profile)

  // TEAM MEMBERS - INVITE
  app.get(teamMembers.invite, permission('users-service:create'), inviteUserController.index)
  app.post(teamMembers.invite, permission('users-service:create'), inviteUserController.invite)

  // 3D SECURE TOGGLE
  app.get(t3ds.index, permission('toggle-3ds:read'), getAccount, paymentMethodIsCard, toggle3dsController.get)
  app.post(t3ds.index, permission('toggle-3ds:update'), getAccount, paymentMethodIsCard, toggle3dsController.post)

  // MOTO MASK CARD NUMBER & SECURITY CODE TOGGLE
  app.get(toggleMotoMaskCardNumberAndSecurityCode.cardNumber, permission('moto-mask-input:read'), getAccount, paymentMethodIsCard, toggleMotoMaskCardNumber.get)
  app.post(toggleMotoMaskCardNumberAndSecurityCode.cardNumber, permission('moto-mask-input:update'), getAccount, paymentMethodIsCard, toggleMotoMaskCardNumber.post)
  app.get(toggleMotoMaskCardNumberAndSecurityCode.securityCode, permission('moto-mask-input:read'), getAccount, paymentMethodIsCard, toggleMotoMaskSecurityCode.get)
  app.post(toggleMotoMaskCardNumberAndSecurityCode.securityCode, permission('moto-mask-input:update'), getAccount, paymentMethodIsCard, toggleMotoMaskSecurityCode.post)

  account.get(billingAddress.index, permission('toggle-billing-address:read'), toggleBillingAddressController.getIndex)
  account.post(billingAddress.index, permission('toggle-billing-address:update'), toggleBillingAddressController.postIndex)

  // Prototyping
  app.get(prototyping.demoService.index, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsersController.index)
  app.get(prototyping.demoService.links, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsersController.links)
  app.get(prototyping.demoService.create, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsersController.create)
  app.post(prototyping.demoService.confirm, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsersController.submit)
  app.get(prototyping.demoService.disable, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsersController.disable)

  app.get(prototyping.demoPayment.index, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPaymentController.index)
  app.post(prototyping.demoPayment.index, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPaymentController.index)
  app.get(prototyping.demoPayment.editDescription, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPaymentController.edit)
  app.get(prototyping.demoPayment.editAmount, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPaymentController.edit)
  app.get(prototyping.demoPayment.mockCardDetails, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPaymentController.mockCardDetails)
  app.post(prototyping.demoPayment.goToPaymentScreens, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPaymentController.goToPayment)

  // Create payment link
  app.get(paymentLinks.start, permission('tokens:create'), getAccount, paymentLinksController.getStart)
  app.get(paymentLinks.information, permission('tokens:create'), getAccount, paymentLinksController.getInformation)
  app.post(paymentLinks.information, permission('tokens:create'), getAccount, paymentLinksController.postInformation)
  app.get(paymentLinks.webAddress, permission('tokens:create'), getAccount, paymentLinksController.getWebAddress)
  app.post(paymentLinks.webAddress, permission('tokens:create'), getAccount, paymentLinksController.postWebAddress)
  app.get(paymentLinks.reference, permission('tokens:create'), getAccount, paymentLinksController.getReference)
  app.post(paymentLinks.reference, permission('tokens:create'), getAccount, paymentLinksController.postReference)
  app.get(paymentLinks.amount, permission('tokens:create'), getAccount, paymentLinksController.getAmount)
  app.post(paymentLinks.amount, permission('tokens:create'), getAccount, paymentLinksController.postAmount)
  app.get(paymentLinks.review, permission('tokens:create'), getAccount, paymentLinksController.getReview)
  app.post(paymentLinks.review, permission('tokens:create'), getAccount, paymentLinksController.postReview)

  app.get(paymentLinks.addMetadata, permission('tokens:create'), getAccount, paymentLinksController.getAddReportingColumn.showAddMetadataPage)
  app.get(paymentLinks.editMetadata, permission('tokens:create'), getAccount, paymentLinksController.getAddReportingColumn.showEditMetadataPage)
  app.post(paymentLinks.addMetadata, permission('tokens:create'), getAccount, paymentLinksController.postUpdateReportingColumn.addMetadata)
  app.post(paymentLinks.editMetadata, permission('tokens:create'), getAccount, paymentLinksController.postUpdateReportingColumn.editMetadata)
  app.post(paymentLinks.deleteMetadata, permission('tokens:create'), getAccount, paymentLinksController.postUpdateReportingColumn.deleteMetadata)

  app.get(paymentLinks.manage.addMetadata, permission('tokens:create'), getAccount, paymentLinksController.getAddReportingColumn.showAddMetadataPage)
  app.post(paymentLinks.manage.addMetadata, permission('tokens:create'), getAccount, paymentLinksController.postUpdateReportingColumn.addMetadata)
  app.get(paymentLinks.manage.editMetadata, permission('tokens:create'), getAccount, paymentLinksController.getAddReportingColumn.showEditMetadataPage)
  app.post(paymentLinks.manage.editMetadata, permission('tokens:create'), getAccount, paymentLinksController.postUpdateReportingColumn.editMetadata)
  app.post(paymentLinks.manage.deleteMetadata, permission('tokens:create'), getAccount, paymentLinksController.postUpdateReportingColumn.deleteMetadata)

  app.get(paymentLinks.manage.index, permission('transactions:read'), getAccount, paymentLinksController.getManage)
  app.get(paymentLinks.manage.disable, permission('tokens:create'), getAccount, paymentLinksController.getDisable)
  app.get(paymentLinks.manage.delete, permission('tokens:create'), getAccount, paymentLinksController.getDelete)
  app.get(paymentLinks.manage.edit, permission('tokens:create'), getAccount, paymentLinksController.getEdit)
  app.post(paymentLinks.manage.edit, permission('tokens:create'), getAccount, paymentLinksController.postEdit)
  app.get(paymentLinks.manage.editInformation, permission('tokens:create'), getAccount, paymentLinksController.getEditInformation)
  app.post(paymentLinks.manage.editInformation, permission('tokens:create'), getAccount, paymentLinksController.postEditInformation)
  app.get(paymentLinks.manage.editReference, permission('tokens:create'), getAccount, paymentLinksController.getEditReference)
  app.post(paymentLinks.manage.editReference, permission('tokens:create'), getAccount, paymentLinksController.postEditReference)
  app.get(paymentLinks.manage.editAmount, permission('tokens:create'), getAccount, paymentLinksController.getEditAmount)
  app.post(paymentLinks.manage.editAmount, permission('tokens:create'), getAccount, paymentLinksController.postEditAmount)

  app.get(paymentLinks.metadata.add, permission('tokens:create'), getAccount, paymentLinksController.metadata.add)
  app.post(paymentLinks.metadata.add, permission('tokens:create'), getAccount, paymentLinksController.metadata.post)
  app.get(paymentLinks.metadata.edit, permission('tokens:create'), getAccount, paymentLinksController.metadata.editPage)
  app.post(paymentLinks.metadata.edit, permission('tokens:create'), getAccount, paymentLinksController.metadata.editPagePost)
  app.post(paymentLinks.metadata.delete, permission('tokens:create'), getAccount, paymentLinksController.metadata.deletePagePost)

  // Configure 2FA
  app.get(user.profile.twoFactorAuth.index, twoFactorAuthController.getIndex)
  app.post(user.profile.twoFactorAuth.index, twoFactorAuthController.postIndex)
  app.get(user.profile.twoFactorAuth.configure, twoFactorAuthController.getConfigure)
  app.post(user.profile.twoFactorAuth.configure, twoFactorAuthController.postConfigure)
  app.post(user.profile.twoFactorAuth.resend, twoFactorAuthController.postResend)

  // Feedback
  app.get(paths.feedback, hasServices, resolveService, getAccount, feedbackController.getIndex)
  app.post(paths.feedback, hasServices, resolveService, getAccount, feedbackController.postIndex)

  // Partner app link GoCardless account
  app.get(paths.partnerApp.linkAccount, permission('connected-gocardless-account:update'), getAccount, goCardlessRedirect.index)

  // Request to go live: index
  app.get(requestToGoLive.index, permission('go-live-stage:read'), getAccount, requestToGoLiveIndexController.get)
  app.post(requestToGoLive.index, permission('go-live-stage:update'), getAccount, requestToGoLiveIndexController.post)
  // Request to go live: organisation name
  app.get(requestToGoLive.organisationName, permission('go-live-stage:update'), getAccount, requestToGoLiveOrganisationNameController.get)
  app.post(requestToGoLive.organisationName, permission('go-live-stage:update'), getAccount, requestToGoLiveOrganisationNameController.post)
  // Request to go live: organisation address
  app.get(requestToGoLive.organisationAddress, permission('go-live-stage:update'), getAccount, requestToGoLiveOrganisationAddressController.get)
  app.post(requestToGoLive.organisationAddress, permission('go-live-stage:update'), getAccount, requestToGoLiveOrganisationAddressController.post)
  // Request to go live: choose how to process payments
  app.get(requestToGoLive.chooseHowToProcessPayments, permission('go-live-stage:update'), getAccount, requestToGoLiveChooseHowToProcessPaymentsController.get)
  app.post(requestToGoLive.chooseHowToProcessPayments, permission('go-live-stage:update'), getAccount, requestToGoLiveChooseHowToProcessPaymentsController.post)
  // Request to go live: agreement
  app.get(requestToGoLive.agreement, permission('go-live-stage:update'), getAccount, requestToGoLiveAgreementController.get)
  app.post(requestToGoLive.agreement, permission('go-live-stage:update'), getAccount, requestToGoLiveAgreementController.post)

  // Private policy document downloads
  app.get(policyPages.download, policyDocumentsController.download)

  // Stripe setup: bank details
  app.get(
    stripeSetup.bankDetails,
    permission('stripe-bank-details:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    checkBankDetailsNotSubmitted,
    getStripeAccount,
    stripeSetupBankDetailsController.get
  )
  app.post(
    stripeSetup.bankDetails,
    permission('stripe-bank-details:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    checkBankDetailsNotSubmitted,
    getStripeAccount,
    stripeSetupBankDetailsController.post
  )

  // Stripe setup: responsible person
  app.get(stripeSetup.responsiblePerson,
    permission('stripe-responsible-person:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    getStripeAccount,
    checkResponsiblePersonNotSubmitted,
    stripeSetupResponsiblePersonController.get
  )
  app.post(stripeSetup.responsiblePerson,
    permission('stripe-responsible-person:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    getStripeAccount,
    checkResponsiblePersonNotSubmitted,
    stripeSetupResponsiblePersonController.post)

  // Stripe setup: VAT number
  app.get(stripeSetup.vatNumber,
    permission('stripe-vat-number-company-number:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    checkVatNumberNotSubmitted,
    stripeSetupVatNumberController.get
  )
  app.post(stripeSetup.vatNumber,
    permission('stripe-vat-number-company-number:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    getStripeAccount,
    checkVatNumberNotSubmitted,
    stripeSetupVatNumberController.post
  )

  // Stripe setup: company number
  app.get(stripeSetup.companyNumber,
    permission('stripe-vat-number-company-number:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    checkCompanyNumberNotSubmitted,
    stripeSetupCompanyNumberController.get
  )
  app.post(stripeSetup.companyNumber,
    permission('stripe-vat-number-company-number:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    getStripeAccount,
    checkCompanyNumberNotSubmitted,
    stripeSetupCompanyNumberController.post
  )

  app.get(stripeSetup.stripeSetupLink, stripeSetupDashboardRedirectController.get)

  app.get(stripe.addPspAccountDetails,
    permission('stripe-account-details:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    stripeSetupAddPspAccountDetailsController.get
  )

  app.get(user.profile.phoneNumber,
    userPhoneNumberController.get
  )

  app.post(user.profile.phoneNumber,
    userPhoneNumberController.post
  )

  app.use(paths.account.root, account)

  app.all('*', (req, res) => {
    logger.info('Page not found', {
      url: req.originalUrl
    })
    res.status(404)
    res.render('404')
  })
}
