const QueryHub = require('./query-hub');
const {limitQuestionsThatMatch} = require('./lib/questions');

module.exports = class {

    async init(isPushingEnabled) {
        this.hub = new QueryHub;
        await this.hub.init(isPushingEnabled);
    }

    async answerQuestion(questionType, questionPayload, answer) {
        await this.hub.answerQuestion(questionType, questionPayload, answer)
    }

    providesAnswersTo(questions) {
        this.questions = questions;
    }

    async askQuestion(questionType, questionPayload, whoNeedsToKnow) {
        const answer = await this.hub.askQuestion(questionType, questionPayload);
        await this.applyAnsweredQuestionToReadModel(questionType, questionPayload, answer, whoNeedsToKnow);
    }

    async applyAnsweredQuestionToReadModel(questionType, questionPayload, answer, whoNeedsToKnow) {
        Object.getOwnPropertyNames(questions).forEach(qt => questions[qt](questionPayload, answer))
    }

    async askReadmodel(readModel, questionType, questionPayload) {
        const questions = limitQuestionsThatMatch(questionType, readModel.getOwnedQuestions());
        const questionNames = Object.getOwnPropertyNames(questions);
        if(questionNames.length <= 0){
            throw `readmodel does not own any question named ${questionType}`
        }
        const answererName = questionNames.pop();
        return await questions[answererName].call(null, questionPayload);
    }
};