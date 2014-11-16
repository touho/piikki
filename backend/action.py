#!/usr/bin/python
# -*- coding: utf-8 -*-

import validationUtil, config

from actions import (piikkaus, getUsers, getItems, createTables, userPage,
	adminMain, adminUsers, adminItems, adminPiikkaukset, adminPayments, adminLogs)

modules = {
	"piikkaus": piikkaus,
	"getUsers": getUsers,
	"getItems": getItems,
	"createTables": createTables,
	"userPage": userPage,
	"adminMain": adminMain,
	"adminUsers": adminUsers,
	"adminItems": adminItems,
	"adminPiikkaukset": adminPiikkaukset,
	"adminLogs": adminLogs,
	"adminPayments": adminPayments
}

def executeAction(fieldStorage, ip):
	if "piikki_password" not in fieldStorage:
		return authentication(fieldStorage)
	if fieldStorage["piikki_password"].value != config.piikki_password:
		return {"success": False, "message": "bad piikki password"}
	if "action" not in fieldStorage:
		return "action not given"

	fieldStorage.ip = ip

	action = fieldStorage["action"].value

	if action in modules:
		return executeActionImpl(modules[action], fieldStorage)

	return "invalid action:", action

def executeActionImpl(module, fieldStorage):
	if not validationUtil.requirePOSTParameters(fieldStorage, module.requiredParameters):
		return "invalid parameters:", fieldStorage.keys(), "required parameters:", module.requiredParameters
	elif not validationUtil.checkDelimiterCharacter(fieldStorage, module.requiredParameters):
		return "Error! A parameter contained delimiter sign ';'"
	else:
		return module.execute(fieldStorage)

def authentication(fieldStorage):
	if "username" in fieldStorage and "password" in fieldStorage:
		return {"success": True, "piikki_password": config.piikki_password}
	else:
		return {"success": False, "message": "bad username or password"}