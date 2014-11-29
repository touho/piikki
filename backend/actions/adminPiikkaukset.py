#!/usr/bin/python
# -*- coding: utf-8 -*-

from .. import mysqlUtil
import adminMain

requiredParameters = []

def execute(fieldStorage):
	if not adminMain.authenticateAdmin(fieldStorage):
		return {"success": False, "message": "Bad admin username or password"}
	ret = mysqlUtil.getAllPiikkaukset(1000)
	if not ret == None:
		return {"success": True, "piikkaukset": ret}
	else:
		return {"success": False}