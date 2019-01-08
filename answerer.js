const hub = require('./query-hub');

module.exports = class {
    async answerQuestion(questionType, questionPayload){
        await hub.answerQuestion(questionType, questionPayload)
    }

    providesAnswersTo(questions){
        this.questions = questions;
    }

    async askQuestion(questionType, questionPayload, whoNeedsToKnow){
        const answer = await hub.askQuestion(questionType, questionPayload);
        whoNeedsToKnow.getNeededQuestions()[questionType](questionPayload, answer);
    }
};