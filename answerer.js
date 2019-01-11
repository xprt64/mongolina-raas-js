const QueryHub = require('./query-hub');

module.exports = class {

    async init(isPushingEnabled){
        this.hub = new QueryHub;
        await this.hub.init(isPushingEnabled);
    }
    async answerQuestion(questionType, questionPayload, answer){
        await this.hub.answerQuestion(questionType, questionPayload, answer)
    }

    providesAnswersTo(questions){
        this.questions = questions;
    }

    async askQuestion(questionType, questionPayload, whoNeedsToKnow){
        const answer = await this.hub.askQuestion(questionType, questionPayload);
        await this.applyAnsweredQuestionToReadModel(questionType, questionPayload, answer, whoNeedsToKnow);
    }

    async applyAnsweredQuestionToReadModel(questionType, questionPayload, answer, whoNeedsToKnow){
        whoNeedsToKnow.getNeededQuestions()[questionType](questionPayload, answer);
    }

    async askReadmodel(readModel, questionType, questionPayload){
        return await readModel.getOwnedQuestions()[questionType](questionPayload);
    }
};