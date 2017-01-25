var pinpointTool = angular.module('pinpointTool', ['ngRoute']);

pinpointTool.provider('configService', function () {
    var options = {};
    this.config = function (opt) {
        angular.extend(options, opt);
    };
    this.$get = [function () {
        if (!options) {
            throw new Error('Config options must be configured');
        }
        return options;
    }];
})

angular.element(document).ready(function () {
    $.get('/config.json', function (data) {

        angular.module('pinpointTool').config(['configServiceProvider', function (configServiceProvider) {
            configServiceProvider.config(data);
        }]);

        angular.bootstrap(document, ['pinpointTool']);
    });
});

pinpointTool.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/maps', {
        templateUrl: 'partials/map-list.html',
        controller: 'mapListCtrl'
      }).
      when('/maps/:mapId', {
        templateUrl: 'partials/map-detail.html',
        controller: 'mapDetailCtrl'
      }).
      when('/maps/new', {
        templateUrl: 'partials/map-detail.html',
        controller: 'mapDetailCtrl'
      }).
      otherwise({
        redirectTo: '/maps'
      });
  }]);  

/////////////////
// EDITOR
/////////////////

pinpointTool.controller('mapDetailCtrl',
  ['$scope', '$routeParams', '$http', '$location', 'mapHelper', 'markerStyles', 'mapDefaults', 'dataWrangler', 'configService',
  function ($scope, $routeParams, $http, $location, mapHelper, markerStyles, mapDefaults, dataWrangler, configService ) {
    
    $scope.mapId = $routeParams['mapId'];
    $scope.icons = markerStyles.icons;
    $scope.labels = markerStyles.labels;
    $scope.aspectRatios = ['wide','square','tall'];
    $scope.pickedLocation = {};
    $scope.config = configService;
    var basemaps = [];
    if ('basemaps' in $scope.config) {
        $scope.basemapNames = basemaps.map(function(d,i) { return d.name });    
    }
    if (basemaps[0]) {
        $scope.basemap = basemaps[0].name;
    }
        
    if ($scope.mapId === 'new') {
        $scope.map = $.extend({}, mapDefaults.map);
        $scope.map.aspectRatio = $scope.map['aspect-ratio'];
    } else {
        $http.get('/api/maps/'+$scope.mapId)
        .success(function(data) {
            $scope.map = data;
            $.extend({}, mapDefaults.map, $scope.map);
        
            $scope = dataWrangler.setupExisting($scope);
        
        })
        .error(function(){
            $location.path('/maps');
        });
    }

    $scope.$watch(function() {
        
        // This is a horribly ugly hack, but I am at my wit's end
        var selectedBasemapName = $('.basemap-selector .btn.active').text();
        
        if ((selectedBasemapName !== '') && ($scope.map !== undefined)) {
            var selectedBasemap = basemaps.filter(function(basemap) {
                return basemap.name === selectedBasemapName;
            })[0];
            $scope.map.basemap = selectedBasemap.url;
            $scope.map.basemapCredit = selectedBasemap.credit;
        }
        if ($scope.map) {
            $scope.map = dataWrangler.onWatch($scope.map);
            $scope.cleanMap = JSON.stringify( dataWrangler.cleanMapObj($scope.map), null, 2 );
            $scope.pinpoint = mapHelper.buildPreview($scope.map, changeMap, changeMap, changeMarker);
        }
    });
    
    $scope.$watch('quickstartLatLonString', function(val){
        if (val) {
            $scope.map.latLonString = val;
            var coords = {
                lat: val.split(',')[0],
                lon: val.split(',')[1]
            }
            $scope.addMarker( coords, $scope.quickstartName );
            
        }
    });
    
    $scope.showPublishModal = function(){
        $scope.publishModal = true;
    }
    $scope.hidePublishModal = function(){
        $scope.publishModal = false;
    }
    
    $scope.$watch('map.published', function(val){
        if (val === true) {
            $scope.save();
        }
    });

    
    function changeMap(ev){
        var newLatLon = ev.target.getCenter();
        var newZoom = ev.target.getZoom();
        $scope.map.latLonString = newLatLon.lat+','+newLatLon.lng;
        $scope.map.zoom = newZoom;
        $scope.$$childHead.mapform.$setDirty();
        $scope.$apply();
    }

    function changeMarker(ev){
        var marker = ev.target;
        var newLatLon = marker._latlng;
        $.each($scope.map.markers, function(i,m){
            if (marker.options.title === i) {
                $scope.map.markers[i].latLonString = newLatLon.lat+','+newLatLon.lng;
            }
        });
        $scope.$$childHead.mapform.$setDirty();
        $scope.$apply();
    }

    
    $scope.$on('$destroy', function() {
       window.onbeforeunload = undefined;
    });
    $scope.$on('$locationChangeStart', function(event, next, current) {
        if (!$scope.$$childHead.mapform.$pristine && !$scope.bypassSaveDialog) {
            if(!confirm("Leave page without saving?")) {
                event.preventDefault();
            }
        }
    });
    

    
    $scope.removeMarker = function(marker){
        var index = $scope.map.markers.indexOf(marker);
        if (index > -1) {
            $scope.map.markers.splice(index, 1);
        }
    }
    $scope.addMarker = function(center, label){
        if ($scope.map.markers.length > 4) {
            return;
        }
        
        var newMarker = $.extend({}, mapDefaults.marker);
        if ($scope.pinpoint) {
            center = center || $scope.pinpoint.map.getCenter();
            newMarker.lat = center.lat;
            newMarker.lon = center.lng || center.lon;
            newMarker.latLonString = newMarker.lat+','+newMarker.lon;
        }
        newMarker.text = label || '';
        newMarker.labelDirection = newMarker['label-direction'];
        $scope.map.markers.push( newMarker );
    }
        
    $scope.save = function(){
        $scope.saving = true;
        var dirty = JSON.parse(JSON.stringify($scope.map));
        var clean = dataWrangler.cleanMapObj(dirty);
        if ($scope.map.id && ($scope.map.id !== 'new')) {
            // update map
            $http
                .put('/api/maps/'+$scope.mapId, clean)
                .success(function(){
                    $scope.saving = false;
                    $scope.$$childHead.mapform.$setPristine();
                });
        } else {
            // create a new map
            $http
                .post('/api/maps/', clean)
                .success(function(d){
                    $scope.map.id = d.id;
                    $scope.saving = false;
                    $location.path('/maps/'+d.id);
                    $scope.$$childHead.mapform.$setPristine();
                });
        }
        if ($scope.map.published === true) {
            $scope.publish();
        }
    }
    $scope.publish = function(){
        var dirty = JSON.parse(JSON.stringify($scope.map));
        var clean = dataWrangler.cleanMapObj(dirty);
    $http
        .post('/api/publish/', clean)
        .success(function(e,r){
            $scope.$$childHead.mapform.$setPristine();
            $scope.published = true;
        })
        .error(function(){
            alert('Not published due to error');
        });
    }
    $scope.delete = function(){
        $scope.deleteModal = true;
    }
    $scope.cancelDelete = function(){
        $scope.deleteModal = false;
    }
    $scope.definitelyDelete = function(){
        if ($scope.map.id && ($scope.map.id !== 'new')) {
            // existing map
            $http
                .delete('/api/maps/'+$scope.map.id)
                .success(function(e,r){
                    alert('Map deleted');
                    $scope.bypassSaveDialog = true;
                    $location.path('/maps/');
                })
                .error(function(){
                    alert('Not deleted due to error');
                    $scope.deleteModal = false;
                });
            
        } else {
            $scope.bypassSaveDialog = true;
            $location.path('/maps/');
            
        }
    }


}]);


