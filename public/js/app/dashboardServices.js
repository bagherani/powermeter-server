app.service("dashboardServices", ['$http', function ($http) {
    var config = {};

    this.getSettings = function () {
        return $http.get('/settings', null, config);
    }
}]);