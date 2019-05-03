app.service("dashboardServices", ['$http', function ($http) {
    var config = {};

    this.serverIsAlive = function () {
        return $http.get('/server-is-alive', null, config);
    }
}]);