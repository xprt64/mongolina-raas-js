const {fetchHubState} = require('./supervizer-api');
const request = require('request-promise');
const startListeningUdpChanges = require('./query-hub-udp-listener').start;
const {fromSeconds, fromMinutes} = require('./lib/time');
const QUERY_TIMEOUT = fromSeconds(5);
const {questionIsOnArray} = require('./lib/questions');

module.exports = class QueryHub {
    async init(isPushingEnabled) {
        this.isPushingEnabled = isPushingEnabled;
        this.hubState = await fetchHubState();
        startListeningUdpChanges(() => this.updateHubState());
        setInterval(() => this.updateHubState(), fromMinutes(10));
    }

    updateHubState() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(async () => {
            this.hubState = await fetchHubState();
            this.timer = null;
        }, fromSeconds(1));
    }

    async askQuestion(questionType, questionPayload, defaultValue) {
        const cacheId = {questionType, questionPayload};
        let cachedAnswer = cacheGet(cacheId);
        if (!this.isPushingEnabled()) {
            if (undefined !== cachedAnswer) {
                console.log(`cache hit`, questionType, questionPayload);
                return cachedAnswer;
            } else {
                console.log(`cache miss`, questionType, questionPayload);
            }
        }
        const resolvers = this.resolveRespondersForQuestion(questionType);
        const uriFetchers = resolvers.filter(({api}) => api && api.query && api.query.answerQuery).map(async ({api, version, name}) => {
            const relativeUri = api.query.answerQuery
                .replace(/__type__/, questionType)
                .replace(/__payload__/, encodeURIComponent(JSON.stringify(questionPayload)))
            ;
            const uri = `http://${name}${relativeUri}`;
            console.log(`fetching ${uri} @${version}`);
            return await request.get({
                uri: uri,
                json: true
            });
        });
        uriFetchers.push(new Promise((res, rej) => setTimeout(() => res(undefined !== cachedAnswer ? cachedAnswer : defaultValue), QUERY_TIMEOUT)));

        const answer = await Promise.properRace(uriFetchers);
        console.log(`HUB: askQuestion`, questionType, questionPayload, `answer:`, answer);
        cacheStore(cacheId, answer);
        return answer;
    }

    async answerQuestion(questionType, questionPayload, answer) {
        if (!this.isPushingEnabled()) {
            console.log(`HUB: push question NOT ENABLED`, questionType, questionPayload);
            return;
        }
        console.log(`HUB: push question`, questionType, questionPayload, answer);
        await Promise.all(this.resolveNeedersForQuestion().filter(hubItem => hubItem.api && hubItem.api.updater && hubItem.api.updater.queryAnswered).map(async ({api, updaterName}) => {
            const uri = `http://${updaterName}${api.updater.queryAnswered}`;
            request.post({
                uri: uri,
                json: true,
                body: {
                    type: questionType,
                    payload: questionPayload,
                    answer: answer
                }
            })

        }));
    }

    resolveRespondersForQuestion(questionType) {
        return this.hubState.filter(hubItem => questionIsOnArray(questionType,  hubItem.state.ownedQuestions));
    }

    resolveNeedersForQuestion(questionType) {
        return this.hubState.filter(hubItem => questionIsOnArray( questionType, hubItem.state.neededQuestions));
    }
};

Promise.properRace = function (promises) {
    if (promises.length < 1) {
        return Promise.reject('Can\'t start a race without promises!');
    }

    // There is no way to know which promise is rejected.
    // So we map it to a new promise to return the index when it fails
    let indexPromises = promises.map((p, index) => p.catch(() => {
        throw index;
    }));

    return Promise.race(indexPromises).catch(index => {
        // The promise has rejected, remove it from the list of promises and just continue the race.
        let p = promises.splice(index, 1)[0];
        p.catch(e => console.log(`Fetcher #${index} has crashed, don\'t interrupt the race:`, e));
        return Promise.properRace(promises);
    });
};

const cache = {};

function cacheStore(key, value) {
    cache[JSON.stringify(key)] = value;
}

function cacheGet(key) {
    return cache[JSON.stringify(key)];
}
