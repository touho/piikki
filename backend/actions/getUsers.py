#!/usr/bin/python
# -*- coding: utf-8 -*-

from .. import mysqlUtil

requiredParameters = []

def execute(fieldStorage):
	#mysqlUtil.dropTables()
	mysqlUtil.createTables()

	con = mysqlUtil.getConnection()
	if con:
		cur = con.cursor()
		cur.execute("select id,name from users;")
		ret = cur.fetchall()
		cur.close()
		con.close()
		return {"success": True, "users": ret}
	else:
		return {"success": False}