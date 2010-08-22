function MainAssistant() {}

MainAssistant.prototype.allItems = [];
MainAssistant.prototype.currentState = (Relego.prefs.open == 'unread')?0:1;


MainAssistant.prototype.setup = function()
{

		this.controller.get('main_title').update($L("Articles"));
		
		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {
			items: [Mojo.Menu.prefsItem, Mojo.Menu.helpItem]
		});
		
		this.controller.setupWidget("article-list", {
			itemTemplate: "main/relegoRowTemplate",
			reorderable: false,
			filterFunction: this.filterArticles.bind(this),
			formatters: {
//				toggleText: function(v, m) { if(m.state === 1){ m.toggleText = "Unread"; else m.toggleText = "Read";} }
				unread: function(v, m) { if (m.readStatus === 0) {
					m.unread = "unread";
				}}
			}
		}, this.articleModel = {});
		
		// Filter
		this.filterViewsHandler = this.filterViews.bind(this);
		this.controller.listen(this.controller.get("filterView"), Mojo.Event.tap, this.filterViewsHandler);
		this.chosen = Relego.prefs.open; //'unread'; //preference;
		this.currentState = (Relego.prefs.open == 'all')?undefined:this.currentState;
		this.controller.get("currentFilterView").update($L(this.chosen));
		
		this.listTap = this.listTap.bindAsEventListener(this);
		this.controller.listen("article-list", Mojo.Event.listTap, this.listTap);
		
		this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, 
			{	visible: true, 
				items: [
					{icon: 'new', command: 'addBookmark', disabled: false},
					{icon: 'refresh', command: 'refreshBookmarks', disabled: false}
				]
			}
		);
		
		this.controller.setupWidget(Mojo.Menu.appMenu, {
				omitDefaultItems: true
			},
			{
				visible: true,
				items: [
					Mojo.Menu.editItem,
					{label: $L('Preferences & Accounts') + "...", command: 'prefs', disabled: false},
					Mojo.Menu.helpItem
				]
			}
		);
		
		API.getAllBookmarks(this.setArticles.bind(this), function(err) {
			// TODO: Replace console.log with proper error handling
			console.log("error: "+Object.toJSON(err));
		});
	};
	
MainAssistant.prototype.activate = function (event) {
	//Mojo.Log.info("Rotate:", Relego.prefs.allowRotate);
	if (Relego.prefs.allowRotate) {
		this.controller.stageController.setWindowOrientation("free");
		//Mojo.Log.info("Rotate FREE!");
	}
	else {
		this.controller.stageController.setWindowOrientation("up");
		//Mojo.Log.info("Rotate UP!");
	}
	
};

MainAssistant.prototype.cleanup = function() {
	this.controller.stopListening("article-list", Mojo.Event.listTap, this.listTap);
};

MainAssistant.prototype.filterViews = function(event) {
	var filterItems = [
		{label: $L("All"), command: 'all'},
		{label: $L("Unread"), command: 'unread'},
		{label: $L("Read"), command: 'read'}
	];
	for(var i = 0; i < filterItems.length; i++){
		if(filterItems[i].command == this.chosen){
			filterItems[i].chosen = true;
			break;
		}
	}
	this.controller.popupSubmenu({
		onChoose: function(value){
			if(value != undefined)
			{
				// TODO: This is wrong!  For translation we must use the label
				this.controller.get("currentFilterView").innerHTML = value;
				this.chosen = value;
			}
			switch(value){
				case 'unread':
					this.showItems(0);
					break;
				case 'read':
					this.showItems(1);
					break;
				case 'all':
					this.showItems();
					break;
			}
		},
		placeNear: this.controller.get("currentFilterView"),
		items: filterItems
	});
}

MainAssistant.prototype.handleCommand = function(event) {
    if (event.type === Mojo.Event.command) {
        switch (event.command) {
            case "addBookmark":
				var dialogModel={
					template: 'main/add-bookmark-dialog',
					assistant: new AddBookmarkAssistant(this, this.showItems.bind(this)),
					preventCancel: false
				};
				this.controller.showDialog(dialogModel);
			break;
			
			case "refreshBookmarks":
				API.getAllBookmarks(this.setArticles.bind(this), function(err) {
					console.log("error: "+ Object.toJSON(err));
				});
			break;
			
			
        }
    }
};
	
MainAssistant.prototype.setArticles = function(articles) {
	console.log("new articles: "+ Object.toJSON(articles));
	this.allItems = articles;
	this.showItems(this.currentState);
};
	
MainAssistant.prototype.showItems = function(state) {
	if(state)
		this.currentState = state;
		
	var filtered = state == undefined ? this.allItems : this.allItems.findAll(function(i) { return i.readStatus == state; });
	this.articleModel.items = filtered;
	//this.controller.modelChanged(this.articleModel, this);
	this.controller.get("article-list").mojo.setLengthAndInvalidate(this.articleModel.items.length);
};

