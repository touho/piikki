#!/usr/bin/python
# -*- coding: utf-8 -*-

from .. import mysqlUtil

requiredParameters = []

def execute(fieldStorage):
	ret = mysqlUtil.getAllPiikkaukset(1000)
	if not ret == None:
		return {"success": True, "piikkaukset": ret}
	else:
		return {"success": False}