const Promise = require("es6-promise").Promise;
const {exec} = require('child_process');
const  parseString = require('xml2js').parseString;

class CommitInfo {

    static svn() {
        return new Promise((resolve, reject) => {
			let command = `svn log ${process.env.svnBranch} -l 1 --xml --trust-server-cert --non-interactive --username ${process.env.svnUserName} --password ${process.env.svnPassword}`;
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    err.stderr = stderr;
                    return reject(err);
				}
                let commitInfo = parseString(stdout, (e,log) => {
					let revision = log.log.logentry[0];
					let formattedJson = {
						shortRevision: revision.$.revision,
						revision: revision.$.revision,
						author: revision.author[0],
						date: this.formatDate(new Date(Date.parse(revision.date[0]))),
						subject: revision.msg[0]
					};
					return resolve(formattedJson);
				});
                
            })
        });
    }
    
    static git() {
        return new Promise((resolve, reject) => {
            let format = JSON.stringify({
                "\"shortRevision\"": "\"%h\"",
                "\"revision\"": "\"%H\"",
                "\"date\"": "\"%cr\"",
                "\"subject\"": "\"%f\"",
                "\"author\"": "\"%an\"",
                "\"authorEmail\"": "\"%ae\"",
                "\"refs\"": "\"%d\""
            });
            let command = `git log -1 --no-color --decorate=short --pretty=format:${format} HEAD`;
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    err.stderr = stderr;
                    return reject(err);
				}
                let commitInfo = JSON.parse(stdout);
                commitInfo.refs = this.fixGitRefs(commitInfo.refs);
                return resolve(commitInfo);
            })
        });
    }

    static fixGitRefs(rawString) {
        let refs = rawString;
        refs = refs.trim();
        refs = refs.replace("(", "");
        refs = refs.replace(")", "");
        return refs.split(", ");
	}
	
	static formatDate(date) {
		var year = date.getFullYear(),
			month = date.getMonth() + 1, // months are zero indexed
			day = date.getDate(),
			hour = date.getHours(),
			minute = date.getMinutes(),
			second = date.getSeconds(),
			hourFormatted = hour % 12 || 12, // hour returned in 24 hour format
			minuteFormatted = minute < 10 ? "0" + minute : minute,
			morning = hour < 12 ? "am" : "pm";
	
		return  hourFormatted + ":" +minuteFormatted + morning;
	}
}

module.exports = CommitInfo;