const request = require('request-promise');
const API_CATCHED_UP = process.env.SUPERVIZER_API_CATCHED_UP;
const API_RESOLVER_URI = process.env.SUPERVIZER_API_RESOLVER_URI;
const API_HUB_STATE_URI = process.env.SUPERVIZER_API_HUB_STATE_URI;

module.exports.tellWeCatchedUp = async function () {
    console.log(`post ${API_CATCHED_UP}`);
    return await request.post({
        uri: API_CATCHED_UP,
        json: true
    });
};

module.exports.resolveRespondersForQuestion = async function (questionType) {
    const uri = `${API_RESOLVER_URI}?questionType=${encodeURIComponent(questionType)}`;
    console.log(`get ${uri}`);
    return await request.get({
        uri: uri,
        json: true
    });
};
module.exports.fetchHubState = async function () {
    const uri = `${API_HUB_STATE_URI}`;
    console.log(`get ${uri}`);
    return await request.get({
        uri: uri,
        json: true
    });
};