/**
 * ==========================================================================
 * UTM Parameter Auditor — Google Ads Script
 * ==========================================================================
 * Scans all enabled ads and checks that required UTM parameters are present
 * in either the final URL, the tracking template, or the URL suffix. Sends
 * an email report listing non-compliant ads.
 *
 * Author:  Thibault Fayol — Consultant SEA
 * Website: https://thibaultfayol.com
 * License: MIT — Thibault Fayol Consulting
 * ==========================================================================
 */

var CONFIG = {
  TEST_MODE: true,
  EMAIL: 'contact@domain.com',
  REQUIRED_UTMS: ['utm_source', 'utm_medium', 'utm_campaign'],
  CAMPAIGN_NAME_CONTAINS: '',
  MAX_ADS_TO_LOG: 200
};

function main() {
  try {
    var tz = AdsApp.currentAccount().getTimeZone();
    var today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
    var accountName = AdsApp.currentAccount().getName();

    Logger.log('=== UTM Parameter Auditor ===');
    Logger.log('Account: ' + accountName);
    Logger.log('Date: ' + today);
    Logger.log('Required UTMs: ' + CONFIG.REQUIRED_UTMS.join(', '));

    var selector = AdsApp.ads()
      .withCondition("Status = 'ENABLED'")
      .withCondition("CampaignStatus = 'ENABLED'")
      .withCondition("AdGroupStatus = 'ENABLED'");

    if (CONFIG.CAMPAIGN_NAME_CONTAINS) {
      selector = selector.withCondition(
        "CampaignName CONTAINS_IGNORE_CASE '" + CONFIG.CAMPAIGN_NAME_CONTAINS + "'");
    }

    var adIterator = selector.get();
    var totalAds = 0;
    var nonCompliant = [];

    while (adIterator.hasNext()) {
      var ad = adIterator.next();
      totalAds++;

      var finalUrls = ad.urls().getFinalUrls() || [];
      var finalUrl = finalUrls.length > 0 ? finalUrls[0] : '';
      var trackingTemplate = ad.urls().getTrackingTemplate() ||
                             ad.getAdGroup().urls().getTrackingTemplate() ||
                             ad.getCampaign().urls().getTrackingTemplate() || '';
      var customParams = ad.urls().getCustomParameters() || {};

      var combined = (finalUrl + ' ' + trackingTemplate).toLowerCase();

      var suffix = '';
      try { suffix = ad.getCampaign().urls().getFinalUrlSuffix() || ''; } catch(ignore) {}
      combined += ' ' + suffix.toLowerCase();

      var missing = [];
      for (var i = 0; i < CONFIG.REQUIRED_UTMS.length; i++) {
        var utm = CONFIG.REQUIRED_UTMS[i];
        if (combined.indexOf(utm) === -1) {
          missing.push(utm);
        }
      }

      if (missing.length > 0 && nonCompliant.length < CONFIG.MAX_ADS_TO_LOG) {
        nonCompliant.push({
          campaignName: ad.getCampaign().getName(),
          adGroupName: ad.getAdGroup().getName(),
          adId: ad.getId(),
          adType: ad.getType(),
          finalUrl: finalUrl,
          trackingTemplate: trackingTemplate.substring(0, 100),
          missingUtms: missing.join(', ')
        });
      }
    }

    Logger.log('Total ads scanned: ' + totalAds);
    Logger.log('Non-compliant ads: ' + nonCompliant.length);

    for (var j = 0; j < Math.min(nonCompliant.length, 20); j++) {
      var nc = nonCompliant[j];
      Logger.log('  Ad #' + nc.adId + ' (' + nc.campaignName + ' > ' +
        nc.adGroupName + ') — Missing: ' + nc.missingUtms);
    }

    if (!CONFIG.TEST_MODE && nonCompliant.length > 0) {
      sendReport_(accountName, today, totalAds, nonCompliant);
    } else if (nonCompliant.length === 0) {
      Logger.log('All ads have required UTM parameters.');
    } else {
      Logger.log('[TEST MODE] Email not sent.');
    }

    Logger.log('=== Done ===');

  } catch (e) {
    Logger.log('FATAL ERROR: ' + e.message);
    if (!CONFIG.TEST_MODE) {
      MailApp.sendEmail(
        CONFIG.EMAIL,
        'ERROR — UTM Auditor — ' + AdsApp.currentAccount().getName(),
        'Script failed:\n' + e.message + '\n\n' + e.stack
      );
    }
  }
}

function sendReport_(accountName, date, totalAds, nonCompliant) {
  var rows = nonCompliant.map(function(nc) {
    return '<tr><td>' + nc.campaignName + '</td><td>' + nc.adGroupName + '</td>' +
      '<td>' + nc.adId + '</td><td>' + nc.adType + '</td>' +
      '<td style="font-size:11px;max-width:250px;word-break:break-all">' + nc.finalUrl + '</td>' +
      '<td style="color:red"><b>' + nc.missingUtms + '</b></td></tr>';
  }).join('\n');

  var html =
    '<h2>UTM Parameter Audit Report</h2>' +
    '<p><b>Account:</b> ' + accountName + '<br><b>Date:</b> ' + date +
    '<br><b>Ads scanned:</b> ' + totalAds +
    '<br><b>Non-compliant:</b> <span style="color:red">' + nonCompliant.length + '</span></p>' +
    '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:12px">' +
    '<tr style="background:#f2f2f2"><th>Campaign</th><th>Ad Group</th><th>Ad ID</th>' +
    '<th>Type</th><th>Final URL</th><th>Missing UTMs</th></tr>' +
    rows + '</table>' +
    '<p style="color:#888;font-size:11px">Fix: add a tracking template at campaign or account level, ' +
    'or set UTMs in the final URL suffix.</p>';

  MailApp.sendEmail({
    to: CONFIG.EMAIL,
    subject: 'UTM Audit — ' + nonCompliant.length + ' non-compliant ads — ' + accountName,
    htmlBody: html
  });
}
