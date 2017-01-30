var moment     = require('moment');
var _          = require('lodash');
var fs         = require('fs');
var knox       = require('knox');
var config     = require('../config');
config.version = require('../package.json').version;
var pug        = require('pug');

var pg = require('knex')({
	client: 'pg',
	connection: process.env.DATABASE_URL
});

if (process.env.AWS_S3_KEY) {
    var s3 = knox.createClient({
        key: process.env.AWS_S3_KEY,
        secret: process.env.AWS_S3_SECRET,
        bucket: process.env.AWS_BUCKET
    });
}

module.exports = function(app) {

    var indexPage = pug.compileFile('./app/index.pug')(config);
    
	app.get('/', function(req, res, next) {
        res.send(indexPage);
        next();
	});

	app.get('/config.json', function(req, res) {
        if (process.env.AWS_S3_KEY) {
            config.s3enabled = true;
        }
		res.json( config );
	});

	app.get('/_health', function (req, res) {
		res.send("I'm alive.");
	});

	// API
	app.get('/api/maps', function(req, res) {
		pg('locator_map')
			.then(function(rows) {
				var rows = parse_data(rows);
				res.json(rows);
			})
			.catch(function(error) {
				res.status(404).json({error: error});
			});
	});

	app.get('/api/maps/slug/:slug', function(req, res) {
		var slug = req.params.slug;

		pg('locator_map')
			.whereRaw("data->>'slug' = ?", slug)
			.then(function(rows) {
				var rows = parse_data(rows);
				res.json(rows[0]);
			})
			.catch(function(error) {
				res.status(404).json({error: error});
			});
	});

	app.get('/api/maps/:id', function(req, res) {
		var id = req.params.id;

		pg('locator_map')
			.where('id', id)
			.then(function(rows) {
				var rows = parse_data(rows);
				res.json(rows[0]);
			})
			.catch(function(error) {
				res.status(404).json({error: error});
			});
	});

	app.post('/api/maps', function(req, res) {
		var data = req.body;
			data.creation_date = Date.now();
			data.modification_date = Date.now();

		pg.insert({data: data})
			.returning('id')
			.into('locator_map')
			.then(function(id) {
				res.status(201).json({
					id: id[0],
					message: 'Map created'
				});
			})
			.catch(function(error) {
				res.status(404).json({error: error});
			});
	});

	app.put('/api/maps/:id', function(req, res) {
		var id = req.params.id;
		var data = req.body;
			delete data.id;
			data.modification_date = Date.now();

		pg('locator_map')
			.where('id', '=', id)
			.update({
				data: data
			})
			.then(function() {
				res.json({
					message: 'Map updated',
				});
			})
			.catch(function(error) {
				res.status(404).json({error: error});
			});
	});

	app.delete('/api/maps/:id', function(req, res){
		var id = req.params.id;
		var location = 'projects';

		pg('locator_map')
			.where('id', id)
			.then(function(rows) {

				var slug = rows[0].data.slug;

				s3.del(location + '/locator-maps/' + slug + '.json')
					.on('response', function(res){
						// 
					}).end();

				return pg('locator_map').where('id', id).del();
			})
			.then(function(response) {
				res.json({
					message: 'Map deleted'
				});
			})
			.catch(function(error) {
				res.status(404).json({error: error});
			});
	});

	app.get('/api/slugs', function(req, res) {
		pg('locator_map')
			.then(function(rows) {
				var rows = parse_data(rows);
				var slugs = _.pluck(rows, 'slug');
				res.json(slugs);
			})
			.catch(function(error) {
				res.json({error: error});
			});
	});

	app.post('/api/publish', function(req, res) {
		var id = req.body.id;
		var location = 'projects';
		
		process_publish(id, location, res);
	});

}

function parse_data(data){
	var rows = _.map(data, function(row){
		var map = {
			id: row.id
		};
		return _.assign(map, row.data);
	});
	return rows;
}

function process_publish(id, location, res){
	pg('locator_map')
		.where('id', id)
		.then(function(rows) {
			var rows   = parse_data(rows);
			var string = JSON.stringify(rows[0]);
			var slug   = rows[0].slug;
			var file   = location + '/locator-maps/' + slug + '.json';
			
			var publish   = s3.put(file, {
			    'Content-Length': Buffer.byteLength(string),
				'Content-Type': 'application/json',
				'x-amz-acl': 'public-read'
			});

			publish.on('response', function(response){
				if (200 == response.statusCode) {
					res.json({
						message : "Map published",
						url: 'http://'+process.env.AWS_BUCKET+'.s3.amazonaws.com/' + file
					});
				} else {
					res.status(404).json({error: "Error saving map to S3"});
				}
			});

			publish.end(string);

		})
		.catch(function(error) {
			res.json({error: error});
		});
}