MainAssistant.prototype.filterArticles = function(filterString, listWidget, offset, count)
{
	filterString = filterString.toLowerCase();
	var results = [];
	var totalResultsSize = 0;
	var items = this.articleModel.items;
	for (var i = 0; i < items.length; i++) {
		if (items[i].title.toLowerCase().indexOf(filterString) != -1 || items[i].url.toLowerCase().indexOf(filterString) != -1) {
			if (results.length < count && totalResultsSize >= offset) {
				results.push(items[i]);
			}
			totalResultsSize++;
		}
	}
	listWidget.mojo.noticeUpdatedItems(offset, results);
	listWidget.mojo.setLength(totalResultsSize);
	listWidget.mojo.setCount(totalResultsSize);
}; 

MainAssistant.prototype.listTap = function(event)
{
	var launchParams = {
        id: "com.palm.app.browser",
        params: {'target': event.item.url}
    };
 
    this.controller.serviceRequest('palm://com.palm.applicationManager',
    {
        method: 'open',
        parameters: launchParams
    });

	API.markBookmarkRead(event.item, onSuccess.bind(this), function(){});
	function onSuccess(){
		API.getAllBookmarks(this.setArticles.bind(this), function(err) {
			console.log("error: "+err);
		});
	}
	// launch read scene
}; 

MainAssistant.prototype.addBookmark = function(url) {
	API.addBookmark(url);
};

var AddBookmarkAssistant = Class.create({
	initialize: function(ass, callBackFunc) {
		this.callBackFunc = callBackFunc;
		this.assistant = ass;
		this.controller = ass.controller;
	},
	
	setup: function(widget) {
		this.widget = widget;
		
		this.controller.setupWidget("titleField", {hintText: "Title"}, this.titleModel = { value: ""});
		this.controller.setupWidget("urlField", {hintText: "URL", hintText: 'enter url...', modelProperty: "originalValue"}, this.urlModel = { value: "", originalValue: "http://"});
		
		this.controller.setupWidget("addButton", {label: "Add Bookmark", type: Mojo.Widget.activityButton}, {buttonClass: "affirmative"});
		this.controller.setupWidget("cancelButton", {label: "Cancel"}, {});
		
		this.controller.listen("addButton", Mojo.Event.tap, this.ladd = this.verifyData.bindAsEventListener(this)); //this.add.bindAsEventListener(this));
		this.controller.listen("cancelButton", Mojo.Event.tap, this.lcancel = this.cancel.bindAsEventListener(this));
	},
	
	cleanup: function() {
		this.controller.stopListening("addButton", Mojo.Event.tap, this.ladd);
		this.controller.stopListening("cancelButton", Mojo.Event.tap, this.lcancel);		
	},
	
	verifyData: function() {
		
		var title = this.controller.get('titleField').mojo.getValue();
		var url = this.controller.get('urlField').mojo.getValue();
		
		// Is this a valid URL
		var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
		var valid_url = regexp.test(url);
		
		title = title.replace(/^\s+|\s+$/g, '');
		url = url.replace(/^\s+|\s+$/g, '');
		
		if (valid_url) {
			
			var bookmark_data = "{\"0\":{\"url\":\""+ url +"\",\"title\":\""+ title +"\",\"tags\":\"\"}}";
			
			var username = API.library.opts.username;
			
			var base_url = "https://readitlaterlist.com/v2/send";
    	
	    	var page_data = "{\"0\":{\"url\":\""+ url +"\",\"title\":\""+ title +"\",\"tags\":\"\"}}";
			
			var ril_url = base_url + "?username=" + API.library.opts.username + "&password=" + API.library.opts.password + "&apikey=" + API.library.opts.apikey + "&new=" + page_data;
	    	
	    	var myAjax = new Ajax.Request(ril_url, {
				method: 'get',
				onSuccess: this.addComplete.bind(this, true, url, title),
				onFailure: this.addComplete.bind(this, false, url, title)
			});
			
		} else {
			this.controller.get('response').innerText = "Invalid!";
			this.controller.get('addButton').mojo.deactivate();
		}
		
	},
	
	addComplete: function(success, url, title, response) {
		
    	var response_code = response.request.transport.status;
    	
    	if ( (success) && (response_code == "200") ) {
    		
    		this.widget.mojo.close();
    		
    		var length = this.controller.get("article-list").mojo.getLength();
    		this.controller.get("article-list").mojo.noticeAddedItems(length, [{title: title, url: url}]);
    		
    	} else {
    		this.showAlert("Something bad happened! Code: " + response_code);
    	}
    	
    },
    
    showAlert: function(response) {
		this.controller.showAlertDialog({
          	onChoose: function(value) {},
            title: "Alert",
            message: response,
            choices:[ {label:'OK', value:'OK', type:'color'} ]});
	},
	
	cancel: function() {
		this.widget.mojo.close();
	}
});
