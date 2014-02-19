'use strict';

angular.module('authoringEnvironmentApp')
    .service('images', ['$http', 'pageTracker', 'configuration', '$log', 'article', function images($http, pageTracker, configuration, $log, article) {
        /* more info about the page tracker in its tests */
        // AngularJS will instantiate a singleton by calling "new" on this function
        var service = this;
        var root = configuration.API.full;
        this.article = article.instance;
        this.tracker = pageTracker.getTracker({max: 100});
        this.loaded = [];
        this.displayed = [];
        this.attached = [];
        this.includedIndex = 0;
        this.included = {};
        this.itemsPerPage = 10;
        /* at the beginning we want do display the results immediately */
        this.init = function() {
            this.load(this.tracker.next())
                .success(function(data) {
                    service.displayed = data.items;
                    service.itemsPerPage = data.pagination.itemsPerPage;
                    /* prepare the next batch, for an happy user */
                    service.more();
                })
        };
        /* synchronously show more items and asynchronously ask for loading */
        this.more = function() {
            var additional = service.loaded.splice(0, this.itemsPerPage);
            this.displayed = this.displayed.concat(additional);
            this.load(this.tracker.next())
                .success(function(data) {
                    service.loaded = service.loaded.concat(data.items);
                })
        };
        this.load = function(page) {
            var url = root + '/images?items_per_page=500&page=' + page;
            var promise = $http.get(url);
            promise.error(function() {
                service.tracker.remove(page);
            });
            return promise;
        };
        // produce a matching function suitable for finding. find it
        // confusing? hey that's functional programming dude!
        this.matchMaker = function(id) {
            return function(needle) {
                return parseInt(needle.id) == parseInt(id);
            };
        };
        this.attach = function(id) {
            var match = this.matchMaker(id);
            if (_.find(this.attached, match)) {
                // already attached, do nothing
                return;
            } else {
                var url = root+'/articles/' + service.article.number;
                var link = '<'+root+'/images/'+id+'>';
                /* this could cause some troubles depending on the
                 * setting of the server (OPTIONS request), thus debug
                 * log may be useful to reproduce the original
                 * request */
                $log.debug('sending a link request');
                $log.debug(url);
                $log.debug(link);
                $http({
                    url: url,
                    method: 'LINK',
                    headers: {
                        Link: link
                    }
                }).success(function() {
                    var i = _.cloneDeep(_.find(service.displayed, match));
                    i.incomplete = true;
                    service.attached.push(i);
                    service.updateAttached();
                });
            }
        };
        this.detach = function(id) {
            var match = this.matchMaker(id);
            if (_.find(this.attached, match)) {
                var url = root+'/articles/' + service.article.number;
                var link = '<'+root+'/images/'+id+'>';
                /* this could cause some troubles depending on the
                 * setting of the server (OPTIONS request), thus debug
                 * log may be useful to reproduce the original
                 * request */
                $log.debug('sending an unlink request');
                $log.debug(url);
                $log.debug(link);
                $http({
                    url: url,
                    method: 'UNLINK',
                    headers: {
                        Link: link
                    }
                }).success(function() {
                    _.remove(service.attached, match);
                });
            } else {
                // already attached, do nothing
                return;
            }
        };
        this.include = function(id) {
            var match = this.matchMaker(id);
            var index = _.findIndex(this.attached, match);
            if (index < 0) {
                // this should be impossible, where is the user dragging from?
                throw Error('trying to include a not attached image');
            } else {
                this.attached[index].included = true;
                this.includedIndex++;
                var image = _.cloneDeep(this.attached[index]);
                var defaultSize = 'big';
                image.size = defaultSize;
                image.style = {
                    container: {
                        width: configuration.image.width[defaultSize]
                    },
                    image: {
                    }
                };
                this.included[this.includedIndex] = image;
                return this.includedIndex;
            }
        };
        this.exclude = function(id) {
            var match = this.matchMaker(id);
            var index = _.findIndex(this.attached, match);
            if (index < 0) {
                // this should be impossible, included images should
                // always be attached
                throw Error('trying to exclude a not attached image');
            } else {
                this.attached[index].included = false;
            }
        };
        this.updateAttached = function() {
            this.attached.forEach(function(a) {
                if (a.incomplete) {
                    $http
                        .get(root + '/images/' + a.id)
                        .success(function(data) {
                            _.forOwn(data, function(value, key) {
                                if (!(key in a)) {
                                    a[key] = value;
                                }
                            });
                            a.incomplete = false;
                        });
                }
            });
        };
        this.findAttached = function(id) {
            return _.find(this.attached, this.matchMaker(id));
        };
        this.byId = function(id) {
            var i = this.findAttached(id);
            if (i) {
                return i;
            } else {
                throw Error('asking details about an image which is not attached to the article is not supported');
            }
        };
        this.isAttached = function(id) {
            return (typeof this.findAttached(id)) != 'undefined';
        };
        this.togglerClass = function(id) {
            return this.isAttached(id) ? 'glyphicon-minus' : 'glyphicon-plus';
        };
        this.toggleAttach = function(id) {
            if (this.isAttached(id)) {
                this.detach(id);
            } else {
                this.attach(id);
            }
        };
    }]);