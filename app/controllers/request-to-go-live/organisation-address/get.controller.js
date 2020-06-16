'use strict'

const lodash = require('lodash')

const goLiveStage = require('../../../models/go-live-stage')
const { requestToGoLive } = require('../../../paths')
const response = require('../../../utils/response')
const { countries } = require('@govuk-pay/pay-js-commons').utils

module.exports = (req, res) => {
  // redirect on wrong stage
  if (req.service.currentGoLiveStage !== goLiveStage.ENTERED_ORGANISATION_NAME) {
    return res.redirect(
      303,
      requestToGoLive.index.replace(':externalServiceId', req.service.externalId)
    )
  }
  // initialise pageData
  let pageData = lodash.get(req, 'session.pageData.requestToGoLive.organisationAddress')
  if (pageData) {
    delete req.session.pageData.requestToGoLive.organisationAddress
  } else {
    const merchantDetails = lodash.get(req, 'service.merchantDetails')
    pageData = lodash.pick(merchantDetails, [
      'address_line1',
      'address_line2',
      'address_city',
      'address_postcode',
      'address_country',
      'telephone_number'
    ])
  }
  pageData.countries = countries.govukFrontendFormatted(lodash.get(pageData, 'address_country'))
  // render
  return response.response(req, res, 'request-to-go-live/organisation-address', pageData)
}
