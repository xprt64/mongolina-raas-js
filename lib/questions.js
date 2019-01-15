const arraysIntersect = (array1, array2) => array1.filter(value => questionIsOnArray(value, array2)).length > 0;
module.exports.arraysIntersect = arraysIntersect;

function questionIsOnArray(question, arr) {
    return undefined !== arr.find((a) => questionsMatch(question, a))
}
module.exports.questionIsOnArray= questionIsOnArray;

function questionsMatch(left, right) {
    const a = parseQuestion(left);
    const b = parseQuestion(right);
    return a.name === b.name && compareVersions(extractMajorFromVersion(a.version), extractMajorFromVersion(b.version));

    function parseQuestion(x) {
        const parts = x.split('@');
        return {name: parts[0], version: parts[1]};
    }

    function extractMajorFromVersion(version) {
        return undefined !== version ? parseInt(version.split(/./g)[0]) : undefined;
    }

    function compareVersions(a, b) {
        return a === b || undefined === a || undefined === b;
    }
}

module.exports.questionsMatch = questionsMatch;

module.exports.limitQuestionsThatMatch = function (questionType, list) {
    const sameQuestionTypes = Object.getOwnPropertyNames(list).filter(qt => questionsMatch(qt, questionType));
    let result = {};
    sameQuestionTypes.forEach(qt => result[qt] = list[qt]);
    return result;
};