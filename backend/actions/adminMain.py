 #!/usr/bin/python
# -*- coding: utf-8 -*-

import datetime, math
from .. import mysqlUtil, util, config
from adminLogs import writeLogFiles
from adminUsers import reportPaymentImpl
import time

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

	users = mysqlUtil.getAllUsers()

	with open("logs/mailErrors.txt", "w") as myfile:
		try:
			myfile.write("Errors:\n")
		except:
			pass

	def setStatus(status, sent, total):
		try:
			with open("logs/mailStatus.txt", "w") as myfile:
	   			myfile.write(status + "\n")
	   			myfile.write(str(sent) + "\n")
	   			myfile.write(str(total) + "\n")
	   	except:
	   		pass

	total = len(users)
	sent = 0

	for user in users:
		userId = user[0]
		name = user[1]
		email = user[2]
		isAdmin = user[3]

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
		balance = float(userInformation[0][4])

		date = datetime.datetime.today().strftime("%d.%m.%Y")

		# get rid of negative zero
		saldoStr = "%.2f" % math.copysign(balance, balance+0.0001)
		billStr = "%.2f" % math.copysign(-balance, -balance+0.0001)

		saldoStr = saldoStr.replace(".", ",")
		billStr = billStr.replace(".", ",")

		subject = "Piikkilaskusi " + date
		message = "Hei, " + name + "!\n\n"
		message += "Piikkitilisi saldo on " + saldoStr + ".\n\n"

		if balance < -0.0001:
			message += "Maksathan piikkilaskusi mahdollisimman pian!\n\n"
			message += "Saaja: "+config.bank_username+"\n"
			message += "Tili: "+config.bank_address+"\n"
			message += "Summa: " + billStr + "\n"

			if balance < -50:
				message += "\nOletpas sinä juonut! Taidat olla huppelissa nytkin. Muistathan, että liian iso piikkisaldo voi viedä piikkausoikeuden.\n"
		elif balance < 0.0001:
			continue
		else:
			message += "Saldosi on positiivinen, joten sinulta ei vaadita toimenpiteitä."

		try:
			util.sendEmail(email, name, subject, message)
		except Exception as e:
			with open("logs/mailErrors.txt", "a") as myfile:
				myfile.write("Error while sending mail to " + name + " <" + email + "> " + str(e) + "\n");

		sent += 1
		setStatus("Sending emails", sent, total)
		time.sleep(2);

		with open("logs/emailDebug.txt", "w") as myfile:
			try:
   				myfile.write(message)
   			except:
   				pass

   	try:
		setStatus("Emails sent", sent, total)
	except:
		pass
	time.sleep(5)

	# Do this two times to make sure the status is written
	try:
		setStatus("Email sender ready", 0, 0)
	except:
		pass
	time.sleep(1)
	try:
		setStatus("Email sender ready", 0, 0)
	except:
		pass

	return "ok"


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
