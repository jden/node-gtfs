var gtfs = require('../../');
var async = require('async');

module.exports = function routes(app){
  // Enable CORS
  app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
   });
  
  //AgencyList
  app.get('/api/agencies', function(req, res){
    gtfs.agencies(function(e, data){
      res.send( data || {error: 'No agencies in database'});
    });
  });
   
  app.get('/api/agenciesNearby/:lat/:lon/:radiusInMiles', function(req, res){
    var lat = req.params.lat
      , lon = req.params.lon
      , radius = req.params.radiusInMiles;
    gtfs.getAgenciesByDistance(lat, lon, radius, function(e, data){
      res.send( data || {error: 'No agencies within radius of ' + radius + ' miles'});
    });
  });

  app.get('/api/agenciesNearby/:lat/:lon', function(req, res){
    var lat = req.params.lat
      , lon = req.params.lon;
    gtfs.getAgenciesByDistance(lat, lon, function(e, data){
      res.send( data || {error: 'No agencies within default radius'});
    });
  });

  // Transitmix
  // Agencies + Routes (to avoid HTTP calls) + parsing
  app.get('/api/agenciesNearbyWithRoutes/:lat/:lon', function(req, res){
    var lat = req.params.lat
      , lon = req.params.lon;
    gtfs.getAgenciesByDistance(lat, lon, function(e, agencies) {
      // for each agency, get the data
      if (!agencies) return res.send({error: 'No agencies within default radius'});

      var addRoutes = function(agency, callback) {
        gtfs.getRoutesByAgency(agency.agency_key, function(e, data) {
          var combined = agency.toJSON();
          combined.lines = data;
          callback(null, combined);
        });
      }

      async.map(agencies, addRoutes, function(err, results) {
        cleanup(results);
        res.send( results || {error: 'No agencies within default radius'} );
      });
    });
  });

  // Rough cleanup to match TransitMix until we figure out more about how we
  // want to structure this.
  function cleanup(agencies) {
    agencies.forEach(function(agency) {
      agency.id = agency.agency_key;
      agency.name = agency.agency_name;

      agency.lines = agency.lines.map(function(line) {
        line = line.toJSON();
        line.id = line.route_id;
        line.name = line.route_short_name + ' ' + line.route_long_name;
        return line;
      });
    });
  }

  // Coordinates
  app.get('/api/coordinates/:agency/:route_id', function(req, res){
    var agency_key = req.params.agency
      , route_id = req.params.route_id
    gtfs.getCoordinatesByRoute(agency_key, route_id, function(e, data){
      res.send( data || {error: 'No shapes for agency/route combination.'});
    });
  });


  app.get('/api/transitjson/:agency', function(req, res){
    var agency_key = req.params.agency
    gtfs.getTransitJSON(agency_key, function(e, data){
      res.send( data || {error: 'Unable to generate transit.'});
    });
  });

  //Routelist
  app.get('/api/routes/:agency', function(req, res){
    var agency_key = req.params.agency;
    gtfs.getRoutesByAgency(agency_key, function(e, data){
      res.send( data || {error: 'No routes for agency_key ' + agency_key});
    });
  });
  
  app.get('/api/routesNearby/:lat/:lon/:radiusInMiles', function(req, res){
    var lat = req.params.lat
      , lon = req.params.lon
      , radius = req.params.radiusInMiles;
    gtfs.getRoutesByDistance(lat, lon, radius, function(e, data){
      res.send( data || {error: 'No routes within radius of ' + radius + ' miles'});
    });
  });
  app.get('/api/routesNearby/:lat/:lon', function(req, res){
    var lat = req.params.lat
      , lon = req.params.lon;
    gtfs.getRoutesByDistance(lat, lon, function(e, data){
      res.send( data || {error: 'No routes within default radius'});
    });
  });

  //Shapes
  app.get('/api/shapes/:agency/:route_id/:direction_id', function(req, res){
    var agency_key = req.params.agency
      , route_id = req.params.route_id
      , direction_id = parseInt(req.params.direction_id,10);
    gtfs.getShapesByRoute(agency_key, route_id, direction_id, function(e, data){
      res.send( data || {error: 'No shapes for agency/route/direction combination.'});
    });
  });
  app.get('/api/shapes/:agency/:route_id', function(req, res){
    var agency_key = req.params.agency
      , route_id = req.params.route_id
    gtfs.getShapesByRoute(agency_key, route_id, function(e, data){
      res.send( data || {error: 'No shapes for agency/route combination.'});
    });
  });



  //Stoplist
  app.get('/api/stops/:agency/:route_id/:direction_id', function(req, res){
    var agency_key = req.params.agency
      , route_id = req.params.route_id
      , direction_id = parseInt(req.params.direction_id,10);
    gtfs.getStopsByRoute(agency_key, route_id, direction_id, function(e, data){
      res.send( data || {error: 'No stops for agency/route/direction combination.'});
    });
  });
  app.get('/api/stops/:agency/:route_id', function(req, res){
    var agency_key = req.params.agency
      , route_id = req.params.route_id;
    gtfs.getStopsByRoute(agency_key, route_id, function(e, data){
      res.send( data || {error: 'No stops for agency/route combination.'});
    });
  });
  
  app.get('/api/stopsNearby/:lat/:lon/:radiusInMiles', function(req, res){
    var lat = req.params.lat
      , lon = req.params.lon
      , radius = req.params.radiusInMiles;
    gtfs.getStopsByDistance(lat, lon, radius, function(e, data){
      res.send( data || {error: 'No stops within radius of ' + radius + ' miles'});
    });
  });
  app.get('/api/stopsNearby/:lat/:lon', function(req, res){
    var lat = req.params.lat
      , lon = req.params.lon;
    gtfs.getStopsByDistance(lat, lon, function(e, data){
      res.send( data || {error: 'No stops within default radius'});
    });
  });
  
  //Times
  app.get('/api/times/:agency/:route_id/:stop_id/:direction_id', function(req, res){
    var agency_key = req.params.agency
      , route_id = req.params.route_id
      , stop_id = req.params.stop_id
      , direction_id = parseInt(req.params.direction_id,10);
    gtfs.getTimesByStop(agency_key, route_id, stop_id, direction_id, function(e, data){
      res.send( data || {error: 'No times for agency/route/stop/direction combination.'});
    });
  });
  app.get('/api/times/:agency/:route_id/:stop_id', function(req, res){
    var agency_key = req.params.agency
      , route_id = req.params.route_id
      , stop_id = req.params.stop_id;
    gtfs.getTimesByStop(agency_key, route_id, stop_id, function(e, data){
      res.send( data || {error: 'No times for agency/route/stop combination.'});
    });
  });
    
  //Nothing specified
  app.all('*', function notFound(req, res) {
    
    res.contentType('application/json');
    res.send({
      error: 'No API call specified'
    });
  });

}