pinpointTool.factory('mapHelper', [function() {
    var p;
    var build = function(opts, dragend, zoomend, markerdragend){
        opts.dragend = dragend;
        opts.zoomend = zoomend;
        opts.markerdragend = markerdragend;
        
        $('.map-outer.inactive').html('<div id="map"></div>');
        if (typeof p !== 'undefined') {
            try {
                p.remove();
            } catch (err) {
                //
            }
        }
        opts.creation = true;
        opts.el = '.map-preview';
        if ( $(opts.el).length === 1 ) {
            $(opts.el).attr('class',opts.el.replace('.','') + ' '+opts['aspect-ratio']);
            p = new Pinpoint(opts);
        }
        return p;
    };
    var splitLatLonString = function(string){
        if (!string) {
            return [0,0];
        }
        var lat = +string.replace(/\s/g,'').split(',')[0];
        var lon = +string.replace(/\s/g,'').split(',')[1];
        return [lat, lon];
    }
    
    return {
        buildPreview: build,
        splitLatLonString: splitLatLonString
    };
}]);

pinpointTool.factory('markerStyles', function() {
    
    var icons = [
        "square",
        "circle",
        "none"
    ];
    var labels_obj = [
        {
            "name": "plain",
            "directions": [
                "north",
                "northeast",
                "east",
                "southeast",
                "south",
                "southwest",
                "west",
                "northwest"
            ]
        },
        {
            "name": "callout",
            "directions": [
                "north",
                "south"
            ]
        }
    ];
    var getDirectionsforLabel = function( label ) {
        labels_obj.forEach(function(l){
            if (l.name === label) {
                return l.directions;
            }
        });
    }
    var labels = [], labels_directions = [];
    labels_obj.forEach(function(l){
        labels.push(l.name);
    });
    labels_obj.forEach(function(l){
        labels_directions[l.name] = l.directions;
    });
    
    return {
        icons: icons,
        labels: labels,
        directions: labels_directions
    };
});

