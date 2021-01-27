sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History"
], function (Controller, History) {
	"use strict";

	return Controller.extend("grc.pc.rep.dashboard.controller.main", {
		onInit: function (evt) {
			this.getView().byId("idMic").setVisible(false);
			this.getView().byId("chatbox-bkChatButton").setVisible(false);
			sap.ui.getCore().getEventBus().subscribe(
				"RepDBChannel",
				"ListenEvent",
				this.onListenCommand,
				this
			);
		},
		onBeforeRendering: function () {
			var that = this;
			var oModelParent = this.getOwnerComponent().getModel();
			oModelParent.read("/repdashboardSet", {
				success: function (oData, response) {
					var oModel = new sap.ui.model.json.JSONModel();
					oModel.setData(oData.results);
					that.getView().setModel(oModel);
				}
			});
		},
		handlePress: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext().getPath();
			var sUrl = oEvent.getSource().getBindingContext().getModel().getProperty(sPath).absurl;
			window.open(sUrl);
		},
		onMicToggle: function (oEvent) {
			var sState = oEvent.getParameter("state");
			if(sState === true){
				this.getView().byId("idMic").setVisible(true);
				this.getView().byId("chatbox-bkChatButton").setVisible(true);//chatbox
			} else
			{
				this.getView().byId("idMic").setVisible(false);
				this.getView().byId("chatbox-bkChatButton").setVisible(false);//chatbox
			}
		},

		onListenCommand: function (schannel, sevent, data) {
			if (this.recognition) {
				this.stoprecognition();
			} else {
				this.startrecognition(data);
			}
		},

		startrecognition: function (data) {
			var that = this;
			/*global webkitSpeechRecognition*/
			/*eslint no-undef: "error"*/
			this.recognition = new webkitSpeechRecognition();
			this.recognition.onstart = function (event) {};
			this.recognition.onresult = function (event) {
				var text = "";
				for (var i = event.resultIndex; i < event.results.length; ++i) {
					text += event.results[i][0].transcript;
				}
				that.str = text;
				that.stoprecognition();
				that.send(data);
			};
			this.recognition.onend = function () {
				that.stoprecognition();
			};
			this.recognition.lang = "en-US";
			this.recognition.start();
		},

		stoprecognition: function () {
			if (this.recognition) {
				this.recognition.stop();
				this.recognition = null;
			}

		},

		send: function (oData) {
			var accessToken = "7dcaaa8821404a73a4141462c21523cd";
			var baseUrl = "https" + "://api.api.ai/v1/";
			var text = this.str;
			var that = this;
			$.ajax({
				type: "POST",
				url: baseUrl + "query?v=20150910",
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				headers: {
					"Authorization": "Bearer " + accessToken
				},
				data: JSON.stringify({
					query: text,
					lang: "en",
					sessionId: "somerandomthing"
				}),
				success: function (data) {
					var msg = new SpeechSynthesisUtterance();
					var voices = window.speechSynthesis.getVoices();
					msg.voice = voices[0]; 
					msg.voiceURI = "native";
					msg.volume = 1; // 0 to 1
					msg.rate = 1; // 0.1 to 10
					msg.pitch = 2; //0 to 2
					msg.text = data.result.fulfillment.speech;
					msg.lang = "en-US";
					speechSynthesis.speak(msg);
					that._setAction(data.result, oData);
				},
				error: function () {

				}
			});
		},

		_setAction: function (data, oData,inpType) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			this.params = {};
			var sUrl;
			var object;
			if (data.actionIncomplete === false) {
				if (data.metadata.intentName === "Report") {
					this.params.intentName = data.metadata.intentName;
					this.params.count = data.parameters["Count"];
					this.params.MasterData = data.parameters["MasterData"][0];
					this.params.Rating = data.parameters["Rating"];
					this.params.Report = data.parameters["Report"];
					this.params.ReportName = data.parameters["any"];
					this.params.Timeframe = this._formatTf(data.parameters["date-period"]);
					this.params.Object = data.parameters["ObjectName"];
					object = JSON.stringify(this.params);
					if(inpType === "chat"){
						return "#/listdisplay/"+encodeURIComponent(object);
					}
					else { 
						oRouter.navTo("listdisplay", {
					 	object: object
					 });
						
					}
				} else if (data.metadata.intentName === "Navigation") {
					if (data.parameters.NavBack === "X") {
						if (sPreviousHash !== undefined) {
							window.history.go(-1);
						} else {
							oRouter.navTo("Routemain", true);
						}
					} else {
						oRouter.navTo("Routemain");
					}
				} else if (data.metadata.intentName === "Sort") {
					this.params.intentName = data.metadata.intentName;
					this.params.column = data.parameters["any"][0];
					this.params.order = data.parameters["SortType"];
					object = JSON.stringify(this.params);
					oRouter.navTo("listdisplay", {
						object: object
					});
				} else if (data.metadata.intentName === "Graph") {
					this.params.intentName = data.metadata.intentName;
					this.params.ctrl = oData;
					object = JSON.stringify(this.params);
					oRouter.navTo("graph", {
						object: object
					});
				} else if (data.metadata.intentName === "Email"){
					var oModelParent = this.getOwnerComponent().getModel();
						oModelParent.read("/sendemailSet", {
							success: function (oData1, response) {
								
							}
						});
				} else if (data.metadata.intentName === "Activities"){
					this.params.intentName = data.metadata.intentName;
					this.params.Activity = data.parameters["Activity"];
					this.params.AsmtStatus = data.parameters["AssessmentStatus"];
					this.params.Count    = data.parameters["Count"];
					this.params.Timeframe = this._formatTf(data.parameters["date-period"]);
					object = JSON.stringify(this.params);
					oRouter.navTo("listdisplay", {
						object: object
					});
				} else if (data.metadata.intentName === "MasterData"){
					sUrl = "https:" + "//ldcigxd.wdf.sap.corp:44300/sap/bc/webdynpro/sap/grpc_base_oif?" +
							"sap-client=100&sap-language=EN&mode=D&object_id=CONTROL/L/50005865&tf_year=2018&timeframe=0SAPY_YEAR#";
				}
				
			}
			return sUrl;
		},
		_formatTf: function(sDatePeriod){
			sDatePeriod = sDatePeriod.replace("/", " ");
			sDatePeriod = sDatePeriod.replace(/\-/g, '');
			var aDates = sDatePeriod.split(" ");
			var oObj = {};
			oObj.Begda = aDates[0];
			oObj.Endda = aDates[1];
			return oObj;
		},
		onSendPressed: function(oEvent){
			
			var chatbot = this.getView().byId("chatbox");
			var question = oEvent.getParameter("text");
			var that = this;
			$.ajax({
					type: "POST",
					url: "https" + "://api.api.ai/v1/" + "query?v=20150910",
					contentType: "application/json; charset=utf-8",
					data: JSON.stringify({ query: question, lang: "en", sessionId: "somerandomthing" }),
					dataType: "json",
					headers: {
						"Authorization": "Bearer " + "7dcaaa8821404a73a4141462c21523cd"
					},
					success: function (data) {
						var sUrl = that._setAction(data.result,null,"chat");
						if(sUrl){
						data.result.fulfillment.speech = data.result.fulfillment.speech +
														 "<br>Click" +
														 "<a href=" + sUrl +"> here </a> to View";}
						chatbot.addChatItem(data.result.fulfillment.speech, false);
					},
					error: function (data) {
						
					}
				});
			
		}
		
	});
});