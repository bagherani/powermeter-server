app.controller("dashboardCtrl", [
    '$scope',
    '$timeout',
    '$interval',
    'dashboardServices',
    'settingsServices',
    function ($scope, $timeout, $interval, services, settingsServices) {

        function init() {
            $scope.powermeters = [];
            getConfig();

            // reset the page every one hour
            $interval(function () {
                services.serverIsAlive()
                    .then(res => {
                        if (res.data.success)
                            window.location.assign('/');
                    }).catch(ex => { })

            }, 3600 * 1000)
        }

        function getConfig() {
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

        }

        init();

    }]);