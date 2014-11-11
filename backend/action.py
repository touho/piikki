#!/usr/bin/python
# -*- coding: utf-8 -*-

import validationUtil

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