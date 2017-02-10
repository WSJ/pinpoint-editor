var moment     = require('moment');
var _          = require('lodash');
var fs         = require('fs');
var config     = require('../config');
config.version = require('../package.json').version;
var pug        = require('pug');
var s3         = require('./s3');

var pg = require('knex')({
	client: 'pg',
	connection: process.env.DATABASE_URL
});

module.exports = function(app) {

    var indexPage = pug.compileFile('./app/index.pug')(config);
    
	app.get('/', function(req, res, next) {
        res.send(indexPage);
        next();
	});

	app.get('/config.json', function(req, res) {
        config.s3enabled = s3.enabled();
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
                s3.remove(slug);
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
			var slug   = rows[0].slug;
			var file   = location + '/locator-maps/' + slug + '.json';
            
            s3.upload(slug, rows[0])
                .then(() => {
					res.json({
						message : "Map published",
						url: 'http://'+process.env.AWS_BUCKET+'.s3.amazonaws.com/' + file
					});
                })
                .catch(() => {
					res.status(404).json({error: "Error saving map to S3"});
                });
		});
		.catch(function(error) {
			res.json({error: error});
		});
}