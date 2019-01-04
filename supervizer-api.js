const request = require('request-promise');
const API_CATCHED_UP = process.env.SUPERVIZER_API_CATCHED_UP;

module.exports.tellWeCatchedUp = async function(){
    console.log(`post ${API_CATCHED_UP}`);
    return await request.post({
        uri: API_CATCHED_UP,
        json: true
    });
};