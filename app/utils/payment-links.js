// helper methods used across the payment link creation and edit user journeys
'use strict'

const lodash = require('lodash')

const paths = require('../paths')

// the edit and create flows handle storing cookie session data in separate places,
// abstract this away from the controller by adding accessors that can be based
// based on the request
function getPaymentLinksContext (req) {
  const isCreatingPaymentLink = !Object.values(paths.paymentLinks.manage).includes(req.route && req.route.path)
  const params = req.params || {}

  if (isCreatingPaymentLink) {
    const { metadataKey } = params

    return {
      sessionData: lodash.get(req, 'session.pageData.createPaymentLink'),
      addMetadataPageUrl: paths.paymentLinks.addMetadata,
      editMetadataPageUrl: paths.formattedPathFor(paths.paymentLinks.editMetadata, metadataKey),
      listMetadataPageUrl: paths.paymentLinks.review,
      isCreatingPaymentLink
    }
  } else {
    const { productExternalId, metadataKey } = params

    return {
      sessionData: lodash.get(req, 'session.editPaymentLinkData'),
      addMetadataPageUrl: paths.generateRoute(paths.paymentLinks.manage.addMetadata, { productExternalId }),
      editMetadataPageUrl: paths.formattedPathFor(paths.paymentLinks.manage.editMetadata, productExternalId, metadataKey),
      listMetadataPageUrl: paths.generateRoute(paths.paymentLinks.manage.edit, { productExternalId }),
      isCreatingPaymentLink
    }
  }
}

function addMetadata (paymentLinkSession = {}, key, value) {
  paymentLinkSession.metadata = paymentLinkSession.metadata || {}
  paymentLinkSession.metadata[key] = value
  return paymentLinkSession
}

function removeMetadata (paymentLinkSession = {}, key) {
  paymentLinkSession.metadata = paymentLinkSession.metadata || {}
  delete paymentLinkSession.metadata[key]
}

function updateMetadata (paymentLinkSession = {}, originalKey, key, value) {
  paymentLinkSession.metadata = paymentLinkSession.metadata || {}
  removeMetadata(paymentLinkSession, originalKey)
  addMetadata(paymentLinkSession, key, value)
  return paymentLinkSession
}

module.exports = {
  getPaymentLinksContext,
  metadata: {
    addMetadata,
    updateMetadata,
    removeMetadata
  }
}
