sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("grc.pc.rep.dashboard.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			var i18nModel = new sap.ui.model.resource.ResourceModel({
        	bundleUrl :  "i18n/i18n.properties"
		      });
		      this.setModel(i18nModel, "i18n");
			// enable routing
			this.getRouter().initialize();
			
			// Create and set domain model to the component
		      var sServiceUrl = "/sap/opu/odata/sap/GRPC_REP_DAB_SRV";
		      // var oModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, true);
		      var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
		      this.setModel(oModel);
			// set the device model
			//this.setModel(models.createDeviceModel(), "device");
		}
	});
});