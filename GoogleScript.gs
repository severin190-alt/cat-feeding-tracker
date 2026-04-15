/**
 * Google Apps Script backend for cat feeding tracker.
 *
 * Setup:
 * 1) Create a Google Sheet with header row:
 *    A: Timestamp, B: Name
 * 2) Open Extensions -> Apps Script, paste this file.
 * 3) Replace SHEET_NAME if needed.
 * 4) Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone with the link
 */

const SHEET_NAME = 'Sheet1';

function doPost(e) {
  try {
    const sheet = getSheet_();
    const payload = parseJsonBody_(e);
    const name = sanitizeName_(payload.name);
    const now = new Date();

    sheet.appendRow([now, name]);

    return jsonResponse_({
      ok: true,
      message: 'Feeding saved',
      entry: {
        name: name,
        timestamp: now.toISOString()
      }
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: String(error && error.message ? error.message : error)
    });
  }
}

function doGet() {
  try {
    const sheet = getSheet_();
    const values = sheet.getDataRange().getValues();

    // If only header exists (or sheet is empty), return empty list.
    if (!values || values.length <= 1) {
      return jsonResponse_({ ok: true, entries: [] });
    }

    const rows = values.slice(1); // skip header
    const lastTen = rows.slice(-10).reverse();

    const entries = lastTen
      .filter(function (row) {
        return row[0] && row[1];
      })
      .map(function (row) {
        const timestamp = row[0] instanceof Date ? row[0] : new Date(row[0]);
        return {
          timestamp: timestamp.toISOString(),
          name: String(row[1])
        };
      });

    return jsonResponse_({ ok: true, entries: entries });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: String(error && error.message ? error.message : error)
    });
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" not found.');
  }
  return sheet;
}

function parseJsonBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Missing POST body.');
  }

  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (_) {
    throw new Error('POST body must be valid JSON.');
  }

  return data || {};
}

function sanitizeName_(value) {
  const allowed = ['Sabrina', 'Line', 'Søren'];
  if (!value) throw new Error('Missing name.');
  const name = String(value).trim();
  if (allowed.indexOf(name) === -1) {
    throw new Error('Invalid name. Allowed: ' + allowed.join(', '));
  }
  return name;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
