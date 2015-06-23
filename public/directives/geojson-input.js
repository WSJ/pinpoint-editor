(function(){
	angular
   		.module('pinpointTool')
   		.directive('geojsonInput', geojsonInput);

	geojsonInput.$inject = ['configService'];
	function geojsonInput(configService){
		return {
			restrict: 'E',
            templateUrl: 'partials/geojson-input.html',
            scope: {
                geojson:'=?'
            },
			link: function ($scope, element, attrs) {
                // configure styles
                $scope.geojsonStyles = configService.geojsonStyles;
                $scope.geojsonStyles.unshift({
                    name: 'Default',
                    class: ''
                });
                
                // load in existing geojson
                $scope.geojsonRaw = [];
                if ($scope.geojson && $scope.geojson.features.length > 0) {
                    for (var i = 0; i < $scope.geojson.features.length; i++) {
                        var feature = $scope.geojson.features[i];
                        $scope.geojsonRaw[i] = {
                            valid: true,
                            style: feature.properties.pinpointStyle,
                            value: JSON.stringify( feature )
                        };
                    }
                }
                $scope.geojson = {
                    type: 'FeatureCollection',
                    features: []
                };
                
                // add/remove geojsonRaw items
                $scope.removeFeature = function(feature){
                    var index = $scope.geojsonRaw.indexOf(feature);
                    if (index > -1) {
                        $scope.geojsonRaw.splice(index, 1);
                    }
                }
                $scope.addFeature = function(){
                    $scope.geojsonRaw.push({
                        value: '',
                        style: '',
                        valid: true
                    });
                }
                
                // validate geojsonRaw
                // and pass it back to geojson
                $scope.$watch(function(){
                    var geojsonRaw = $scope.geojsonRaw;
                    for (var i = 0; i < geojsonRaw.length; i++) {
                        var valid = true;
                        try {
                            var parsed = JSON.parse(geojsonRaw[i].value);
                            if (!parsed.properties || !parsed.properties.pinpointStyle) {
                                parsed.properties = {
                                    pinpointStyle: geojsonRaw[i].style
                                };
                            } else {
                                parsed.properties.pinpointStyle = geojsonRaw[i].style;
                            }
                            $scope.geojson.features[i] = parsed;
                            geojsonRaw[i].valid = true;
                        } catch (err) {
                            geojsonRaw[i].valid = false;
                        }
                    }
                }); // $scope.$watch
                                
			} // link
		};
	}
})();