/**
 * Guidesync Services — lead intake for Google Sheets.
 *
 * Setup (one time, about 5 minutes):
 * 1. Create a Google Sheet named "Guidesync Leads".
 * 2. Extensions > Apps Script. Delete the sample code and paste this whole file.
 * 3. Change SHARED_SECRET below to a long random string (keep a copy for Cloudflare).
 * 4. Click Deploy > New deployment > type "Web app".
 *      Execute as: Me    |    Who has access: Anyone
 *    Authorize when prompted. Copy the Web app URL.
 * 5. In Cloudflare Pages > your project > Settings > Variables and Secrets, add:
 *      SHEETS_WEBHOOK_URL   = the Web app URL
 *      SHEETS_SHARED_SECRET = the same SHARED_SECRET value
 *
 * The secret means only your website's server function can write to this sheet.
 */

var SHARED_SECRET = 'CHANGE-ME-to-a-long-random-string';
var NOTIFY_EMAIL = 'ineilson@sgosolutions.com'; // new-lead alert; set to '' to disable
var SHEET_NAME = 'Leads';

var COLUMNS = [
  'submitted_at', 'first_name', 'last_name', 'email', 'phone', 'industry', 'monthly_volume', 'services',
  'page', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'gclid', 'landing_page', 'referrer',
  'country', 'region', 'consent', 'status', 'notes'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!body.secret || body.secret !== SHARED_SECRET) return out_({ ok: false, error: 'unauthorized' });
    var lead = body.lead || {};

    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(COLUMNS);
      sh.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold').setBackground('#0B1B33').setFontColor('#FFFFFF');
      sh.setFrozenRows(1);
    }
    lead.status = 'New';
    lead.notes = '';
    var row = COLUMNS.map(function (c) { return lead[c] != null ? String(lead[c]) : ''; });
    sh.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: 'New Guidesync lead: ' + lead.first_name + ' ' + lead.last_name + ' (' + lead.industry + ')',
        body:
          'Name: ' + lead.first_name + ' ' + lead.last_name + '\n' +
          'Email: ' + lead.email + '\n' +
          'Phone: ' + lead.phone + '\n' +
          'Industry: ' + lead.industry + '\n' +
          'Monthly volume: ' + (lead.monthly_volume || 'n/a') + '\n' +
          'Services needed: ' + lead.services + '\n\n' +
          'Source: ' + (lead.utm_source || 'direct/organic') + ' / ' + (lead.utm_campaign || '') + '\n' +
          'Page: ' + lead.page + '\n\n' +
          'Open the sheet: ' + ss.getUrl()
      });
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet() {
  return out_({ ok: true, service: 'guidesync-leads' });
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
