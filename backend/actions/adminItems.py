#!/usr/bin/python
# -*- coding: utf-8 -*-

from .. import mysqlUtil
import adminMain

requiredParameters = ["subAction"]

def execute(fieldStorage):
	if not adminMain.authenticateAdmin(fieldStorage):
		return {"success": False, "message": "Bad admin username or password"}
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
	else:
		return "unknown subAction " + str(subAction)


def get():
	#result = mysqlUtil.getAllItems()

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

	if not result == None:
		return {"success": True, "items": result}
	else:
		return {"success": False, "message": "fail: " + str(result)}

def add(fieldStorage):
	if not "name" in fieldStorage or not "price" in fieldStorage or not "visible" in fieldStorage:
		return "invalid sub parameters. name, price and visible needed"

	name = fieldStorage["name"].value
	price = float(fieldStorage["price"].value)
	visible = int(fieldStorage["visible"].value)

	sql = "insert into items (name, price, visible) VALUES('"+name+"', "+str(price)+", "+str(visible)+");"
	if mysqlUtil.commitSQLCommand(sql) > 0:
		return "ok"
	return "fail"

def edit(fieldStorage):
	if (not "name" in fieldStorage or not "price" in fieldStorage or
		not "id" in fieldStorage or not "visible" in fieldStorage):
		return "invalid sub parameters. name, price and id needed"


	id = int(fieldStorage["id"].value)
	name = fieldStorage["name"].value
	price = float(fieldStorage["price"].value)
	visible = int(fieldStorage["visible"].value)


	sql = "update items set name='"+name+"', price="+str(price)+", visible="+str(visible)+" where id = " + str(id) + ";"
	if mysqlUtil.commitSQLCommand(sql) > 0:
		return "ok"
	return "fail"

# This shouldn't be used
def remove(fieldStorage):
	if not "id" in fieldStorage:
		return "invalid sub parameters. id needed"

	id = int(fieldStorage["id"].value)

	sql = "delete from items where id = " + str(id) + ";"
	if mysqlUtil.commitSQLCommand(sql) > 0:
		return "ok"
	return "fail"