pinpointTool.value('mapDefaults', {
    map: {
        hed: '',
        dek: '',
        lat: 51.5049378,
        lon: -0.0870377,
        latLonString: '51.5049378, -0.0870377',
        zoom: 4,
        minimap: false,
        "aspect-ratio": 'wide',
        "minimap-zoom-offset": -5,
        markers: []
    },
    marker: {
        lat: 0,
        lon: 0,
        text: "",
        icon: "square",
        "label-direction": "north"
    }
});

pinpointTool.factory('dataWrangler', ['mapHelper', 'markerStyles', function(mapHelper, markerStyles){
    var clean = function(input){
        var output = JSON.parse(JSON.stringify(input));
        var toDelete = [
            'labelDirections',
            'latLonString',
            'el',
            'id',
            'aspectRatio',
            'minimapZoomOffset',
            'labelDirection',
            'creation',
            'creation_date',
            'modification_date'
        ];
        $.each(toDelete, function(i, d){
            delete output[d];
        });
        $.each(input.markers, function(j, marker){
            $.each(toDelete, function(i, d){
                delete output.markers[j][d];
            });
        });
        if (output.geojson && output.geojson.features.length === 0) {
            delete output.geojson;
        }
        if (output.markers.length === 0) {
            delete output.markers;
        }       
        return output;
    }
    var setupExisting = function(scope) {
        if (scope.map.lat && scope.map.lon) {
            scope.map.latLonString = scope.map.lat + ',' + scope.map.lon;
        } else {
            scope.map.latLonString = '51.5049378,-0.0870377';
        }
        scope.map.minimapZoomOffset = scope.map['minimap-zoom-offset'];
        scope.map.aspectRatio = scope.map['aspect-ratio'];
            
        if (typeof scope.map.minimapZoomOffset !== 'number')  {
            scope.map.minimapZoomOffset = -5;
        }
        
        scope.map.markers = scope.map.markers || [];
        $.each(scope.map.markers, function(i,m){
            if (m.lat && m.lon) {
                m.latLonString = m.lat + ',' + m.lon;
            } else {
                m.latLonString = '51.5049378,-0.0870377';
            }
            m.labelDirections = markerStyles.directions[m.label];
            m['label-direction'] = m['label-direction'] || m.labelDirections[0];
            scope.map.markers[i] = m;
        });
        
        if (scope.map.basemap && scope.config.basemaps) {
            scope.basemap = scope.config.basemaps.filter(function(b) {
                return b.url === scope.map.basemap;
            })[0];
        }
        
        return scope;
        
    }
    var watch = function(map){
        map.zoom = parseInt( map.zoom );
        map.lat = mapHelper.splitLatLonString(map.latLonString)[0];
        map.lon = mapHelper.splitLatLonString(map.latLonString)[1];
        map['minimap-zoom-offset'] = +map.minimapZoomOffset || map['minimap-zoom-offset'];
        map['aspect-ratio'] = map.aspectRatio || map['aspect-ratio'];
        $.each(map.markers, function(i,m){
            m.labelDirections = markerStyles.directions[m.label];
            m['label-direction'] = m.labelDirection || m['label-direction'];
            m.lat = mapHelper.splitLatLonString(m.latLonString)[0];
            m.lon = mapHelper.splitLatLonString(m.latLonString)[1];
            map.markers[i] = m;
        });
        
        return map;
    }
    return {
        cleanMapObj: clean,
        setupExisting: setupExisting,
        onWatch: watch
    }
}]);

/////////////////
// HOMEPAGE
/////////////////

pinpointTool.controller('mapListCtrl',
  ['$scope', '$http', '$location', '$filter', 'configService', function ($scope, $http, $location, $filter, configService) {
    $scope.listView = false;
    $scope.changeView = function(){
        $scope.listView = !$scope.listView;
    }
    $scope.maps = [];
    $scope.allMaps = [];
    $http.get('/api/maps').success(function(data) {
        $scope.allMaps = $filter('orderBy')(data, 'creation_date', true);;
        $scope.loadMore();
    });
    
    var numberToLoadEachTime = 10; 
    $scope.loadMore = function() {
        $scope.maps = $scope.allMaps.slice(0, $scope.maps.length + numberToLoadEachTime);
        $scope.hideLoadMore = ($scope.maps.length === $scope.allMaps.length);
    }
        
    $scope.previewLink = function(map){
        if (map['aspect-ratio'] === 'wide') {
            var layout = 'offset';
        } else {
            var layout = 'margin';
        }
        var url = configService.previewLink + map.slug;
        return url;
    }
    $scope.liveLink = function(map){
        var url = configService.liveLink+attr.slug;
        return url;
    }
    
}]);






