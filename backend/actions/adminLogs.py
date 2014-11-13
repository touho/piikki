 #!/usr/bin/python
# -*- coding: utf-8 -*-

import os, datetime, string, random, csv
from .. import mysqlUtil

requiredParameters = ["subAction"]

def execute(fieldStorage):
	subAction = fieldStorage["subAction"].value

	if subAction == "get":
		csvfiles = [ f for f in os.listdir("logs") if ".csv" in f ]
		return {"success": True, "folder": "logs", "filenames": csvfiles}
	elif subAction == "write":
		ret = writeLogFiles()
		return {"success": ret == "ok", "message": ret}


def writeLogFile(mysqlData, name, datestring):
	randomString = ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(6))
	filename = "logs/" + datestring + "_" + name + "_" + randomString + ".csv"
	with open(filename, 'wb') as csvfile:
		writer = csv.writer(csvfile)
		for row in mysqlData:
			writer.writerow(row)

def writeLogFiles():
	datestring = getLogDateString()

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
	result = mysqlUtil.fetchWithSQLCommand(sql);
	if result:
		result = list(result)
		result.insert(0, ["Id", "Name", "Email", "IsAdmin", "Payments", "Piikkaukset", "Balance"])
		writeLogFile(result, "users", datestring)

	sql = """
select items.id as id,
items.name as name,
items.price as price,
items.visible as visible,
CAST(IFNULL(SUM(piikkaukset.value),0) as SIGNED) as piikkaukset,
IFNULL(SUM(piikkaukset.price),0) as earnings
from items
left join piikkaukset on items.id = piikkaukset.itemId
group by items.id;
	"""
	result = mysqlUtil.fetchWithSQLCommand(sql);
	if result:
		result = list(result)
		result.insert(0, ["Id", "Name", "Price", "Visible", "Piikkaukset", "Earnings"])
		writeLogFile(result, "items", datestring)

	result = list(mysqlUtil.getAllPiikkaukset())
	result.insert(0, ["UserId", "ItemId", "User", "Item", "Value", "Price", "Date", "IP"])
	if result:
		writeLogFile(result, "piikkaukset", datestring)

	result = list(mysqlUtil.getAllPayments())
	result.insert(0, ["UserId", "User", "Value", "Date"])
	if result:
		writeLogFile(result, "payments", datestring)
		
	return "ok"

def getLogDateString():
	return datetime.datetime.today().strftime("%Y-%m-%d_%H-%M-%S")