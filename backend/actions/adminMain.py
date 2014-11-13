 #!/usr/bin/python
# -*- coding: utf-8 -*-

import datetime, math
from .. import mysqlUtil, util
from adminLogs import writeLogFiles

requiredParameters = ["subAction"]

def execute(fieldStorage):
	subAction = fieldStorage["subAction"].value


	if subAction == "get":
		users = mysqlUtil.getAllUsers()
		items = mysqlUtil.getAllItems()
		userLen = 0
		itemLen = 0
		if users != None:
			userLen = len(users)
		if items != None:
			itemLen = len(items)
		return {"numItems": itemLen, "numUsers": userLen, "lastCheckpoint": util.getLastCheckpointDate("%d.%m.%Y %H:%M:%S")}
	elif subAction == "reset":
		mysqlUtil.dropTables()
		mysqlUtil.createTables()
		return {"success": True}
	elif subAction == "sendPaymentRequest":
		ret = sendPaymentRequest()
		return {"success": ret == "ok", "message": ret}
	elif subAction == "clearHistory":
		ret = clearHistory()
		return {"success": ret == "ok", "message": ret}
	else:
		return "unknown subAction " + str(subAction)


def sendPaymentRequest():

	# Balance = Balance - Piikkausten summa
	sql = """
		update users
		inner join
		(select users.id as userId, SUM(items.price) as piikkaukset
		from users
		left join piikkaukset on users.id = piikkaukset.userId
		left join items on piikkaukset.itemId = items.id
		group by users.id)
		as sum on users.id = sum.userId
		set users.balance = IFNULL(users.balance, 0) - IFNULL(sum.piikkaukset, 0);
	"""
	"""
	con = mysqlUtil.getConnection()
	if not con:
		return "fail"
	cur = con.cursor()
	cur.execute(sql)

	# Don't commit yet.

	datestring = getLogDateString()

	ret = list(mysqlUtil.getAllPiikkaukset())
	ret.insert(0, ["UserId", "ItemId", "User", "Item", "Value", "Date", "IP"])
	if ret:
		writeLogFile(ret, "piikkaukset", datestring)

	ret = list(mysqlUtil.getAllPayments())
	ret.insert(0, ["UserId", "User", "Value", "Date"])
	if ret:
		writeLogFile(ret, "payments", datestring)

	cur.close()
	con.commit() # Now commit
	con.close()

	ret = list(mysqlUtil.getAllUsers())
	ret.insert(0, ["UserId", "UserName", "Email", "Balance"])
	if ret:
		writeLogFile(ret, "users", datestring)

	sendEmail()
	
	mysqlUtil.resetPiikkauksetAndPayments()

	sql = "delete from items where items.toBeRemoved = 1;"
	mysqlUtil.commitSQLCommand(sql)
	"""

	sendEmail()
	
	return "fail"

def sendEmail():
	users = mysqlUtil.getAllUsers()

	for user in users:
		name = user[1]
		email = user[2]
		balance = user[3]

		date = datetime.datetime.today().strftime("%d.%m.%Y")

		# get rid of negative zero
		balanceStr = "%.2f" % math.copysign(-balance, -balance+0.0001)

		sender = "Piikkimestari"
		header = "Piikkilaskusi " + date
		message = "Hei, " + name + "!\n\n"
		message += "Piikkilaskusi on " + balanceStr + "e."


		#TODO: sendEmailImpl(sender, email, header, message)

def clearHistory():
	writeLogFiles()
	#TODO: Fetch balance for all users
	mysqlUtil.resetPiikkauksetAndPayments()
	#TODO: Add initial payment (balance)
	return "fail"
	return "ok"
