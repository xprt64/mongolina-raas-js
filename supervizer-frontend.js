var http = require('http');
var express = require('express');

var app = express();
var port = process.env.PORT || '80';

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.set('port', port);
var router = express.Router();

module.exports.init = async function(onDelete, areWeTailingEvents) {
    router.delete('/', async function (req, res, next) {
        try {
            await onDelete();
            res.send('understood');
        } catch (e) {
            next(e);
        }
    });
   router.get('/are-we-tailing-events', async function (req, res, next) {
        try {
            res.send( await areWeTailingEvents());
        } catch (e) {
            next(e);
        }
    });
    app.use('/', router);
    var server = http.createServer(app);
    server.on('error', (error) => console.log(error));
    server.on('listening', () => console.log(`supervizer-frontend listening on port ${port}`));
    server.listen(port);
};