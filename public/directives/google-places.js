pinpointTool.directive('googlePlaces', function(){
    return {
        restrict:'E',
        replace:true,
        // transclude:true,
        scope: {
            location:'=',
            locationName:'=?',
            placeholder:'@'
        },
        template: '<input id="google_places_ac" name="google_places_ac" type="text" class="form-control search-form" placeholder="" />',
        link: function($scope, elm, attrs){
            var autocomplete = new google.maps.places.Autocomplete(elm[0], {});
            google.maps.event.addListener(autocomplete, 'place_changed', function() {
                var place = autocomplete.getPlace();
                $scope.location = place.geometry.location.lat() + ',' + place.geometry.location.lng();
                $scope.locationName = place.name;
                $scope.$apply();
                elm.val(''); // clear text
            });
        }
    }
});
