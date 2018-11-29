/*
 * Copyright (c) 2018. Constantin Galbenu <xprt64@gmail.com> Toate drepturile rezervate. All rights reserved.
 */
const fs = require("fs");
const {connectMultipleEventLogs, connectMultipleEventStores} = require('mongolina');
const {dbNameFromUrlString} = require('mongolina');
const {connect} = require('./mongo');
const eventSources = require('/eventSources.json');

module.exports.runManaged = async function main(readModel) {
    const options = {};
    if (readModel.needsDatabase()) {
        options.getDatabase = async () => await connect(process.env.PERSISTENCE_DSN).db(factoryNameWithVersion(readModel))
    }
    if (readModel.needsCollection()) {
        options.getCollection = async () => (await connect(process.env.PERSISTENCE_DSN)).db(dbNameFromUrlString(process.env.PERSISTENCE_DSN)).collection(process.env.COLLECTION || factoryNameWithVersion(readModel))
    }
    await readModel.init(options);
    if (process.env.REBUILD === '1') {
        await readModel.clear();
    }
    return run(readModel);
};

async function run(readModel) {
    readModel.continueToRunAfterInitialProcessing();

    const eventSources = getRelevantEventSourcesFromReadModel(readModel);
    const eventStores = getEventStores(eventSources);
    const eventLogs = getEventLogs(eventSources);

    const eventStoreConnections = await connectMultipleEventStores(eventStores.map(eventStore => {
        const dsn = fs.readFileSync(`/run/secrets/${eventStore.name}`);
        return {
            connectUrl: `${dsn}/${eventStore.database}`,
            oplogUrl: `${dsn}/local`,
            collectionName: eventStore.collection,
            name: `${eventStore.database}/${eventStore.collection}`
        }
    }));

    const eventLogConnections = await connectMultipleEventLogs(eventLogs.map(eventStore => {
        const dsn = fs.readFileSync(`/run/secrets/${eventStore.name}`);
        return {
            connectUrl: `${dsn}/${eventStore.database}`,
            oplogUrl: `${dsn}/local`,
            collectionName: eventStore.collection,
            name: `${eventStore.database}/${eventStore.collection}`
        }
    }));

    const connections = eventStoreConnections.concat(eventLogConnections);

    connections.forEach(eventSource => {
        console.log(`subscribing to`, eventSource.name);
        eventSource
            .subscribeReadModel(readModel)
            .run();
    })
}

module.exports.run = run;

function getRelevantEventSourcesFromReadModel(readModel) {
    const eventTypes = readModel.getEventTypes();
    return eventSources.filter((eventSource) => arrayIntersects(eventSource.eventTypes, eventTypes));
}

function getEventStores(eventSources) {
    return eventSources.filter((eventSource) => eventSource.type === "MongoEventStore");
}

function getEventLogs(eventSources) {
    return eventSources.filter((eventSource) => eventSource.type === "MongoEventLog");
}

function arrayIntersects(array1, array2) {
    return array1.filter(value => -1 !== array2.indexOf(value)).length > 0;
}

function factoryNameWithVersion(readModel) {
    return `${readModel.constructor.name}-${process.env.VERSION || '0_0_1'}`;
}
