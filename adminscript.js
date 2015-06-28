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

	var adminUsername = "";
	var adminPassword = "";

	var emailPollingInterval = null;
	this.clearIntervals = function(){
		if (emailPollingInterval)
			clearInterval(emailPollingInterval);
		emailPollingInterval = null;
	}

	this.init = function()
	{
		if (piikki.common_password.length > 0)
			navigation.find("span").eq(0).click();

		else
			window.location = "./index.html";
	}

	this.doAuthentication = function()
	{
		var user = document.getElementById("usernameinput");
		var pass = document.getElementById("passwordinput");

		if (user && pass && user.value.length > 0 && pass.value.length > 0) {
			adminUsername = user.value;
			adminPassword = pass.value;
			navigation.find("span").eq(0).click();
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
			admin.doAuthentication();
		}
	}
	this.buildAuthenticationPage = function()
	{
		this.clearIntervals();
		var code = "";
		code += "<input id='usernameinput' onkeydown='admin.authUsernameKeyPress(event);' type='text' placeholder='Koko nimesi?'/><br/>";
		code += "<input id='passwordinput' onkeydown='admin.authPasswordKeyPress(event);' type='password' placeholder='Salasanasi?'/><br/>";
		code += "<button onclick='admin.doAuthentication();' id='authbutton'>Tunnistaudu</button>";

		content.html(code);
		document.getElementById("usernameinput").focus();
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

	//Not in gui. Use from commandline
	this.resetDatabase = function() {
		if (!confirm("Are you sure you want to reset whole database?")) return;
		admin.sendAjax("server.fcgi", {"action": "adminMain", "subAction": "reset"}, function(results) {
			if (results.success)
				alert(doneText);
			else
				alert("Error! " + doneText + " And it failed!")
			admin.buildMainPage();
		});
	}

	this.createMainPageInterval = function()
	{
		emailPollingInterval = setInterval(function(){
			$.get("logs/mailStatus.txt").done(function(result){
				if (result)
				{
					result = result.split("\n");
					if (result.length > 2) {
						var html = "Status: " + result[0] + "<br/>";
						if (result[2] != "0")
							html += "Progress: " + result[1] + "/" + result[2];
						$(".mailStatusInformation").html(html);

						if (result[0] == "Email sender idling")
							admin.clearIntervals();
					}
				}
			});
			$.get("logs/mailErrors.txt").done(function(result){
				$(".mailErrorsInformation").text(result);
			});
		}, 1000);
	}
	this.buildMainPage = function()
	{
		this.clearIntervals();
		this.selectButton("mainbutton");
		admin.sendAjax("server.fcgi", {action: "adminMain", subAction: "get"}, function(results) {
			if (!results.success) {
				admin.buildAuthenticationPage();
				return;
			}
			var code = "Database has " + results.numUsers + " users and " + results.numItems + " items.<br/>";
			code += "<br/><br/>";
			code += "Admin commands:";
			content.html(code);


			function addAdminAction(name, listBegin, list, confirmationText, actionParams, doneText, dangerous) {
				var button = $("<button/>").text(name + "!").click(function(){
					if (confirmationText.length == 0 || confirm(confirmationText))
					{
						actionParams["action"] = "adminMain";
						admin.sendAjax("server.fcgi", actionParams, function(results) {
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

				admin.createMainPageInterval();
			}
			addAdminAction("Send Payment Requests", "When you request payment", [
				"TODO: everything...",
				"An email will be sent to all users",
				"Email will tell the current balance of the user",
				"Email will include the information how to pay"],
				"Sending Payment Request. Are you sure?", {subAction: "sendPaymentRequest"}, "Payment request sent!", false);

			content.append("Email sender:<div style='border: solid 1px black'><div style='margin-bottom: 10px;' class='mailStatusInformation'></div><div class='mailErrorsInformation'></div></div>");
			admin.createMainPageInterval();

			addAdminAction("Clear history", "When you clear history", [
				"Current data will be saved as a log .csv file",
				"Piikkaus history will be cleared",
				"Payment history will be cleared",
				"An initial payment will be added for all users, containing the current balance"],
				"Clearing history data. Are you sure?", {subAction: "clearHistory"}, "History cleared!", true);

			/*
			addAdminAction("Reset Database", "When you reset database", [
				"Users are deleted",
				"Items are deleted",
				"Piikkaukset are deleted",
				"Payments are deleted",
				"Logs will not be deleted"],
				"Are you sure to delete EVERYTHING?", {subAction: "reset"}, "Database reseted!", true);
			*/

			content.append("<hr/>");
		});
	}

	this.getCurrentDateString = function()
	{
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
		return "" + yyyy + "-" + mm + "-" + dd;
	}

	this.buildUsersOrItems = function(isUsers, buttonId, action, smallCaseName, bigCaseName)
	{
		this.clearIntervals();
		var buttonId = isUsers ? "usersbutton" : "itemsbutton";
		var action = isUsers ? "adminUsers" : "adminItems";
		var smallCaseName = isUsers ? "user" : "item";
		var smallCaseNames = isUsers ? "users" : "items";
		var bigCaseName = isUsers ? "User" : "Item";
		var bigCaseNames = isUsers ? "Users" : "Items";
		var rebuildCommand = function(){ if (isUsers) admin.buildUsersPage(); else admin.buildItemsPage();};

		this.selectButton(buttonId);
		admin.sendAjax("server.fcgi", {action: action, subAction: "get"}, function(results) {
			if (!results.success) {
				admin.buildAuthenticationPage();
				return;
			}

			var things = results[smallCaseNames];

			content.empty();
			if (isUsers && things.length == 0) {
				var span = $("<span/>").css({"color": "red", "font-weight": "bold"}).text("NOTE! You should add admin user first!");
				content.append(span).append("<br/>");
			}
			content.append(bigCaseNames+": " + things.length + "<br/>");

			function addThingToTable(thingArray, table) {
				var tr = $("<tr/>");
				var id = $("<td/>").text(thingArray[0]);
				var name = $("<td/>").text(thingArray[1]);
				if (isUsers)
				{
					var email = $("<td/>").text(thingArray[2]);
					if (!admin.validateEmail(email.text())) email.addClass("invalidEmail");
					var isAdmin = $("<td/>").text(thingArray[3] == "1" ? "Yes" : "No").attr("title", "Is admin");
					var payments = $("<td/>").text(thingArray[4].toFixed(2)).attr("title",
						"Payments is the sum of all payments that admin has reported.");
					var piikkaukset = $("<td/>").text(thingArray[5].toFixed(2)).attr("title",
						"Piikkaukset is total value how much user has piikked.");
					var balance = $("<td/>").text(thingArray[6].toFixed(2)).attr("title",
						"Balance means how much user has money in piikki bank. Balance = Payments - Piikkaukset");
				}
				else
				{
					var price = $("<td/>").text(thingArray[2].toFixed(2));
					var visible = $("<td/>").text(thingArray[3] == "1" ? "Yes" : "No");
					piikkaukset = $("<td/>").text(parseInt(thingArray[4])).attr("title",
						"Piikkaukset means how many time this item has been piikke'd.");
					var earnings = $("<td/>").text(thingArray[5].toFixed(2)).attr("title",
						"Earnings means how much piikkaukset have cost in total.");

					if (visible.text() == "No") {
						tr.addClass("disabledItem");
					}
				}

				var editButton = $("<button/>").text("Edit").click(function() {
					var nameInput = $("<input/>").attr("type", "text").val(name.text());
					var emailInput = $("<input/>").attr("type", "text").val(email ? email.text() : "");
					var priceInput = $("<input/>").attr("type", "text").val( price ? price.text() : "");

					var visibleInput = $("<input/>").attr("type", "checkbox");
					if (visible && visible.text() == "Yes") visibleInput.attr("checked", "checked");
					else visibleInput.removeAttr("checked");

					var isAdminInput = $("<input/>").attr("type", "checkbox");
					if (isAdmin && isAdmin.text() == "Yes") isAdminInput.attr("checked", "checked");
					else isAdminInput.removeAttr("checked");


					var submitButton = $("<button/>").text("Submit changes!").click(function(){
						admin.sendAjax("server.fcgi", {
							action: action,
							subAction: "edit",
							id: parseInt(id.text()),
							name: nameInput.val(),
							email: emailInput.val(),
							price: parseFloat(priceInput.val()),
							visible: visibleInput.is(":checked") ? 1 : 0,
							isAdmin: isAdminInput.is(":checked") ? 1 : 0
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
						inputArea.append("<br/>Is Admin: ").append(isAdminInput);
					}
					else
					{
						inputArea.append("<br/>Price: ").append(priceInput);
						inputArea.append("<br/>Visible: ").append(visibleInput);
					}

					inputArea.append("<br/>");
					inputArea.append(submitButton);
					nameInput.focus();
				});

				if (isUsers)
				{
					var paymentButton = $("<button/>").text("Report Payment").click(function() {
						var valueInput = $("<input/>").attr("type", "text").val("0.0");
						var dateInput = $("<input/>").attr("type", "text").val(admin.getCurrentDateString());

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

							admin.sendAjax("server.fcgi", {
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

					var resetPasswordButton = $("<button/>").text("Reset Password").click(function() {
						if (!confirm("Are you sure you want to reset user's password and set it by email?")) return;
						admin.sendAjax("server.fcgi", {
							action: action,
							subAction: "resetPassword",
							id: parseInt(id.text())
						}, function(resetResults) {
							if (resetResults.success)
							{
								alert("Password reseted and sent as email.");
								rebuildCommand();
							}
							else
								admin.debugLog("Error while reseting password: " + resetResults.message);
						});
					});

					var removeButton = $("<button/>").text("Remove").click(function() {
						if (isUsers)
							var confirmation = "Are you sure you want to remove user '" + name.text() + "' with balance of " + balance.text() + "?";
						//else
						//	confirmation = "Are you sure you want to remove item '" + name.text() + "'?";

						if (confirm(confirmation))
						{
							admin.sendAjax("server.fcgi", {
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
					tr.append(isAdmin);
					tr.append(payments);
					tr.append(piikkaukset);
					tr.append(balance);
				}
				else
				{
					tr.append(price);
					tr.append(visible);
					tr.append(piikkaukset);
					tr.append(earnings);
				}

				var td = $("<td/>").append(editButton);
				if (isUsers)
				{
					td.append(paymentButton);
					td.append(resetPasswordButton);
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
				"<th>Is Admin</th>" +
				"<th>Payments</th>" +
				"<th>Piikkausten Arvo</th>" +
				"<th>Balance</th>"
				)
				:
				("<th>Price</th>" +
				"<th>Visible</th>" +
				"<th>Piikkaukset</th>" +
				"<th>Earnings</th>")
				) +
				"<th></th>"
			));
			for (var i = 0; i < things.length; i++)
				addThingToTable(things[i], table);

			tableContainer.append(table);
			content.append(tableContainer).append("<br/>");
			if (isUsers)
			{
				var totalPayments = 0;
				table.find("tr").find("td:eq(4)").each(function(){
					totalPayments += parseFloat($(this).text());
				});
				var totalBalance = 0;
				table.find("tr").find("td:eq(6)").each(function(){
					totalBalance += parseFloat($(this).text());
				});
				var totalPiikkaustenArvo = 0;
				table.find("tr").find("td:eq(5)").each(function(){
					totalPiikkaustenArvo += parseFloat($(this).text());
				});
				content.append("Total Payments: "+totalPayments.toFixed(2)+"<br/>");
				content.append("Total Piikkausten Arvo: "+totalPiikkaustenArvo.toFixed(2)+"<br/>");
				content.append("Total Balance: "+totalBalance.toFixed(2)+"<br/>");
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
				var isAdminInput = $("<input/>").attr("type", "checkbox");
				if (isUsers && things.length == 0) {
					isAdminInput.attr({"checked": "checked", "disabled": true});
				}
				var addButton2 = $("<button/>").text("Add!").click(function(){
					admin.sendAjax("server.fcgi", {
						action: action,
						subAction: "add",
						name: nameInput.val(),
						email: emailInput.val(),
						visible: visibleInput.is(":checked") ? 1 : 0,
						isAdmin: isAdminInput.is(":checked") ? 1 : 0,
						price: parseFloat(priceInput.val())
					}, function(addResults) {
						if (addResults.success)
						{
							if (things.length == 0 && isUsers) {
								alert("Admin user created. It must be activated from the link in email.");
							}
							rebuildCommand();
						}
						else
							admin.debugLog("Error while inserting "+smallCaseName+": " + addResults.message);
					});
				});
				inputArea.empty().append("Add new "+smallCaseName+":<br/>")
					.append("Name: ").append(nameInput);

				if (isUsers)
				{
					inputArea.append("<br/>Email: ").append(emailInput);
					inputArea.append("<br/>Is Admin: ").append(isAdminInput);
				}
				else
				{
					inputArea.append("<br/>Price: ").append(priceInput);
					inputArea.append("<br/>Visible: ").append(visibleInput);
				}

				inputArea.append("<br/>");
				inputArea.append(addButton2);
				if (isUsers) inputArea.append("<font size=1>Password link will be sent by email.</font>");

				nameInput.focus();
			});
			content.append("<br/>").append(addButton);

			if (isUsers) {
				var loadButton = $("<input/>").attr({"type": "file", title: "Format: name;email;[balance];[isAdmin 1|0]"});
				if (things.length == 0)
					loadButton.attr("disabled", true);
				loadButton.change(function(e)
				{
					if (e && e.target && e.target.files && e.target.files.length >= 1) {
						var fileReader = null;

						try {
							fileReader = new FileReader();
						}
						catch (e) {
						}
						if (fileReader != null)
						{
							fileReader.onload = function(e){
								var errors = 0;
								var waitCount = 0;
								var addedUsers = 0;
								var addedPayments = 0;

								function addUser(name, email, balance, isAdmin)
								{
									waitCount++;
									admin.sendAjax("server.fcgi", {
										action: action,
										subAction: "add",
										name: name,
										email: email,
										isAdmin: isAdmin,
									}, function(addResults) {
										waitCount--;
										if (addResults.success)
										{
											addedUsers++;
											if (balance != 0) {
												waitCount++;
												admin.sendAjax("server.fcgi", {
													action: action,
													subAction: "reportPayment",
													id: addResults.userId,
													value: balance,
													date: admin.getCurrentDateString(),
												}, function(editResults) {
													waitCount--;
													if (editResults.success)
														addedPayments++;
													else
														errors += 1;
												});
											}
										}
										else
											errors += 1;
									});
								}

								var lines = e.target.result.split("\n");
								for (var i = 0; i < lines.length; i++) {
									if (lines[i].length < 2) continue;

									var lineData = lines[i].split(";");
									if (lineData.length < 2) {
										continue;
									}
									var name = lineData[0];
									var email = lineData[1];

									if (name.length < 2) {
										continue;
									}

									if (email.length < 2) {
										errors += 1; //name found but email missing
										continue;
									}

									var balance = lineData.length >= 3 ? parseFloat(lineData[2]) : 0;
									if (isNaN(balance)) {
										balance = 0;
									}
									var isAdmin = lineData.length >= 4 ? parseInt(lineData[3]) : 0;
									if (isAdmin !== 1) {
										isAdmin = 0;
									}

									addUser(name, email, balance, isAdmin);
								}

								var interval = setInterval(function(){
									var progress = addedUsers
									loadLabel.text("Adding users... " + addedUsers + " users and " + addedPayments + " payments. Operations in queue: " + waitCount );
									if (waitCount > 0) return;
									clearInterval(interval);

									if (errors == 0)
									{
										alert("" + addedUsers + " users added successfully!");
									}
									else
										alert("Import error! Users added: " + addedUsers + ". Errors occured: " + errors);

									admin.buildUsersPage();
								}, 100);
							}
							var file = e.target.files[0];
							fileReader.readAsText(file);
							loadButton.hide();
							var loadLabel = $("<span/>").text("Adding users...");
							loadButton.after(loadLabel);
						}
					}
					setTimeout(function(){loadButton.val("");}, 5000);
				});
				content.append("<br/>Add users from csv file: ").append(loadButton);
			}

			content.append("<br/>").append(inputArea);

			sorttable.makeSortable(table.get(0));
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
		this.clearIntervals();
		this.selectButton("piikkauksetbutton");

		admin.sendAjax("server.fcgi", {action: "adminPiikkaukset"}, function(results) {
			if (!results.success) {
				admin.buildAuthenticationPage();
				return;
			}
			if (results.success)
			{
				var piikkaukset = results.piikkaukset; //ordered list
				var container = admin.createTableContainer();
				var table = $("<table/>").css({"border": "1px solid black"}).addClass("sortable");
				table.append($("<tr/>").append(
					"<th>UserId</th>" +
					"<th>ItemId</th>" +
					"<th>UserName</th>" +
					"<th>ItemName</th>" +
					"<th>Value</th>" +
					"<th>Price</th>" +
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
					.append($("<td/>").text(item[6]))
					.append($("<td/>").text(item[7]));
					table.append(tr);
				}

				for (var i = piikkaukset.length-1; i >= 0; i--) {
					addToTable(piikkaukset[i]);
				};

				container.append(table);

				content.empty().append(container);

				sorttable.makeSortable(table.get(0));
			}
			else
				admin.debugLog("Unable to get piikkaukset.");
		});
	}

	this.buildPaymentsPage = function()
	{
		this.clearIntervals();
		this.selectButton("paymentsbutton");

		admin.sendAjax("server.fcgi", {action: "adminPayments"}, function(results) {
			if (!results.success) {
				admin.buildAuthenticationPage();
				return;
			}
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

				sorttable.makeSortable(table.get(0));
			}
			else
				admin.debugLog("Unable to get payments.");
		});
	}

	this.buildLogsPage = function()
	{
		this.clearIntervals();
		this.selectButton("logsbutton");
		admin.sendAjax("server.fcgi", {action: "adminLogs", subAction: "get"}, function(results) {
			if (!results.success) {
				admin.buildAuthenticationPage();
				return;
			}
			content.empty();
			if (results.success)
			{
				var filenames = results.filenames;
				var folder = results.folder;

				var writeButton = $("<button/>").text("Write logs").click(function() {
					admin.sendAjax("server.fcgi", {
						action: "adminLogs",
						subAction: "write"
					}, function(results) {
						if (results.success)
						{
							admin.buildLogsPage();
							alert("Log files written!");
						}
						else
							admin.debugLog("Error while writing logs: " + results.message);
					});
				});

				var code = "<br/><br/><b>List of logs:</b><br/>";

				for (var i = filenames.length - 1; i >= 0; i--) {
					code += "<a href='" + folder + "/" + filenames[i] + "'>" + filenames[i] + "</a><br/>";
				}

				content.append("You can write all data to log files. Nothing will get deleted.<br/>");
				content.append("Since nothing is deleted, creating log files often will create much duplicate information.<br/>");
				content.append(writeButton).append(code);
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

	this.validateEmail = function(email) {
		var atIndex = email.indexOf("@");
		var dotIndex = email.lastIndexOf(".");

		if (atIndex < 1 || dotIndex < 3) return false;

		if (dotIndex <= atIndex + 1) return false;
		if (dotIndex + 2 > email.length) return false;

		return true;
	}

	this.sendAjax = function() {
		arguments[1].adminUsername = adminUsername;
		arguments[1].adminPassword = adminPassword;
		piikki.sendAjax.apply(piikki, arguments);
	}

	//private:

	var content = $("#content");
	var navigation = $("#navigation");
}
