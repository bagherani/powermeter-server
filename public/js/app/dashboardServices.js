app.service("dashboardServices", ['$http', function ($http) {
    var config = {};

    this.serverIsAlive = function () {
        return $http.get('/server-is-alive', null, config);
    }

    this.getRegisterHistory = function (time, pm, register) {
        return $http.get('/get-register-history?time=' + time + "&pm=" + pm + "&register=" + register, null, config);
    }
}]);