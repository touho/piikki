function piikkiBegin()
{
	piikki = new PiikkiUtil();

	if (window["localStorage"]) {
		var userId = parseInt(localStorage["piikkiUserId"]);
		if (!isNaN(userId) && userId >= 0)
		{
			piikki.getUsers(function(){
				piikki.selectUser(userId);
			});
			return;
		}
	}
	piikki.buildUserPage();
}

var piikki;
function PiikkiUtil()
{
	//public:

	this.currentUserId = -1;
	this.currentUserName = "";

	this.users = [];
	this.items = [];

	this.selectUser = function(id)
	{
		if (!isNaN(id) && id >= 0)
		{
			for (var i = 0; i < this.users.length; i++) {
				if (this.users[i].id == id)
				{
					this.currentUserId = this.users[i].id;
					this.currentUserName = this.users[i].name

					var rememberMeElement = document.getElementById("rememberMe");

					if (window["localStorage"] && rememberMeElement && rememberMeElement.checked) {
						localStorage["piikkiUserId"] = this.currentUserId;
					}

					headerElement.innerHTML = "Hei, " + this.currentUserName;

					this.buildItemPage();

					return;
				}
			};
		}

		this.buildUserPage();
	}

	this.debugLog = function(msg) {
		var elem = document.getElementById("log");
		elem.innerHTML = msg + "<br/>" + elem.innerHTML;
	}

	this.getUserNameById = function(id) {
		for (var i = 0; i < this.users.length; i++) {
			if (this.users[i].id == id) return this.users[i].name;
		};
		return null;
	}

	this.getItemNameById = function(id) {
		for (var i = 0; i < this.items.length; i++) {
			if (this.items[i].id == id) return this.items[i].name;
		};
		return null;
	}

	this.piikkaus = function(itemId, value)
	{
		var undoDiv = document.getElementById("undoDiv");
		if (undoDiv)
			undoDiv.innerHTML = "";

		var userId = this.currentUserId;
		if (isNaN(userId) || userId < 0) return;
		userId = ~~userId;

		if (isNaN(itemId) || itemId < 0) return;
		itemId = ~~itemId;

		if (isNaN(value)) value = 1;
		value = ~~value;

		piikki.sendAjax("server.cgi", {action: "piikkaus", userId: userId, itemId: itemId, value: value}, function(results) {
			if (results.success)
			{
				piikki.debugLog("" + value + " kpl " + piikki.getItemNameById(itemId) + " piikattu tyypille " + piikki.getUserNameById(userId));

				var undoDiv = document.getElementById("undoDiv");
				if (undoDiv)
				{
					if (value > 0)
						undoDiv.innerHTML = piikki.getItemNameById(itemId) + " piikattu! <span id='undoButton' onclick='piikki.piikkaus("+itemId+", "+(-value)+");'>Undo</span>";
					else
						undoDiv.innerHTML = piikki.getItemNameById(itemId) + " undottu.";
				}
			}
			else
				piikki.debugLog("Piikkaus epäonnistui: " + results.message);
		});
	}
	this.getUsers = function(callback)
	{
		piikki.sendAjax("server.cgi", {action: "getUsers"}, function(results) {
			if (results.success)
			{
				piikki.users = results.users;
				for (var i = 0; i < piikki.users.length; i++) {
					piikki.users[i] = {id: piikki.users[i][0], name: piikki.users[i][1]};
				};
				if (callback) callback();
			}
			else
				piikki.debugLog("Unable to get users.");
		});
	}
	this.getItems = function(callback)
	{
		piikki.sendAjax("server.cgi", {action: "getItems"}, function(results) {
			if (results.success)
			{
				piikki.items = results.items;
				for (var i = 0; i < piikki.items.length; i++) {
					piikki.items[i] = {id: piikki.items[i][0], name: piikki.items[i][1]};
				};
				if (callback) callback();
			}
			else
				piikki.debugLog("Unable to get items.");
		});
	}
	this.buildItemPage = function()
	{
		if (isNaN(this.currentUserId) || this.currentUserId < 0) {
			this.debugLog("Error, bad user id");
			return;
		}

		this.getItems(function(){
			loginElement.innerHTML = "<a href='user.html?id="+piikki.currentUserId+"'>Login</a>";
			var code = "<button onclick=\"piikki.buildUserPage()\">En oo minä</button><br/><br/>";

			code += "<div id='piikkausbuttons'>";
			function createItem(id, name) {
				code += "<div onclick=\"piikki.piikkaus('"+id+"',1)\" class='button'>"+name+"</div>";
				//code += "<button onclick=\"piikki.piikkaus('"+id+"',1)\">" + name + "</button>";
			}
			for (var i = 0; i < piikki.items.length; i++)
				createItem(piikki.items[i].id, piikki.items[i].name);

			code += "</div>";
			code += "<div id='undoDiv'></div>";

			contentElement.innerHTML = code;
		});
	}
	this.buildUserPage = function()
	{
		this.currentUserId = -1;
		this.currentUserName = "";
		loginElement.innerHTML = "";

		if (window["localStorage"]) {
			delete localStorage["piikkiUserId"];
		}

		headerElement.innerHTML = "Kuka sie oot?";

		this.getUsers(function(){
			var code = "";

			code += "<br/><input id='nameinput' type='text' onfocusout='piikki.clearAutocomplete();' onfocus='piikki.updateAutocomplete();' onkeyup='piikki.inputKeyUp(event);' onkeydown='piikki.inputKeyDown(event);' placeholder='Mikäs sun nimi olikaan?'/>";
			code += "<input id='rememberMe' type='checkbox'/> Muista mut";
			code += "<br/><div onmousedown='piikki.autoCompleteMouseDown();' style='visibility:hidden' id='autocomplete'></div>";

			//code += "<input id='rememberMe' type='checkbox' name='rememberMe' value='1'/> Muista mut täl selaimel";

			contentElement.innerHTML = code;
		});
	}

	this.selectedAutocompleteIndex = -1;
	var autocompleteUsers = [];
	this.hilightAutocompleteRow = function(row)
	{
		if (row !== undefined) piikki.selectedAutocompleteIndex = row;

		if (piikki.selectedAutocompleteIndex >= 0 && piikki.selectedAutocompleteIndex < autocompleteUsers.length)
		{
			var auto = document.getElementById("autocomplete");
			if (auto)
			{
				for (var i = 0; i < auto.childNodes.length; i++) {
					auto.childNodes[i].className = "";
				};
				auto.childNodes[piikki.selectedAutocompleteIndex].className = "selected";
			}
		}
	}
	this.inputKeyDown = function(e)
	{
		if (e)
		{
			var k = e.keyCode;
			if (k == 38) //Up
			{
				piikki.selectedAutocompleteIndex--;
				if (piikki.selectedAutocompleteIndex < 0)
					piikki.selectedAutocompleteIndex = 0;
				e.preventDefault();
				e.stopPropagation();
				this.hilightAutocompleteRow();
				return;
			}
			else if (k == 40) //Down
			{
				piikki.selectedAutocompleteIndex++;
				var max = autocompleteUsers.length - 1;
				if (piikki.selectedAutocompleteIndex > max)
					piikki.selectedAutocompleteIndex = max;
				e.preventDefault();
				e.stopPropagation();
				this.hilightAutocompleteRow();
				return;
			}
			else if (k == 13) //Enter
			{
				if (piikki.selectedAutocompleteIndex >= 0 && piikki.selectedAutocompleteIndex < autocompleteUsers.length)
					piikki.selectUser(autocompleteUsers[piikki.selectedAutocompleteIndex].id);
				e.preventDefault();
				e.stopPropagation();
				return;
			}
		}
	}
	this.inputKeyUp = function(e){if (e.keyCode < 37 || e.keyCode > 43) this.updateAutocomplete();}
	this.updateAutocomplete = function()
	{
		var input = document.getElementById("nameinput");
		var auto = document.getElementById("autocomplete");
		piikki.selectedAutocompleteIndex = -1;
		autocompleteUsers.length = 0;
		if (auto)
		{
			var visible = "hidden";
			var code = "";
			if (input && (input.value.length >= 2 || input.value == "*"))
			{
				var findStr = input.value.toLowerCase();
				var rowCount = 0;
				for (var i = 0; i < this.users.length; i++) {
					if (this.users[i].name.toLowerCase().indexOf(findStr) >= 0 && rowCount < 5 || findStr == "*")
					{
						autocompleteUsers.push(this.users[i]);
						visible = "visible";
						code += "<div onmouseover='piikki.hilightAutocompleteRow("+rowCount+");' onclick='piikki.selectUser("+this.users[i].id+");'>" + this.users[i].name + "</div>";
						rowCount++;
					}
				};
			}
			
			auto.innerHTML = code;
			if (visible != auto.style.visibility) auto.style.visibility = visible;
			auto.style.display = "block";
		}
	}

	var ignoreNextFocusout = false;
	var hideTimeout = null; //TODO
	this.clearAutocomplete = function()
	{
		if (ignoreNextFocusout) {
			ignoreNextFocusout = false;
			return;
		}

		autocompleteUsers.length = 0;
		hideTimeout = setTimeout(function() {
			hideTimeout = null;
			var auto = document.getElementById("autocomplete");
			if (auto)
			{

				auto.style.visibility = "collapse";
				auto.style.display = "none";
			}
		}, 200);
	}

	this.autoCompleteMouseDown = function()
	{
		if (document.activeElement.tagName.toLowerCase() == "input")
		{
			ignoreNextFocusout = true;
		}
	}

	//private:

	var contentElement = document.getElementById("content");
	var undoElement = document.getElementById("undo");
	var headerElement = document.getElementById("header");
	var loginElement = document.getElementById("login");

	//parameters: {action: "act", param: "par"}
	this.sendAjax = function(url, parameters, callback)
	{
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function()
		{
			if (xmlhttp.readyState==4 && xmlhttp.status==200)
			{
				if (xmlhttp.responseText.indexOf("problem occurred in a Python script") > 0)
				{
					//FIXME: Just for debug
					document.body.innerHTML = xmlhttp.responseText;
				}
				else if (callback)
				{
					try
					{
						var response = JSON.parse(xmlhttp.responseText);
					}
					catch (e)
					{
						function safe_tags(str) {
						    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
						}
						piikki.debugLog(safe_tags(xmlhttp.responseText));
					}
					try
					{
						callback(response);
					}
					catch(e){}
				}
			}
		}
		xmlhttp.open("POST", url, true);
		xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded;charset=utf-8");

		var msg = "";
		var keys = Object.keys(parameters);
		for (var i = 0; i < keys.length; i++) {
			if (i != 0) msg += "&";
			msg += keys[i] + "=" + parameters[keys[i]];
		}
		xmlhttp.send(msg);
	}
}