(function () {
  'use strict';

  var app = angular.module('docnixMaterialApp');

  app.directive('acTable', [function () {
    return {
      restrict: 'A',
      scope: {
        onReorder: '=',
        order: '='
      },
      controller: ['$scope', function ($scope) {
        this.setOrder = function (order) {
          if ($scope.order == order) {
            $scope.order = '-' + order;
          } else {
            $scope.order = order;
          }
          $scope.$apply();
        };

        this.currentOrder = function () {
          return $scope.order;
        };

        this.reorder = function () {
          $scope.onReorder();
        }
      }]
    };
  }]);

  app.directive('acColumn', [function () {
    function defineIcon(val, orderBy) {
      var inverse = false;
      var order = val;
      if (order.charAt(0) === '-') {
        inverse = true;
        order = order.substring(1);
      }
      if (order === orderBy) {
        return inverse ? 'sort-desc' : 'sort-asc';
      }
      return 'sort';
    }

    return {
      restrict: 'A',
      require: '^^acTable',
      transclude: true,
      template: '<ng-transclude></ng-transclude> <i class="fa fa-{{icon}} pull-right"></i>',
      scope: {
        orderBy: '@'
      },
      link: function (scope, element, attrs, acTable) {
        element[0].style.cursor = 'pointer';
        scope.icon = defineIcon(acTable.currentOrder(), scope.orderBy);

        $(element).click(function () {
          if (scope.orderBy) {
            acTable.setOrder(scope.orderBy);
            acTable.reorder();
            scope.$root.$broadcast('order-change');
          }
        });

        scope.$on('order-change', function () {
          scope.icon = defineIcon(acTable.currentOrder(), scope.orderBy);
        });
      }
    };
  }]);

  app.directive('acPaginate', ['$timeout', function ($timeout) {
    return {
      restrict: 'E',
      template: '<div class="paginate-container">' +
      '<div class="col-sm-6 pull-right align-right">' +
      '<ul class="pagination">' +
      '<li class="paginate_button first" ng-class="{\'disabled\': page === 1}"><a href="javascript:void(0)" ng-click="page > 1 && first()"><i class="fa fa-angle-double-left"></i></a></li>' +
      '<li class="paginate_button previous" ng-class="{\'disabled\': page === 1}"><a href="javascript:void(0)" ng-click="page > 1 && previous()"><i class="fa fa-angle-left"></i></a></li>' +
      '<li class="paginate_button page" ng-class="{\'active\': page === aPage}" ng-repeat="aPage in pages"><a href="javascript:void(0)" ng-click="goTo(aPage)">{{aPage}}</a></li>' +
      '<li class="paginate_button next" ng-class="{\'disabled\': page === lastPage}"><a href="javascript:void(0)" ng-click="page < lastPage && next()"><i class="fa fa-angle-right"></i></a></li>' +
      '<li class="paginate_button last" ng-class="{\'disabled\': page === lastPage}"><a href="javascript:void(0)" ng-click="page < lastPage && last()"><i class="fa fa-angle-double-right"></i></a></li>' +
      '</ul>' +
      '</div>' +
      '</div>',
      scope: {
        limit: '=',
        total: '=',
        onPaginate: '=',
        page: '=',
        label: '='
      },
      link: function (scope, element) {
        scope.limit = scope.limit || 10;
        scope.page = scope.page || 1;
        scope.lastPage = Math.ceil(scope.total / scope.limit);
        scope.pages = [];

        scope.$watch('total', function() {
          scope.lastPage = Math.ceil(scope.total / scope.limit);
          for (var i = 1; i <= scope.lastPage; i++) {
            scope.pages.push(i);
          }
        });

        scope.goTo = function(page) {
          scope.page = page > scope.lastPage ? scope.lastPage : page < 1 ? 1 : page;
          $timeout(function() {
            scope.onPaginate();
          });
        };

        scope.next = function() {
          console.log('Clicou');
          scope.goTo(scope.page + 1);
        };

        scope.previous = function() {
          console.log('Clicou');
          scope.goTo(scope.page - 1);
        };

        scope.first = function() {
          console.log('Clicou');
          scope.goTo(1);
        };

        scope.last = function() {
          console.log('Clicou');
          scope.goTo(scope.lastPage);
        };
      }
    }
  }]);
})();