sap.ui.define([
	'jquery.sap.global',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/Filter',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Sorter',
	"sap/ui/model/FilterOperator"
], function (jQuery, Controller, Filter, JSONModel, Sorter, FilterOperator) {
	"use strict";

	return Controller.extend("grc.pc.rep.dashboard.controller.listdisplay", {
		oGlobalBusyDialog: new sap.m.BusyDialog(),

		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oGlobalBusyDialog.open();
			oRouter.getRoute("listdisplay").attachPatternMatched(this._routematched, this);
		},
		_routematched: function (oEvent) {
			var oInputs = JSON.parse(oEvent.getParameter("arguments").object);
			if (oInputs.intentName === "Report") {
				this._routedisplay(oInputs);
				this._setCriteriaInfo(oInputs);
			} else if (oInputs.intentName === "Sort") {
				var oTable = this.getView().byId("idasmt");
				var oItems = oTable.getBinding("items");
				var str = oInputs.column;
				var oBindingPath = this.oTableMeta.cols.filter(function (arr) {
					return arr.label.toLowerCase() === str.toLowerCase();
				})[0].field;
				var oSorter = new Sorter(oBindingPath, true);
				oItems.sort(oSorter);
			} else if (oInputs.intentName === "Activities") {
				this._routedisplay(oInputs);
				this._setCriteriaInfo(oInputs);
			}
		},
		_routedisplay: function (oInputs) {
			var that = this;
			var oModelParent = this.getOwnerComponent().getModel();
			var aFilters = [];
			if (oInputs.intentName === "Report") {
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "BEGDA/" + oInputs.Timeframe.Begda));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "ENDDA/" + oInputs.Timeframe.Endda));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "COUNT/" + oInputs.count));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "REPORT/" + oInputs.Report));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "MASTERDATA/" + oInputs.MasterData));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "REPORTNAME/" + oInputs.ReportName));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "OBJECT/" + oInputs.Object));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "RATING/" + oInputs.Rating));
			} else if (oInputs.intentName === "Activities") {
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "INTENT/" + oInputs.intentName));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "BEGDA/" + oInputs.Timeframe.Begda));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "ENDDA/" + oInputs.Timeframe.Endda));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "COUNT/" + oInputs.Count));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "ACTIVITY/" + oInputs.Activity));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "STATUS/" + oInputs.AsmtStatus));
			}
			oModelParent.read("/asmtratingsSet", {
				filters: aFilters,
				success: function (oData, response) {
					var oTableMeta = {
						cols: [],
						datan: []
					};
					oTableMeta.datan = oData.results;
					var colcnt = 0;
					var oTable = that.getView().byId("idasmt");
					var columnListItem = new sap.m.ColumnListItem();
					var oColVisible = oData.results[0];
					var akeys = Object.keys(oColVisible);
					akeys.splice(0, 1);
					for (var i = 0; i < akeys.length; i++) {
						if (oColVisible[akeys[i]] !== '') {

							oTableMeta.cols[colcnt] = {
								field: akeys[i],
								label: oColVisible[akeys[i]]
							};
							colcnt = colcnt + 1;
							if (akeys[i] === 'AssessmentTitle') {
								columnListItem.addCell(new sap.m.Link({
									text: "{" + akeys[i] + "}",
									target: "{Assessment}"
								}));
							} else {
								columnListItem.addCell(new sap.m.Text({
									text: "{" + akeys[i] + "}"
								}));
							}
						}
					}
					oTable.bindAggregation("columns", "/cols", new sap.m.Column({
						hAlign: "Center",
						header: new sap.m.Label({
							text: "{label}",
							class: "columnLabelStyle"
						})
					}));
					oTableMeta.datan.splice(0, 1);
					oTable.bindItems("/datan", columnListItem, null, null);
					var oModel = new sap.ui.model.json.JSONModel(oTableMeta);
					oTable.setModel(oModel);
					that.oGlobalBusyDialog.close();
					that.oTableMeta = oTableMeta;
				}

			});
		},
		onListenCommand: function (e) {
			var aControls = [];
			var oTable = this.getView().byId("idasmt");
			var aItems = oTable.getSelectedContextPaths();
			if (aItems.length !== 0) {
				for (var i = 0; i < aItems.length; i++) {
					var iIndex = oTable.getSelectedContextPaths()[i].split("/", 3)[2];
					aControls.push(this.oTableMeta.datan[iIndex].ControlId);
				}
			}
			sap.ui.getCore().getEventBus().publish(
				"RepDBChannel",
				"ListenEvent",
				aControls
			);
		},
		_setCriteriaInfo: function (oInputs) {
			var that = this;
			var oModelParent = this.getOwnerComponent().getModel();
			var aFilters = [];
			if (oInputs.intentName === "Report") {
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "BEGDA/" + oInputs.Timeframe.Begda));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "ENDDA/" + oInputs.Timeframe.Endda));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "COUNT/" + oInputs.count));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "REPORT/" + oInputs.Report));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "MASTERDATA/" + oInputs.MasterData));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "REPORTNAME/" + oInputs.ReportName));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "OBJECT/" + oInputs.Object));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "RATING/" + oInputs.Rating));
			} else if (oInputs.intentName === "Activities") {
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "INTENT/" + oInputs.intentName));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "BEGDA/" + oInputs.Timeframe.Begda));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "ENDDA/" + oInputs.Timeframe.Endda));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "COUNT/" + oInputs.Count));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "ACTIVITY/" + oInputs.Activity));
				aFilters.push(new sap.ui.model.Filter("filter", sap.ui.model.FilterOperator.EQ, "STATUS/" + oInputs.AsmtStatus));
			}
			oModelParent.read("/critinfoSet", {
				filters: aFilters,
				success: function (oData, response) {
					var oObjectHeader = that.getView().byId("idCritInfo");
					oObjectHeader.destroyAttributes();
					var oFields = Object.keys(oData.results[0]);
					oFields.splice(0, 1);
					for (var i = 0; i < oFields.length; i++) {
						if (oFields[i] === 'Records') {
							var oAttribute = new sap.m.ObjectAttribute({
								title: oData.results[0][oFields[i]],
								text: '100'
							});
						} else {
							oAttribute = new sap.m.ObjectAttribute({
								title: oData.results[0][oFields[i]],
								text: oData.results[1][oFields[i]]
							});
						}
						oObjectHeader.addAttribute(oAttribute);
					}

					that.oGlobalBusyDialog.close();
				}

			});
		},
		toggleCollapse: function (oEvent) {
			var oObjectHeader = this.getView().byId("idCritInfo");
			if (oEvent.getSource().getIcon() === "sap-icon://navigation-up-arrow") {
				oEvent.getSource().setIcon("sap-icon://navigation-down-arrow");
				oObjectHeader.setVisible(false);
			} else {
				oEvent.getSource().setIcon("sap-icon://navigation-up-arrow");
				oObjectHeader.setVisible(true);
			}
		}

	});

});