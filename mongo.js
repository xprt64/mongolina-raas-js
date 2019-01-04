/*
 * Copyright (c) 2018. Constantin Galbenu <xprt64@gmail.com> Toate drepturile rezervate. All rights reserved.
 */
const MongoClient = require('mongodb').MongoClient;

module.exports.find = function(collection, query, projection) {
    return new Promise((resolve, reject) => {
        try {
            collection.find(query, projection).limit(1).toArray(function (err, docs) {
                //console.log('result judet', docs);
                if (err !== null) {
                    reject(err);
                } else {
                    if (docs.length === 0) {
                        reject("not found");
                    } else {
                        const city = docs.pop();
                        resolve(city);
                    }
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports.insert = function(collection, data) {
    return new Promise((resolve, reject) => {
        try {
            collection.insert(data, (err) => {
                if (null === err) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};


module.exports.connect = function(dsn) {
    return new Promise((resolve, reject) => {
        const client = new MongoClient(dsn, {
            reconnectTries: 30,
            reconnectInterval: 1000,
            useNewUrlParser: true
        });
        client.connect(function (err, client) {
            if (err) {
                reject(err);
            } else {
                resolve(client);
            }
        });
    });
};