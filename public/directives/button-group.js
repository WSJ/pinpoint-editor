pinpointTool.directive('buttonGroup', function(){
    return {
        restrict:'E',
        replace:true,
        // transclude:true,
        scope: {
            value:'=',
            options:'=',
            labels:'=?'
        },
        template: '<div class="btn-group"></div>',
        link: function($scope, elm, attrs){
            var $elm = $(elm);
            $.each($scope.options, function(i, o){
                if ($scope.labels && $scope.labels[i]) {
                    var label = $scope.labels[i];
                } else {
                    var label = o;
                }
                $elm.append('<button type="button" data-val="'+o+'" class="btn btn-default">'+label+'</button>');
            });
            $elm.find('.btn[data-val="'+$scope.value+'"]').addClass('active');
            $elm.find('.btn').click(function(){
                var $this = $(this);
                $elm.find('.btn').removeClass('active');
                $this.addClass('active');
                var val = $this.attr('data-val');
                $scope.value = val;
                $scope.$apply();
                setTimeout(function() {
                    $scope.$apply();
                },50);
            });
        }
    }
});