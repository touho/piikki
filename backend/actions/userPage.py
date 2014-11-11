 #!/usr/bin/python
# -*- coding: utf-8 -*-

from .. import mysqlUtil, util

requiredParameters = ["subAction", "userId"]

def execute(fieldStorage):
	subAction = fieldStorage["subAction"].value
	userId = int(fieldStorage["userId"].value)

	if subAction == "get":
		sql = """select users.id as id, users.name as name, users.email as email,
			users.balance as balance,
			IFNULL(ROUND(SUM(items.price), 2), 0) as piikkaukset,
			IFNULL(paymentsSum,0)
			from users
			left join piikkaukset on users.id = piikkaukset.userId
			left join items on piikkaukset.itemId = items.id
			left join (
			select payments.userId as userId, IFNULL(ROUND(SUM(payments.value), 2), 0) as paymentsSum
			from payments
			group by payments.userId
			) as payments on users.id = payments.userId
			where users.id = """+ str(userId) + """
			group by users.id;"""
		userInformation = mysqlUtil.fetchWithSQLCommand(sql);

		sql = """
			select items.id as id, items.name as name, CAST(IFNULL(mypiikkaukset.value,0) as SIGNED) as count
			from items
			left join (
			select itemId, SUM(value) as value from piikkaukset
			where piikkaukset.userId = """+str(userId)+"""
			group by userId, itemId
			) as mypiikkaukset on items.id = mypiikkaukset.itemId
 			where items.visible = 1 or mypiikkaukset.value > 0
			group by items.id;
		"""
		piikkausInformation = mysqlUtil.fetchWithSQLCommand(sql);

		return {
			"success": True,
			"userInformation": userInformation,
			"piikkausInformation": piikkausInformation,
			"previousCheckpoint": util.getLastCheckpointDate()}
	else:
		return "unknown subAction " + str(subAction)
		