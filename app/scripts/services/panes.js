'use strict';

angular.module('authoringEnvironmentApp')
  .factory('panes', function () {
    // Service logic
    // ...

    var panes = [
        {name: "Topics", icon:'chat', template: 'views/pane-topics.html', position: 'left', active: false, selected: true}
    ];

    // Public API here
    return {
      query: function () {
        return panes;
      },
      active: function (Pane) {
//        panes.indexOf(Pane)
        Pane.active = !Pane.active;
      }
    };
  });
