Relego = {};

/* Added DB helper stuff from webOS101 - should be in stage controller*/
/*var dbColumn = Relego.db.dbColumn;
var dbTable = Relego.db.dbTable;
var dbInstance = Relego.db.dbInstance;*/

//--> Our Stages
Relego.MainStageName			 	= "Stage";					//--> Our main stage (where we perform, duh!)
Relego.DashboardStageName			= "Dashboard";				//--> Our dashboard stage (where the bobbleheads go, duh!)
Relego.Stage						= null;

//--> Default Values
Relego.Database				 		= null;						//--> Our database

Relego.prefs = {
    email: "none entered",
    password: "",
    allowRotate: false
};

function AppAssistant(appController){
}
AppAssistant.prototype.setup = function(){
	//this.handleLaunch();
	//Relego.Database = dbInstance({'name': Relego.db.info.name}, {'version': Relego.db.info.version}); // this needs to be run in the stage controller
	Relego.Metrix = new Metrix();
	this.getPrefs();
}

//  -------------------------------------------------------
//  handleLaunch - called by the framework when the application is asked to launch
AppAssistant.prototype.handleLaunch = function(launchParams){
	Mojo.Log.error("*** --> handleLaunch Called");
	var cardStageController = this.controller.getStageController(Relego.MainStageName);
	var appController = Mojo.Controller.getAppController();
	Relego.Stage = cardStageController;
	
	try{
		if (!launchParams)  {
			//---------------------------------------------------------
			// FIRST LAUNCH
			//---------------------------------------------------------
				if (cardStageController) {
					Mojo.Log.error("*** --> cardStageController = TRUE. Launch Main");
					// If it exists, just bring it to the front by focusing its window.
					cardStageController.popScenesTo("main");    
					cardStageController.activate();
				}else{
					Mojo.Log.error("*** --> cardStageController = FALSE. Launch Main");
					// Create a callback function to set up the new main stage once it is done loading. It is passed the new stage controller as the first parameter.
					var pushMainScene = function(stageController) {
						stageController.pushScene("main");
					}
					
					var stageArguments = {name: Relego.MainStageName, lightweight: false};
					this.controller.createStageWithCallback(stageArguments, pushMainScene.bind(this), "card");
				}
		}else{
			Mojo.Log.error("*** --> handleLaunch Called w/ Params: " + launchParams.action);
			switch (launchParams.action){
				
				case "addtorelego":
					//--> This should auto save the passed along option
					//--> What params do we need?
					
					Mojo.Log.error("*** --> Added to Relogo");
					break;
			}
		}
	}catch(e){
		Mojo.Log.error("handleLaunch Error: " + e);
	}
}

// -----------------------------------------
// handleCommand - called to handle app menu selections
AppAssistant.prototype.handleCommand = function(event){
    var stageController = this.controller.getActiveStageController();
    var currentScene = stageController.activeScene();
    if(event.type == Mojo.Event.command) {
        switch(event.command) {
			case "help":
				stageController.pushScene("help");
				break;
        	case "about":
				stageController.pushScene("about");
				break;
		case "prefs":
				stageController.pushScene("prefs");
				break;

        }
    }
}


// -----------------------------------------
// getPrefs - called to store handle to prefsCookie and
// load prefs to global prefs object

AppAssistant.prototype.getPrefs = function () {
	Relego.prefsCookie = new Mojo.Model.Cookie(Mojo.appInfo.title + ".prefs");
	var args = Relego.prefsCookie.get();
	if (args) {
		//Mojo.Log.info("Preferences retrieved from Cookie");
		for (value in args) {
			Relego.prefs[value] = args[value];
		}
	}
	else {
		//Mojo.Log.info("PREFS LOAD FAILURE!!!");
	}
	//Mojo.Log.info("Prefs: %j", Relego.prefs);
};
