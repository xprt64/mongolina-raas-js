const request = require('request-promise');
const API_CATCHED_UP = process.env.SUPERVIZER_API_CATCHED_UP;

module.exports.tellWeCatchedUp = async function(){
    return await request.post({
        uri: API_CATCHED_UP,
        json: true
    });
};