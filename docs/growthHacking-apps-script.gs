/**
 * growthHacking — Google Apps Script web app
 *
 * Bind this script to the spreadsheet (Extensions → Apps Script), paste this
 * file, set SHARED_SECRET below, then Deploy → New deployment → Web app:
 *   - Execute as: Me
 *   - Who has access: Anyone
 * Copy the resulting /exec URL into .env.local as GH_APPS_SCRIPT_URL and use
 * the same secret as GH_SHARED_SECRET.
 *
 * Sheet layout (1-indexed):
 *   Col A: row2 "Deltaker", row3 "Epost", row4 "Kode", row5+ activity name
 *   Col B: row5+ activity status ("Lukket" = locked, empty/anything else = open)
 *   Col C: row5+ activity result (fasit)
 *   Col D+: one column per participant — row2 name, row3 email, row4 code,
 *           row5+ that participant's answer for each activity (percent number)
 */

var SHARED_SECRET = "CHANGE_ME"; // must match GH_SHARED_SECRET in .env.local

var ROW_NAME = 1; // 0-indexed → sheet row 2
var ROW_EMAIL = 2; // sheet row 3
var ROW_CODE = 3; // sheet row 4
var FIRST_ACTIVITY_ROW = 4; // 0-indexed → sheet row 5
var FIRST_USER_COL = 3; // 0-indexed → column D
var COL_STATUS = 1; // column B
var COL_RESULT = 2; // column C

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || "{}");
    if (body.secret !== SHARED_SECRET) {
      return json({ ok: false, error: "unauthorized" });
    }
    switch (body.action) {
      case "login":
        return json(handleLogin(body));
      case "activities":
        return json(handleActivities(body));
      case "participants":
        return json(handleParticipants(body));
      case "submit":
        return json(handleSubmit(body));
      default:
        return json({ ok: false, error: "unknown action" });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function getData() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].getDataRange().getValues();
}

function norm(v) {
  return String(v == null ? "" : v).trim();
}

function isLocked(statusCell) {
  return norm(statusCell).toLowerCase() === "lukket";
}

/** Find the 0-indexed user column matching email + code, or -1. */
function findUserCol(data, email, code) {
  var e = norm(email).toLowerCase();
  var c = norm(code);
  for (var col = FIRST_USER_COL; col < data[ROW_EMAIL].length; col++) {
    if (norm(data[ROW_EMAIL][col]).toLowerCase() === e && norm(data[ROW_CODE][col]) === c) {
      return col;
    }
  }
  return -1;
}

function activityRows(data) {
  var rows = [];
  for (var r = FIRST_ACTIVITY_ROW; r < data.length; r++) {
    if (norm(data[r][0]) !== "") rows.push(r);
  }
  return rows;
}

function userCols(data) {
  var cols = [];
  for (var col = FIRST_USER_COL; col < data[ROW_EMAIL].length; col++) {
    if (norm(data[ROW_EMAIL][col]) !== "") cols.push(col);
  }
  return cols;
}

function handleLogin(body) {
  var data = getData();
  var col = findUserCol(data, body.email, body.code);
  if (col === -1) return { ok: false, error: "no_match" };
  return { ok: true, name: norm(data[ROW_NAME][col]) };
}

function handleActivities(body) {
  var data = getData();
  var col = findUserCol(data, body.email, body.code);
  if (col === -1) return { ok: false, error: "no_match" };
  var activities = activityRows(data).map(function (r) {
    var locked = isLocked(data[r][COL_STATUS]);
    var mine = norm(data[r][col]);
    return {
      rad: r + 1, // 1-indexed sheet row
      navn: norm(data[r][0]),
      locked: locked,
      harSvart: mine !== "",
      mittSvar: mine === "" ? null : Number(mine),
    };
  });
  return { ok: true, activities: activities };
}

function handleParticipants(body) {
  var data = getData();
  var col = findUserCol(data, body.email, body.code);
  if (col === -1) return { ok: false, error: "no_match" };
  var r = Number(body.rad) - 1; // back to 0-indexed
  if (r < FIRST_ACTIVITY_ROW || r >= data.length || norm(data[r][0]) === "") {
    return { ok: false, error: "bad_activity" };
  }
  var locked = isLocked(data[r][COL_STATUS]);
  var cols = userCols(data);
  var mineRaw = norm(data[r][col]);
  var mittSvar = mineRaw === "" ? null : Number(mineRaw);

  if (!locked) {
    // Sealed bid: only who has answered, no numbers, no result.
    var people = cols.map(function (c) {
      return {
        navn: norm(data[ROW_NAME][c]),
        harSvart: norm(data[r][c]) !== "",
        isMe: c === col,
      };
    });
    return {
      ok: true,
      locked: false,
      navn: norm(data[r][0]),
      mittSvar: mittSvar,
      participants: people,
    };
  }

  // Locked: reveal result, values and distance, ranked closest first.
  var fasit = Number(norm(data[r][COL_RESULT]));
  var ranked = cols.map(function (c) {
    var raw = norm(data[r][c]);
    var answered = raw !== "";
    var value = answered ? Number(raw) : null;
    return {
      navn: norm(data[ROW_NAME][c]),
      harSvart: answered,
      verdi: value,
      avstand: answered ? Math.abs(value - fasit) : null,
      isMe: c === col,
    };
  });
  ranked.sort(function (a, b) {
    if (a.harSvart && !b.harSvart) return -1;
    if (!a.harSvart && b.harSvart) return 1;
    if (!a.harSvart && !b.harSvart) return 0;
    return a.avstand - b.avstand;
  });
  return { ok: true, locked: true, navn: norm(data[r][0]), fasit: fasit, mittSvar: mittSvar, participants: ranked };
}

function handleSubmit(body) {
  var ss = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = ss.getDataRange().getValues();
  var col = findUserCol(data, body.email, body.code);
  if (col === -1) return { ok: false, error: "no_match" };
  var r = Number(body.rad) - 1;
  if (r < FIRST_ACTIVITY_ROW || r >= data.length || norm(data[r][0]) === "") {
    return { ok: false, error: "bad_activity" };
  }
  if (isLocked(data[r][COL_STATUS])) return { ok: false, error: "locked" };

  var value = Number(body.verdi);
  if (isNaN(value) || value < 0 || value > 100) return { ok: false, error: "bad_value" };

  ss.getRange(r + 1, col + 1).setValue(value); // 1-indexed
  return { ok: true };
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
