#!/usr/bin/env node
/* Runs the Studio test suites.
 *
 *   npm test              everything
 *   npm run test:unit     the node-only checks
 *   npm run test:browser  the ones that drive Chromium
 *
 * The browser suites need Chromium for playwright-core:
 *
 *   npx playwright install chromium
 *
 * If it is missing they are reported as not run and the whole run fails,
 * rather than being skipped quietly — a suite that did not run is not a suite
 * that passed, and the difference matters most on the day it would have caught
 * something.
 */
import { report, failed, check, suite } from "./helpers.mjs";

const only = process.argv[2];
const wanted = (name) => !only || only === name;

let hardFailure = null;

if (wanted("unit")) {
	const { default: runUnit } = await import("./unit.mjs");
	await runUnit();
}

if (wanted("browser")) {
	try {
		const { default: runBrowser } = await import("./browser.mjs");
		await runBrowser();
	} catch (error) {
		suite("Browser suites");
		check("the browser suites ran", false, `\n    ${error.message.replace(/\n/g, "\n    ")}`);
		hardFailure = error;
	}
}

const count = report();
if (hardFailure) {
	console.log("\nThe browser suites did not run. They are not optional: three of the\n" +
		"bugs this project has shipped fixes for were only visible in a browser.");
}
process.exit(count || failed() ? 1 : 0);
