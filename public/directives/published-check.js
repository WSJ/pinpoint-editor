(function(){
    angular
        .module('pinpointTool')
        .directive('publishedCheck', publishedCheck);

    publishedCheck.$inject = ['$http', 'configService'];
    function publishedCheck($http, configService){
        return {
            restrict:'A',
            replace:false,
            link: function($scope, elm, attrs){
                function disable(){
                    $(elm).html('unpublished');
                }
                function enable(){
                    $(elm)
                      .html('<span class="glyphicon glyphicon-ok" aria-hidden="true"></span> published')
                      .removeClass('label-default')
                      .addClass('label-primary');
                }
                if (configService.s3url) {
                    var ajax_url = configService.s3url + attrs.slug + '.json';
                    $http.get(ajax_url).success(enable).error(disable);
                } else {
                    enable();
                }
            }
        }
    }

})();