#!/usr/bin/python
# -*- coding: utf-8 -*-

from .. import mysqlUtil
from datetime import datetime

requiredParameters = ["subAction"]

def execute(fieldStorage):
	subAction = fieldStorage["subAction"].value

	if subAction == "get":
		return get()
	elif subAction == "add":
		ret = add(fieldStorage)
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
	else:
		return "unknown subAction " + str(subAction)


def get():

	sql = """select users.id as id, users.name as name, users.email as email, users.balance as balance, IFNULL(ROUND(SUM(items.price), 2), 0) as piikkaukset
		from users
		left join piikkaukset on users.id = piikkaukset.userId
		left join items on piikkaukset.itemId = items.id
		group by users.id;"""
	result = mysqlUtil.fetchWithSQLCommand(sql);
	#result = mysqlUtil.getAllUsers()
	if not result == None:
		return {"success": True, "users": result}
	else:
		return {"success": False, "message": "fail: " + str(result)}

def add(fieldStorage):
	if not "name" in fieldStorage or not "email" in fieldStorage:
		return "invalid sub parameters. name and email needed"

	name = fieldStorage["name"].value
	email = fieldStorage["email"].value

	sql = "insert into users (name, email, balance) VALUES('"+name+"', '"+email+"', 0.0);"
	if mysqlUtil.commitSQLCommand(sql) > 0:
		return "ok"
	return "fail"

def edit(fieldStorage):
	if not "name" in fieldStorage or not "email" in fieldStorage or not "id" in fieldStorage:
		return "invalid sub parameters. name, id and email needed"


	id = int(fieldStorage["id"].value)
	name = fieldStorage["name"].value
	email = fieldStorage["email"].value
	#balance = float(fieldStorage["balance"].value)


	sql = "update users set name='"+name+"', email='"+email+"' where id = " + str(id) + ";"
	if mysqlUtil.commitSQLCommand(sql) > 0:
		return "ok"
	return "fail"

def remove(fieldStorage):
	if not "id" in fieldStorage:
		return "invalid sub parameters. id needed"

	id = int(fieldStorage["id"].value)

	sql = "delete from users where id = " + str(id) + ";"
	if mysqlUtil.commitSQLCommand(sql) > 0:
		return "ok"
	return "fail"


def reportPayment(fieldStorage):
	if not "id" in fieldStorage or not "value" in fieldStorage or not "date" in fieldStorage:
		return "invalid sub parameters. id, value and date needed"

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
	con = mysqlUtil.getConnection()
	if con:
		cur = con.cursor()

		sql = "insert into payments (userId, value, date) VALUES("+str(id)+", "+str(value)+", '"+date+"');"
		num = cur.execute(sql)
		if num == 0:
			cur.close()
			con.close()
			return 0

		sql = "update users set balance = IFNULL(balance, 0) + "+str(value)+" where id = "+str(id)+";"
		num = cur.execute(sql)
		if num == 0:
			cur.close()
			con.close()
			return 0

		#If we get here, both mysql commands were successful
		#we can commit the changes

		cur.close()
		con.commit()
		con.close()
		return num
	return 0