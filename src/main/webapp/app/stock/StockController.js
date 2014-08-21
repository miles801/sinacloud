(function () {
    var app = angular.module('com.miles.stock', ['stock']);

    app.controller('StockCtrl', function ($scope, $http, Stock) {
        $scope.running = false;
        $scope.orderBy = 'currentPercent';
        $scope.reverse = true;
        $scope.selectedStocks = [];
        var interval;
        $(document).bind('keydown', function (e) {
            var keycode = e.keyCode || e.which;
            var ctrl = e.ctrlKey;
            if (keycode === 13 && ctrl) {// 回车
                $scope.query();
                return;
            }
            if (keycode === 17) {// CTRL + K
            }
        });

        var doQuery = function () {
            var codes = $scope.selectedStocks.map(function (v) {
                return v.code;
            });
            if (codes.length < 1) return;
            $http.get('stock?code=' + codes.join(','))
                .success(function (data) {
                    $scope.stocks = data;
                });
        };
        $scope.query = function () {
            if (!$scope.selectedStocks.length || $scope.running) return false;
            $scope.running = true;
            doQuery();
            interval = setInterval(doQuery, 10000);
        };

        $scope.stop = function () {
            clearInterval(interval);
            $scope.running = false;
        };
        $scope.remove = function (index) {
            $scope.selectedStocks.splice(index, 1);
        };
        var showK = function (url, title, index) {
            art.artDialog({
                title: title | 'K线图',
                content: '<img src="' + url + '" width="545" height="300"/>'
            });
        };
        $scope.minK = function (code, index) {
            showK(Stock.minuteK(code), "分时K线", index);
        };

        $scope.dayK = function (code, index) {
            showK(Stock.dayK(code), "日K线", index);
        };

        $scope.weekK = function (code, index) {
            showK(Stock.weekK(code), "周K线", index);
        };

        $scope.monthK = function (code, index) {
            showK(Stock.monthK(code), "月K线", index);
        };

    });

    app.directive('sort', function ($compile) {
        var icon = '<i class="glyphicons" style="position: absolute;right: 8px;top: 12px;" ng-class="{\'sort-by-attributes\':!reverse,\'sort-by-attributes-alt\':reverse}"></i>';
        return {
            link: function (scope, element, attr, ctrl) {
                element.css({'cursor': 'pointer', 'position': 'relative'});
                var value = attr['sort'];
                element.append($compile(icon)(scope));
                element.bind('click', function () {
                    scope.$apply(function () {
                        if (scope.orderBy == value) {
                            scope.reverse = !scope.reverse;
                        } else {
                            scope.orderBy = value;
                        }
                    });
                });
            }
        }
    });
})();