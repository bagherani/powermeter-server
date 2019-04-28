app.controller("dashboardCtrl", [
    '$scope',
    '$timeout',
    'dashboardServices',
    'settingsServices',
    function ($scope, $timeout, services, settingsServices) {
        $scope.powermeters = [];

        settingsServices.getConfig()
            .then(function (res) {
                var result = res.data;
                $scope.powermeters = result.powermeters;

                $scope.socketPath = "http://" + result.serverPath + ":" + result.socketPort;

                var socket = io($scope.socketPath);

                socket.on('connect', function () {
                    console.debug('connected to ', $scope.socketPath);
                });

                socket.on('message', function (message) {
                    if (!message)
                        return;

                    $scope.powermeters.forEach(function (pm) {
                        var pmMessage = message.find(function (item) {
                            return item.id == pm.id;
                        })

                        if (!pmMessage)
                            return;

                        pm.registers.forEach(function (register) {
                            var registerData = pmMessage.registers.find(function (item) {
                                return item.address == register.address;
                            })

                            if (!registerData)
                                return;

                            $timeout(function () {
                                register.value = registerData.value;
                            }, 1);
                        })
                    })
                });

                socket.on('disconnect', function () {
                    console.debug('disconnected');
                    socket.off('message');
                });
            });

    }]);