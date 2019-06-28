app.directive('unit', [function () {
    return {
        scope: {
            ngId: '=',
            ngPm: '=',
            ngTitle: '=',
            ngShowChart: '=',
            ngMin: '=',
            ngMax: '=',
        },
        restrict: 'AE',
        controller: function ($scope, $rootScope) {
            $scope.setClickedRegister = function () {
                $rootScope.$broadcast('registerClicked', {
                    pm: $scope.ngPm,
                    register: $scope.ngTitle.replace(' ', '').toLowerCase(),
                    min: $scope.ngMin,
                    max: $scope.ngMax
                });
            };

            $scope.labels = [];
            $scope.series = ['مقدار'];
            $scope.data = [];
            $scope.colors = ['#45b7cd', '#ff6384', '#ff8e72'];
            $scope.datasetOverride = [{
                yAxisID: 'y-axis-1'
            }];

            $scope.options = {
                animation: {
                    duration: 0
                },
                elements: {
                    line: {
                        tension: 0, // disables bezier curves
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    labels: {
                        fontFamily: 'Vazir',
                        fontSize: 14,
                        fontStyle: 'bold'
                    }
                },
                scales: {
                    yAxes: [{
                        id: 'y-axis-1',
                        display: true,
                        position: 'right',
                        ticks: {
                            suggestedMin: $scope.ngMin,
                            suggestedMax: $scope.ngMax
                        }
                    }]
                }
            };
        },
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            scope.$watch(function () {
                return ngModel.$modelValue;
            }, function (newVal) {
                if (newVal != null && !isNaN(newVal)) {
                    var val = parseFloat(newVal).toFixed(2);
                    scope.ngModel = val;

                    scope.data.push(val);
                    scope.labels.push(moment().format('HH:mm:ss'));

                    if (scope.labels.length > 30)
                        scope.labels.splice(0, 1);
                    if (scope.data.length > 30)
                        scope.data.splice(0, 1);
                }
            });
        },
        templateUrl: '/js/app/views/unitDir.html'
    }
}]);