/**
 * 依赖于
 *  angular-all.js
 *  angular-strap-all.js 信息提示用
 *  angular-file-upload.js 附件上传
 * Created by miles on 2014/5/13.
 */
(function (angular) {
    var app = angular.module('eccrm.attachment', [
        'ngResource',
        'eccrm.angular',
        'eccrm.angularstrap',
        'angularFileUpload'
    ]);
    app.service('AttachmentService', ['$resource', function ($resource) {
        return $resource('attachment/:method', {}, {
            //上传附件
            upload: {method: 'POST', params: {method: 'upload'}, isArray: false},

            //删除指定id的附件
            remove: {method: 'GET', params: {method: 'delete', ids: '@ids'}, isArray: false},

            removeTmp: {method: 'GET', params: {method: 'delete/tmp', ids: '@ids'}, isArray: false},

            //获得图片信息
            image: {method: 'GET', params: {method: 'image', id: '@id'}},

            //查询指定id的附件信息
            get: {method: 'GET', params: {method: 'get', id: '@id'}, isArray: false},

            //查询附件列表的信息
            //支持的参数：{bid:'业务id',btype:'业务类型',bclass:'业务class'}
            query: {method: 'GET', params: {method: 'query'}, isArray: false},

            // 根据id列表查询附件的信息
            queryByIds: {method: 'GET', params: {method: 'queryByIds', ids: '@ids'}, isArray: false}
        });
    }])
        .service('AttachmentConstant', function () {
            return {
                UPLOAD_URL: 'attachment/upload',
                TYPES: [
                    {code: 1, name: '本地文件'},
                    {code: 2, name: '远程链接'}
                ]
            }
        })
        .service('AttachmentContext', function () {
            return {};
        })
        .directive('eccrmUpload', [
            '$fileUploader', '$sce', '$http', 'AttachmentService', 'AlertFactory', '$popover', '$window', 'AttachmentContext',
            function ($fileUploader, $sce, $http, AttachmentService, AlertFactory, $popover, $window, AttachmentContext) {
                var FILE_UPLOAD = "attachment/upload/";
                var URL_UPLOAD = "attachment/upload/url";
                var WECHAT_UPLOAD = "wechat/attachment/upload?wcid=";
                return {
                    scope: {
                        options: '=eccrmUpload'
                    },
                    templateUrl: 'js/template/file-upload-standard.tpl.html',
                    link: function (scope, element, attr, ctrl) {

                        var defaults = {
                            id: null,// 如果设置了此值，则会将生成的fileUploader对象放入到AttachmentContext中
                            autoUpload: true,//是否自动上传
                            disabled: false,//禁用上传
                            ids: [], // 回显用,值为附件的id数组，与businessId互斥，两者不兼容（ids的优先级高）
                            businessId: null,//用户做显示的时候用
                            businessType: null,
                            text: '上传',//按钮上的文字
                            image: false,//是否回显图片
                            formData: [],//额外的表单数据
                            maxSize: 10 * 1000 * 1000,//最大10M
                            fileTypes: [
                                'text/plain', 'application/pdf', 'application/msword', 'application/kswps', 'application/kset', 'application/vnd.ms-excel', 'ppt', 'application/vnd.ms-powerpoint',//文本区
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',// 2007
                                'image/jpeg', 'image/gif', 'image/png', 'image/bmp',//图片区
                                'audio/mpeg', 'wma', 'amr', 'audio/x-wav',//音频区
                                'video/mpeg', 'video/x-msvideo', 'rmvb', 'flv', 'mkv', '3gp', 'mov'//视频
                            ],//允许的文件类型
                            replace: true,
                            // 上传成功后的回调
                            // 上下文this：附件对象
                            // 参数1：返回的附件id
                            onSuccess: null,
                            // 成功移除一个文件后触发的事件
                            // 上下文this：附件对象
                            // 参数1：移除的附件id
                            onRemove: null,
                            wcid: null,//上传到微信，值为微信公众号的原始id
                            enableUrl: false,//是否允许添加URL附件
                            url: FILE_UPLOAD,//上传的url地址
                            maxFiles: 10,
                            minFiles: 0
                        };
                        var options = scope.options = angular.extend({scope: scope}, defaults, scope.options);
                        //发送到微信
                        if (options.wcid && typeof options.wcid === 'string') {
                            options.url = WECHAT_UPLOAD + options.wcid;
                        }
                        //添加过滤器
                        options.filters = [
                            function (item) {//大小过滤器
                                var size = item.size;
                                if (size > options.maxSize) {
                                    AlertFactory.error(scope, '附件大小超出!');
                                    return false;
                                }
                                return true;
                            },
                            function (item) {//格式过滤器
                                var type = item.type;
                                if (!type) {
                                    var name = item.name;
                                    var index = name.lastIndexOf('.');
                                    if (index > 0) {
                                        type = name.substring(index + 1)
                                    }
                                }
                                var flag = false;
                                angular.forEach(options.fileTypes, function (v) {
                                    if (type === v) {
                                        flag = true;
                                    }
                                });
                                if (!flag) {
                                    AlertFactory.error(scope, '不支持的附件格式[ ' + type + ' ]!');
                                    return false;
                                }
                                return true;
                            }
                        ];

                        //初始化上传插件
                        var uploader = scope.uploader = $fileUploader.create(options);
                        //上传成功的回调
                        uploader.bind('success', function (event, xhr, item, response) {
                            if (angular.isFunction(options.onSuccess)) {
                                if (angular.isObject(response) && response.success == true && angular.isArray(response.data)) {
                                    options.onSuccess.call(item, response.data[0]);
                                }
                            }
                        });
                        if (options.enableUrl) {
                            var pop = $popover(element.find('button#btn_url'), {
                                template: 'js/template/file-upload-url-popover.html',
                                placement: 'right'
                            });
                            var ps = pop.$scope;
                            ps.uploadUrl = function () {
                                var s = ps.url;
                                $http.post(URL_UPLOAD, {url: ps.url}).success(function (data) {
                                    uploader.queue.push({
                                        isSuccess: true,
                                        _xhr: {responseText: [data.id]},
                                        file: {name: s, type: 'url'}
                                    });
                                });
                                ps.url = '';
                                ps.$hide();
                            };
                        }
                        var maxWidth = window.innerWidth - 200;
                        var maxHeight = window.innerHeight - 100;
                        var iframeCss = 'border: 0;padding: 0;margin: 0;width: ' + maxWidth + 'px;height: ' + maxHeight + 'px;';
                        scope.view = function (file) {
                            //图片类型的直接打开 image/jpeg
                            var src = 'attachment/view?id=' + file.id;
                            if (file.contentType.indexOf('image/') !== -1) {
                                (function () {
                                    art.dialog({
                                        padding: 0,
                                        fixed: true,
                                        resize: false,
                                        drag: false,
                                        title: file.name,
                                        content: '<img src=' + src + ' alt="' + file.fileName + '" width="650" height="450"/>',
                                        lock: true
                                    });
                                })();
                            } else if (file.contentType.indexOf('text/') !== -1) {
                                (function () {
                                    art.dialog({
                                        padding: 0,
                                        fixed: true,
                                        drag: false,
                                        title: file.name,
                                        content: '<iframe src="' + src + '" style="' + iframeCss + '"></iframe>',
                                        lock: true
                                    });
                                })();
                            } else if (file.contentType === 'application/pdf') {
                                (function () {
                                    art.dialog({
                                        padding: 0,
                                        fixed: true,
                                        resize: true,
                                        drag: false,
                                        title: file.name,
                                        content: '<iframe src="pdf.jsp?id=' + file.id + '" style="' + iframeCss + '"></iframe>',
                                        lock: true
                                    });
                                })();
                            } else {//其他类型的下载
                                window.open('attachment/download?id=' + file.id);
                            }

                        };
                        scope.cancel = function (index) {
                            uploader.queue[index].cancel();
                        };
                        //对外提供的接口：获取附件id列表
                        var getIds = function () {
                            var ids = [];
                            angular.forEach(uploader.queue || [], function (data) {
                                if (data && data.isSuccess) {
                                    var text = angular.fromJson(data._xhr.responseText);
                                    if (angular.isArray(text)) {
                                        ids = ids.concat(text);
                                    } else if (angular.isObject(text) && angular.isArray(text.data)) {
                                        ids = ids.concat(text.data);
                                    } else if (typeof text === 'string') {
                                        ids.push(text);
                                    }
                                }
                            });
                            return ids;
                        };
                        scope.remove = function (index) {
                            var ids = getIds() || [];
                            var id = ids[index];
                            angular.isFunction(options.onRemove) ? options.onRemove.call(uploader, id) : null;
                            uploader.removeFromQueue(uploader.queue[index]);
                        };
                        scope.options.getIds = getIds;
                        if (typeof options.id === 'string') {
                            uploader['getIds'] = getIds;
                            AttachmentContext[options.id] = uploader;
                        }
                        //有数据:加载历史附件列表
                        var result;
                        if (angular.isArray(scope.options.ids) && scope.options.ids.length > 0) {
                            result = AttachmentService.queryByIds({ids: scope.options.ids.join(',')});
                        } else if (scope.options.businessId) {
                            var obj = {
                                bid: options.businessId,
                                btype: options.businessType,
                                bclass: options.businessClass
                            };
                            result = AttachmentService.query(obj);
                        }
                        if (result) {
                            AlertFactory.handle(scope, result, function (data) {
                                data = data.data || [];
                                angular.forEach(data, function (value) {
                                    var item = {
                                        file: {
                                            id: value.id,//附件id
                                            contentType: value.contentType,//附件类型
                                            name: value.fileName,//附件名称
                                            size: value.size//附件大小
                                        },
                                        progress: 100,
                                        isUploaded: true,
                                        isSuccess: true
                                    };
                                    uploader.queue.push(item);
                                });
                                uploader.progress = 100;
                            });
                        }
                    }
                };
            }
        ])

})(angular);