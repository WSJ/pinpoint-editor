(function(){
    angular
    	.module('pinpointTool')
    	.directive('liveLink', liveLink);

	liveLink.$inject = ['$http', 'configService'];
    function liveLink($http, configService){
        return {
            restrict:'A',
            replace:false,
            scope: {
                published:'=?'
            },
            link: function($scope, elm, attrs){
                function disable(){
                    $(elm).attr('disabled', true);
                    $(elm).text('Unpublished');
                }
                function enable(){
                    $(elm).attr('disabled', false);
                    $(elm).text('Live link');
                }
                var url = configService.liveLink + attrs.slug;
            	$(elm).attr('href',url).attr('target','_blank');
                if (configService.s3url) {
                    var ajax_url = configService.s3url + attrs.slug + '.json';
                    $http.get(ajax_url).error(disable);
                } else {
                    enable();
                }
    			$scope.$watch(function(){
    			    if ($scope.published === true) {
                    	enable();
    			    }
    			});
            }
        }
    }

})();