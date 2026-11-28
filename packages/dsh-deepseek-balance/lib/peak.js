/**
 * The peak/off-peak billing rule, kept free of the host half's imports so it
 * can be exercised on its own (test/peak-hours.test.mjs) without a harness.
 *
 * DeepSeek's rule, as published on the pricing page: peak hours are
 * 09:00-12:00 and 14:00-18:00 Beijing time, Monday through Friday; every other
 * hour is off-peak, and from 2026-08-23 the whole weekend is off-peak.
 */

/** Peak windows as Beijing wall-clock hours: `start` inclusive, `end` exclusive. */
export const PEAK_WINDOWS = [
	{ start: 9, end: 12 },
	{ start: 14, end: 18 }
];

/** The instant the peak/off-peak scheme starts; earlier usage is flat-priced. */
export const PEAK_SCHEME_FROM = "2026-08-17T00:00:00+08:00";

/** The instant the weekend rule starts; it is not retroactive. */
export const WEEKEND_RULE_FROM = "2026-08-23T00:00:00+08:00";

/**
 * Billing period of one instant: `flat` before the scheme exists, `offPeak` on
 * weekend days once the weekend rule applies, otherwise `peak` inside a daily
 * window. The weekday is read off the Beijing wall clock, not the UTC one — the
 * two disagree between 16:00 and 24:00 UTC, which is exactly the range a naive
 * implementation gets wrong.
 * @param time - the instant, in epoch milliseconds.
 * @param effectiveFromMs - before this instant everything is `flat`.
 * @param weekendFromMs - from this instant onward Saturday/Sunday are off-peak all day.
 * @param windows - peak windows in Beijing hours; defaults to the live schedule.
 * @returns `"flat"`, `"peak"`, or `"offPeak"`.
 */
export function periodOfUsage(time, effectiveFromMs, weekendFromMs, windows = PEAK_WINDOWS) {
	if (time < effectiveFromMs) return "flat";
	const d = new Date(time + 8 * 3600 * 1000);
	const day = d.getUTCDay();
	if ((day === 0 || day === 6) && Number.isFinite(weekendFromMs) && time >= weekendFromMs) return "offPeak";
	const hour = d.getUTCHours();
	return windows.some((w) => hour >= w.start && hour < w.end) ? "peak" : "offPeak";
}
