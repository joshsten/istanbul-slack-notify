const Promise = require("es6-promise").Promise;
const Slack = require("slack-node");

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

class SlackNotify {
	constructor(settings) {
		this.settings = settings || {};
		this.settings.timeout = this.settings.slack.timeout || 5000;
		if (!this.settings.slack.webhook) {
			throw new Error("Slack webhook url is required (settings.webhook)")
		}
	}

	buildCoveragePayload(data) {
			return new Promise((resolve, reject) => {
			if (!data || !data.coverage || !data.build) {
				reject(new Error("Coverage and/or build data was not provided"))
			}
			let messageFormatting = data.coverage.coverageDelta > 0 ? this.settings.messageFormatting.pass 
				:data.coverage.coverageDelta < data.coverage.allowedDrop? this.settings.messageFormatting.fail : this.settings.messageFormatting.warning;
			let commitRef = !data.build || !data.build.refs? "": data.build.refs.length === 1 ? data.build.refs[0] : data.build.refs[1];
			
			const payload = {
				username: this.settings.slack.username,
				channel: this.settings.slack.channel,
				icon_emoji: messageFormatting.icon,
				attachments: [
					{
						thumb_url: messageFormatting.thumbnails[getRandomInt(0,messageFormatting.thumbnails.length )],
						icon_url: messageFormatting.thumbnails[getRandomInt(0,messageFormatting.thumbnails.length )],
						color: messageFormatting.color,
						fallback: `${data.projectName} - coverage ${messageFormatting.text} at ${data.coverage.project}%`,
						mrkdwn_in: ['text', 'title'],
						title: `${data.projectName} Change: ${(data.coverage.coverageDelta).toFixed(2)}% - ${messageFormatting.text}`,
						title_link: `${data.repositoryUrl}/commits/${data.build.revision}`,
						footer: `${data.build.date} - ${data.build.author} commited ${data.build.shortRevision} ${commitRef}`,
						fields: this.buildAttachments(data)
					}
				]
			};

			resolve(payload);
		});
	}
	
	buildAttachments(data){
		let attachments = [
			{
				title: "Total Coverage",
				value: `${data.coverage.project}%`,
				short: true
			},
			{
				title: "Threshold",
				value: `${data.coverage.threshold}%`,
				short: true
			},
		];

		if (!this.settings.slack.compact){
			attachments = attachments.concat([{
				title: "Statements",
				value: `${data.coverage.statements}%`,
				short: true
			},
			{
				title: "Functions / Methods",
				value: `${data.coverage.functions}%`,
				short: true
			},
			{
				title: "Branches",
				value: `${data.coverage.branches}%`,
				short: true
			},
			{
				title: "Lines",
				value: `${data.coverage.lines}%`,
				short: true
			}]);
		}
	
		return attachments;
	}

	sendNotification(payload) {
		return new Promise((resolve, reject) => {
		
			if (!payload) {
				reject(new Error("No slack payload provided"))
			}
			const timeout = setTimeout(() => {
				reject(new Error('Took too long to send slack request'));
			}, this.settings.timeout);
			const slack = new Slack();
			slack.setWebhook(this.settings.slack.webhook);
			slack.webhook(payload, (err) => {
				clearTimeout(timeout);
				if (err) {
					return reject(err);
				}
				return resolve();
			});
		});
	}
}

module.exports = SlackNotify;
