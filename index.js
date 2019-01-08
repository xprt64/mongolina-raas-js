/*
 * Copyright (c) 2018. Constantin Galbenu <xprt64@gmail.com> Toate drepturile rezervate. All rights reserved.
 */
const fs = require("fs");
const namespace = process.env.NAMESPACE;
const {connectMultipleEventLogs, connectMultipleEventStores} = require('mongolina');
const {connect} = require('./mongo');
const {attachToReadModelAndCatchUp} = require('./event-sources');
const {tellWeCatchedUp} = require('./supervizer-api');
const Answerer = require('./answerer');
const frontendInit = require('./supervizer-frontend').init;
const eventCounters = [];

async function runManaged(readModel) {
    try {
        let tailing = false;
        let cleared = false;
        await frontendInit(
            async () => {
                cleared = true;
                return await readModel.clear()
            },
            () => tailing,
            countEvents
        );
        if (cleared) {
            return;
        }
        await __runManaged(readModel, () => cleared, (sourceName, eventsCounter) => addCounter(sourceName, eventsCounter));
        tailing = true;
        const response = await tellWeCatchedUp();
        console.log(response);
        console.log(`running managed readmodel ${readModel.constructor.name}`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

async function __runManaged(readModel, shouldAbort, raportStats) {
    const options = {};
    if (readModel.needsDatabase()) {
        if (!process.env.PERSISTENCE_SERVER) {
            throw "process.env.PERSISTENCE_SERVER is missing";
        }
        let db = factoryReadmodelNameWithVersion(readModel);
        console.log(`using managed database ${process.env.PERSISTENCE_SERVER}`);
        options.getDatabase = async () => (await connect(getDsn(process.env.PERSISTENCE_SERVER) + '/' + db))
            .db(db)
    }
    if (readModel.needsCollection()) {
        if (!process.env.PERSISTENCE_SERVER) {
            throw "process.env.PERSISTENCE_SERVER is missing";
        }
        if (!process.env.PERSISTENCE_DATABASE) {
            throw "process.env.PERSISTENCE_DATABASE is missing";
        }
        const collection = factoryNameWithVersion(process.env.PERSISTENCE_COLLECTION || readModel.constructor.name);
        console.log(`using managed collection ${process.env.PERSISTENCE_SERVER}/${process.env.PERSISTENCE_DATABASE}/${collection}`);
        options.getCollection = async () => (await connect(getDsn(process.env.PERSISTENCE_SERVER) + '/' + process.env.PERSISTENCE_DATABASE))
            .db(process.env.PERSISTENCE_DATABASE)
            .collection(collection)
    }
    await readModel.init(options);
    if (process.env.REBUILD === '1') {
        await readModel.clear();
    }
    await attachToReadModelAndCatchUp(readModel, shouldAbort, raportStats);
}

module.exports.runManaged = runManaged;
module.exports.getAnswerer = new Answerer;

function factoryReadmodelNameWithVersion(readModel) {
    return factoryNameWithVersion(readModel.constructor.name);
}

function factoryNameWithVersion(name) {
    return `${name}_${process.env.VERSION.replace(/\./g, '_')}_${process.env.BUILD}`;
}

function getDsn(serverName) {
    let secret = fs.readFileSync(`/run/secrets/db-${serverName}`);
    console.log('secret', serverName, `${secret}`)
    return `${secret}`.match(/^mongodb:\/\//) ? secret : `mongodb://${secret}`;
}

function addCounter(sourceName, eventsCounter) {
    console.log(`addCounter`, sourceName)
    eventCounters.push({sourceName, eventsCounter});
}

function countEvents() {
    return eventCounters.map((counter) => ({name: counter.sourceName, count: counter.eventsCounter()}) );
}

