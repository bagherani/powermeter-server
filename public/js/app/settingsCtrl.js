app.controller("settingsCtrl", [
    '$scope',
    '$timeout',
    'settingsServices',
    function ($scope, $timeout, services) {
        var self = this;
        function init() {
            $scope.powermeters = [];

            services.getConfig()
                .then(function (res) {
                    var result = res.data;
                    $scope.settings = result.powermeters;
                });
        }

        self.save = function () {
            services.saveConfigs($scope.settings)
                .then(function (res) {
                    var result = res.data;
                    if (result.success) {
                        window.location.assign('/');
                    }
                    else
                        alert('Error in saving config');
                });
        }

        init();

    }
]);