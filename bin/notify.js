#!/usr/bin/env node
const IstanbulReport = require("../src/istanbul-report");
const SlackNotify = require("../src/slack-notify");
const TextNotify = require("../src/text-notify");
const CommitInfo = require("../src/commit-info");
const CodeCoverageHistory = require("../src/code-coverage-history");
const fs = require("fs");

// Runs Coverage Notifier
const settings = {
	useTextNotify: !process.env.SLACK_WEBHOOK,
	useSvn: !!process.env.useSvn,
	istanbul: {
		rootDir: process.env.PWD,
		coverageFiles: ["coverage/coverage-final.json"],
		summaryFile: "coverage/coverage-summary.json",
		threshold: 100
	},
	slack: {
		webhook: process.env.SLACK_WEBHOOK,
		compact: true
	},
	project: {
		projectName: process.env.npm_package_name,
	}
};

// Overwrite settings from package.json if defined
const packageJson = JSON.parse(fs.readFileSync('./package.json'));
if (packageJson.coverage) {
	settings.istanbul.coverageFiles = packageJson.coverage.coverageFiles || settings.istanbul.coverageFiles;
	settings.istanbul.threshold = packageJson.coverage.threshold || settings.istanbul.threshold;
	settings.slack.channel = packageJson.coverage.channel || settings.slack.channel;
	settings.slack.username = packageJson.coverage.username || settings.slack.username;
	settings.slack.webhook = packageJson.coverage.webhook || settings.slack.webhook;
	settings.project.projectName = packageJson.coverage.projectName || settings.project.projectName || packageJson.name;
	settings.project.repositoryUrl = packageJson.coverage.repositoryUrl;
	settings.useSvn = packageJson.coverage.useSvn || settings.useSvn;
	settings.slack.compact = packageJson.coverage.compact || settings.slack.compact;
	settings.useTextNotify = !settings.slack.webhook;
	settings.trackingEnpoint = packageJson.coverage.trackingEnpoint;
	settings.allowedCoverageDrop = packageJson.coverage.allowedDrop;
	settings.messageFormatting = packageJson.coverage.messageFormatting;
}
const reports = new IstanbulReport(settings.istanbul);
const coverageReporter = new CodeCoverageHistory(settings.trackingEnpoint);
reports.generateSummary().then(() => {
  let coverage = reports.processSummary();
  let build = settings.useSvn ? CommitInfo.svn() : CommitInfo.git();
  Promise.all([coverage, build]).then(values => {
	settings.project.coverage = values[0];
	settings.project.build = values[1];
	coverageReporter
	  .postCoverageAsync(
		values[1].refs[0],
		values[1].revision,
		values[0].project
	  )
	  .then(() => {
		coverageReporter
		  .getLastCoverageDeltaAsync(values[1].refs[0])
		  .then(coverageDelta => {
			settings.project.coverage.coverageDelta = coverageDelta;
			settings.project.coverage.allowedDrop =  settings.allowedCoverageDrop;
			if (settings.useTextNotify) {
			  const textNotify = new TextNotify();
			  textNotify.printCoverage(settings.project);
			} else {
			  const slack = new SlackNotify(settings);
			  slack
				.buildCoveragePayload(settings.project)
				.then(data => slack.sendNotification(data));
			}
			if (
			  settings.project.coverage.coverageDelta <
			  settings.project.coverage.allowedDrop
			) {
			  throw Error("Code coverage drop was below acceptable drop.");
			}
		  });
	  });
  });
});