const arraysIntersectAndFirstPrecedesSecond = (first, second) => first.filter(value => questionIsOnArrayAndPrecedes(value, second)).length > 0;
module.exports.arraysIntersectAndFirstPrecedesSecond = arraysIntersectAndFirstPrecedesSecond;

function questionIsOnArrayAndPrecedes(question, arr) {
    return undefined !== arr.find((a) => questionsMatchAndPrecedes(question, a))
}
module.exports.questionIsOnArrayAndPrecedes = questionIsOnArrayAndPrecedes;

function questionIsOnArrayAndFollows(question, arr) {
    return undefined !== arr.find((a) => questionsMatchAndLeftFollowsRight(question, a))
}
module.exports.questionIsOnArrayAndFollows = questionIsOnArrayAndFollows;

function questionsMatchAndPrecedes(left, right) {
    const a = parseQuestion(left);
    const b = parseQuestion(right);
    return a.name === b.name && firstVersionPrecedesSecond(parseVersion(a.version), parseVersion(b.version));
}

module.exports.questionsMatchAndPrecedes = questionsMatchAndPrecedes;

function questionsMatchAndLeftFollowsRight(left, right) {
    const a = parseQuestion(left);
    const b = parseQuestion(right);
    return a.name === b.name && firstVersionPrecedesSecond(parseVersion(b.version), parseVersion(a.version));
}

module.exports.questionsMatchAndLeftFollowsRight = questionsMatchAndLeftFollowsRight;

function parseQuestion(x) {
    const parts = x.split('@');
    return {name: parts[0], version: parts[1]};
}

function parseVersion(x) {
    if (!x) {
        return undefined;
    }
    const parts = x.split(/\./g);
    return {major: parts[0], minor: parts[1], patch: parts[2]};
}

function extractMajorFromVersion(version) {
    return undefined !== version ? parseInt(version.split(/\./g)[0]) : undefined;
}

function firstVersionPrecedesSecond(a, b) {
    return undefined === a || undefined === b || (a.major === b.major && (a.minor < b.minor || (a.minor === b.minor && a.patch <= b.patch)));
}
