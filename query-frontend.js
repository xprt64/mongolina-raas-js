var http = require('http');
var express = require('express');

var app = express();
var port = process.env.PORT || '80';

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.set('port', port);
var router = express.Router();

module.exports.init = async function (queryExecutor) {
    router.get('/query', async function (req, res, next) {
        try {
            if (!req.query.type) {
                throw "type parameter is missing";
            }
            console.log(req.query);
            if (req.query.payload) {
                console.log(JSON.parse(req.query.payload));
            }
            res.send(await queryExecutor(req.query.type, req.query.payload ? JSON.parse(req.query.payload) : null));
        } catch (e) {
            next(e);
        }
    });

    app.use('/', router);
    var server = http.createServer(app);
    server.on('error', (error) => console.log(error));
    server.on('listening', () => console.log(`query-frontend listening on port ${port}`));
    server.listen(port);
};