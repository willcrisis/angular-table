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
          if ($scope.order === order) {
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
        };
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
    function calculatePages(page, lastPage) {
      var pages = [];
      var i;
      if (lastPage <= 5) {
        for (i = 1; i <= lastPage; i++) {
          pages.push(i);
        }
      } else {
        if ([1, 2].indexOf(page) > -1) {
          for (i = 1; i <= 5; i++) {
            pages.push(i);
          }
        } else if ([lastPage - 1, lastPage].indexOf(page) > -1) {
          for (i = lastPage - 4; i <= lastPage; i++) {
            pages.push(i);
          }
        } else {
          for (i = -2; i < 3; i++) {
            var addPage = page + i;
            if (addPage > 0 && addPage <= lastPage) {
              pages.push(addPage);
            }
          }
        }
      }
      return pages;
    }

    return {
      restrict: 'E',
      template: '<div class="paginate-container col-sm-12 pull-right align-right">' +
      '<ul class="pagination pull-right">' +
      '<li class="paginate_button first" ng-class="{\'disabled\': page === 1}"><a href="javascript:void(0)" ng-click="page > 1 && first()"><i class="fa fa-angle-double-left"></i></a></li>' +
      '<li class="paginate_button previous" ng-class="{\'disabled\': page === 1}"><a href="javascript:void(0)" ng-click="page > 1 && previous()"><i class="fa fa-angle-left"></i></a></li>' +
      '<li class="paginate_button page" ng-class="{\'active\': page === aPage}" ng-repeat="aPage in pages"><a href="javascript:void(0)" ng-click="goTo(aPage)">{{aPage}}</a></li>' +
      '<li class="paginate_button next" ng-class="{\'disabled\': page === lastPage}"><a href="javascript:void(0)" ng-click="page < lastPage && next()"><i class="fa fa-angle-right"></i></a></li>' +
      '<li class="paginate_button last" ng-class="{\'disabled\': page === lastPage}"><a href="javascript:void(0)" ng-click="page < lastPage && last()"><i class="fa fa-angle-double-right"></i></a></li>' +
      '</ul>' +
      '<div class="pager-info col-sm-6 pull-right">' +
      '<div class="col-sm-10"><p>{{label.showing}} {{start}}-{{end}} {{label.of}} {{total}} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {{label.page}} {{page}} {{label.of}} {{lastPage}} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {{label.rowsPerPage}}:</p></div> <div class="col-sm-2"><select class="form-control" ng-model="limit"><option ng-repeat="option in limitOptions" value="{{option}}">{{option}}</option></select></div>' +
      '</div>' +
      '</div>',
      scope: {
        limit: '=',
        total: '=',
        onPaginate: '=',
        page: '=',
        label: '='
      },
      link: function (scope) {
        scope.limit = scope.limit.toString() || "10";
        scope.limitOptions = scope.limitOptions || [5, 10, 15];
        scope.page = scope.page || 1;
        scope.lastPage = Math.ceil(scope.total / scope.limit);
        scope.pages = [];
        scope.label = scope.label || {page: 'Page', of: 'of', rowsPerPage: 'Rows per Page', showing: 'Showing'};

        scope.$watch('total', function () {
          $timeout(function () {
            calculateLastPage();
            calculateStartEnd();
            scope.goTo(1);
          });
        });

        scope.$watch('limit', function () {
          $timeout(function () {
            calculateLastPage();
            scope.onPaginate();
            calculateStartEnd();
          });
        });

        function calculateLastPage() {
          scope.lastPage = Math.ceil(scope.total / scope.limit);
          scope.pages = calculatePages(scope.page, scope.lastPage);
        }

        scope.$watch('page', function () {
          $timeout(function () {
            calculateStartEnd();
            scope.pages = calculatePages(scope.page, scope.lastPage);
          });
        });

        function calculateStartEnd() {
          scope.start = scope.page * scope.limit - scope.limit + 1;
          scope.end = Math.min(scope.page * scope.limit, scope.total);
        }

        scope.goTo = function (page) {
          scope.page = page > scope.lastPage ? scope.lastPage : page < 1 ? 1 : page;
          $timeout(function () {
            scope.onPaginate();
          });
        };

        scope.next = function () {
          console.log('Clicou');
          scope.goTo(scope.page + 1);
        };

        scope.previous = function () {
          console.log('Clicou');
          scope.goTo(scope.page - 1);
        };

        scope.first = function () {
          console.log('Clicou');
          scope.goTo(1);
        };

        scope.last = function () {
          console.log('Clicou');
          scope.goTo(scope.lastPage);
        };
      }
    };
  }]);
})();