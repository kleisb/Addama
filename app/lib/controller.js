var Model = require('../models/model');
var JSONModel = require("../models/model_json");
var TableModel = require("../models/model_catalog");
var GraphModel = require('../models/graph');
var FeatureListModel = require('../models/featureList');
var MutationsModel = require('../models/mutations');
var GenomicFeatureListModel = require('../models/genomic_featureList');
var FeatureMatrix2Model = require('../models/featureMatrix2');
var FeatureMatrixModel = require('../models/featureMatrix');

var DataMenuView = require("../views/data_menu");
var MenuItemsView = require("../views/menu_items");

var VisViewClasses = {
    "graph": require("../views/graph_view"),
    "grid": require("../views/grid_view"),
    "circ": require("../views/circ_view"),
    "heat": require("../views/oncovis_view"),
    "twoD": null,
    "kde": null,
    "parcoords": require("../views/parcoords_view")
};

Controller = {
    loadQED:function () {
        var qedConfigModel = new JSONModel({ url:"svc/data/lookups/qed_configuration.json" });
        qedConfigModel.on("load", function() {
            var title = qedConfigModel.get("title");
            if (title) {
                document.title = title;
                $(".titled").html(title);
            }
        });
        qedConfigModel.standard_fetch();

        var featureLabelModel = new TableModel({ url:"svc/data/lookups/feature_labels" });
        featureLabelModel.on("load", function() {
            qed.labels = featureLabelModel.get("itemsById");
        });
        featureLabelModel.standard_fetch();

        Controller.ChromosomeModel = new TableModel({ url:"svc/data/lookups/chromosomes" });
        Controller.ChromosomeModel.on("load", function() { Controller.ChromosomeModel.isReady = true; });
        Controller.ChromosomeModel.standard_fetch();
    },

    testwindow:{
        view:function () {
            var WinView = require('../views/window_view');
            var winView = new WinView();
            $('#mainDiv').html(winView.render().el);
        }
    },

    grid:{
        view:function () {
            var GridView = require('../views/grid_view');
            var gridView = new GridView();
            $('#mainDiv').html(gridView.render().el);
            gridView.renderGrid();
        }
    },

    app:{
        layout:function () {
            var TopNavBar = require('../views/topbar_view');
            var topnavbar = new TopNavBar();
            $('#navigation-container').append(topnavbar.render().el);

            var CloudStorageView = require("../views/cloud_storage_view");
            var csview = new CloudStorageView({ $navbar:$('#navigation-container') });
            $(document.body).append(csview.render().el);

            var dmModel = new TableModel({ url:"svc/data/analysis/feature_matrices/CATALOG" });

            var gridItems = new DataMenuView({ "data_prefix":"#feature_matrices", "data_suffix":"grid", "model":dmModel });
            var heatItems = new DataMenuView({ "data_prefix":"#feature_matrices", "data_suffix":"heat", "model":dmModel });

            $(".open-in-grid").html(gridItems.render().el);
            $(".open-in-heat").html(heatItems.render().el);

            dmModel.standard_fetch();
        }
    },

    graph:{
        view:function () {
            var GraphView = require('../views/graph_view');
            var graphView = new GraphView();
            $('#mainDiv').html(graphView.render().el);
        }
    },

    pwpv:{
        view:function () {
            var PwPvView = require('../views/pwpv_view');
            var pwpvView = new PwPvView();
            $('#mainDiv').html(pwpvView.render().el);
            pwpvView.renderGraph();
        }
    },

    twod:{
        view:function (label1, label2) {
            var TwoD = require('../views/2D_Distribution_view');
            var FL = require('../models/featureList');
            var fl = new FL({
                websvc:'/endpoints/filter_by_id?filepath=%2Ffeature_matrices%2F2012_09_18_0835__cons&IDs=',
                feature_list:[label1, label2]
            });
            var twoDView = new TwoD({collection:fl});
            fl.fetch();
            $('#mainDiv').html(twoDView.render().el);
        }
    },

    oncovis:{
        view:function () {
            var Oncovis = require('../views/oncovis_view');
            var oncovisView = new Oncovis();
            $('#mainDiv').html(oncovisView.render().el);
        }
    },

    home:{
        view:function () {
            var HomeView = require('../views/home_view');
            var homeView = new HomeView();
            $('#mainDiv').html(homeView.render().el);
        }
    },

    route_analysis:function (analysis_type, dataset_id, remainder) {

        var arg_array = remainder.length ? remainder.split('/') : [],
            len = arg_array.length,
            features = arg_array.slice(0, len - 1),
            view_name = '';

        if (len > 0) { //if there's param (even an empty one)
            view_name = arg_array[len - 1];
        }

        //graph based analysis
        if (_(['rf-ace', 'mds', 'pairwise']).contains(analysis_type)) {
            if (len <= 2) {  // 1 or no parameters.  just draw vis of analysis
                return Controller.ModelAndView(view_name || 'graph', GraphModel, {analysis_id:analysis_type, dataset_id:dataset_id});
            }

            return Controller.ModelAndView(view_name, FeatureListModel, {analysis_id:analysis_type, dataset_id:dataset_id, features:features});
        }

        if (analysis_type === 'mutations') {
            return Controller.ModelAndView(view_name, MutationsModel, {analysis_id:analysis_type, dataset_id:dataset_id });
        }

        if (analysis_type === 'information_gain') {
            return Controller.ModelAndView(view_name, GenomicFeatureListModel, {analysis_id:analysis_type, dataset_id:dataset_id });
        }

        //tabular data like /feature_matrices
        if (view_name == 'heat') {
            var oncovisView = Controller.ModelAndView(view_name, FeatureMatrix2Model, {analysis_id:analysis_type, dataset_id:dataset_id }, {dataset_id:dataset_id });
            Controller.InitGeneListViews(oncovisView);
            return oncovisView;
        }

        return Controller.ModelAndView(view_name, FeatureMatrixModel, {analysis_id:analysis_type, dataset_id:dataset_id, features:features});
    },

    ModelAndView:function (view_name, ModelClass, model_optns, view_optns) {
        var model = new ModelClass(model_optns);
        try {
            var ViewClass = VisViewClasses[view_name];
            var view = new ViewClass(_.extend(view_optns || {}, { "model":model, "chromosomes": Controller.ChromosomeModel }));
            $('#mainDiv').html(view.render().el);
            return view;
        } finally {
            var loadModelChain = _.once(function() {
                model.fetch({
                    success:function () {
                        model.make_copy(ModelClass, model_optns);
                        model.trigger('load');
                    }
                });
            });
            if (Controller.ChromosomeModel.isReady) {
                loadModelChain();
            } else {
                Controller.ChromosomeModel.on("load", loadModelChain);
            }
        }
    },

    InitGeneListViews:function (dataView) {
        var ProfiledModel = require("../models/genelist_profiled");
        var profiledModel = new ProfiledModel();
        profiledModel.standard_fetch();

        var CustomModel = require("../models/genelist_custom");
        var customModel = new CustomModel();
        customModel.standard_fetch();

        var profiledView = new MenuItemsView({ model:profiledModel, selectEvent:"genelist-selected" });
        $(".genelist-profiled").html(profiledView.render().el);

        var customView = new MenuItemsView({ model:customModel, selectEvent:"genelist-selected" });
        $(".genelist-custom").html(customView.render().el);

        var ManageGLView = require("../views/genelist_manage");
        var manageGLView = new ManageGLView({ model:customModel });
        $('.genelist-modal').html(manageGLView.render().el);

        return _.map([profiledView, customView, manageGLView], function (v) {
            if (dataView.onNewRows) v.on("genelist-selected", dataView.onNewRows);
        });
    }
};

module.exports = Controller;

Controller.loadQED();