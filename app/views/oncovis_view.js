var View = require('./view');
var template = require('./templates/oncovis');
require("../vis/oncovis");
require("../vis/oncovisSlider");

module.exports = View.extend({
    template:template,

    getRenderData:function () {
    },

    afterRender:function () {
        this.$el.addClass('row');
    },

    renderGraph:function () {
        console.log("renderGraph");
        var color_fn = function(val) {
            return "blank";
        };

        this.$el.find(".oncovis-container").oncovis(oncovisData.data, {
            bar_width:4,
            column_spacing:1,
            plot_width:3000,
            label_width:70,
            highlight_cls:"mutation",
            color_fn:color_fn,
            columns_by_cluster:oncovisData.columns_by_cluster,
            cluster_labels:oncovisData.cluster_labels,
            row_labels:oncovisData.row_labels
        });
    },

    _enableSliders: function() {
        this.$el.find(".slider_barheight").oncovis_range({ min: 10, max: 50, initialStep: 20, slide: visrangeFn("bar_height") });
        this.$el.find(".slider_rowspacing").oncovis_range({ min: 0, max: 50, initialStep: 10, slide: visrangeFn("row_spacing") });
        this.$el.find(".slider_barwidth").oncovis_range({ min: 1, max: 10, initialStep: 5, slide: visrangeFn("bar_width") });
        this.$el.find(".slider_barspacing").oncovis_range({ min: 0, max: 10, initialStep: 2, slide: visrangeFn("column_spacing") });
        this.$el.find(".slider_clusterspacing").oncovis_range({ min: 0, max: 50, initialStep: 10, slide: visrangeFn("cluster_spacing") });
        this.$el.find(".slider_fontsize").oncovis_range({ min: 5, max: 21, initialStep: 14, slide: visrangeFn("label_fontsize") });
    }

});
