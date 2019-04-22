app.directive('unit', [function () {
    return {
        scope: {
            ngId: '=',
            ngTitle: '=',
            ngShowChart: '=',
            ngMin: '=',
            ngMax: '='
        },
        restrict: 'AE',
        controller: function ($scope) {
            $scope.labels = [];
            $scope.series = ['مقدار'];
            $scope.data = [];
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
                maintainAspectRatio: false,
                legend: {
                    labels: {
                        fontFamily: 'Vazir',
                        fontSize: 14,
                        fontStyle: 'bold'
                    }
                },
                responsive: false,
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
                if (!isNaN(newVal)) {
                    var val = parseFloat(newVal.toFixed(2));
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