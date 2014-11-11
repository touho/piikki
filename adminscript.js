function adminBegin()
{
	piikki = new PiikkiUtil();
	admin = new AdminUtil();
	admin.init();
}

var admin;
function AdminUtil()
{
	//public:

	this.init = function()
	{
		navigation.find("span").eq(0).click();
	}

	this.debugLog = function(message) {
		var elem = document.getElementById("log");
		if (elem)
			elem.innerHTML = message + "<br/>" + elem.innerHTML;
		console.log(message);
	}

	this.selectButton = function(id) {
		$(".navbutton").css("background", "");
		$("#"+id).css("background", "#ffffbb");
	}

	this.buildMainPage = function()
	{
		this.selectButton("mainbutton");
		piikki.sendAjax("server.cgi", {action: "adminMain", subAction: "get"}, function(results) {
			var code = "Database has " + results.numUsers + " users and " + results.numItems + " items.<br/>";
			if (results.lastCheckpoint)
				code += "Previous checkpoint: " + results.lastCheckpoint;
			else
				code += "There hasn't been any checkpoints yet.";
			code += "<br/><br/>";
			code += "Admin commands:";
			content.html(code);


			function addAdminAction(name, listBegin, list, confirmationText, actionParams, doneText, dangerous) {
				var button = $("<button/>").text(name + "!").click(function(){
					if (confirmationText.length == 0 || confirm(confirmationText))
					{
						actionParams["action"] = "adminMain";
						piikki.sendAjax("server.cgi", actionParams, function(results) {
							if (results.success)
								alert(doneText);
							else
								alert("Error! " + doneText + " And it failed!")
							admin.buildMainPage();
						});
					}
				});

				var code = "<hr/><br/><b>"+name+":</b><br/><br/>";
				code += listBegin+":<br/>";
				for (var i = 0; i < list.length; i++)
					code += "- " + list[i] + "<br/>";
				code += "<br/>";

				var buttonContainer = $("<div/>");
				buttonContainer.append(button);

				content.append(code);

				if (dangerous) {
					button.css("color", "red");
					var link = $("<a/>").attr("href", "#").text("Show/Hide button").css("font-size", 10).click(function(){
						buttonContainer.toggle();
					});
					content.append(link).append("<br/><br/>");
					buttonContainer.hide();
				}
				content.append(buttonContainer)
				content.append("<br/><br/>");
			}
			addAdminAction("Announce Checkpoint", "When you announce checkpoint", [
				"User balance is recalculated using piikkaukset information",
				"Piikkaukset will be dumped in to a log file", 
				"Piikkaukset will be reseted"],
				"Announcing Checkpoint. Are you sure?", {subAction: "checkpoint"}, "Checkpoint announced!", false);

			addAdminAction("Reset Database", "When you reset database", [
				"Users are deleted", 
				"Items are deleted",
				"Piikkaukset are deleted",
				"Payments are deleted",
				"History logs will not be deleted"],
				"Are you sure to delete EVERYTHING?", {subAction: "reset"}, "Database reseted!", true);

			content.append("<hr/>");
/*
			var resetButton = $("<button/>").text("Reset database").click(function(){
				if (confirm("Are you sure you want to reset EVERYTHING?"))
				{
					piikki.sendAjax("server.cgi", {action: "adminMain", subAction: "reset"}, function(results) {
						admin.buildMainPage();
					});
				}
			});
			var checkpointButton = $("<button/>").text("Announce Checkpoint!").click(function(){
				if (confirm("Announcing Checkpoint. Are you sure?"))
				{
					piikki.sendAjax("server.cgi", {action: "adminMain", subAction: "checkpoint"}, function(results) {
						admin.buildMainPage();
					});
				}
			});


			content.append("<hr/><b>Checkpoint:</b><br/><br/>");
			content.append("When you announce checkpoint:<br/>" + 
				"- all necessary data will be dumped in to log files<br/>" + 
				"- piikkaukset will be reseted<br/><br/>");
			content.append(checkpointButton);
			content.append("<hr/>");

			content.append(resetButton);
			*/
		});
	}

	this.buildUsersOrItems = function(isUsers, buttonId, action, smallCaseName, bigCaseName)
	{
		var buttonId = isUsers ? "usersbutton" : "itemsbutton";
		var action = isUsers ? "adminUsers" : "adminItems";
		var smallCaseName = isUsers ? "user" : "item";
		var smallCaseNames = isUsers ? "users" : "items";
		var bigCaseName = isUsers ? "User" : "Item";
		var bigCaseNames = isUsers ? "Users" : "Items";
		var rebuildCommand = function(){ if (isUsers) admin.buildUsersPage(); else admin.buildItemsPage();};

		this.selectButton(buttonId);
		piikki.sendAjax("server.cgi", {action: action, subAction: "get"}, function(results) {
			if (!results.success)
			{
				admin.debugLog(results.message);
				return;
			}

			var things = results[smallCaseNames];

			content.empty();
			content.append(bigCaseNames+": " + things.length + "<br/>");

			function addThingToTable(thingArray, table) {
				var tr = $("<tr/>");
				var id = $("<td/>").text(thingArray[0]);
				var name = $("<td/>").text(thingArray[1]);
				if (isUsers)
				{
					var email = $("<td/>").text(thingArray[2]);
					var balance = $("<td/>").text(thingArray[3].toFixed(2)).attr("title", 
						"Balance means how much user has money in piikki bank. "+
						"It is updated when payment is reported and when checkpoint is announced.");
					var piikkaukset = $("<td/>").text(thingArray[4]).attr("title", 
						"Piikkaukset is total value how much user's piikkaukset would cost. " + 
						"When checkpoint is announced, the value is subtracted from balance and then reseted.");
				}
				else
				{
					var price = $("<td/>").text(thingArray[2].toFixed(2));
					var visible = $("<td/>").text(thingArray[3] == "1" ? "Yes" : "No");
					var toBeRemoved = $("<td/>").text(thingArray[4] == "1" ? "Yes" : "No");
					piikkaukset = $("<td/>").text(thingArray[5]).attr("title", 
						"Piikkaukset means how many time this item has been piikke'd.");

					if (visible.text() == "No") {
						tr.addClass("disabledItem");
					}
					if (toBeRemoved.text() == "Yes") {
						tr.addClass("toBeRemovedItem");
					}
				}

				var editButton = $("<button/>").text("Edit").click(function() {
					var nameInput = $("<input/>").attr("type", "text").val(name.text());
					var emailInput = $("<input/>").attr("type", "text").val(email ? email.text() : "");
					//var balanceInput = $("<input/>").attr("type", "text").val(balance ? balance.text() : "");
					var priceInput = $("<input/>").attr("type", "text").val( price ? price.text() : "");

					var visibleInput = $("<input/>").attr("type", "checkbox");
					if (visible && visible.text() == "Yes") visibleInput.attr("checked", "checked");
					else visibleInput.removeAttr("checked");
					var toBeRemovedInput = $("<input/>").attr("type", "checkbox");
					if (toBeRemoved && toBeRemoved.text() == "Yes") toBeRemovedInput.attr("checked", "checked");
					else toBeRemovedInput.removeAttr("checked");


					var submitButton = $("<button/>").text("Submit changes!").click(function(){
						piikki.sendAjax("server.cgi", {
							action: action,
							subAction: "edit",
							id: parseInt(id.text()),
							name: nameInput.val(),
							email: emailInput.val(),
							//balance: parseFloat(balanceInput.val()),
							price: parseFloat(priceInput.val()),
							visible: visibleInput.is(":checked") ? 1 : 0,
							toBeRemoved: toBeRemovedInput.is(":checked") ? 1 : 0
						}, function(editResults) {
							if (editResults.success)
								rebuildCommand();
							else
								admin.debugLog("Error while editing "+smallCaseName+": " + editResults.message);
						});
					});
					inputArea.empty().append("Edit existing "+smallCaseName+" with id "+id.text()+":<br/>")
						.append("Name: ").append(nameInput);
					if (isUsers)
					{
						inputArea.append("<br/>Email: ").append(emailInput);
						//.append(" Balance: ").append(balanceInput);
					}
					else
					{
						inputArea.append("<br/>Price: ").append(priceInput);
						inputArea.append("<br/>Visible: ").append(visibleInput);
						inputArea.append("<br/>Remove on next checkpoint: ").append(toBeRemovedInput);
					}

					inputArea.append("<br/>");
					inputArea.append(submitButton);
					nameInput.focus();
				});

				if (isUsers)
				{
					var paymentButton = $("<button/>").text("Report Payment").click(function() {
						var valueInput = $("<input/>").attr("type", "text").val("0.0");


						var today = new Date();
						var dd = today.getDate();
						if(dd<10) {
							dd='0'+dd;
						} 
						var mm = today.getMonth()+1; //January is 0!
						if(mm<10) {
							mm='0'+mm;
						} 
						var yyyy = today.getFullYear();
						var dateInput = $("<input/>").attr("type", "text").val("" + yyyy + "-" + mm + "-" + dd);

						var submitButton = $("<button/>").text("Report Payment!").click(function(){
							//Value validation:
							var value = parseFloat(valueInput.val());
							if (isNaN(value)) {
								alert("Invalid payment value: " + valueInput.val());
								return;
							}
							else if (value <= 0) {
								if (!confirm("Payment value is not positive. Are you sure you want to continue?"))
									return;
							}

							//Date validation:
							var date = dateInput.val();
							var parts = date.split('-');
							if (parts.length < 3
								|| isNaN(parseInt(parts[0]))
								|| isNaN(parseInt(parts[1]))
								|| isNaN(parseInt(parts[2])))
							{
								alert("Invalid date format. User yyyy-mm-dd.");
								return;
							}

							piikki.sendAjax("server.cgi", {
								action: action,
								subAction: "reportPayment",
								id: parseInt(id.text()),
								value: value,
								date: date
							}, function(editResults) {
								if (editResults.success)
									rebuildCommand();
								else
									admin.debugLog("Error while editing "+smallCaseName+": " + editResults.message);
							});
						});
						inputArea.empty().append("Report a payment that " + name.text() + " has paid:<br/>")
							.append("Value: ").append(valueInput).append(" Payment Date: ").append(dateInput);

						inputArea.append(submitButton);
						valueInput.focus();
					});

					var removeButton = $("<button/>").text("Remove").click(function() {
						if (isUsers)
							var confirmation = "Are you sure you want to remove user '" + name.text() + "' with balance of " + balance.text() + "?";
						//else
						//	confirmation = "Are you sure you want to remove item '" + name.text() + "'?";

						if (confirm(confirmation))
						{
							piikki.sendAjax("server.cgi", {
								action: action,
								subAction: "remove",
								id: parseInt(id.text())
							}, function(removeResults) {
								if (removeResults.success)
									rebuildCommand();
								else
									admin.debugLog("Error while editing "+smallCaseName+": " + removeResults.message);
							});	
						}
					});
				}

				tr.append(id);
				tr.append(name);
				if (isUsers)
				{
					tr.append(email);
					tr.append(balance);
				}
				else
				{
					tr.append(price);
					tr.append(visible);
					tr.append(toBeRemoved);
				}

				//Items and Users both have piikkaukset, the meaning is different, tho.
				tr.append(piikkaukset);

				var td = $("<td/>").append(editButton);
				if (isUsers)
				{
					td.append(paymentButton);
					td.append(removeButton);
				}

				tr.append(td);

				table.append(tr);
			}
			var tableContainer = admin.createTableContainer();
			var table = $("<table/>").css("border", "1px solid black");
			table.append($("<tr/>").append(
				"<th>Id</th>" +
				"<th>Name</th>" + ( isUsers ?

				("<th>Email</th>" +
				"<th>Balance</th>" +
				"<th>Piikkausten Arvo</th>") 
				: 
				("<th>Price</th>" + 
				"<th>Visible</th>" + 
				"<th>To Be Removed</th>" +
				"<th>Piikkaukset</th>")
				) +
				"<th></th>"
			));
			for (var i = 0; i < things.length; i++)
				addThingToTable(things[i], table);

			tableContainer.append(table);
			content.append(tableContainer).append("<br/>");
			if (isUsers)
			{
				var totalBalance = 0;
				table.find("tr").find("td:eq(3)").each(function(){
					totalBalance += parseFloat($(this).text());
				});
				var totalPiikkaustenArvo = 0;
				table.find("tr").find("td:eq(4)").each(function(){
					totalPiikkaustenArvo += parseFloat($(this).text());
				});
				content.append("Total Balance: "+totalBalance.toFixed(2)+"<br/>");
				content.append("Total Piikkausten Arvo: "+totalPiikkaustenArvo+"<br/>");
			}

			var inputArea = $("<div/>").css({
				"border": "1px solid black",
				"display": "inline-block",
				"margin": "20px",
				"padding": "5px"
			});
			var addButton = $("<button/>").text("Add " + bigCaseName + "...").click(function(){
				var nameInput = $("<input/>").attr("type", "text");
				var emailInput = $("<input/>").attr("type", "text");
				var priceInput = $("<input/>").attr("type", "text");
				var visibleInput = $("<input/>").attr("type", "checkbox").attr("checked", "checked");
				var addButton2 = $("<button/>").text("Add!").click(function(){
					piikki.sendAjax("server.cgi", {
						action: action,
						subAction: "add",
						name: nameInput.val(),
						email: emailInput.val(),
						visible: visibleInput.is(":checked") ? 1 : 0,
						price: parseFloat(priceInput.val())
					}, function(addResults) {
						if (addResults.success)
							rebuildCommand();
						else
							admin.debugLog("Error while inserting "+smallCaseName+": " + addResults.message);
					});
				});
				inputArea.empty().append("Add new "+smallCaseName+":<br/>")
					.append("Name: ").append(nameInput);
				if (isUsers)
				{
					inputArea.append("<br/>Email: ").append(emailInput);
				}
				else
				{
					inputArea.append("<br/>Price: ").append(priceInput);
					inputArea.append("<br/>Visible: ").append(visibleInput);
				}

				inputArea.append("<br/>");
				inputArea.append(addButton2);

				nameInput.focus();
			});
			content.append("<br/>").append(addButton);
			content.append("<br/>").append(inputArea);
		});
	}

	this.buildUsersPage = function()
	{
		this.buildUsersOrItems(true);
	}

	this.buildItemsPage = function()
	{
		this.buildUsersOrItems(false);
	}

	this.buildPiikkauksetPage = function()
	{
		this.selectButton("piikkauksetbutton");

		piikki.sendAjax("server.cgi", {action: "adminPiikkaukset"}, function(results) {
			if (results.success)
			{
				var piikkaukset = results.piikkaukset; //ordered list
				var container = admin.createTableContainer();
				var table = $("<table/>").css({"border": "1px solid black"});
				table.append($("<tr/>").append(
					"<th>UserId</th>" +
					"<th>ItemId</th>" +
					"<th>UserName</th>" +
					"<th>ItemName</th>" +
					"<th>Value</th>" +
					"<th>Date</th>" + 
					"<th>IP</th>"
				));

				function addToTable(item) {
					var tr = $("<tr/>");
					tr.append($("<td/>").text(item[0]))
					.append($("<td/>").text(item[1]))
					.append($("<td/>").text(item[2]))
					.append($("<td/>").text(item[3]))
					.append($("<td/>").text(item[4]))
					.append($("<td/>").text(item[5]))
					.append($("<td/>").text(item[6]));
					table.append(tr);
				}

				for (var i = piikkaukset.length-1; i >= 0; i--) {
					addToTable(piikkaukset[i]);
				};

				container.append(table);

				content.empty().append(container);
			}
			else
				admin.debugLog("Unable to get piikkaukset.");
		});
	}

	this.buildPaymentsPage = function()
	{
		this.selectButton("paymentsbutton");

		piikki.sendAjax("server.cgi", {action: "adminPayments"}, function(results) {
			if (results.success)
			{
				var payments = results.payments; //ordered list
				var container = admin.createTableContainer();
				var table = $("<table/>").css({"border": "1px solid black"});
				table.append($("<tr/>").append(
					"<th>Id</th>" +
					"<th>Name</th>" +
					"<th>Value</th>" +
					"<th>Date</th>"
				));

				function addToTable(item) {
					var tr = $("<tr/>");
					tr.append($("<td/>").text(item[0]))
					.append($("<td/>").text(item[1]))
					.append($("<td/>").text(item[2].toFixed(2)))
					.append($("<td/>").text(item[3]));
					table.append(tr);
				}

				for (var i = payments.length-1; i >= 0; i--) {
					addToTable(payments[i]);
				};

				container.append(table);

				content.empty().append(container);
			}
			else
				admin.debugLog("Unable to get payments.");
		});
	}

	this.buildLogsPage = function()
	{
		this.selectButton("logsbutton");
		piikki.sendAjax("server.cgi", {action: "adminLogs"}, function(results) {
			content.empty();
			if (results.success)
			{
				var filenames = results.filenames;
				var folder = results.folder;
				
				var code = "List of log files. Most recent files first. Random string at the end of name is for security.<br/><br/>";

				for (var i = filenames.length - 1; i >= 0; i--) {
					code += "<a href='" + folder + "/" + filenames[i] + "'>" + filenames[i] + "</a><br/>";
				}

				content.append(code);
			}
			else
				admin.debugLog("Unable to get logs.");
		});
	}

	this.createTableContainer = function() {
		return $("<div/>").css({
				"display": "inline-block",
				"max-height": "500px",
				"overflow": "scroll",
				"overflow-y": "scroll"
			});
	}

	//private:

	var content = $("#content");
	var navigation = $("#navigation");
}