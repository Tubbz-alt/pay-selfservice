'use strict'

const generateRoute = require('./utils/generate-route')
const formattedPathFor = require('./utils/replace-params-in-path')

const keys = {
  SERVICE_EXTERNAL_ID: 'serviceExternalId',
  GATEWAY_ACCOUNT_EXTERNAL_ID: 'gatewayAccountExternalId'
}

module.exports = {
  keys,
  account: {
    root: `/account/:${keys.GATEWAY_ACCOUNT_EXTERNAL_ID}`,
    toggleBillingAddress: {
      index: '/billing-address'
    }
  },
  transactions: {
    index: '/transactions',
    download: '/transactions/download',
    detail: '/transactions/:chargeId',
    refund: '/transactions/:chargeId/refund',
    redirectDetail: '/redirect/transactions/:chargeId'
  },
  allServiceTransactions: {
    index: '/all-service-transactions',
    download: '/all-service-transactions/download'
  },
  yourPsp: {
    index: '/your-psp',
    flex: '/your-psp/flex',
    worldpay3dsFlex: '/your-psp/worldpay-3ds-flex'
  },
  credentials: {
    index: '/credentials',
    edit: '/credentials/edit',
    create: '/credentials'
  },
  notificationCredentials: {
    index: '/credentials',
    edit: '/notification-credentials/edit',
    update: '/notification-credentials'
  },
  user: {
    logIn: '/login',
    otpLogIn: '/otp-login',
    otpSendAgain: '/otp-send-again',
    logOut: '/logout',
    callback: '/callback',
    noAccess: '/noaccess',
    forgottenPassword: '/reset-password',
    passwordRequested: '/reset-password-requested',
    forgottenPasswordReset: '/reset-password/:id',
    profile: {
      index: '/my-profile',
      phoneNumber: '/my-profile/phone-number',
      twoFactorAuth: {
        index: '/my-profile/two-factor-auth',
        configure: '/my-profile/two-factor-auth/configure',
        resend: '/my-profile/two-factor-auth/resend'
      }
    }
  },
  dashboard: {
    index: '/'
  },
  apiKeys: {
    index: '/api-keys',
    revoked: '/api-keys/revoked',
    create: '/api-keys/create',
    revoke: '/api-keys/revoke',
    update: '/api-keys/update'
  },
  paymentTypes: {
    index: '/payment-types'
  },
  digitalWallet: {
    applePay: '/digital-wallet/apple-pay',
    googlePay: '/digital-wallet/google-pay'
  },
  emailNotifications: {
    index: '/email-notifications',
    indexRefundTabEnabled: '/email-notifications-refund',
    edit: '/email-notifications/edit',
    confirm: '/email-notifications/confirm',
    update: '/email-notifications/update',
    off: '/email-notifications/off',
    on: '/email-notifications/on',
    collection: '/email-settings-collection',
    confirmation: '/email-settings-confirmation',
    refund: '/email-settings-refund'
  },
  serviceSwitcher: {
    index: '/my-services',
    switch: '/my-services/switch',
    create: '/my-services/create'
  },
  editServiceName: {
    index: '/service/:externalServiceId/edit-name',
    update: '/service/:externalServiceId/edit-name'
  },
  merchantDetails: {
    index: '/organisation-details/:externalServiceId',
    edit: '/organisation-details/edit/:externalServiceId'
  },
  teamMembers: {
    index: '/service/:externalServiceId',
    show: '/service/:externalServiceId/team-member/:externalUserId',
    delete: '/service/:externalServiceId/team-member/:externalUserId/delete',
    permissions: '/service/:externalServiceId/team-member/:externalUserId/permissions',
    invite: '/service/:externalServiceId/team-members/invite'
  },
  inviteValidation: {
    validateInvite: '/invites/:code'
  },
  registerUser: {
    registration: '/register',
    subscribeService: '/subscribe',
    otpVerify: '/verify-otp',
    reVerifyPhone: '/re-verify-phone',
    logUserIn: '/proceed-to-login'
  },
  selfCreateService: {
    register: '/create-service/register',
    confirm: '/create-service/confirm',
    otpVerify: '/create-service/verify-otp',
    otpResend: '/create-service/resend-otp',
    logUserIn: '/create-service/proceed-to-login',
    serviceNaming: '/service/set-name'
  },
  toggle3ds: {
    index: '/3ds'
  },
  toggleMotoMaskCardNumberAndSecurityCode: {
    cardNumber: '/moto-hide-card-number',
    securityCode: '/moto-hide-security-code'
  },
  healthcheck: {
    path: '/healthcheck'
  },
  staticPaths: {
    naxsiError: '/request-denied'
  },
  prototyping: {
    demoService: {
      index: '/test-with-your-users',
      links: '/test-with-your-users/links',
      create: '/test-with-your-users/create',
      confirm: '/test-with-your-users/confirm',
      disable: '/test-with-your-users/links/disable/:productExternalId'
    },
    demoPayment: {
      index: '/make-a-demo-payment',
      editDescription: '/make-a-demo-payment/edit-description',
      editAmount: '/make-a-demo-payment/edit-amount',
      mockCardDetails: '/make-a-demo-payment/mock-card-numbers',
      goToPaymentScreens: '/make-a-demo-payment/go-to-payment'
    }
  },
  paymentLinks: {
    start: '/create-payment-link',
    information: '/create-payment-link/information',
    webAddress: '/create-payment-link/web-address',
    reference: '/create-payment-link/reference',
    amount: '/create-payment-link/amount',
    review: '/create-payment-link/review',
    addMetadata: '/create-payment-link/add-reporting-column',
    editMetadata: '/create-payment-link/add-reporting-column/:metadataKey',
    deleteMetadata: '/create-payment-link/add-reporting-column/:metadataKey/delete',
    manage: {
      index: '/create-payment-link/manage',
      edit: '/create-payment-link/manage/edit/:productExternalId',
      disable: '/create-payment-link/manage/disable/:productExternalId',
      delete: '/create-payment-link/manage/delete/:productExternalId',
      editInformation: '/create-payment-link/manage/edit/information/:productExternalId',
      editReference: '/create-payment-link/manage/edit/reference/:productExternalId',
      editAmount: '/create-payment-link/manage/edit/amount/:productExternalId',
      addMetadata: '/create-payment-link/manage/:productExternalId/add-reporting-column',
      editMetadata: '/create-payment-link/manage/:productExternalId/add-reporting-column/:metadataKey',
      deleteMetadata: '/create-payment-link/manage/:productExternalId/add-reporting-column/:metadataKey/delete'
    },
    metadata: {
      add: '/create-payment-link/manage/edit/:productExternalId/metadata',
      edit: '/create-payment-link/manage/edit/:productExternalId/metadata/:metadataKey',
      delete: '/create-payment-link/manage/edit/:productExternalId/metadata/:metadataKey/delete'
    }
  },
  feedback: '/feedback',
  partnerApp: {
    linkAccount: '/link-account',
    oauthComplete: '/oauth/complete'
  },
  generateRoute: generateRoute,
  formattedPathFor: formattedPathFor,
  requestToGoLive: {
    index: '/service/:externalServiceId/request-to-go-live',
    organisationName: '/service/:externalServiceId/request-to-go-live/organisation-name',
    organisationAddress: '/service/:externalServiceId/request-to-go-live/organisation-address',
    chooseHowToProcessPayments: '/service/:externalServiceId/request-to-go-live/choose-how-to-process-payments',
    agreement: '/service/:externalServiceId/request-to-go-live/agreement'
  },
  policyPages: {
    download: '/policy/download/:key'
  },
  stripeSetup: {
    bankDetails: '/bank-details',
    responsiblePerson: '/responsible-person',
    vatNumber: '/vat-number',
    companyNumber: '/company-number',
    stripeSetupLink: '/service/:externalServiceId/dashboard/live'
  },
  stripe: {
    addPspAccountDetails: '/stripe/add-psp-account-details'
  },
  settings: {
    index: '/settings'
  },
  payouts: {
    list: '/payments-to-your-bank-account'
  }
}
