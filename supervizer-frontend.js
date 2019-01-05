var http = require('http');
var express = require('express');

var app = express();
var port = process.env.PORT || '80';

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.set('port', port);
var router = express.Router();

module.exports.init = async function (onDelete, areWeTailingEvents) {
	router.delete('/', async function (req, res, next) {
		try {
			let s = await onDelete();
			res.send(`understood, cleaned the readmodel: ${s}`);
		} catch (e) {
			if (`${e}`.match(/MongoError/)) {
				res.send(`${e}`);
			} else {
				next(e);
			}
		}
	});
	router.get('/are-we-tailing-events', async function (req, res, next) {
		try {
			res.send(await areWeTailingEvents());
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