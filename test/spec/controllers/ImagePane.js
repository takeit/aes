'use strict';

/**
* Module with tests for the image pane controller.
*
* @module ImagepaneCtrl controller tests
*/

describe('Controller: ImagepaneCtrl', function () {

    var fakeImagesService,
        ImagepaneCtrl,
        scope;

    // load the controller's module
    beforeEach(module('authoringEnvironmentApp'));

    beforeEach(inject(function ($controller, $rootScope) {
        fakeImagesService = {};
        scope = $rootScope.$new();

        ImagepaneCtrl = $controller('ImagePaneCtrl', {
            $scope: scope,
            images: fakeImagesService
        });
    }));

    it('attaches images to the scope', function () {
        expect(scope.images).toBeDefined();
    });

    it('sets a default width property on scope to 100%', function () {
        expect(scope.defaultWidth).toEqual('100%');
    });

    it('sets `root` property on scope holding API root URL', function () {
        expect(scope.root).toEqual('http://newscoop.aes.sourcefabric.net');
    });

    describe('scope\'s attachModal() method', function () {
        var modal;

        beforeEach(inject(function (_modal_) {
            modal = _modal_;
            spyOn(modal, 'show');
        }));

        it('opens a modal dialog', function () {
            scope.attachModal();
            expect(modal.show).toHaveBeenCalledWith({
                title: 'Attach Image',
                templateUrl: 'views/attach-image.html'
            });
        });
    });

    describe('scope\'s detachingAllowed() method', function () {
        beforeEach(inject(function ($controller) {
            var imagesService = {
                inArticleBody: {2: true, 15: true, 99: true}
            };
            ImagepaneCtrl = $controller('ImagePaneCtrl', {
                $scope: scope,
                images: imagesService
            });
        }));

        it('returns false for images in article body', function () {
            expect(scope.detachingAllowed(15)).toBe(false);
        });

        it('returns true for images not in article body', function () {
            expect(scope.detachingAllowed(1)).toBe(true);
        });
    });

    describe('scope\'s detachImage() method', function () {
        var deferred,
            modalFactory,
            resultPromise;

        beforeEach(inject(function ($q, _modalFactory_) {
            modalFactory = _modalFactory_;

            fakeImagesService.detach = jasmine.createSpy();

            deferred = $q.defer();
            resultPromise = deferred.promise;

            spyOn(modalFactory, 'confirmLight').andCallFake(function () {
                return {
                    result: resultPromise
                };
            });
        }));

        it('opens a "light" confirmation dialog', function () {
            scope.detachImage(123);
            expect(modalFactory.confirmLight).toHaveBeenCalled();
        });

        it('detaches image on action confirmation"', function () {
            scope.detachImage(123);

            deferred.resolve(true);
            scope.$digest();

            expect(fakeImagesService.detach).toHaveBeenCalledWith(123);
        });

        it('does *not* detach image on action rejection"', function () {
            scope.detachImage(123);

            deferred.reject(false);
            scope.$digest();

            expect(fakeImagesService.detach).not.toHaveBeenCalled();
        });
    });
});
