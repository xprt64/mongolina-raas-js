/*
 * Copyright (c) 2018. Constantin Galbenu <xprt64@gmail.com> Toate drepturile rezervate. All rights reserved.
 */
const fs = require("fs");
const namespace = process.env.NAMESPACE;
const {connectMultipleEventLogs, connectMultipleEventStores, ReadModelUpdater} = require('mongolina');
const {connect} = require('./mongo');
const {attachToReadModelAndCatchUp} = require('./event-sources');
const {tellWeCatchedUp} = require('./supervizer-api');
const Answerer = require('./answerer');
const frontendInit = require('./supervizer-frontend').init;
const eventCounters = [];
let ownedQuestionTypes;

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
			countEvents,
			() => ownedQuestionTypes
		);
		if (cleared) {
			return;
		}
		await __runManaged(
			readModel,
			() => cleared,
			(sourceName, eventsCounter) => addCounter(sourceName, eventsCounter),
			(_ownedQuestionTypes) => ownedQuestionTypes = _ownedQuestionTypes
		);
		tailing = true;
		const response = await tellWeCatchedUp();
		console.log(response);
		console.log(`running managed readmodel ${readModel.constructor.name}`);
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

async function __runManaged(readModel, shouldAbort, raportStats, getOwnedQuestionTypesCallback) {
	const options = {};
	const readmodelInitOptionsNeeds = readModel.getInitOptions();
	if (readmodelInitOptionsNeeds.getDatabase) {
		if (!process.env.PERSISTENCE_SERVER) {
			throw "process.env.PERSISTENCE_SERVER is missing";
		}
		let db = factoryReadmodelNameWithVersion(readModel);
		console.log(`using managed database ${process.env.PERSISTENCE_SERVER}`);
		options.getDatabase = async () => (await connect(getDsn(process.env.PERSISTENCE_SERVER) + '/' + db))
			.db(db)
	}
	if (readmodelInitOptionsNeeds.getCollection) {
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
	const answerer = new Answerer;
	if (readmodelInitOptionsNeeds.answerer) {
		options.answerer = answerer;
	}
	if ('getOwnedQuestions' in readModel) {
		const ownedQuestions = readModel.getOwnedQuestions();
		answerer.providesAnswersTo(ownedQuestions);
		getOwnedQuestionTypesCallback(Object.getOwnPropertyNames(ownedQuestions))
	}

	const readmodelUpdater = new ReadModelUpdater({
		eventListeners: readModel.getEventListeners(),
	});
	await readModel.init(options);
	if (process.env.REBUILD === '1') {
		await readModel.clear();
	}
	await attachToReadModelAndCatchUp(readmodelUpdater, shouldAbort, raportStats);
}

module.exports.runManaged = runManaged;

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
	return eventCounters.map((counter) => ({name: counter.sourceName, count: counter.eventsCounter()}));
}

