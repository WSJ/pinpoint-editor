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
            var basemap = configService.basemap || 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
            L.tileLayer( basemap ).addTo(map);
        }
    }
}]);
