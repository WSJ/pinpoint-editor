pinpointTool.directive('mapRoughPreview', ['configService', function(configService){
    return {
        restrict:'E',
        replace:false,
        template: '<div class="prevmap"></div>',
        link: function($scope, elm, attrs){
        	var mapOptions = {
        		scrollWheelZoom: false,
        		keyboard: false,
                attributionControl: false,
                zoomControl: false
        	};
            var mapEl = $(elm).find('.prevmap')[0];
            var map = L.map(mapEl, mapOptions)
        		.setView([attrs.lat, attrs.lon], attrs.zoom-1);
            
            var basemap = attrs.basemap;
            if (!basemap && (configService.basemaps.length > 0)) {
                basemap = $scope.config.basemaps[0].url;
            } else if (!basemap) {
                basemap = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
            }
            L.tileLayer( basemap ).addTo(map);
        }
    }
}]);
