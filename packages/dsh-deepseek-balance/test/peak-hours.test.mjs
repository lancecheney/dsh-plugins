#!/usr/bin/env node
/**
 * Conformance test for the peak/off-peak rule.
 *
 * The vectors are the public CC0-1.0 fixture from
 * <https://github.com/xyzs996/deepseek-peak-hours> (copied verbatim into
 * ./deepseek-peak-offpeak-vectors.json). They are the artifact; this file only
 * feeds them to `periodOfUsage` and reports.
 *
 * The point of the fixture is that it can point the rule at a schedule other
 * than the live one: the synthetic 16:00-22:00 UTC schedule is the only way to
 * see the Beijing-vs-UTC weekday shift, because the live windows both close
 * before 16:00 UTC.
 *
 *   node test/peak-hours.test.mjs
 *
 * Exit code 0 when every vector agrees, 1 otherwise.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PEAK_SCHEME_FROM, PEAK_WINDOWS, WEEKEND_RULE_FROM, periodOfUsage } from "../lib/peak.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const CALENDAR_OFFSET_HOURS = 8; // Asia/Shanghai: no DST, so a fixed offset is exact.

const hhmmToMinutes = (text) => {
	const [h, m] = text.split(":").map(Number);
	return h * 60 + m;
};

/** Translate a schedule's UTC windows into Beijing hour ranges for `periodOfUsage`. */
function beijingWindows(schedule) {
	const windows = [];
	for (const [from, to] of schedule.peak_windows_utc) {
		const startMinutes = (hhmmToMinutes(from) + CALENDAR_OFFSET_HOURS * 60) % (24 * 60);
		const endMinutes = (hhmmToMinutes(to) + CALENDAR_OFFSET_HOURS * 60) % (24 * 60);
		if (startMinutes % 60 !== 0 || endMinutes % 60 !== 0) {
			throw new Error(`schedule window ${from}-${to} is not whole-hour after the Beijing shift`);
		}
		const start = startMinutes / 60;
		const end = endMinutes / 60;
		if (end > start) windows.push({ start, end });
		else {
			windows.push({ start, end: 24 });
			windows.push({ start: 0, end });
		}
	}
	return windows;
}

const sameWindows = (a, b) =>
	a.length === b.length &&
	a.every((w, i) => w.start === b[i].start && w.end === b[i].end);

const db = JSON.parse(readFileSync(join(HERE, "deepseek-peak-offpeak-vectors.json"), "utf8"));
const liveName = "deepseek-live-2026-08-23";
const live = db.schedules[liveName];
if (!live) throw new Error("the live schedule is missing from the fixture");

// Guard the fixture itself: if the live schedule and the shipped default ever
// disagree, the vectors below would be testing a rule the plugin does not run.
if (!sameWindows(beijingWindows(live), PEAK_WINDOWS)) {
	throw new Error(
		`PEAK_WINDOWS ${JSON.stringify(PEAK_WINDOWS)} does not match the fixture's live schedule ` +
			`${JSON.stringify(beijingWindows(live))}`
	);
}

const effectiveFromMs = Date.parse(PEAK_SCHEME_FROM);
const weekendFromMs = Date.parse(WEEKEND_RULE_FROM);
const failures = [];
let checked = 0;

for (const vector of db.vectors) {
	const schedule = db.schedules[vector.schedule];
	if (!schedule) throw new Error(`vector names an unknown schedule: ${vector.schedule}`);
	const weekendFrom = schedule.weekend_offpeak_effective_utc
		? Date.parse(schedule.weekend_offpeak_effective_utc)
		: weekendFromMs;
	const got = periodOfUsage(Date.parse(vector.at_utc), effectiveFromMs, weekendFrom, beijingWindows(schedule));
	checked += 1;
	if (got.toLowerCase() !== vector.expect.toLowerCase()) {
		failures.push({ ...vector, got });
	}
}

for (const failure of failures) {
	console.error(
		`FAIL ${failure.at_utc} (${failure.beijing_local}) expected ${failure.expect}, got ${failure.got} — ${failure.why}`
	);
}

console.log(`${checked - failures.length}/${checked} peak/off-peak vectors agree`);
if (db.next_boundary_vectors) {
	console.log(
		`(${db.next_boundary_vectors.length} next-boundary vectors are not run: this plugin has no countdown feature)`
	);
}
process.exit(failures.length === 0 ? 0 : 1);
