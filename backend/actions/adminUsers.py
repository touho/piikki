#!/usr/bin/python
# -*- coding: utf-8 -*-

from .. import mysqlUtil, validationUtil, config, util
from datetime import datetime
from passlib.hash import pbkdf2_sha256
import random, string
import adminMain

requiredParameters = ["subAction"]

def execute(fieldStorage):
	timer = util.Timer("adminUsers Auth")
	if not adminMain.authenticateAdmin(fieldStorage):
		return {"success": False, "message": "Bad admin username or password"}
	subAction = fieldStorage["subAction"].value

	timer.write()

	if subAction == "get":
		timer = util.Timer("adminUsers get function")
		rv = get()
		timer.write()
	elif subAction == "add":
		return add(fieldStorage)
		return {"success": ret == "ok", "message": ret}
	elif subAction == "edit":
		ret = edit(fieldStorage)
		return {"success": ret == "ok", "message": ret}
	elif subAction == "remove":
		ret = remove(fieldStorage)
		return {"success": ret == "ok", "message": ret}
	elif subAction == "reportPayment":
		ret = reportPayment(fieldStorage)
		return {"success": ret == "ok", "message": ret}
	elif subAction == "resetPassword":
		ret = resetPassword(fieldStorage)
		return {"success": ret == "ok", "message": ret}
	else:
		return "unknown subAction " + str(subAction)


def get():

	#IFNULL(ROUND(SUM(piikkaukset.price), 2), 0)

	timer = util.Timer("getAdminUsers sqlStr")

	sql = """
select id, name, email, isAdmin,
ROUND(IFNULL(SUM(payments.value),0),2) as payments,
piikkaukset,
(ROUND(IFNULL(SUM(payments.value),0),2)-piikkaukset) as balance
from
(select id, name, email, isAdmin, ROUND(IFNULL(SUM(piikkaukset.price),0),2) as piikkaukset
from users
left join piikkaukset on users.id = piikkaukset.userId
group by users.id) as subTable
left join payments on subTable.id = payments.userId
group by subTable.id;
	"""
	timer.write()

	timer = util.Timer("getAdminUsers sql")
	result = mysqlUtil.fetchWithSQLCommand(sql);
	timer.write()


	#result = mysqlUtil.getAllUsers()
	if not result == None:
		return {"success": True, "users": result}
	else:
		return {"success": False, "message": "fail: " + str(result)}

def add(fieldStorage):
	requredParams = ["name", "email", "isAdmin"]
	if not validationUtil.requirePOSTParameters(fieldStorage, requredParams):
		return "invalid sub params. required: " + str(requredParams)

	name = fieldStorage["name"].value
	email = fieldStorage["email"].value
	isAdmin = int(fieldStorage["isAdmin"].value)

	sql = "select * from users where name='"+name+"';"
	if mysqlUtil.commitSQLCommand(sql) > 0:
		return {"success": False, "message": "User already"}

	password = ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(50))
	passwordHash = pbkdf2_sha256.encrypt(password);

	sql = "insert into users (name, email, isAdmin, password) VALUES('"+name+"', '"+email+"', "+str(isAdmin)+", '"+passwordHash+"');"
	if mysqlUtil.commitSQLCommand(sql) > 0:
		#Send password as mail
		sql = "select id from users where name='"+name+"';"
		userId = mysqlUtil.fetchWithSQLCommand(sql)[0][0]
		sendPasswordLinkByEmail(userId, password, True)

		return {"success": True, "message": "ok", "userId": userId}
	return {"success": False, "message": "failed to insert user to database"}

def edit(fieldStorage):
	requredParams = ["name", "email", "id", "isAdmin"]
	if not validationUtil.requirePOSTParameters(fieldStorage, requredParams):
		return "invalid sub params. required: " + str(requredParams)


	id = int(fieldStorage["id"].value)
	name = fieldStorage["name"].value
	email = fieldStorage["email"].value
	isAdmin = int(fieldStorage["isAdmin"].value)
	#balance = float(fieldStorage["balance"].value)


	sql = "update users set name='"+name+"', email='"+email+"', isAdmin="+str(isAdmin)+" where id = " + str(id) + ";"
	if mysqlUtil.commitSQLCommand(sql) > 0:
		return "ok"
	return "fail " + str(sql)

def remove(fieldStorage):
	requredParams = ["id"]
	if not validationUtil.requirePOSTParameters(fieldStorage, requredParams):
		return "invalid sub params. required: " + str(requredParams)

	id = int(fieldStorage["id"].value)

	sql = "delete from users where id = " + str(id) + ";"
	if mysqlUtil.commitSQLCommand(sql) > 0:
		return "ok"
	return "fail"

def resetPassword(fieldStorage):
	requredParams = ["id"]
	if not validationUtil.requirePOSTParameters(fieldStorage, requredParams):
		return "invalid sub params. required: " + str(requredParams)

	id = int(fieldStorage["id"].value)

	password = ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(50))
	passwordHash = pbkdf2_sha256.encrypt(password);

	sql = "update users set password='"+passwordHash+"' where id = " + str(id) + ";"
	if mysqlUtil.commitSQLCommand(sql) > 0:
		sendPasswordLinkByEmail(id, password, False)
		return "ok"
	return "fail"

def reportPayment(fieldStorage):
	requredParams = ["value", "date", "id"]
	if not validationUtil.requirePOSTParameters(fieldStorage, requredParams):
		return "invalid sub params. required: " + str(requredParams)

	try:
		id = int(fieldStorage["id"].value)
		value = float(fieldStorage["value"].value)
		date = fieldStorage["date"].value
		dateTest = datetime.strptime(date, "%Y-%m-%d")
	except:
		return "Bad parameters"

	if value == 0:
		return "Can't pay zero"

	if reportPaymentImpl(id, value, date) > 0:
		return "ok"
	return "fail"

def reportPaymentImpl(id, value, date):
	sql = "insert into payments (userId, value, date) VALUES("+str(id)+", "+str(value)+", '"+date+"');"
	return mysqlUtil.commitSQLCommand(sql)

def sendPasswordLinkByEmail(userId, password, newUser):
	sql = "select name from users where id=" + str(userId) + ";"
	username = mysqlUtil.fetchWithSQLCommand(sql)
	if len(username) > 0:
		username = str(username[0][0])

	link = config.baseUrl + "?id=" + str(userId) + "&p=" + password

   	# TODO: Send email
   	message = "Error"
   	if newUser:
   		message = """Hei, """ + username + """!

Sinulle on tehty tunnukset piikkisivulle. Aktivoi tunnuksesi syöttämällä salasana osoiteessa:
""" + link + """

Terveisin: Piikki        Mestari"""
   	else:
   		message = """Hei, """ + username + """!

Salasanasi piikkisivulla on resetoitu. Syötä uusi salasana osoiteessa:
""" + link + """

Terveisin: Piikki        Mestari"""

   	# DEBUG: write it to a file
	with open("logs/emailDebug.txt", "w") as myfile:
   		myfile.write(message)
