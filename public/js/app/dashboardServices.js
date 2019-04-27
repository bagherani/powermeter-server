app.service("dashboardServices", ['$http', function ($http) {
    var config = {};

    this.getConfig = function () {
        return $http.get('/settings/get-config', null, config);
    }
}]);