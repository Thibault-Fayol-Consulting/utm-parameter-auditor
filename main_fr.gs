/**
 * --------------------------------------------------------------------------
 * utm-parameter-auditor - Google Ads Script for SMBs
 * --------------------------------------------------------------------------
 * Author: Thibault Fayol - Consultant SEA PME
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */
var CONFIG = { TEST_MODE: true, REQUIRED_UTM: "utm_source" };
function main() {
    Logger.log("Audit des paramètres UTM...");
    var adIter = AdsApp.ads().withCondition("Status = ENABLED").get();
    var missingCount = 0;
    while(adIter.hasNext()) {
        var ad = adIter.next();
        var trackingTemplate = ad.urls().getTrackingTemplate() || ad.getCampaign().urls().getTrackingTemplate() || "";
        var finalUrls = ad.urls().getFinalUrls();
        var url = finalUrls && finalUrls.length > 0 ? finalUrls[0] : "";
        
        if (trackingTemplate.indexOf(CONFIG.REQUIRED_UTM) === -1 && url.indexOf(CONFIG.REQUIRED_UTM) === -1) {
            Logger.log("UTM manquant Annonce ID " + ad.getId() + " - " + url);
            missingCount++;
        }
    }
    Logger.log(missingCount + " UTM manquants trouvés.");
}
