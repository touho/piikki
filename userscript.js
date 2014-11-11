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
				var previousCheckpoint = results.previousCheckpoint;


				// User Info:

				var name = userInfo[0][1];
				var email = userInfo[0][2];
				var balance = userInfo[0][3];
				var piikkausValue = userInfo[0][4];
				var payments = userInfo[0][5];

				content.empty();
				var table;

				function addRow(key, value, title) {
					var tr = $("<tr/>");
					var keyTd = $("<td/>").text(key);
					var valueTd = $("<td/>").text(value).attr("title", title || "");
					tr.append(keyTd).append(valueTd);
					table.append(tr);
				}

				function addBlock(text) {
					content.append("<b>" + text + "</b>");
					table = $("<table/>");
				}


				addBlock("Tietosi:");
				addRow("Nimi:", name);
				addRow("Email:", email);
				content.append(table);


				addBlock("Rahatilanteesi:");
				addRow("Saldosi "+previousCheckpoint+":", "= " + (balance - payments).toFixed(2) + " €");
				addRow("Merkatut maksut sen jälkeen:", "+ " + payments.toFixed(2) + " €");
				addRow("", "= " + balance.toFixed(2) + " €");
				addRow("Piikkaukset "+previousCheckpoint+" jälkeen:", "– " + piikkausValue.toFixed(2) + " €", previousCheckpoint + " lähtien");
				addRow("Saldo piikkaukset huomioiden:", "= " + (balance - piikkausValue).toFixed(2) + " €");
				content.append(table);


				addBlock("Piikkaukset "+previousCheckpoint+" jälkeen:");
				for (var i = 0; i < piikkausInfo.length; i++)
					addRow(piikkausInfo[i][1] + ":", piikkausInfo[i][2] + " kpl");
				content.append(table);

			}
		});
	}

	var content = $("#content");
}