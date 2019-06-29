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
                            // $scope.historyChartLabels = result.data.map(item => item.time);
                            // $scope.historyChartData = result.data.map(item => item.value);
                            var dt = result.data.map(item => item.value)
                            dt.push($scope.min);
                            draw(dt, "#historyCanvas");
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

        function getPoints(data) {
            var points = [];
            var len = data.length;
            var sum = 0;
            var count_valid = 0;
            var max;
            var min;
            var d;
            for (var i = 0; i < len; i++) {
                d = data[i];
                if (typeof d === 'number') {
                    if (typeof max !== 'number') {
                        max = d;
                        min = d;
                    }
                    max = d > max ? d : max;
                    min = d < max ? d : min;
                    count_valid += 1;
                    sum += data[i];
                }
            }
            var average = sum / count_valid;
            var middle = (max - min) / 2;
            var range = max - min;
            for (var i = 0; i < len; i++) {
                d = data[i];
                if (typeof d === 'number') {
                    points.push({
                        val: 2 * ((d - min) / range - 0.5),
                        data: d,
                        index: i
                    });
                } else {
                    points.push(null);
                }
            }
            return points;
        };


        function draw(data, elcanvas) {
            var $el = $(elcanvas);
            if (!$el) {
                return;
            }
            var len = data.length;
            var width = parseInt($el.width(), 10);
            var height = parseInt($el.attr('height'), 10);
            var gap = width / (len - 1);
            var ctx = $el[0].getContext('2d');
            var startPoint = null;
            var points = getPoints(data);
            var endPoint;
            var point;
            for (var i = 0; i < len; i++) {
                point = points[i];
                if (point) {
                    if (!startPoint) {
                        startPoint = point;
                    }
                    endPoint = point;
                }
            }
            if (!endPoint) {
                return;
            }
            ctx.save();
            ctx.fillStyle = '#f2f2f2';
            ctx.lineWidth = '3';
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
            ctx.beginPath();
            for (var i = 1; i < len; i++) {
                ctx.moveTo(i * gap, 0);
                ctx.lineTo(i * gap, height);
            }
            ctx.save();
            ctx.strokeStyle = '#ffe';
            ctx.stroke();
            ctx.restore();
            ctx.beginPath();
            ctx.moveTo(startPoint.index * gap, height);

            for (var i = 0; i < len; i++) {
                point = points[i];
                if (point) {
                    ctx.lineTo(point.index * gap, - point.val * height * 0.8 / 2 + height / 2);
                }
            }
            ctx.lineTo(endPoint.index * gap, height);
            ctx.save();
            ctx.fillStyle = '#dc0740';
            ctx.strokeStyle = '#f00';
            ctx.lineWidth = '1';
            ctx.stroke();
            ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.strokeStyle = '#666';
            ctx.lineWidth = '1';
            ctx.strokeRect(0, 0, width, height);
            ctx.restore();
        };

        init();
    }]);