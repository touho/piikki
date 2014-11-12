function userBegin()
{
	piikki = new PiikkiUtil();
	user = new UserUtil();
	user.build();
}

var user;
function UserUtil()
{
	this.build = function()
	{
		var userId = 0;

		var params = window.location.search.substr(1);

		var i = params.indexOf("id=") + 3;
		userId = parseInt(params.substr(i));

		if (isNaN(userId)) {
			return;
		}

		piikki.sendAjax("server.cgi", {action: "userPage", subAction: "get", userId: userId}, function(results) {
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

				function addLine(time, text) {
					var rowDiv = $("<div/>");
					var dateSpan = $("<span/>").text(time).addClass("dateSpan");
					var textSpan = $("<span/>").text(text).addClass("textSpan");
					rowDiv.append(dateSpan).append(textSpan);
					div.append(rowDiv);
				}

				function addBlock(text) {
					content.append("<b>" + text + "</b>");
					table = $("<table/>");
					div = $("<div/>").addClass("divBlock");
				}

				addBlock("Tietosi:");
				addRow("Nimi:", name);
				addRow("Email:", email);
				addRow("Saldo:", balance + "€")
				if (isAdmin)
					addRow("Admin:", "Kyllä!");
				content.append(table);


				addBlock("Viimeisimmät maksusi:");
				for (var i = 0; i < paymentInformation.length; i++) {
					var value = parseInt(paymentInformation[i][1]);
					var date = "[" + paymentInformation[i][2] + "] ";

					addLine(date, value + "€");
				};
				content.append(div);


				addBlock("Viimeisimmät piikkauksesi:");
				for (var i = 0; i < piikkausInfo.length; i++) {
					var name = piikkausInfo[i][1];
					var value = parseInt(piikkausInfo[i][2]);
					var date = "[" + piikkausInfo[i][3] + "] ";

					addLine(date, name + (value == 1 ? "" : " x " + value));
				};
				content.append(div);

			}
		});
	}

	var content = $("#content");
}