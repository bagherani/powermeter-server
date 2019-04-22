app.controller("dashboardCtrl", ['$scope', '$timeout', 'dashboardServices', function ($scope, $timeout, services) {
    $scope.powermeters = [];

    services.getSettings()
        .then(function (res) {
            var result = res.data;
            $scope.powermeters = result.powermeters;

            $scope.socketPath = "http://" + result.serverPath + ":" + result.socketPort;

            var socket = io($scope.socketPath);

            socket.on('connect', function () {
                console.log('connected to ', $scope.socketPath)
            });

            socket.on('message', function (message) {
                if (!message)
                    return;

                $scope.powermeters.forEach(function (pm) {
                    var pmMessage = message.find(function (item) {
                        return item.id == pm.id;
                    })
                    if (!pmMessage) return;

                    pm.registers.forEach(function (register) {
                        var registerData = pmMessage.registers.find(function (item) {
                            return item.address == register.address;
                        })
                        if (!registerData) return;

                        $timeout(function () {
                            register.value = registerData.value;
                        }, 1);
                    })
                })
            });

            socket.on('usb', function (devices) {
                $list = $('.device-list');
                $list.html('');
                for (let i = 0; i < devices.length; i++) {
                    const device = devices[i];
                    var $a = $('<a>')
                        .data('id', device)
                        .addClass('js_saveOnDisk')
                        .html('ذخیره اطلاعات در درایو « <span class="iblock ltr">' + device + "</span> »")
                        .attr('href', '#');
                    var $li = $("<li/>").addClass('list-group-item');
                    $li.append($a);
                    $list.append($li)
                }

                var $a = $('<a>')
                    .addClass('text-danger')
                    .html("انصراف")
                    .attr('href', '#')
                    .on('click', function () {
                        $('.devices').hide();
                    });

                var $li = $("<li/>").addClass('list-group-item');
                $li.append($a);
                $list.append($li)

                $list.on('click', '.js_saveOnDisk', function (ev) {
                    ev.preventDefault();
                    var path = $(this).data('id')

                    $('.process').show();

                    $.ajax({
                        url: '/download',
                        method: 'post',
                        data: {
                            path: path
                        },
                        success: function (res) {
                            if (res == 'done') {
                                $('.success').show();
                                setTimeout(function () {
                                    $('.success').hide();
                                }, 3000);
                            } else {
                                $('.error').show();
                                setTimeout(function () {
                                    $('.error').hide();
                                }, 3000);
                            }
                        },
                        error: function () {
                            $('.error').show();
                            setTimeout(function () {
                                $('.error').hide();
                            }, 3000);
                        },
                        complete: function () {
                            $('.process').hide();
                            $('.devices').hide();
                        }
                    })
                });

                $('.devices').show();
            });
            socket.on('usboff', function () {
                $('.process').hide();
                $('.error').hide();
                $('.success').hide();
                $('.devices').hide();
            });

            socket.on('disconnect', function () {
                console.log('disconnected');
                socket.off('message');
            });
        });

}]);