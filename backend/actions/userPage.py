 #!/usr/bin/python
# -*- coding: utf-8 -*-

from .. import mysqlUtil, util, validationUtil

requiredParameters = ["subAction", "userId", "password"]

def execute(fieldStorage):
	subAction = fieldStorage["subAction"].value
	password = fieldStorage["password"].value
	userId = int(fieldStorage["userId"].value)

	if not mysqlUtil.isValidUserIdAndPassword(userId, password):
		return {"success": False}

	if subAction == "get":
		sql = """
select id, name, email, isAdmin,
(ROUND(IFNULL(SUM(payments.value),0),2)-piikkaukset) as balance
from
(select id, name, email, isAdmin, ROUND(IFNULL(SUM(piikkaukset.price),0),2) as piikkaukset
from users
left join piikkaukset on users.id = piikkaukset.userId
group by users.id) as subTable
left join payments on subTable.id = payments.userId
where subTable.id = """+ str(userId) + """
group by subTable.id;
		"""
		userInformation = mysqlUtil.fetchWithSQLCommand(sql);

		sql = """
select id, name, value, DATE_FORMAT(date, '%a %d.%m.%Y %H:%i') as formattedDate, ip, originalUser
from piikkaukset
left join items on items.id = itemId
where userId = """+ str(userId) + """
order by date desc
limit 10;
		"""
		piikkausInformation = mysqlUtil.fetchWithSQLCommand(sql);

		sql = """
select userId, value, DATE_FORMAT(date, '%d.%m.%Y') as formattedDate
from payments
where userId = """+ str(userId) + """
order by date desc
limit 3;
		"""
		paymentInformation = mysqlUtil.fetchWithSQLCommand(sql);

		return {
			"success": True,
			"userInformation": userInformation,
			"piikkausInformation": piikkausInformation,
			"paymentInformation": paymentInformation
		}
	elif subAction == "changeEmail":
		requredParams = ["email"]
		if not validationUtil.requirePOSTParameters(fieldStorage, requredParams):
			return "invalid sub params. required: " + str(requredParams)

		email = fieldStorage["email"].value;

		sql = "update users set email='"+email+"' where id = " + str(userId) + ";"
		if mysqlUtil.commitSQLCommand(sql) > 0:
			return {
				"success": True,
				"message": "ok"
			}
		return {"success": False, "message": "Unable to change email."}
	else:
		return "unknown subAction " + str(subAction)
		