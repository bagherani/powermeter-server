app.controller("settingsCtrl", [
    '$scope',
    '$timeout',
    'settingsServices',
    function ($scope, $timeout, services) {
        $scope.powermeters = [];

        services.getConfig()
            .then(function (res) {
                var result = res.data;
                $scope.settings = result.powermeters;
            });

    }
]);