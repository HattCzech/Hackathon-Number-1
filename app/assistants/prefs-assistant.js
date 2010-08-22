function PrefsAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */

	// for the secret thing
	this.easterEggString = '';
	this.easterEggSecret = 'WOR';
}

PrefsAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
	this.controller.get('appOptionsTitle').innerHTML = $L("Display Settings");
		
	this.controller.get('accountOptionsTitle').innerHTML = $L("Account Settings");
	this.controller.get('AccountId').innerHTML = $L("Username:") + " " + Relego.prefs.username;

	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	/* setup widgets here */
	
	this.controller.setupWidget("EditAccountButtonId", 
		this.accountButtonAttributes = {}, 
		this.accountButtonModel = {
			buttonLabel : $L('Edit Account Settings'),        
			buttonClass : '',        
			disabled : false        
		});

	this.controller.setupWidget('themeSelectorId', {
			labelPlacement: Mojo.Widget.labelPlacementLeft,
			label: $L("Theme")
		},
		this.themeSelectorModel = {
			value: Relego.prefs.theme,
			disabled: false,
			choices: [
				{label: $L("Dark"), value: "dark"},
				{label: $L("Light"), value: "light"}
			]
		}
	);
	
	this.controller.setupWidget('openSelectorId', {
			labelPlacement: Mojo.Widget.labelPlacementLeft,
			label: $L("Open with")
		},
		this.openSelectorModel = {
			value: Relego.prefs.open,
			choices: [
				{label: $L("Unread"), value: "unread"},
				{label: $L("Read"), value: "read"},
				{label: $L("All"), value: "all"}
			]
		}
	);
	
	this.toggleAttributes = {
		trueLabel: $L('Yes'),
		falseLabel: $L('No')
	};

	// Add allow Landscape toggle
	this.controller.setupWidget('allowRotateToggleId',
		this.toggleAttributes,
		this.allowRotateModel = {
			value: Relego.prefs.allowRotate,
			disabled: false			
		});
	this.controller.get('allowRotateLabel').innerHTML = $L("Allow Landscape");
	
	/* add event handlers to listen to events from widgets */
	
	// for the secret thing
	// this.controller.get('easterEggImage').style.display = 'none';
	this.keyPressHandler = this.keyPress.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.sceneElement, Mojo.Event.keypress, this.keyPressHandler);
	this.editAccountHandler = this.editAccount.bind(this);
	this.controller.listen('EditAccountButtonId', Mojo.Event.tap, this.editAccountHandler);

};

PrefsAssistant.prototype.editAccount = function (event) {
	//Mojo.Log.info('Going to accounts scene');
	this.controller.stageController.pushScene('auth');
};

PrefsAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

PrefsAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */

	// Store preferences in global prefs object
	Relego.prefs.allowRotate = this.allowRotateModel.value;
	Relego.prefs.theme = this.themeSelectorModel.value;
	Relego.prefs.open = this.openSelectorModel.value;
	
	// Save global prefs object to cookie.
	Relego.prefsCookie = new Mojo.Model.Cookie(Mojo.appInfo.title + ".prefs");
	Relego.prefsCookie.put(Relego.prefs);
	
};

PrefsAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */

	// for the secret thing
	Mojo.Event.stopListening(this.controller.sceneElement, Mojo.Event.keypress, this.keyPressHandler);
};

PrefsAssistant.prototype.keyPress = function(event) {
	// for the secret thing
	var currentChar = event.originalEvent.charCode;

	this.easterEggString += String.fromCharCode(currentChar);
	
	if (currentChar == 8) {
		this.easterEggString = '';
		this.controller.get('easterEggImage').removeClassName('show');
		// this.controller.get('easterEggImage').style.display = 'none';
	}

	if (this.easterEggString.length == this.easterEggSecret.length) {
		if (this.easterEggString === this.easterEggSecret) {
			Mojo.Log.info("Hooray! Easter Egg!");
			// this.controller.get('easterEggImage').style.display = '';
			this.controller.get('easterEggImage').addClassName('show');
			this.easterEggString = '';
		}
	} else if (this.easterEggString.length > this.easterEggSecret.length) {
		this.easterEggString = '';
		this.controller.get('easterEggImage').removeClassName('show');
	}

};
