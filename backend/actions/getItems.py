#!/usr/bin/python
# -*- coding: utf-8 -*-

from .. import mysqlUtil

requiredParameters = []

def execute(fieldStorage):
	con = mysqlUtil.getConnection()
	if con:
		cur = con.cursor()
		cur.execute("select id,name from items where items.visible = 1;")
		ret = cur.fetchall()
		cur.close()
		con.close()
		return {"success": True, "items": ret}
	else:
		return {"success": False}