(function (window) {
    angular.module('eccrm.angular', [
        'eccrm.angular.base',
        'eccrm.angular.date',
        'eccrm.angular.string',
        'eccrm.angular.pagination',
        'eccrm.angular.picker',
        'eccrm.angular.adjustment',
        'eccrm.angular.route'
    ]).factory('eccrmHttpInterceptor', ['$q', '$window', '$log', function ($q, $window, $log) {
        return function (promise) {
            return promise.then(function (response) {
                var data = response.data;
                if (angular.isObject(data)) {
                    var error = data.error;
                    if (error == true) {
                        var msg = data.message || '';
                        if (msg) {
                            msg = '错误信息:' + msg;
                        }
                        var code = data.code || '';
                        if (code) {
                            code = '状态码:[' + code + '],';
                        }
                        $log.error('操作异常! ' + code + msg);
                    }
                }
                return response;
            }, function (response) {
                if (art && angular.isFunction(art.dialog)) {
                    art.dialog({
                        padding: 5,
                        fixed: true,
                        resize: true,
                        icon: 'error',
                        content: response.data,
                        lock: true
                    });
                } else {
                    var o = $window.open('error.html', 'errorWin', 'height=700, width=1000, top=0,left=0, toolbar=no, menubar=no, scrollbars=no, resizable=no,location=no, status=no');
                    o.document.write(response.data);
                }
                return $q.reject(response);
            });
        }
    }]).config(['$httpProvider', function ($httpProvider) {
        // 给所有的ajax请求添加X-Requested-With header
        $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        $httpProvider.responseInterceptors.push('eccrmHttpInterceptor');
    }]);

    //基本
    angular.module('eccrm.angular.base', ['ngCookies'])
        .service('Debounce', function () {
            var timer = null;
            return {
                delay: function (fn, delay) {
                    var context = this, args = arguments;
                    clearTimeout(timer);
                    timer = setTimeout(function () {
                        if (!angular.isFunction(fn)) return;
                        fn.apply(context, args);
                    }, delay);
                }
            }
        })
        .service('CommonUtils', ['Debounce', '$window', '$q', '$parse', '$cookies', function (Debounce, $window, $q, $parse, $cookies) {
            return {
                // Debounce延迟函数
                delay: Debounce.delay,

                // 返回上一个页面
                back: function () {
                    $window.history.back();
                },

                // 从Cookie中获取登录上下文信息
                // 可获取的信息有id、username
                loginContext: function () {
                    return {
                        id: $cookies['eccrmContext.id'],
                        username: $cookies['eccrmContext.username']
                    }
                },
                // 使用artDialog插件弹出一个提示框，当只有一个参数时，标题即为内容
                // 参数1（可选）：标题
                // 参数2（必须）：内容
                // 参数3（可选）：图标
                artDialog: function (title, content, icon) {
                    content = content || title;
                    if (!title || content == title) title = '信息';
                    if (art && angular.isFunction(art.dialog)) {
                        var obj = {
                            title: title,
                            content: content
                        };
                        if (typeof icon === 'string') {
                            obj.icon = icon;
                        }
                        art.dialog(obj);
                        return art;
                    } else {
                        alert(title + ':' + content);
                        throw '没有获得art对象!请确保加载了artDialog插件相关的js和css!';
                    }
                },

                // 使用artDialog弹出一个带有success图标的成功提示框
                // 参数1（必须）:内容
                // 参数2（可选）：标题
                successDialog: function (content, title) {
                    title = title || '信息';
                    this.artDialog(title, content, 'succeed');
                },

                // 使用artDialog弹出一个带有error图标的错误提示框
                // 参数1（必须）:内容
                // 参数2（可选）：标题
                errorDialog: function (content, title) {
                    title = title || '错误';
                    this.artDialog(title, content, 'error');
                },

                // 获得一个$q延迟对象
                defer: function () {
                    return $q.defer();
                },
                // 使用$q延迟执行指定的函数，并返回结果
                // 参数1（必须）：回调函数，会回传defer对象
                // 参数2（可选）：延迟的毫秒数（默认为0）
                promise: function (callback, delay) {
                    if (!angular.isFunction(callback)) {
                        this.artDialog('错误', '使用promise方法必须传递一个回调函数!')
                    }
                    var defer = $q.defer();
                    delay = angular.isNumber(delay) ? delay : 0;
                    this.delay(function () {
                        callback(defer);
                    }, delay);
                    return defer.promise;
                },

                // 解析angularjs表达式
                // 参数1（必须）：上下文
                // 参数2（必须）：要被解析的字符串
                // 参数3（可选）：要被设置的新的值
                parse: function (context, str, newValue) {
                    if (!angular.isObject(context) && str) {
                        this.artDialog('错误', '解析上下文必须是一个对象,被解析的字符串不能为空!')
                    }
                    var parsed = $parse(str, newValue);
                    return parsed(context);
                },
                // 对字符串使用encodeURI进行两次编码，如果不是字符串，则直接返回
                // 参数1：要被编码的字符串
                encode: function (str) {
                    if (typeof str === 'string') {
                        return encodeURI(encodeURI(str));
                    }
                    return str;
                }
            };
        }]);


    // 时间相关的插件
    angular.module('eccrm.angular.date', [])
        .factory('DateFormat', ['$filter', function ($filter) {
            return function (value, pattern) {
                if (!value) return '';
                return $filter('date')(value, pattern);
            }
        }])
        .filter('eccrmDate', ['DateFormat', function (DateFormat) {
            return function (value) {
                return DateFormat(value, 'yyyy-MM-dd');
            }
        }])
        .filter('eccrmTime', ['DateFormat', function (DateFormat) {
            return function (value) {
                return DateFormat(value, 'HH:mm:ss');
            }
        }])
        .filter('eccrmDatetime', ['DateFormat', function (DateFormat) {
            return function (value) {
                return DateFormat(value, 'yyyy-MM-dd HH:mm:ss');
            }
        }]);

    //字符串相关
    angular.module('eccrm.angular.string', [])
        // 格式化字符串长度，超出部分使用'...'进行替换
        // 参数1（必须）：值
        // 参数2（可选）：最大长度，默认为50
        // 参数3（可选）：替换的后缀，默认为'...'
        .filter('substr', [function () {
            return function (value, length, suffix) {
                if (typeof value !== 'string') return value;
                if (!value)return '';
                length = length || 50;
                suffix = suffix || '...';
                if (value.length > length) {
                    return value.substring(0, length) + suffix;
                }
                return value;
            }
        }]);
    //分页
    angular.module('eccrm.angular.pagination', [])
        .directive('eccrmPage', [function () {
            return {
                scope: {
                    pager: '=eccrmPage'
                },
                templateUrl: 'js/template/page.html',
                link: function (scope, element, attr) {
                    var defaults = {
                        fetch: angular.noop,//查询函数
                        pageSize: [5, 10, 15, 20, 30, 40, 50, 100, 150, 300, 500],
                        start: 0,
                        limit: 15,//每页显示的数量
                        total: 0,//总数据
                        opacity: 1,//透明度
                        firstAndLast: true,//第一页和最后一页按钮
                        allowNav: true,//允许输入页面进行跳转
                        prevAndNext: true,//上一页和下一页的按钮
                        configLimit: true,//显示每页数据
                        currentPage: 1,//当前页号
                        totalPage: 1,//总页数
                        ready: false,
                        totalProperty: 'total',//总记录条数，可以使用字符串或者一个函数
                        next: function () {
                            //没有到最后一页
                            if (this.currentPage < this.totalPage) {
                                this.currentPage++;
                            }
                        },
                        prev: function () {
                            //没有到达第一页
                            if (this.currentPage > 1) {
                                this.currentPage--;
                            }
                        },
                        first: function () {
                            //不是第一页
                            if (this.currentPage != 1) {
                                this.currentPage = 1;
                            }
                        },
                        last: function () {
                            //不是最后一页
                            if (this.currentPage != this.totalPage) {
                                this.currentPage = this.totalPage;
                            }
                        },
                        jump: function (page_no) {//跳转到指定页面
                            //不是当前页，并且大于等于第一页，小于等于最后一页
                            if (this.currentPage != page_no && page_no > 0 && page_no <= this.totalPage) {
                                this.currentPage = page_no;
                            }
                        },
                        init: function () {//初始化分页的参数
                            this.currentPage = 1;
                            this.totalPage = 1;
                            this.start = 0;
                            this.total = 0;
                        },
                        initPaginationInfo: function (total) {
                            this.total = total || 0;
                            this.totalPage = Math.ceil(total / this.limit) || 1;
                        },
                        finishInit: $.noop,//初始化完成的回调
                        load: function () {
                            var current = scope.pager;
                            if (angular.isFunction(current.fetch)) {
                                var s = current.fetch();//支持返回{total:number} obj.promise obj.$promise 或者promise对象
                                if (!s) return;
                                var doInitPagination = function (value) {
                                    var totalProperty = current.totalProperty || 'total';
                                    var total = 0;
                                    if (angular.isNumber(value)) {
                                        total = value;
                                    } else if ((typeof value === 'object') && angular.isNumber(value[totalProperty])) {
                                        total = value[totalProperty];
                                    }
                                    current.initPaginationInfo.call(current, total);
                                };
                                if (angular.isObject(s) && angular.isDefined(s.total)) {
                                    doInitPagination(s);
                                    return s;
                                }
                                var promise = s.promise || s.$promise || s;
                                if (angular.isFunction(promise.then)) {
                                    promise.then(doInitPagination);
                                }
                                return promise;

                            }

                        },
                        query: function () {
                            var current = scope.pager;
                            current.load.call(current);
                        }
                    };
                    var pager = scope.pager = angular.extend({}, defaults, scope.pager);
                    var destroy = scope.$watch('pager.currentPage', function (value, oldValue) {
                        if (value === undefined || value === oldValue) return;
                        pager.start = scope.pager.limit * (value - 1);
                        pager.query();
                    });
                    var destroy2 = scope.$watch('pager.limit', function (value, oldValue) {
                        if (value === undefined || value === oldValue) return;
                        pager.start = 0;
                        pager.currentPage = 1;
                        pager.query();
                    });
                    if (angular.isFunction(pager.finishInit)) {
                        pager.finishInit.call(pager);
                    }
                    scope.$on('$destroy', destroy);
                    scope.$on('$destroy', destroy2);

                }
            };
        }]);

    //选择
    angular.module('eccrm.angular.picker', [])
        .directive('selectAllCheckbox', [function () {
            return {
                replace: true,
                restrict: 'EA',
                scope: {
                    checkboxes: '=',
                    allselected: '=allSelected',
                    allclear: '=allClear',
                    items: '=selectedItems',
                    anyoneSelected: '='
                },
                template: '<input type="checkbox" ng-model="master" ng-change="masterChange()" ng-cloak>',
                controller: function ($scope, $element, $attrs) {
                    if (!$scope.items) $scope.items = [];
                    //根改变
                    $scope.masterChange = function () {
                        if ($scope.master) {
                            angular.forEach($scope.checkboxes, function (cb) {
                                $scope.items.push(cb);
                                cb.isSelected = true;
                            });
                        } else {
                            $scope.items = [];
                            angular.forEach($scope.checkboxes, function (cb) {
                                cb.isSelected = false;
                            });
                        }
                    };
                    var destroy = $scope.$watch('checkboxes', function (value) {
                        var allSet = true,
                            allClear = true;
                        if (!value)$scope.items = [];//当checkbox的值发生变化时，清空选中的内容
                        angular.forEach(value, function (cb) {
                            var _ind = $.inArray(cb, $scope.items);
                            if (cb.isSelected) {
                                if (_ind == -1) {
                                    $scope.items && $scope.items.push(cb);
                                }
                                allClear = false;
                            } else {
                                allSet = false;
                                if (_ind != -1) {
                                    $scope.items && $scope.items.splice(_ind, 1);
                                }
                            }
                        });

                        if ($scope.allselected !== undefined) {
                            $scope.allselected = allSet;
                        }
                        if ($scope.allclear !== undefined) {
                            $scope.allclear = allClear;
                        }
                        if ($attrs['anyoneSelected']) {
                            $scope.anyoneSelected = !allClear;
                        }

                        $element.prop('indeterminate', false);
                        if (allSet && $scope.items && $scope.items.length > 0) {
                            $scope.master = true;
                        } else if (allClear) {
                            $scope.master = false;
                        } else {
                            $scope.master = false;
                            $element.prop('indeterminate', true);
                        }
                    }, true);
                    $element.on('$destroy', destroy);
                }
            }
        }]);

    //单选框
    //下拉框

    //自适应相关
    angular.module('eccrm.angular.adjustment', ['eccrm.angular.base'])
        //自动调节高度
        .directive('eccrmAutoHeight', ['$window', 'Debounce', function ($window, Debounce) {
            return {
                restrict: 'A',
                link: function (scope, ele, attr) {
                    var el = attr['eccrmAutoHeight'];
                    if (!el) return;
                    var _p = ele.parent(), _e = $(el);
                    if (_p.length < 1) {
                        console.debug('没有获得对应的父容器!');
                        return;
                    }
                    if (_e.length < 1) {
                        console.debug('没有获得相对的兄弟元素，无法根据其高度进行自适应!');
                        return;
                    }
                    var changeSize = function () {
                        ele.animate(
                            {height: _p.height() - _e.outerHeight() - 5}, 500
                        );
                    };
                    angular.element(window).on('resize', function () {
                        Debounce.delay(changeSize, 200);
                    });
                    changeSize();
                }
            }
        }]);


    //路由
    angular.module('eccrm.angular.route', ['ngRoute', 'ngAnimate'])
        .directive('eccrmRoute', ['$window', function ($window) {
            return {
                scope: {
                    routes: '=eccrmRoute'
                },
                templateUrl: 'js/template/route.html',
                link: function (scope, element, attr, ctrl) {
                    var path = $window.location.pathname;
                    var routes = scope.routes;
                    var defaultIndex = 0;
                    if (angular.isArray(routes)) {
                        angular.forEach(routes, function (value, index) {
                            var url = value.url;
                            if (!url) throw '无效的路由地址';
                            if (url.indexOf('#') !== 0) {
                                url = '#' + url;
                            }
                            value.url = path + url;
                            if (value.active === true) {
                                defaultIndex = index;
                            }
                        });
                    }
                    scope.active = defaultIndex;
                }
            }
        }]);
})(window);