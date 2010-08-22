function AuthAssistant () {
}

AuthAssistant.prototype = {
  spinnerModel: {
    spinning: false
  },

  checkbox: {
    value: false
  },

  button: {
    label: "Log In"
  },

  setup: function () {

    this.controller.get('authTitle').update($L('Relego for webOS'));
    this.controller.get('authDesc').update($L('This is a quick description of Relego'));
    this.controller.get('authBody').update($L('Login or Create a new account'));
    this.controller.get('userNameTitle').update($L('Username'));
    this.controller.get('passwordTitle').update($L('Password'));
    
    this.usernameModel = {
      hintText: $L('Username'),
      multiline: false,
      disabledProperty: 'disabled',
      focus: true,
      changeOnKeyPress: true,
	  textCase: Mojo.Widget.steModeLowerCase
    };

    this.passwordModel = {
      hintText: $L('Password'),
      multiline:    false,
      disabledProperty: 'disabled',
      changeOnKeyPress: true
    };

    // username field
    this.controller.setupWidget('username', this.usernameModel, null);

    // password field
    this.controller.setupWidget('password', this.passwordModel, null);

    // create new account checkbox
    this.controller.setupWidget("new", null, this.checkbox);

    // setup the scrim
    this.controller.setupWidget('mojoSpinner', { spinnerSize: 'large' }, this.spinnerModel);
    this.controller.get('spinnerScrim').hide();

    // setting up the login button
    this.controller.setupWidget("authBtn", null, this.button);

    // listener for the button and checkbox
    Mojo.Event.listen(this.controller.get('authBtn'), Mojo.Event.tap, this.authenticate.bind(this));
    Mojo.Event.listen(this.controller.get("new"), Mojo.Event.propertyChange, this.changeBtn.bind(this));
  },

  activate: function (event) {

  },

  deactivate: function (event) {

  },

  cleanup: function (event) {
    // stop the listener
    // Mojo.Event.stopListening(this.controller.get('authBtn'), Mojo.Event.tap, this.authenticate.bind(this));
  },

  changeBtn: function (event) {
    this.button.label = event.value ? "Create Account" : "Log In";
    this.controller.modelChanged(this.button);
  },

  authenticate: function () {
    this.controller.get('spinnerScrim').show();
    this.spinnerModel.spinning = true;
    this.controller.modelChanged(this.spinnerModel);

    // creating new user object
    // Josh: Is this saved anywhere?
    this.user = new User({
      username: this.controller.get('username').mojo.getValue(),
      password: this.controller.get('password').mojo.getValue()
    });

    // setup the service/library - now in app assistant
  //  API.setService(API.SERVICE_READ_IT_LATER);

    // logging the user in
    if (this.checkbox.value === false) {
      API.verifyAccount(this.user, this.authSuccess.bind(this), this.authFail.bind(this));

    // creating a new account
    } else if (this.checkbox.value === true) {
      API.createAccount(this.user, this.registerSuccess.bind(this), this.registerFail.bind(this));
    }

  },

  authSuccess: function () {
  	Relego.prefs.username = this.user.username;
	Relego.prefs.password = this.user.password;
	Relego.prefsCookie = new Mojo.Model.Cookie(Mojo.appInfo.title + ".prefs");
    Relego.prefsCookie.put(Relego.prefs);
    this.controller.stageController.swapScene("main");
  },

  authFail: function (code, message, description) {
    
    // login unsuccessful (password or username incorrect)
    if (code === "401") {
      this.controller.showErrorDialog($L("You've provided an incorrect username or password. Please try again."));
    }

  },

  registerSuccess: function () {
  	Relego.prefs.username = this.user.username;
	Relego.prefs.password = this.user.password;
	Relego.prefsCookie = new Mojo.Model.Cookie(Mojo.appInfo.title + ".prefs");
    Relego.prefsCookie.put(Relego.prefs);
    this.controller.stageController.swapScene("main");
  },

  registerFail: function (code, message, description) {

    // the username is already taken
    if (code === "401") {
      this.controller.showErrorDialog($L("This username is already taken. Please try again."));
    }

    this.spinnerModel.spinning = false;
    this.controller.modelChanged(this.spinnerModel);
    this.controller.get('spinnerScrim').hide();
  }

};
