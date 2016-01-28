function userBegin()
{
	piikki = new PiikkiUtil();
	user = new UserUtil();
	user.buildAuthenticationPage();
}

var user;
function UserUtil()
{
	var userPassword = "";
	var userId = -1;
	var params = window.location.search.substr(1);
	var i = params.indexOf("id=") + 3;
	userId = parseInt(params.substr(i));


	this.doAuthentication = function()
	{
		var pass = document.getElementById("passwordinput");

		if (pass && pass.value.length > 0) {
			userPassword = pass.value;
			user.buildInfo();
		}
	}
	this.authPasswordKeyPress = function(e)
	{
		var k = e.keyCode;
		if (k == 13) {
			this.doAuthentication();
		}
	}
	this.buildAuthenticationPage = function()
	{
		piikki.getUsers(function(){
			var name = piikki.getUserNameById(userId);
			var code = "";
			code += "<div id='homeLink'><a href='./?userId="+userId+"'>Takaisin</a></div>";
			code += "<div class='marginBottom'><h2>"+name+"</h2></div>";
			code += "<input id='passwordinput' onkeydown='piikki.authPasswordKeyPress(event);' type='password' placeholder='Salasanasi?'/><br/>";
			code += "<button class=\"action-button\" onclick='user.doAuthentication();' id='authbutton'>Tunnistaudu</button>";

			content.html(code);
			document.getElementById("passwordinput").focus();
		});
	}
	this.buildInfo = function()
	{
		if (isNaN(userId)) {
			return;
		}

		piikki.sendAjax("server.cgi", {action: "userPage", subAction: "get", userId: userId, password: userPassword}, function(results) {
			if (results.success)
			{
				var userInfo = results.userInformation;
				var piikkausInfo = results.piikkausInformation;
				var paymentInformation = results.paymentInformation;


				// User Info:

				var name = userInfo[0][1];
				var email = userInfo[0][2];
				var isAdmin = userInfo[0][3] == "1";
				var balance = userInfo[0][4].toFixed(2);

				content.empty();
				var table,div;

				function addRow(key, value, title, boldCol) {
					if (table == null)
					{
						table = $("<table/>");
						div.append(table);
					}
					var tr = $("<tr/>").addClass(key + "UserRow");
					var keyTd = $("<td/>").text(key).addClass("keyElement");
					var valueTd = $("<td/>").text(value).attr("title", title || "").addClass("valueElement");
					if (boldCol == "left")
						keyTd.addClass("bold");
					else if (boldCol == "right")
						valueTd.addClass("bold");
					tr.append(keyTd).append(valueTd);
					table.append(tr);
				}

				function addLine(time, text, title) {
					var rowDiv = $("<div/>");
					var dateSpan = $("<span/>").text(time).addClass("dateSpan");
					var textSpan = $("<span/>").text(text).addClass("textSpan").attr("title", title);
					rowDiv.append(dateSpan).append(textSpan);
					div.append(rowDiv);
				}

				function addBlock(text) {
					content.append(text);
					table = null;
					div = $("<div/>").addClass("divBlock");
				}

				addBlock("<h1>Omat tiedot</h1>");

				content.append("<div class='main-commands'><a href='./?userId="+userId+"' class=backButton>Takaisin</a>");
				if (isAdmin) {
					$(".main-commands").first().append("<a href='admin.html'>Hallinnoi</a>");
				};
				//Tämä divin lopetus on 'main-commands'ille. Tulee väärään kohtaan. :(
				content.append("</div>");

				addRow("Nimi", name, null, "left");
				addRow("Email", email, null, "left");
				addRow("Saldo", balance + "€", null, "left")
				if (isAdmin)
					addRow("Admin", "Kyllä", null, "left");
				content.append(div);

				addBlock("<h2>Viimeisimmät piikkauksesi</h2>");
				for (var i = 0; i < piikkausInfo.length; i++) {
					var itemName = piikkausInfo[i][1];
					var value = parseInt(piikkausInfo[i][2]);
					var date = piikkausInfo[i][3];
					var ip = "IP: " + piikkausInfo[i][4];
					var originalUser = piikkausInfo[i][5];

					if (value != 1)
					{
						itemName += " " + value;
					}
					/*
					if (originalUser && originalUser != name)
					{
						itemName += " ("+originalUser+")";
					}
					*/

					addRow(date, itemName, ip, "right");
				};
				if (piikkausInfo.length == 0)
				{
					div.append("Ei vielä piikkauksia");
				}
				content.append(div);

				addBlock("<h2>Viimeisimmät maksusi</h2>");
				for (var i = 0; i < paymentInformation.length; i++) {
					var value = parseInt(paymentInformation[i][1]);
					var date = paymentInformation[i][2];

					addRow(date, value + "€", null, "right");
				};

				if (paymentInformation.length == 0)
				{
					div.append("Ei vielä maksuja");
				}

				content.append(div);

				addBlock("<h2>Vaihda salasana</h2>");
				var passwordInput = $("<input>").attr({type: "password", placeholder: "Uusi salasana"});
				var passwordInput2 = $("<input>").attr({type: "password", placeholder: "Vahvista uusi salasana"});
				var passwordSendButton = $("<button class='action-button'/>").text("Vaihda").click(function(){
					var newPassword = passwordInput.val();
					var newPassword2 = passwordInput2.val();
					if (newPassword.length <= 0) return;
					if (newPassword != newPassword2) {
						alert("Salasana uudelleenkirjoitettu väärin.");
						return;
					}

					piikki.sendAjax("server.cgi", {userId: userId, oldPassword: userPassword, newPassword: newPassword}, function(results) {
						if (results.success)
						{
							userPassword = newPassword;
							alert("Salasanan vaihto onnistui!");
							user.buildInfo();
						}
						else
						{
							alert("Salasanan vaihto epäonnistui.");
							piikki.debugLog("Failed to change password");
						}
					});
				});
				div.append(passwordInput).append("<br/>").append(passwordInput2).append("<br/>").append(passwordSendButton);
				content.append(div);


				// Email editing:
				var editButton = $("<button>").text("edit").addClass("editButton").click(function(){
					var newEmail = prompt("Inser your email", email);
					if (newEmail)
					{
						piikki.sendAjax("server.cgi", {action: "userPage", subAction: "changeEmail", userId: userId, password: userPassword, email: newEmail}, function(results) {
							if (results.success)
							{
								user.buildInfo();
							}
							else
							{
								alert("Sähköpostiosoitteen vaihto epäonnistui.");
								piikki.debugLog("Failed to change email");
							}
						});
					}
				});
				$(".EmailUserRow .valueElement").append(editButton);
			}
			else
			{
				alert("Väärä salasana.");
				document.getElementById("passwordinput").focus();
			}
		});
	}

	var content = $("#content");
}
