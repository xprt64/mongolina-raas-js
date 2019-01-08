module.exports.askQuestion = async function(questionType, questionPayload){
	console.log(`HUB: askQuestion`, questionType, questionPayload)
	return "ceva asked";
};

module.exports.answerQuestion = async function(questionType, questionPayload){
	console.log(`HUB: answerQuestion`, questionType, questionPayload);
	return "ceva answered";
};