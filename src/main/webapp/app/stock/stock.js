(function () {
    var app = angular.module('stock', []);

    app.service('Stock', function ($http, $q) {
            var format = function (code) {
                var category = "sh";// 600 601 900 730 700...
                var prev = code.substr(0, 1);
                if ("0|3".indexOf(prev) !== -1) {
                    category = "sz";
                }
                return category + code;
            };
            return {
                // 股票池
                // 返回：promise对象，数据结构为：[{}]
                pool: function () {
                    var defer = $q.defer();
                    $http.get('app/stock/stock.json').success(function (data) {
                        defer.resolve(data);
                    });
                    return defer.promise;
                },
                // 分时K线图
                // 必须参数：股票代码
                minuteK: function (code) {
                    return "http://image.sinajs.cn/newchart/min/n/" + format(code) + ".gif";
                },

                // 日K线图
                // 必须参数：股票代码
                dayK: function (code) {
                    return "http://image.sinajs.cn/newchart/daily/n/" + format(code) + ".gif";
                },

                // 周K线图
                // 必须参数：股票代码
                weekK: function (code) {
                    return "http://image.sinajs.cn/newchart/weekly/n/" + format(code) + ".gif";
                },

                // 月K线图
                // 必须参数：股票代码
                monthK: function (code) {
                    return "http://image.sinajs.cn/newchart/monthly/n/" + format(code) + ".gif";
                }
            }
        }
    );
    // 股票选择插件
    // 在文本框中使用，当输入值后，会弹出面板选择股票
    // 支持数字和字母的匹配，默认匹配十条
    app.directive('stockList', function (Stock, $compile, $filter, $parse) {
        return {
            require: '^ngModel',
            restrict: 'A',
            scope: true,
            link: function (scope, element, attrs, ctrl) {
                var listEle = '<div class="list-group" ng-show="show" style="position: absolute;top: ' + (element.height() + 20) + 'px;left: 0;z-index:9999;">' +
                    '<a style="cursor: pointer;" ng-class="{active:$index===0}" ng-click="choose(stock)" ng-repeat="stock in stocks|filter:viewValue" class="list-group-item">{{stock.code}} {{stock.name}} {{stock.type}} {{stock.industry}}</a>' +
                    '</div>';

                var panel = $compile(listEle)(scope);
                element.parent().append(panel);
                $(document).bind('keydown', function (e) {
                    if (!element.is(":focus")) return;
                    var keycode = e.keyCode || e.which;
                    var ctrl = e.ctrlKey;
                    if (keycode === 13) {// 回车
                        scope.$apply(function () {
                            scope.choose(scope.stocks[0]);
                        })
                    }
                });
                var stocks = [];
                Stock.pool().then(function (data) {
                    stocks = data;
                });
                ctrl.$parsers.unshift(function (viewValue) {
                    scope.$viewValue = viewValue;
                    scope.show = !!viewValue;
                    scope.stocks = [];
                    if (viewValue.match(/\d+/)) {
                        (function () {
                            for (var i = 0; i < stocks.length; i++) {
                                var stock = stocks[i];
                                if (stock.code.indexOf(viewValue) !== -1) {
                                    scope.stocks.push(stock);
                                    if (scope.stocks.length === 10) {
                                        break;
                                    }
                                }
                            }
                        })();
                    } else if (viewValue.match(/[a-zA-Z]+/)) {
                        (function () {
                            for (var i = 0; i < stocks.length; i++) {
                                var stock = stocks[i];
                                if (stock.shortName.indexOf(viewValue.toUpperCase()) !== -1) {
                                    scope.stocks.push(stock);
                                    if (scope.stocks.length === 10) {
                                        break;
                                    }
                                }
                            }
                        })();
                    }
                    return viewValue;
                });
                var stockList = attrs['stockList'];
                scope.choose = function (stock) {
                    // 设置父scope的ng-model值
                    if (!stock || !stock.code) return;
                    $parse(stockList)(scope.$parent).push(stock);
                    ctrl.$setViewValue('');
                    ctrl.$render();
                    scope.show = false;
                }
            }
        }
    });
})();