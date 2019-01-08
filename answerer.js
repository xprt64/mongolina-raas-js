const hub = require('hub');

module.exports = class {
    async answerQuestion(questionType, questionPayload){

    }

    providesAnswersTo(questions){
        this.questions = questions;
    }

    async askQuestion(questionType, questionPayload, whoNeedsToKnow){
        const answer = await hub.askQuestion(questionType, questionPayload);
        whoNeedsToKnow.answerer.whenAnswered(questionType, questionPayload, answer);
    }
};