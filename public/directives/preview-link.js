pinpointTool.directive('previewLink', ['configService', function(configService){
    return {
        restrict:'A',
        replace:false,
        link: function($scope, elm, attrs){
            if (!configService.previewLink) {
                return $(elm).hide();
            }
            var layout = 'margin';
            var url = configService.previewLink + attrs.slug;
        	$(elm).attr('href',url).attr('target','_blank');
        }
    }
}]);
