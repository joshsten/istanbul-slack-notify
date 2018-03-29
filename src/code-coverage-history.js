var fetch = require('node-fetch');

class CodeCoverageHistory{
	constructor(endpoint){
		this.endpoint = endpoint;
	}

	postCoverageAsync(branch, revision, coverageNumber){ 
		return fetch(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ branch: branch, average: coverageNumber, revision: revision, date: new Date() }) }).then(res => res.json());
	}

	getCoverageHistoryAsync(branch,days){ 
		return fetch(this.endpoint+"?branch="+branch, { method: 'GET'} ).then(res => res.json());
	}
	
	getLastCoverageAsync(branch) {
		return this.getCoverageHistoryAsync(branch)
			.then(history => {
				return history[history.length-1].average;
			});
	}

	getLastCoverageDeltaAsync(branch) {
		return this.getCoverageHistoryAsync(branch)
			.then(history => {
				const len = history.length;
				if (len > 1){
					return  history[len-1].average - history[len-2].average; 
				}else{
					return 0;
				}
			});
	}
}

module.exports = CodeCoverageHistory;