 #!/usr/bin/python
# -*- coding: utf-8 -*-

import datetime, math
from .. import mysqlUtil, util
from adminLogs import writeLogFiles
from adminUsers import reportPaymentImpl

requiredParameters = ["subAction"]

def authenticateAdmin(fieldStorage):
	users = mysqlUtil.getAllUsers()
	if len(users) == 0:
		return True # No users in database. Accept connection!

	if not "adminUsername" in fieldStorage or not "adminPassword" in fieldStorage:
		return False
	user = fieldStorage["adminUsername"].value
	password = fieldStorage["adminPassword"].value
	if len(user) < 1 or len(password) < 1:
		return False

	sql = "select password from users where name='" + user + "' and isAdmin=1;"
	result = mysqlUtil.fetchWithSQLCommand(sql)
	if len(result) > 0:
		realPasswordHash = result[0][0]
		if util.verify(password, realPasswordHash):
			return True

	return False

def execute(fieldStorage):
	if not authenticateAdmin(fieldStorage):
		return {"success": False, "message": "Bad admin username or password"}
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
		return {"success": True, "numItems": itemLen, "numUsers": userLen}
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

def getPaymentDateString():
	return datetime.datetime.today().strftime("%Y-%m-%d")

def clearHistory():

	#Write logs:

	writeLogFiles()
	sql = """
select id,
(ROUND(IFNULL(SUM(payments.value),0),2)-piikkaukset) as balance
from
(select id, name, email, isAdmin, ROUND(IFNULL(SUM(piikkaukset.price),0),2) as piikkaukset
from users
left join piikkaukset on users.id = piikkaukset.userId
group by users.id) as subTable
left join payments on subTable.id = payments.userId
group by subTable.id;
	"""

	#Fetch Balance:

	userData = mysqlUtil.fetchWithSQLCommand(sql);

	#Reset:
	mysqlUtil.resetPiikkauksetAndPayments()


	#Add balance:

	for user in userData:
		id = int(user[0])
		balance = float(user[1])
		if balance != 0:
			reportPaymentImpl(id, balance, getPaymentDateString())

	return "ok"
