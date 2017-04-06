(function () {
  'use strict';

  var app = angular.module('willcrisis.angular-table', []);

  app.directive('acTable', ['$timeout', function ($timeout) {
    return {
      restrict: 'A',
      scope: {
        onReorder: '&',
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
          $timeout(function() {
            $scope.$root.$broadcast('acTable.order-change');
          });
        };
      }]
    };
  }]);

  app.directive('acColumn', ['$timeout', function ($timeout) {
    function defineIcon(val, orderBy) {
      var inverse = false;
      var order = val;
      if (order && order.charAt(0) === '-') {
        inverse = true;
        order = order.substring(1);
      }
      if (order === orderBy) {
        return inverse ? 'sort-desc' : 'sort-asc';
      }
      return 'sort';
    }

    function addHiddenClass(element, size) {
      element.addClass('hidden-' + size);
    }

    function addVisibleClass(element, size) {
      element.addClass('visible-' + size);
    }

    function hideElement(element) {
      addHiddenClass(element, 'xs');
      addHiddenClass(element, 'sm');
      addHiddenClass(element, 'md');
      addHiddenClass(element, 'lg');
    }

    function showOrHideElement(element, hideOpts) {
      if (hideOpts === 'all') {
        hideElement(element);
      } else {
        var sizes = hideOpts.split(',');
        angular.forEach(sizes, function (size) {
          addHiddenClass(element, size)
        });
      }
    }

    function createDetailValue(element, elementCol, hideOpts) {
      var value = $('<p/>');
      var label = $('<label class="control-label ' + element.index() + '" /> ');
      label.append(element.find('ng-transclude').html() + ': ');
      value.append(label);
      value.append(' ');
      value.append(elementCol.html());

      if (hideOpts !== 'all') {
        var sizes = hideOpts.split(',');
        angular.forEach(sizes, function (size) {
          addVisibleClass(value, size)
        });
      }

      return value;
    }

    function applyColumnClasses(element, hideOpts) {
      $timeout(function () {
        if (hideOpts) {
          showOrHideElement(element, hideOpts);

          var tbody = element.parent().parent().parent().find('tbody');
          var rows = tbody.find('tr:not(.detail-row)');
          if (!rows) {
            return;
          }

          for (var i = 0; i < rows.length; i++) {
            var elementRow = $(rows[i]);
            elementRow.addClass(i % 2 == 0 ? 'even' : 'odd');
            var cols = elementRow.children();

            var colspan = cols.length;

            var column = cols.get(element.index());
            if (column) {
              var elementCol = $(column);
              showOrHideElement(elementCol, hideOpts);

              var detailRow = tbody.children().eq(elementRow.index() + 1);
              if (detailRow && detailRow.hasClass('detail-row')) {
                var col = detailRow.children().eq(0);
                if (!col.children().find('.' + element.index()).length) {
                  col.append(createDetailValue(element, elementCol, hideOpts));
                }
              } else {
                detailRow = $('<tr class="detail-row"/>');
                var collapse = $('<i class="fa fa-angle-right fa-fw" />');
                var firstCol = cols.eq(0);
                firstCol.click(function() {
                  $(this).parent().next().toggle();
                  var collapse = $(this).children().eq(0);
                  collapse.toggleClass('fa-angle-right');
                  collapse.toggleClass('fa-angle-down');
                });
                firstCol.prepend(collapse);
                var detailCol = $('<td colspan="' + colspan + '"/>');
                detailCol.append(createDetailValue(element, elementCol, hideOpts));
                detailRow.append(detailCol);
                elementRow.after(detailRow);
                detailRow.hide();
              }
            }
          }
        }
      });
    }

    return {
      restrict: 'A',
      require: '^^acTable',
      transclude: true,
      template: '<ng-transclude></ng-transclude> <i class="fa fa-{{icon}}" ng-if="orderBy"></i>',
      scope: {
        orderBy: '@',
        hide: '@'
      },
      link: function (scope, element, attrs, acTable) {
        if (scope.orderBy) {
          element[0].style.cursor = 'pointer';
        }
        scope.icon = defineIcon(acTable.currentOrder(), scope.orderBy);

        applyColumnClasses(element, scope.hide);

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

        scope.$on('acTable.order-change', function () {
          applyColumnClasses(element, scope.hide);
        });
        scope.$on('acTable.list-change', function () {
          applyColumnClasses(element, scope.hide);
        });
        scope.$on('acTable.page-change', function () {
          applyColumnClasses(element, scope.hide);
        });
        scope.$on('acTable.total-change', function () {
          applyColumnClasses(element, scope.hide);
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
      '</div>',
      scope: {
        limit: '=?',
        total: '=',
        onPaginate: '&',
        page: '=',
        label: '=?'
      },
      link: function (scope) {
        scope.limit = scope.limit || 10;
        scope.page = scope.page || 1;

        function calculateLastPage() {
          scope.lastPage = Math.ceil(scope.total / scope.limit);
          scope.pages = calculatePages(scope.page, scope.lastPage);
        }

        calculateLastPage();

        scope.label = scope.label || {page: 'Page', of: 'of', rowsPerPage: 'Rows per Page', showing: 'Showing'};

        scope.$watch('total', function () {
          $timeout(function () {
            calculateLastPage();
            calculateStartEnd();
            $timeout(function() {
              scope.$root.$broadcast('acTable.total-change');
            });
          });
        });

        scope.$watch('limit', function (newVal, oldVal) {
          if (newVal !== oldVal) {
            $timeout(function () {
              calculateLastPage();
              scope.onPaginate();
              calculateStartEnd();
            });
          }
        });

        scope.$watch('page', function () {
          $timeout(function () {
            calculateStartEnd();
            scope.pages = calculatePages(scope.page, scope.lastPage);
          });
        });

        function calculateStartEnd() {
          scope.start = Math.max(scope.page * scope.limit - scope.limit + 1, 0);
          scope.end = Math.min(scope.page * scope.limit, scope.total);
        }

        scope.goTo = function (page) {
          scope.page = page > scope.lastPage ? scope.lastPage : page < 1 ? 1 : page;
          $timeout(function () {
            scope.onPaginate();
            $timeout(function() {
              scope.$root.$broadcast('acTable.page-change');
            });
          });
        };

        scope.next = function () {
          scope.goTo(scope.page + 1);
        };

        scope.previous = function () {
          scope.goTo(scope.page - 1);
        };

        scope.first = function () {
          scope.goTo(1);
        };

        scope.last = function () {
          scope.goTo(scope.lastPage);
        };
      }
    };
  }]);
})();
