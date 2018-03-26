var request = require('node-fetch');

class CodeCoverageHistory{
	constructor(endpoint){
		this.endpoint = endpoint;
	}

	postCoverageAsync = coverageNumber =>  fetch(this.endpoint, { method: 'POST',  body: { average: coverageNumber } }).then(res => res.json());
	getCoverageHistoryAsync = days => fetch(this.endpoint, { method: 'GET', body: { average: coverageNumber  }} ).then(res => res.json());
	
	getLastCoverageDeltaAsync = () => {
		return this.getCoverageHistoryAsync()
			.then(history => {
				const len = history.length;
				if (len > 2){
					return history[len-1] - history[len-2]; 
				}else{
					return 0;
				}
			});
	}
	
}

module.exports = CodeCoverageHistory;