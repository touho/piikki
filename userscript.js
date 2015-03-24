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
	var userId = 0;
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
			code += "<div id='homeLink'><a href='./'>Takaisin</a></div>";
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

				function addRow(key, value, title) {
					var tr = $("<tr/>");
					var keyTd = $("<td/>").text(key);
					var valueTd = $("<td/>").text(value).attr("title", title || "");
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
					table = $("<table/>");
					div = $("<div/>").addClass("divBlock");
				}

				addBlock("<h1>Omat tiedot</h1>");

				content.append("<div class='main-commands'><a href='./' class=backButton>Takaisin</a>");
				if (isAdmin)
					content.append("<a href='admin.html'>Hallinnoi</a>");
				content.append("</div>");

				addRow("Nimi:", name);
				addRow("Email:", email);
				addRow("Saldo:", balance + "€")
				if (isAdmin)
					addRow("Admin:", "Kyllä!");
				content.append(table);

				addBlock("<h2>Viimeisimmät piikkauksesi</h2>");
				for (var i = 0; i < piikkausInfo.length; i++) {
					var name = piikkausInfo[i][1];
					var value = parseInt(piikkausInfo[i][2]);
					var date = "[" + piikkausInfo[i][3] + "] ";
					var ip = "IP: " + piikkausInfo[i][4];

					addLine(date, name + (value == 1 ? "" : " x " + value), ip);
				};
				content.append(div);

				addBlock("<h2>Viimeisimmät maksusi</h2>");
				for (var i = 0; i < paymentInformation.length; i++) {
					var value = parseInt(paymentInformation[i][1]);
					var date = "[" + paymentInformation[i][2] + "] ";

					addLine(date, value + "€");
				};
				content.append(div);

				addBlock("<h2>Vaihda salasana</h2>");
				var passwordInput = $("<input>").attr({type: "password", placeholder: "uusi salasana"});
				var passwordInput2 = $("<input>").attr({type: "password", placeholder: "uusi salasana uudelleen"});
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
