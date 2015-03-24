#!/usr/bin/python
# -*- coding: utf-8 -*-

import validationUtil, config, mysqlUtil, util

from actions import (piikkaus, getUsers, getItems, userPage,
	adminMain, adminUsers, adminItems, adminPiikkaukset, adminPayments, adminLogs)

modules = {
	"piikkaus": piikkaus,
	"getUsers": getUsers,
	"getItems": getItems,
	"userPage": userPage,
	"adminMain": adminMain,
	"adminUsers": adminUsers,
	"adminItems": adminItems,
	"adminPiikkaukset": adminPiikkaukset,
	"adminLogs": adminLogs,
	"adminPayments": adminPayments
}

def executeAction(fieldStorage, ip):

	if "common_password" not in fieldStorage or ("userId" in fieldStorage and "newPassword" in fieldStorage):
		return authentication(fieldStorage)
	if fieldStorage["common_password"].value != config.common_password:
		return {"success": False, "message": "bad common password"}
	if "action" not in fieldStorage:
		return "action not given"

	fieldStorage.ip = ip

	action = fieldStorage["action"].value

	if action in modules:
		rv = executeActionImpl(modules[action], fieldStorage)
		return rv

	return "invalid action:", action

def executeActionImpl(module, fieldStorage):
	if not validationUtil.requirePOSTParameters(fieldStorage, module.requiredParameters):
		return "invalid parameters:", fieldStorage.keys(), "required parameters:", module.requiredParameters
	elif not validationUtil.checkDelimiterCharacter(fieldStorage, module.requiredParameters):
		return "Error! A parameter contained delimiter sign ';'"
	else:
		return module.execute(fieldStorage)

def authentication(fieldStorage):
	mysqlUtil.createTables() #Creates tables if they doesn't exists yet
	if "username" in fieldStorage and "password" in fieldStorage:
		if mysqlUtil.isValidUsernameAndPassword(fieldStorage["username"].value, fieldStorage["password"].value):
			return {"success": True, "common_password": config.common_password}

	elif "userId" in fieldStorage and "oldPassword" in fieldStorage and "newPassword" in fieldStorage:
		if mysqlUtil.changePassword(fieldStorage):
			return {"success": True, "common_password": config.common_password}
	return {"success": False, "message": "Bad authentication"}