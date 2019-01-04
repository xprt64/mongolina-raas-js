const fs = require("fs");
const namespace = process.env.NAMESPACE;
const {connectMultipleEventLogs, connectMultipleEventStores} = require('mongolina');
const {dbNameFromUrlString} = require('mongolina');
const {connect} = require('./mongo');
const request = require('request-promise');
const API = process.env.EVENT_SOURCES_API || 'http://event-sources';

async function fetchEventSources(){
    return await request.get({
        uri: `${API}/sources`,
        json: true
    });
}

module.exports.attachToReadModelAndCatchUp = async function(readModel){
    const eventSources = await getRelevantEventSourcesFromReadModel(readModel);
    const eventStores = getEventStores(eventSources);
    const eventLogs = getEventLogs(eventSources);

    const eventStoreConnections = await connectMultipleEventStores(eventStores.map(eventSourceToDto));
    const eventLogConnections = await connectMultipleEventLogs(eventLogs.map(eventSourceToDto));
    const connections = eventStoreConnections.concat(eventLogConnections);

    await Promise.all(connections.map(eventSource => {
        console.log(`subscribing to`, eventSource.name);
        return eventSource
            .subscribeReadModel(readModel)
            .run();
    }));

    function eventSourceToDto(eventStore){
        const dsn = fs.readFileSync(`/run/secrets/db-${eventStore.server}`);
        return {
            connectUrl: `${dsn}/${eventStore.database}`,
            oplogUrl: `${dsn}/local`,
            collectionName: eventStore.collection,
            name: `${eventStore.database}/${eventStore.collection}`
        }
    }
};


async function getRelevantEventSourcesFromReadModel(readModel) {
    const eventTypes = readModel.getEventTypes();
    const eventSources = await fetchEventSources();
    return eventSources.filter((eventSource) => arrayIntersects(eventSource.events, eventTypes));
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