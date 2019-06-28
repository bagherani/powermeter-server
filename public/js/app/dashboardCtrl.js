app.controller("dashboardCtrl", [
    '$scope',
    '$timeout',
    '$interval',
    'dashboardServices',
    'settingsServices',
    function ($scope, $timeout, $interval, services, settingsServices) {

        function init() {
            $scope.powermeters = [];

            $scope.$on('registerClicked', function (ev, data) {
                $scope.clickedPM = data.pm;
                $scope.clickedRegister = data.register;
                $scope.min = data.min;
                $scope.max = data.max;
                // $scope.historyChartOptions.scales.yAxes[0].ticks.suggestedMax = $scope.max;
                // $scope.historyChartOptions.scales.yAxes[0].ticks.suggestedMin = $scope.min;
            });

            getConfig();

            // reset the page every one hour
            $interval(function () {
                services.serverIsAlive()
                    .then(res => {
                        if (res.data.success)
                            window.location.assign('/');
                    }).catch(ex => { })

            }, 1800 * 1000);

            $scope.historyChartLabels = [];
            $scope.historyChartSeries = ['مقدار'];
            $scope.historyChartData = [];
            $scope.historyChartColors = ['#ff6384'];
            $scope.historyChartDatasetOverride = [{
                yAxisID: 'y-axis-1'
            }];

            $scope.historyChartOptions = {
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
                            suggestedMin: $scope.min,
                            suggestedMax: $scope.max
                        }
                    }]
                }
            };

            $scope.historyChartTime = 1;
            $scope.loadHistory = function (time) {
                $scope.historyChartTime = time || 0;

                $scope.historyChartLabels = [];
                $scope.historyChartData = [];

                var fromTime = Date.now() - ($scope.historyChartTime * 24 * 3600 * 1000);
                if ($scope.historyChartTime == 0)
                    fromTime = 0;

                $scope.isLoading = true;
                services.getRegisterHistory(fromTime, $scope.clickedPM, $scope.clickedRegister)
                    .then(function (res) {
                        var result = res.data;
                        if (result.success) {
                            $scope.historyChartLabels = result.data.map(item => item.time);
                            $scope.historyChartData = result.data.map(item => item.value);
                        }
                    })
                    .catch(function (ex) {
                        console.log(ex)
                    }).finally(function () {
                        $scope.isLoading = false;
                    });
            };

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