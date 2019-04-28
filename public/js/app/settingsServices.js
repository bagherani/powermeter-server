app.service("settingsServices", ['$http', function ($http) {
    var config = {};

    this.getConfig = function () {
        return $http.get('/settings/get-config', null, config);
    }

    this.saveConfigs = function (data) {
        return $http.post('/settings/save-config', data, config);
    }
}]);