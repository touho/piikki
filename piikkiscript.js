//Anna
function piikkiBegin()
{
	piikki = new PiikkiUtil();

	if (piikki.isChangePasswordUrl())
	{
		piikki.buildChangePasswordPage();
		return;
	}
	else if (window["localStorage"])
	{
		var userId = parseInt(localStorage["piikkiUserId"]);
		if (!isNaN(userId) && userId >= 0)
		{
			piikki.getUsers(function(){
				piikki.selectUser(userId);
			});
			return;
		}
	}

	if (piikki.common_password.length > 0) {
		piikki.buildUserPage();
	}
	else
	{
		piikki.buildAuthenticationPage();
	}
}

var piikki;
function PiikkiUtil()
{
	//public:

	this.currentUserId = -1;
	this.currentUserName = "";
	this.common_password = "";

	if (window["localStorage"] && window.localStorage["piikkiCommonPassword"])
		this.common_password = window.localStorage["piikkiCommonPassword"];

	this.users = [];
	this.items = [];

	this.reset = function()
	{
		delete localStorage["piikkiUserId"];
		delete localStorage["piikkiCommonPassword"];
		this.common_password = "";
		this.currentUserName = "";
		this.currentUserId = -1;
		this.users = [];
		this.items = [];

		return "Reset done! You should now refresh the page and log in.";
	}

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

					//headerElement.innerHTML = "Hei, " + this.currentUserName;

					this.buildItemPage();

					return;
				}
			};
		}

		this.buildUserPage();
	}

	this.debugLog = function(msg) {
		var elem = document.getElementById("log");
		if (elem)
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


	var undoTimeout = null;
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

		triedPiikkaukset += value;
		piikki.refreshPiikkausNumber();

		piikki.sendAjax("server.cgi", {action: "piikkaus", userId: userId, itemId: itemId, value: value}, function(results) {
			if (results.success)
			{
				successfulPiikkaukset += value;
				piikki.refreshPiikkausNumber();
				piikki.debugLog("" + value + " kpl " + piikki.getItemNameById(itemId) + " piikattu tyypille " + piikki.getUserNameById(userId));

				var undoDiv = document.getElementById("undoDiv");
				if (undoDiv)
				{
					if (value > 0)
						undoDiv.innerHTML = piikki.getItemNameById(itemId) + " piikattu! <span id='undoButton' onclick='piikki.piikkaus("+itemId+", "+(-value)+");'>Undo</span>";
					else
						undoDiv.innerHTML = piikki.getItemNameById(itemId) + " undottu.";

					if (undoTimeout)
						clearTimeout(undoTimeout);
					undoTimeout = null;

					$(undoDiv).slideDown();
					undoTimeout = setTimeout(function(){
						$(undoDiv).fadeOut(5000);
					}, 20000);
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

	this.refreshPiikkausNumber = function()
	{
		$("#number").text("Session piikkaukset: " + successfulPiikkaukset + "/" + triedPiikkaukset);
		if (successfulPiikkaukset != triedPiikkaukset)
		{
			$("#number").addClass("conflict");
		}
		else
			$("#number").removeClass("conflict");
	}

	var triedPiikkaukset = 0;
	var successfulPiikkaukset = 0;
	this.buildItemPage = function()
	{
		if (isNaN(this.currentUserId) || this.currentUserId < 0) {
			this.debugLog("Error, bad user id");
			return;
		}

		triedPiikkaukset = 0;
		successfulPiikkaukset = 0;

		var code = "<div id=\"header\" class=\"header\">";
		code += "<h1>Hei " + this.currentUserName + "!</h1>";
		code += "</div>";
		contentElement.innerHTML = code;

		this.getItems(function(){
			//loginElement.innerHTML = "<a href='user.html?id="+piikki.currentUserId+"'>Login</a>";
			var code = "<button onclick=\"piikki.buildUserPage()\">En oo minä</button><br/><br/>";
			var code = "<div id=\"header\" class=\"header\">";

			code += "<h1>Hei " + piikki.currentUserName + "!</h1>\n";
			code += "<div class=\"main-commands\">";
			code += "<div id=\"notme\"><button class=\"non-button\" onclick=\"piikki.buildUserPage()\">Vaihda henkilöä</button></div>";
			code += "<div id=\"login\" class=\"login\"><a href='user.html?id="+piikki.currentUserId+"'>Piikkaushistoria</a></div>";
			code += "</div>"; // main-commands

			code += "</div>"; // header

			//contentElement.innerHTML = code;
/*
<div class="header">
		<h1 id="header">Hei Marko Rintamäki!</h1>
		<div id="notme">
			<button class="non-button" onclick="piikki.buildUserPage()">Vaihda henkilöä</button>
		</div>
		<div id="login" class="login"><a href="user.html?id=1">Piikkaushistoria</a></div>
	</div>
*/

			code += "<div id='undoDiv'></div>";

			code += "<div id='piikkausbuttons' class=\"justified-adjustment\">";
			function createItem(id, name) {
				code += "<div onclick=\"piikki.piikkaus('"+id+"',1)\" class='button'>"+name+"</div>";
				//code += "<button onclick=\"piikki.piikkaus('"+id+"',1)\">" + name + "</button>";
			}
			for (var i = 0; i < piikki.items.length; i++)
				createItem(piikki.items[i].id, piikki.items[i].name);

			code += "</div>";

			code += "<span id='number'></span>";


			contentElement.innerHTML = code;

			$("#undoDiv").hide();
			piikki.refreshPiikkausNumber();
		});
	}

	this.doAuthentication = function()
	{
		var user = document.getElementById("usernameinput");
		var pass = document.getElementById("passwordinput");

		if (user && pass && user.value.length > 0 && pass.value.length > 0) {
			piikki.sendAjax("server.cgi", {username: user.value, password: pass.value}, function(results) {
				if (results.success)
				{
					piikki.common_password = results.common_password;
					if (window["localStorage"]) localStorage["piikkiCommonPassword"] = piikki.common_password;
					piikki.buildUserPage();
				}
				else
					piikki.debugLog("Unable to authenticate.");
			});
		}
	}
	this.authUsernameKeyPress = function(e)
	{
		var k = e.keyCode;
		if (k == 13) {
			var pass = document.getElementById("passwordinput");
			if (pass) pass.focus();
		}
	}
	this.authPasswordKeyPress = function(e)
	{
		var k = e.keyCode;
		if (k == 13) {
			var pass = document.getElementById("authbutton");
			if (pass) pass.focus();
		}
	}
	this.buildAuthenticationPage = function()
	{
		var code = "";
		code += "<input id='usernameinput' onkeydown='piikki.authUsernameKeyPress(event);' type='text' placeholder='Koko nimesi?'/><br/>";
		code += "<input id='passwordinput' onkeydown='piikki.authPasswordKeyPress(event);' type='password' placeholder='Salasanasi?'/><br/>";
		code += "<button class=\"action-button\" onclick='piikki.doAuthentication();' id='authbutton'>Tunnistaudu</button>";

		contentElement.innerHTML = code;
	}

	this.buildUserPage = function()
	{
		this.currentUserId = -1;
		this.currentUserName = "";

		if (window["localStorage"]) {
			delete localStorage["piikkiUserId"];
		}

		//headerElement.innerHTML = "Kuka sie oot?";

		this.getUsers(function(){
			var code = "";

			code += "<br/><div class='dropdown'><input id='nameinput' type='text' onfocusout='piikki.clearAutocomplete();' onfocus='piikki.updateAutocomplete();' onkeyup='piikki.inputKeyUp(event);' onkeydown='piikki.inputKeyDown(event);' placeholder='Nimesi?'/>";
			code += "<br/><div onmousedown='piikki.autoCompleteMouseDown();' style='visibility:hidden' id='autocomplete'></div></div>";
			code += "<div><input id='rememberMe' type='checkbox'/> Muista minut</div>";

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

	this.changePasswordSend = function()
	{
		var newPassword = document.getElementById("newpasswordinput").value;
		var newPassword2 = document.getElementById("newpasswordinput2").value;
		if (newPassword != newPassword2)
		{
			alert("Salasanan syöttö uudelleen epäonnistui.");
			return;
		}
		piikki.sendAjax("server.cgi", {userId: changePasswordUserId, oldPassword: changePasswordPassword, newPassword: newPassword}, function(results) {
			if (results.success)
			{
				piikki.common_password = results.common_password;
				if (window["localStorage"]) localStorage["piikkiCommonPassword"] = piikki.common_password;
				//piikki.buildUserPage();
				alert("Salasanan vaihto onnistui!");
				window.location = "./index.html"; //This removes get parameters
			}
			else
			{
				alert("Salasanan vaihto epäonnistui. Oletko jo vaihtanut salasanan?");
				piikki.debugLog("Failed to change password");
			}
		});
	}

	this.changePasswordSecondPasswordKeyPress = function(e)
	{
		var k = e.keyCode;
		if (k == 13) {
			piikki.changePasswordSend();
		}
	}
	this.buildChangePasswordPage = function()
	{
		var code = "";
		code += "<input id='newpasswordinput' type='password' placeholder='uusi salasana'/><br/>";
		code += "<input id='newpasswordinput2' onkeydown='piikki.changePasswordSecondPasswordKeyPress(event);' type='password' placeholder='uusi salasana uudelleen'/><br/>";
		code += "<button onclick='piikki.changePasswordSend();' id='changePasswordSendButton'>Tallenna</button>";

		contentElement.innerHTML = code;

		document.getElementById("newpasswordinput").focus();
	}

	var changePasswordUserId = -1;
	var changePasswordPassword = "";
	this.isChangePasswordUrl = function()
	{
		try
		{
			var params = window.location.search.substr(1);
			var idIndex = params.indexOf("id=") + 3;
			var passwordIndex = params.indexOf("p=") + 2;

			changePasswordUserId = parseInt(params.substr(idIndex, passwordIndex-2));
			changePasswordPassword = params.substr(passwordIndex);
			return !isNaN(changePasswordUserId) && changePasswordPassword.length > 0;
		}
		catch(e)
		{
		}
		return false;
	}

	//private:

	var contentElement = document.getElementById("content");

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
						    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
		if (piikki.common_password.length > 0) parameters["common_password"] = piikki.common_password;
		var keys = Object.keys(parameters);
		for (var i = 0; i < keys.length; i++) {
			if (i != 0) msg += "&";
			msg += keys[i] + "=" + parameters[keys[i]];
		}
		xmlhttp.send(msg);
	}
}

var help = "Reset piikki page: piikki.reset();";
