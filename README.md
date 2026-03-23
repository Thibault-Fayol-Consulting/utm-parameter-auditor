# UTM Parameter Auditor

Google Ads Script that scans all enabled ads and checks for required UTM parameters in final URLs, tracking templates, and URL suffixes.

## What it does

1. Iterates over all enabled ads in the account
2. Checks final URL, tracking template (ad/ad group/campaign level), and URL suffix
3. Flags ads missing any of the required UTM parameters
4. Sends an HTML email report listing non-compliant ads

## Setup

1. Open [Google Ads Scripts](https://ads.google.com/aw/bulk/scripts)
2. Create a new script and paste the contents of `main_en.gs` (or `main_fr.gs`)
3. Edit the `CONFIG` block — especially `REQUIRED_UTMS`
4. Run once in test mode, review the logs
5. Set `TEST_MODE: false` and schedule (e.g., weekly)

## CONFIG reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `TEST_MODE` | boolean | `true` | `true` = log only, `false` = log + email |
| `EMAIL` | string | `'contact@domain.com'` | Report recipient email |
| `REQUIRED_UTMS` | array | `['utm_source', 'utm_medium', 'utm_campaign']` | UTM parameters to check |
| `CAMPAIGN_NAME_CONTAINS` | string | `''` | Filter campaigns by name (empty = all) |
| `MAX_ADS_TO_LOG` | number | `200` | Max ads to include in the report |

## How it works

- Uses `AdsApp.ads()` entity selectors with proper condition quoting (`"Status = 'ENABLED'"`)
- Checks three levels: ad final URL, tracking template (ad > ad group > campaign), and campaign URL suffix
- Combines all URL text and checks for presence of each required UTM parameter
- Reports campaign name, ad group, ad ID, ad type, final URL, and missing UTMs

## Requirements

- Google Ads account
- Google Ads Scripts access

## License

MIT - Thibault Fayol Consulting
