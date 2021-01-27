sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("grc.pc.rep.dashboard.controller.graph", {

		oGlobalBusyDialog: new sap.m.BusyDialog(),
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oGlobalBusyDialog.open();
			oRouter.getRoute("graph").attachPatternMatched(this._routematched, this);
			var oVizFrame = this.getView().byId("idStackedChart");
			oVizFrame.setVizProperties({
				plotArea: {
					colorPalette: d3.scale.category20().range(),
					// colorPalette :  ["blue","green","red","grey"],
					dataLabel: {
						visible: true,
						showTotal: true
					}
				},
				tooltip: {
					visible: true
				},
				title: {
					text: "Control Activities"
				}
			});
			var oDataset = new sap.viz.ui5.data.FlattenedDataset({
				// dimensions: [{
				// 	name: "Control",
				// 	value: "{Control}"
				// }
				// ],

				measures: [{
					name: "Activities Performed",
					value: "{Act}"
				}, {
					name: "Adequate",
					value: "{Adequate}"
				}, {
					name: "Deficient",
					value: "{Deficient}"
				}, {
					name: "Open",
					value: "{Open}"
				}],

				data: {
					path: "/"
				}
			});
			oVizFrame.setDataset(oDataset);

			var oFeedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "valueAxis",
					"type": "Measure",
					"values": ["Activities Performed"]
				}),
				oFeedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "valueAxis",
					"type": "Measure",
					"values": ["Adequate"]
				}),
				oFeedValueAxis2 = new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "valueAxis",
					"type": "Measure",
					"values": ["Deficient"]
				}),
				oFeedValueAxis3 = new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "valueAxis",
					"type": "Measure",
					"values": ["Open"]
				});

			oVizFrame.addFeed(oFeedValueAxis);
			oVizFrame.addFeed(oFeedValueAxis1);
			oVizFrame.addFeed(oFeedValueAxis2);
			oVizFrame.addFeed(oFeedValueAxis3);

		},

		handleBack: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("selection");
		},
		_routematched: function (oEvent) {
			var that = this;
			var oInputs = JSON.parse(oEvent.getParameter("arguments").object);
			var aFilters = [];
			var oVizFrame = that.getView().byId("idStackedChart");
			var aFeeds = oVizFrame.getFeeds();
			if (aFeeds.length > 3) {
				for (var i = 0; i < aFeeds.length; i++) {
					var aValues = aFeeds[i].getValues();
					if (aValues[0] === "Control") {
						oVizFrame.removeFeed(aFeeds[i]);
					} else if (aValues[0] === "Organization") {
						oVizFrame.removeFeed(aFeeds[i]);
					}
				}
			}
			aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "TF/" + "0SAPY_YEAR" )); //oInputs.tf
			aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "YEAR/" + "2018")); //oInputs.tfyear
			aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "ACTVT/" + "1"));
			aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "SEL/" + "1"));
			for (i=0; i<oInputs.ctrl.length ; i++){
			aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "CTRL/" + oInputs.ctrl[i]));
			}
			var oDset = oVizFrame.getDataset();
			oDset.destroyDimensions();
			oDset.removeAllDimensions();
			oDset.addDimension(new sap.viz.ui5.data.DimensionDefinition({
				name: "Control",
				value: "{Control}"
			}));

			var oFeedOrg = new sap.viz.ui5.controls.common.feeds.FeedItem({
				"uid": "categoryAxis",
				"type": "Dimension",
				"values": ["Control"]
			});
			oVizFrame.addFeed(oFeedOrg);

			var oDataset = oVizFrame.getDataset();
			var oDimensions = oDataset.getDimensions();
			if (oDimensions.length === 1) {
				oDataset.addDimension(new sap.viz.ui5.data.DimensionDefinition({
					name: "Category",
					value: "{Category}"
				}));

				var oFeedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "categoryAxis",
					"type": "Dimension",
					"values": ["Category"]
				});
				oVizFrame.addFeed(oFeedCategoryAxis);
			}

			var oModelParent = this.getOwnerComponent().getModel();
			var oModel = new sap.ui.model.json.JSONModel();
			oModelParent.read("/controlactivitiesSet", {
				filters: aFilters,
				success: function (oData, response) {
					oModel.setData(oData.results);
					oVizFrame.setModel(oModel);
					that.oGlobalBusyDialog.close();
				}

			});

		},
		onListenCommand: function(e){
				
				sap.ui.getCore().getEventBus().publish(
			        "RepDBChannel",
			        "ListenEvent"
			    );
			}
	});

});